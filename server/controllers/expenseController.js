import mongoose from 'mongoose';
import Expense from '../models/Expense.js';
import Account from '../models/Account.js';
import Category from '../models/Category.js';
import Budget from '../models/Budget.js';

// Safe Transaction Helper supporting standalone fallback
const runInSession = async (operation) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    
    const isStandaloneError = 
      error.message.includes('replica set') || 
      error.message.includes('transaction') || 
      error.message.includes('session') ||
      error.codeName === 'CommandNotSupportedOnReplicaSetMemberWithoutJournaling' ||
      error.code === 263 ||
      error.message.includes('Sessions are not supported');

    if (isStandaloneError) {
      console.warn('[Database WARNING] MongoDB transactions are not supported on standalone local nodes. Falling back to non-transactional updates.');
      return await operation(null);
    }
    
    throw error;
  } finally {
    session.endSession();
  }
};

// @desc    Create a new Expense entry
// @route   POST /api/v1/expense
// @access  Private
export const createExpense = async (req, res, next) => {
  const { accountId, categoryId, amount, date, description } = req.body;
  const userId = req.user.id;

  try {
    // 1. Verify account ownership
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found or unauthorized'
      });
    }

    // 2. Verify category ownership or default status
    const category = await Category.findOne({ _id: categoryId, userId, type: 'expense' });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Expense category not found or unauthorized'
      });
    }

    // Check account limit or liquidity for credit cards
    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount must be a positive number'
      });
    }

    // Run transaction
    const newExpense = await runInSession(async (session) => {
      const options = session ? { session } : {};

      // Insert expense record (resolve essential flag from the category)
      const [expenseDoc] = await Expense.create([{
        userId,
        accountId,
        categoryId,
        amount: expenseAmount,
        date: date || new Date(),
        description: description || '',
        essential: category.essential === true
      }], options);

      // Decrement account balance by amount (subtracting)
      await Account.findOneAndUpdate(
        { _id: accountId },
        { $inc: { balance: -expenseAmount } },
        { new: true, ...options }
      );

      return expenseDoc;
    });

    // Determine if this expense pushes active category budgets over alerts limits (80% or 100%)
    let warning = null;
    try {
      const activeBudget = await Budget.findOne({
        userId,
        categoryId,
        startDate: { $lte: newExpense.date },
        endDate: { $gte: newExpense.date }
      });

      if (activeBudget) {
        const budgetExpenses = await Expense.find({
          userId,
          categoryId,
          date: { $gte: activeBudget.startDate, $lte: activeBudget.endDate }
        });

        const totalSpent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);
        const limit = activeBudget.limitAmount;

        if (totalSpent >= limit) {
          warning = `Budget Exceeded! You have spent ₹${totalSpent.toLocaleString('en-IN')} of your ₹${limit.toLocaleString('en-IN')} limit for this period.`;
        } else if (totalSpent >= limit * 0.8) {
          const percent = ((totalSpent / limit) * 100).toFixed(0);
          warning = `Budget Alert! You have used ${percent}% of your category budget (Spent ₹${totalSpent.toLocaleString('en-IN')} of ₹${limit.toLocaleString('en-IN')}).`;
        }
      }
    } catch (budgetErr) {
      console.error('Failed to resolve budget warnings during creation:', budgetErr);
    }

    res.status(201).json({
      success: true,
      data: newExpense,
      warning
    });

  } catch (error) {
    next(error);
  }
};

