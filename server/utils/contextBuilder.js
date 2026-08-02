import Account from '../models/Account.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';
import EMI from '../models/EMI.js';
import { generateInsights } from './insightEngine.js';

export const buildUserFinancialContext = async (userId, dateRange = {}) => {
  // 1. Establish dates boundaries
  const now = new Date();
  const to = dateRange.to ? new Date(dateRange.to) : now;
  const from = dateRange.from ? new Date(dateRange.from) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

  const diffTime = Math.abs(to - from);
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  const prevTo = new Date(from);
  prevTo.setSeconds(prevTo.getSeconds() - 1);
  const prevFrom = new Date(from);
  prevFrom.setDate(prevFrom.getDate() - diffDays);

  // 2. Fetch Accounts
  const accounts = await Account.find({ userId });
  const accountsSummary = accounts.map(a => ({
    name: a.name,
    type: a.type,
    balance: a.balance,
    creditLimit: a.creditLimit
  }));

  const totalAssets = accounts.reduce((sum, a) => sum + a.balance, 0);

  // 3. Fetch Income
  const incomes = await Income.find({
    userId,
    date: { $gte: from, $lte: to }
  }).populate('categoryId');

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

  // 4. Fetch Expense
  const expenses = await Expense.find({
    userId,
    date: { $gte: from, $lte: to }
  }).populate('categoryId');

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown
  const categoryMap = {};
  expenses.forEach(e => {
    const catName = e.categoryId?.name || 'Other';
    categoryMap[catName] = (categoryMap[catName] || 0) + e.amount;
  });
  const expenseByCategory = Object.keys(categoryMap).map(name => ({
    category: name,
    amount: categoryMap[name]
  })).sort((a, b) => b.amount - a.amount);

  // 5. Fetch previous equivalent period expenses (for rule insights comparison)
  const prevExpenses = await Expense.find({
    userId,
    date: { $gte: prevFrom, $lte: prevTo }
  }).populate('categoryId');

  // Trigger rule engine
  const ruleInsights = generateInsights(expenses, prevExpenses);

  // 6. Fetch Budgets and compute spentSoFar
  const budgets = await Budget.find({ userId }).populate('categoryId');
  const activeBudgetsSummary = [];

  for (const b of budgets) {
    const start = b.startDate;
    const end = b.endDate;
    const matchingExpenses = await Expense.find({
      userId,
      categoryId: b.categoryId?._id,
      date: { $gte: start, $lte: end }
    });
    const spentSoFar = matchingExpenses.reduce((sum, e) => sum + e.amount, 0);
    const percentUsed = b.limitAmount > 0 ? (spentSoFar / b.limitAmount) * 100 : 0;

    activeBudgetsSummary.push({
      category: b.categoryId?.name || 'Unknown',
      limitAmount: b.limitAmount,
      spentSoFar,
      percentUsed,
      duration: b.duration,
      startDate: start,
      endDate: end
    });
  }

  // 7. Fetch EMIs
  const emis = await EMI.find({ userId }).populate('linkedAccountId');
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueSoonLimit = new Date(todayDate);
  dueSoonLimit.setDate(todayDate.getDate() + 3);

  const emisSummary = emis.map(e => {
    const nextDate = new Date(e.nextPaymentDate);
    const nextPayNorm = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());

    let status = 'upcoming';
    if (nextPayNorm < todayDate) {
      status = 'overdue';
    } else if (nextPayNorm <= dueSoonLimit) {
      status = 'due soon';
    }

    return {
      description: e.description,
      totalAmount: e.totalAmount,
      paymentAmount: e.paymentAmount,
      frequency: e.frequency,
      nextPaymentDate: e.nextPaymentDate,
      linkedAccount: e.linkedAccountId?.name || 'Inaccessible',
      status
    };
  });

  // Assemble full context JSON
  return {
    dateRange: {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0]
    },
    accounts: accountsSummary,
    totalAssets,
    summary: {
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense
    },
    expenseByCategory,
    activeBudgets: activeBudgetsSummary,
    recurringEMIs: emisSummary,
    ruleBasedInsights: ruleInsights
  };
};
