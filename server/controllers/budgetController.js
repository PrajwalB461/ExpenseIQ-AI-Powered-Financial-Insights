import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import Category from '../models/Category.js';

// Helper to compute durations default dates
const calculateDates = (duration, inputStart, inputEnd) => {
  const now = new Date();
  let start = inputStart ? new Date(inputStart) : new Date(now.getFullYear(), now.getMonth(), 1);
  let end = inputEnd ? new Date(inputEnd) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  if (duration === 'monthly') {
    start = inputStart ? new Date(inputStart) : new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  } else if (duration === 'weekly') {
    start = inputStart ? new Date(inputStart) : new Date();
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// @desc    Create category active budget limits
// @route   POST /api/v1/budgets
// @access  Private
export const createBudget = async (req, res, next) => {
  const { categoryId, limitAmount, duration, startDate, endDate } = req.body;
  const userId = req.user.id;

  try {
    if (!categoryId || !limitAmount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both a Category and a Limit Amount.'
      });
    }

    const { start, end } = calculateDates(duration || 'monthly', startDate, endDate);

    // Verify duplicate validation
    const duplicate = await Budget.findOne({
      userId,
      categoryId,
      startDate: start,
      endDate: end
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'A budget cap already exists for this Category in the specified date range.'
      });
    }

    const budget = await Budget.create({
      userId,
      categoryId,
      limitAmount: parseFloat(limitAmount),
      duration: duration || 'monthly',
      startDate: start,
      endDate: end
    });

    res.status(201).json({
      success: true,
      data: budget
    });

  } catch (error) {
    next(error);
  }
};

// @desc    List all active budgets populated with spent totals and percent metadata
// @route   GET /api/v1/budgets
// @access  Private
export const getBudgets = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const budgets = await Budget.find({ userId })
      .populate('categoryId', 'name type')
      .sort({ createdAt: -1 });

    const budgetsWithProgress = await Promise.all(
      budgets.map(async (budget) => {
        // Query expense aggregates in budget range and category
        const expenses = await Expense.find({
          userId,
          categoryId: budget.categoryId?._id || budget.categoryId,
          date: { $gte: budget.startDate, $lte: budget.endDate }
        });

        const spentSoFar = expenses.reduce((sum, e) => sum + e.amount, 0);
        const percentUsed = budget.limitAmount > 0 ? (spentSoFar / budget.limitAmount) * 100 : 0;

        return {
          _id: budget._id,
          categoryId: budget.categoryId,
          limitAmount: budget.limitAmount,
          duration: budget.duration,
          startDate: budget.startDate,
          endDate: budget.endDate,
          spentSoFar: parseFloat(spentSoFar.toFixed(2)),
          percentUsed: parseFloat(percentUsed.toFixed(1))
        };
      })
    );

    res.status(200).json({
      success: true,
      data: budgetsWithProgress
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update budget limit settings
// @route   PUT /api/v1/budgets/:id
// @access  Private
export const updateBudget = async (req, res, next) => {
  const { id } = req.params;
  const { limitAmount, duration, startDate, endDate } = req.body;
  const userId = req.user.id;

  try {
    const budget = await Budget.findOne({ _id: id, userId });
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget record not found or unauthorized'
      });
    }

    if (limitAmount !== undefined) budget.limitAmount = parseFloat(limitAmount);
    
    if (duration !== undefined || startDate !== undefined || endDate !== undefined) {
      const activeDuration = duration !== undefined ? duration : budget.duration;
      const activeStart = startDate !== undefined ? startDate : budget.startDate;
      const activeEnd = endDate !== undefined ? endDate : budget.endDate;
      const { start, end } = calculateDates(activeDuration, activeStart, activeEnd);
      budget.duration = activeDuration;
      budget.startDate = start;
      budget.endDate = end;
    }

    await budget.save();

    res.status(200).json({
      success: true,
      data: budget
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete custom budgeting goals
// @route   DELETE /api/v1/budgets/:id
// @access  Private
export const deleteBudget = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const budget = await Budget.findOneAndDelete({ _id: id, userId });
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget record not found or credentials mismatch'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Budget limit config deleted.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Calculate dynamic suggestions based on historical averages
// @route   GET /api/v1/budgets/suggestions
// @access  Private
export const getBudgetSuggestions = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const expenses = await Expense.find({ userId }).populate('categoryId', 'name');

    // Grouping by category
    const categoryLog = {};
    expenses.forEach(e => {
      const catId = e.categoryId?._id?.toString();
      const catName = e.categoryId?.name;
      if (!catId || !catName) return;

      const dateObj = new Date(e.date);
      const monthKey = `${dateObj.getFullYear()}-${dateObj.getMonth()}`;

      if (!categoryLog[catId]) {
        categoryLog[catId] = {
          categoryId: catId,
          categoryName: catName,
          total: 0,
          months: new Set()
        };
      }

      categoryLog[catId].total += e.amount;
      categoryLog[catId].months.add(monthKey);
    });

    const suggestions = [];

    Object.keys(categoryLog).forEach(catId => {
      const log = categoryLog[catId];
      const uniqueMonths = log.months.size;
      
      // Calculate monthly average
      // For testing, if user has less than 2 distinct months, we compute base average dividing by 2 or actual counts
      const avg = log.total / Math.max(2, uniqueMonths);

      suggestions.push({
        categoryId: log.categoryId,
        categoryName: log.categoryName,
        suggestedLimit: parseFloat(avg.toFixed(2)),
        monthsHistory: uniqueMonths,
        reason: uniqueMonths >= 2 
          ? `Average of ${formatCurrencyINR(avg)} spent monthly over ${uniqueMonths} months of logs.`
          : `Provisional average of ${formatCurrencyINR(avg)} computed based on current transaction history.`
      });
    });

    res.status(200).json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    next(error);
  }
};

// Local currency helper
const formatCurrencyINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val);
};
