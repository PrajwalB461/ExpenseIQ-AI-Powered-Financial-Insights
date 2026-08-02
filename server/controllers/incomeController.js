import mongoose from 'mongoose';
import Income from '../models/Income.js';
import Account from '../models/Account.js';
import Category from '../models/Category.js';

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
    
    // Check if error is due to MongoDB running as standalone (no replica set configured)
    const isStandaloneError = 
      error.message.includes('replica set') || 
      error.message.includes('transaction') || 
      error.message.includes('session') ||
      error.codeName === 'CommandNotSupportedOnReplicaSetMemberWithoutJournaling' ||
      error.code === 263 || // Session/Transaction support error code
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

// @desc    Create a new Income entry
// @route   POST /api/v1/income
// @access  Private
export const createIncome = async (req, res, next) => {
  const { accountId, categoryId, amount, date, description } = req.body;
  const userId = req.user.id;

  try {
    // 1. Verify account ownership
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Asset account resource not found or unauthorized'
      });
    }

    // 2. Verify category ownership or default status
    const category = await Category.findOne({ _id: categoryId, userId, type: 'income' });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Income category resource not found or unauthorized'
      });
    }

    const incomeAmount = parseFloat(amount);
    if (isNaN(incomeAmount) || incomeAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Income amount must be a positive number'
      });
    }

    // Execute atomic creation & balance increment
    const newIncome = await runInSession(async (session) => {
      // Create options
      const options = session ? { session } : {};

      // Insert income record
      const [incomeDoc] = await Income.create([{
        userId,
        accountId,
        categoryId,
        amount: incomeAmount,
        date: date || new Date(),
        description: description || ''
      }], options);

      // Increment account balance by amount
      await Account.findOneAndUpdate(
        { _id: accountId },
        { $inc: { balance: incomeAmount } },
        { new: true, ...options }
      );

      return incomeDoc;
    });

    res.status(201).json({
      success: true,
      data: newIncome
    });

  } catch (error) {
    next(error);
  }
};

// @desc    List income logs with filter features
// @route   GET /api/v1/income
// @access  Private
export const getIncomes = async (req, res, next) => {
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
        // Set to end of day to fully include that date
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.date.$lte = endDate;
      }
    }

    const currentPage = parseInt(page);
    const itemLimit = parseInt(limit);
    const skipCount = (currentPage - 1) * itemLimit;

    // Run parallel counts & query lists for efficiency
    const [totalCount, incomes] = await Promise.all([
      Income.countDocuments(filter),
      Income.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skipCount)
        .limit(itemLimit)
        .populate('accountId', 'name type')
        .populate('categoryId', 'name')
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total: totalCount,
        page: currentPage,
        pages: Math.ceil(totalCount / itemLimit),
        limit: itemLimit
      },
      data: incomes
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Modify an existing income transaction (Updating account balances accordingly)
// @route   PUT /api/v1/income/:id
// @access  Private
export const updateIncome = async (req, res, next) => {
  const { id } = req.params;
  const { accountId, categoryId, amount, date, description } = req.body;
  const userId = req.user.id;

  try {
    const income = await Income.findOne({ _id: id, userId });
    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income transaction log not found'
      });
    }

    let targetAccountId = income.accountId;
    if (accountId && accountId !== income.accountId.toString()) {
      // Verify new account ownership
      const newAccount = await Account.findOne({ _id: accountId, userId });
      if (!newAccount) {
        return res.status(404).json({
          success: false,
          message: 'Target asset account not found or unauthorized'
        });
      }
      targetAccountId = accountId;
    }

    let targetCategoryId = income.categoryId;
    if (categoryId && categoryId !== income.categoryId.toString()) {
      // Verify category
      const targetCategory = await Category.findOne({ _id: categoryId, userId, type: 'income' });
      if (!targetCategory) {
        return res.status(404).json({
          success: false,
          message: 'Target category not found or unauthorized'
        });
      }
      targetCategoryId = categoryId;
    }

    const newAmount = amount !== undefined ? parseFloat(amount) : income.amount;
    if (isNaN(newAmount) || newAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Income amount must be greater than zero'
      });
    }

    const oldAmount = income.amount;
    const oldAccountId = income.accountId;

    // Run transaction
    const updatedIncome = await runInSession(async (session) => {
      const options = session ? { session } : {};

      // If account changed, decrement balance in old account and increment balance in new account
      if (oldAccountId.toString() !== targetAccountId.toString()) {
        // Decrease old account balance by old amount
        await Account.findOneAndUpdate(
          { _id: oldAccountId },
          { $inc: { balance: -oldAmount } },
          options
        );

        // Increase new account balance by new amount
        await Account.findOneAndUpdate(
          { _id: targetAccountId },
          { $inc: { balance: newAmount } },
          options
        );
      } else if (oldAmount !== newAmount) {
        // If account is the same, simply increment the difference
        const difference = newAmount - oldAmount;
        await Account.findOneAndUpdate(
          { _id: oldAccountId },
          { $inc: { balance: difference } },
          options
        );
      }

      // Update the income record
      const updatedDoc = await Income.findOneAndUpdate(
        { _id: id },
        {
          accountId: targetAccountId,
          categoryId: targetCategoryId,
          amount: newAmount,
          date: date || income.date,
          description: description !== undefined ? description : income.description
        },
        { new: true, ...options }
      );

      return updatedDoc;
    });

    res.status(200).json({
      success: true,
      data: updatedIncome
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete an income log (Reversing balance actions)
// @route   DELETE /api/v1/income/:id
// @access  Private
export const deleteIncome = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const income = await Income.findOne({ _id: id, userId });
    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found'
      });
    }

    const incomeAmount = income.amount;
    const targetAccountId = income.accountId;

    // Run transaction block
    await runInSession(async (session) => {
      const options = session ? { session } : {};

      // Decrement the account balance by deleted income amount
      await Account.findOneAndUpdate(
        { _id: targetAccountId },
        { $inc: { balance: -incomeAmount } },
        options
      );

      // Remove income transaction log
      await Income.deleteOne({ _id: id }, options);
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Income transaction successfully deleted and account balance recalculated.'
      }
    });

  } catch (error) {
    next(error);
  }
};