// @desc    List expense entries with filters
// @route   GET /api/v1/expense
// @access  Private
export const getExpenses = async (req, res, next) => {
  const { page = 1, limit = 10, from, to, categoryId } = req.query;

  try {
    const filter = { userId: req.user.id };

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (from || to) {
      filter.date = {};
      if (from) {
        filter.date.$gte = new Date(from);
      }
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.date.$lte = endDate;
      }
    }

    const currentPage = parseInt(page);
    const itemLimit = parseInt(limit);
    const skipCount = (currentPage - 1) * itemLimit;

    // Fetch lists
    const [totalCount, expenses] = await Promise.all([
      Expense.countDocuments(filter),
      Expense.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skipCount)
        .limit(itemLimit)
        .populate('accountId', 'name type')
        .populate('categoryId', 'name essential')
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total: totalCount,
        page: currentPage,
        pages: Math.ceil(totalCount / itemLimit),
        limit: itemLimit
      },
      data: expenses
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Modify an existing expense transaction (Updating account balances accordingly)
// @route   PUT /api/v1/expense/:id
// @access  Private
export const updateExpense = async (req, res, next) => {
  const { id } = req.params;
  const { accountId, categoryId, amount, date, description } = req.body;
  const userId = req.user.id;

  try {
    const expense = await Expense.findOne({ _id: id, userId });
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense transaction log not found'
      });
    }

    let targetAccountId = expense.accountId;
    if (accountId && accountId !== expense.accountId.toString()) {
      const newAccount = await Account.findOne({ _id: accountId, userId });
      if (!newAccount) {
        return res.status(404).json({
          success: false,
          message: 'Target asset account not found or unauthorized'
        });
      }
      targetAccountId = accountId;
    }

    let targetCategoryId = expense.categoryId;
    let essentialFlag = expense.essential;
    if (categoryId && categoryId !== expense.categoryId.toString()) {
      const targetCategory = await Category.findOne({ _id: categoryId, userId, type: 'expense' });
      if (!targetCategory) {
        return res.status(404).json({
          success: false,
          message: 'Target category not found or unauthorized'
        });
      }
      targetCategoryId = categoryId;
      essentialFlag = targetCategory.essential === true;
    }

    const newAmount = amount !== undefined ? parseFloat(amount) : expense.amount;
    if (isNaN(newAmount) || newAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount must be greater than zero'
      });
    }

    const oldAmount = expense.amount;
    const oldAccountId = expense.accountId;

    // Run transaction rebalancing
    const updatedExpense = await runInSession(async (session) => {
      const options = session ? { session } : {};

      // If account changed, increment balance in old account by old amount and decrement balance in new account by new amount
      if (oldAccountId.toString() !== targetAccountId.toString()) {
        // Refund old account
        await Account.findOneAndUpdate(
          { _id: oldAccountId },
          { $inc: { balance: oldAmount } },
          options
        );

        // Charge new account
        await Account.findOneAndUpdate(
          { _id: targetAccountId },
          { $inc: { balance: -newAmount } },
          options
        );
      } else if (oldAmount !== newAmount) {
        // If account is the same, simply subtract the difference
        const difference = newAmount - oldAmount;
        await Account.findOneAndUpdate(
          { _id: oldAccountId },
          { $inc: { balance: -difference } },
          options
        );
      }

      // Update matching expense doc
      const updatedDoc = await Expense.findOneAndUpdate(
        { _id: id },
        {
          accountId: targetAccountId,
          categoryId: targetCategoryId,
          amount: newAmount,
          date: date || expense.date,
          description: description !== undefined ? description : expense.description,
          essential: essentialFlag
        },
        { new: true, ...options }
      );

      return updatedDoc;
    });

    // Check budget warnings on modification
    let warning = null;
    try {
      const activeBudget = await Budget.findOne({
        userId,
        categoryId: targetCategoryId,
        startDate: { $lte: updatedExpense.date },
        endDate: { $gte: updatedExpense.date }
      });

      if (activeBudget) {
        const budgetExpenses = await Expense.find({
          userId,
          categoryId: targetCategoryId,
          date: { $gte: activeBudget.startDate, $lte: activeBudget.endDate }
        });

        const totalSpent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);
        const limit = activeBudget.limitAmount;

        if (totalSpent >= limit) {
          warning = `Budget Exceeded! You have spent ₹${totalSpent.toLocaleString('en-IN')} of your ₹${limit.toLocaleString('en-IN')} limit for this period.`;
        } else if (totalSpent >= limit * 0.8) {
          const percent = ((totalSpent / limit) * 100).toFixed(0);
          warning = `Budget Alert! You have used ${percent}% of your category budget (Spent ₹${totalSpent.toLocaleString('en-IN')} of ₹${limit.toLocaleString('en-IN')}).`;
        }
      }
    } catch (budgetErr) {
      console.error('Failed to resolve budget warnings during update:', budgetErr);
    }

    res.status(200).json({
      success: true,
      data: updatedExpense,
      warning
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete an expense log (Reversing balance actions)
// @route   DELETE /api/v1/expense/:id
// @access  Private
export const deleteExpense = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const expense = await Expense.findOne({ _id: id, userId });
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found'
      });
    }

    const expenseAmount = expense.amount;
    const targetAccountId = expense.accountId;

    await runInSession(async (session) => {
      const options = session ? { session } : {};

      // Refund the account balance by adding back the deleted amount
      await Account.findOneAndUpdate(
        { _id: targetAccountId },
        { $inc: { balance: expenseAmount } },
        options
      );

      // Remove expense record
      await Expense.deleteOne({ _id: id }, options);
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Expense transaction successfully deleted and account balance recalculated.'
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get spend metrics, splits, and categories aggregates
// @route   GET /api/v1/expense/summary
// @access  Private
export const getExpenseSummary = async (req, res, next) => {
  const { from, to } = req.query;
  const userId = req.user.id;

  try {
    const filter = { userId };
    
    if (from || to) {
      filter.date = {};
      if (from) {
        filter.date.$gte = new Date(from);
      }
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.date.$lte = endDate;
      }
    }

    const expenses = await Expense.find(filter).populate('categoryId', 'name essential');

    let totalSpend = 0;
    let essential = 0;
    let discretionary = 0;
    const categoryMap = {};

    expenses.forEach(exp => {
      const amount = exp.amount;
      totalSpend += amount;

      // Determine essential/discretionary
      const isEssential = exp.essential || (exp.categoryId?.essential === true);
      if (isEssential) {
        essential += amount;
      } else {
        discretionary += amount;
      }

      const categoryName = exp.categoryId?.name || 'Other';
      categoryMap[categoryName] = (categoryMap[categoryName] || 0) + amount;
    });

    const spendByCategory = Object.keys(categoryMap).map(name => ({
      category: name,
      amount: categoryMap[name]
    })).sort((a,b) => b.amount - a.amount);

    res.status(200).json({
      success: true,
      data: {
        totalSpend,
        essentialSplit: {
          essential,
          discretionary
        },
        spendByCategory
      }
    });

  } catch (error) {
    next(error);
  }
};
