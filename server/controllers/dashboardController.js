import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Account from '../models/Account.js';
import Category from '../models/Category.js';
import { generateInsights } from '../utils/insightEngine.js';
import XLSX from 'xlsx';

// Helper to resolve request date boundaries
const getDateRange = (fromQuery, toQuery) => {
  const now = new Date();
  
  // Default range: current month
  let from = fromQuery ? new Date(fromQuery) : new Date(now.getFullYear(), now.getMonth(), 1);
  let to = toQuery ? new Date(toQuery) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  if (isNaN(from.getTime())) {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (isNaN(to.getTime())) {
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  // Ensure full days are represented
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  return { from, to };
};

// @desc    Get dashboard metrics, trend lines, and categories
// @route   GET /api/v1/dashboard/overview
// @access  Private
export const getOverview = async (req, res, next) => {
  const { from: fromQuery, to: toQuery, categoryId } = req.query;
  const userId = req.user.id;

  try {
    const { from, to } = getDateRange(fromQuery, toQuery);

    const filter = {
      userId,
      date: { $gte: from, $lte: to }
    };

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Parallel fetch current period logs
    const [incomes, expenses] = await Promise.all([
      Income.find(filter).populate('categoryId', 'name'),
      Expense.find(filter).populate('categoryId', 'name')
    ]);

    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netSavings = totalIncome - totalExpense;

    // Group expenses by category
    const categoryMap = {};
    expenses.forEach(exp => {
      const name = exp.categoryId?.name || 'Other';
      categoryMap[name] = (categoryMap[name] || 0) + exp.amount;
    });

    const spendByCategory = Object.keys(categoryMap).map(name => {
      const amount = categoryMap[name];
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        category: name,
        amount,
        percentage: parseFloat(percentage.toFixed(1))
      };
    }).sort((a, b) => b.amount - a.amount);

    const topCategories = spendByCategory.slice(0, 3);

    // Build timeline dates grid to fill zero spend values
    const trendMap = {};
    let currentDayIter = new Date(from);
    const endDayIter = new Date(to);

    // Caps chart iterations to a max daily items, if too large default to grouping weeks (safety check)
    const diffTime = Math.abs(endDayIter - currentDayIter);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    if (diffDays <= 90) {
      while (currentDayIter <= endDayIter) {
        const key = currentDayIter.toISOString().split('T')[0];
        trendMap[key] = 0;
        currentDayIter.setDate(currentDayIter.getDate() + 1);
      }

      expenses.forEach(exp => {
        const key = new Date(exp.date).toISOString().split('T')[0];
        if (trendMap[key] !== undefined) {
          trendMap[key] += exp.amount;
        }
      });
    } else {
      // Group by month for broad ranges
      while (currentDayIter <= endDayIter) {
        const key = `${currentDayIter.getFullYear()}-${String(currentDayIter.getMonth() + 1).padStart(2, '0')}`;
        trendMap[key] = 0;
        currentDayIter.setMonth(currentDayIter.getMonth() + 1);
      }

      expenses.forEach(exp => {
        const d = new Date(exp.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (trendMap[key] !== undefined) {
          trendMap[key] += exp.amount;
        }
      });
    }

    const spendTrend = Object.keys(trendMap).map(dateStr => ({
      date: dateStr,
      amount: trendMap[dateStr]
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netSavings,
        spendByCategory,
        spendTrend,
        topCategories
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve rule-based engine insights
// @route   GET /api/v1/dashboard/insights
// @access  Private
export const getInsights = async (req, res, next) => {
  const { from: fromQuery, to: toQuery, categoryId } = req.query;
  const userId = req.user.id;

  try {
    const { from, to } = getDateRange(fromQuery, toQuery);

    const filter = {
      userId,
      date: { $gte: from, $lte: to }
    };

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Fetch current period expenses
    const expenses = await Expense.find(filter).populate('categoryId', 'name essential');

    // Calculate previous equivalent date boundaries
    const currentStart = new Date(from);
    const currentEnd = new Date(to);
    const diffTime = Math.abs(currentEnd - currentStart);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const prevEnd = new Date(currentStart);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays);

    const prevFilter = {
      userId,
      date: { $gte: prevStart, $lte: prevEnd }
    };

    if (categoryId) {
      prevFilter.categoryId = categoryId;
    }

    const prevExpenses = await Expense.find(prevFilter).populate('categoryId', 'name');

    // Generate insights
    const insights = generateInsights(expenses, prevExpenses);

    res.status(200).json({
      success: true,
      data: insights
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Export Ledger tables to fully structured excel files
// @route   GET /api/v1/dashboard/export
// @access  Private
export const exportDashboardData = async (req, res, next) => {
  const { from: fromQuery, to: toQuery, categoryId } = req.query;
  const userId = req.user.id;

  try {
    const { from, to } = getDateRange(fromQuery, toQuery);

    const filter = {
      userId,
      date: { $gte: from, $lte: to }
    };

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    const [incomes, expenses] = await Promise.all([
      Income.find(filter).populate('accountId', 'name').populate('categoryId', 'name'),
      Expense.find(filter).populate('accountId', 'name').populate('categoryId', 'name')
    ]);

    // Build consolidated list sorted by date descending
    const rawList = [];

    incomes.forEach(inc => {
      rawList.push({
        date: inc.date,
        type: 'Income',
        category: inc.categoryId?.name || 'Inflow Category',
        account: inc.accountId?.name || 'Target Account',
        amount: inc.amount,
        description: inc.description || ''
      });
    });

    expenses.forEach(exp => {
      rawList.push({
        date: exp.date,
        type: 'Expense',
        category: exp.categoryId?.name || 'Outflow Category',
        account: exp.accountId?.name || 'Source Account',
        amount: -exp.amount, // Negate expense amounts for formatting
        description: exp.description || ''
      });
    });

    const sortedReportList = rawList.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Construct excel rows
    const headerRow = ["Transaction Date", "Direction Type", "Category Classification", "Associated Asset Account", "Amount (INR)", "Optional Details"];
    const fileRows = sortedReportList.map(item => [
      new Date(item.date).toLocaleDateString('en-IN'),
      item.type,
      item.category,
      item.account,
      item.amount,
      item.description
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...fileRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ExpenseIQ Transactions");

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Unified_Finance_Report.xlsx');
    res.end(excelBuffer);

  } catch (error) {
    next(error);
  }
};
