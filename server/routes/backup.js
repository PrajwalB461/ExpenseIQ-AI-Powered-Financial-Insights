import { Router } from 'express';
import XLSX from 'xlsx';
import { protect } from '../middleware/authMiddleware.js';
import Account from '../models/Account.js';
import Category from '../models/Category.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';
import EMI from '../models/EMI.js';

const router = Router();

// Protect all backup lines
router.use(protect);

// Helper to format dates cleanly
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

// @route   GET /api/v1/backup/export
// @access  Private
router.get('/export', async (req, res, next) => {
  const userId = req.user.id;

  try {
    // 1. Retrieve all data
    const [accounts, categories, incomes, expenses, budgets, emis] = await Promise.all([
      Account.find({ userId }),
      Category.find({ $or: [{ userId }, { isDefault: true }] }),
      Income.find({ userId }).populate('accountId categoryId'),
      Expense.find({ userId }).populate('accountId categoryId'),
      Budget.find({ userId }).populate('categoryId'),
      EMI.find({ userId }).populate('linkedAccountId')
    ]);

    // 2. Format for XLSX
    const accountsData = accounts.map(a => ({
      Name: a.name,
      Type: a.type,
      Balance: a.balance,
      CreditLimit: a.creditLimit || ''
    }));

    const categoriesData = categories.map(c => ({
      Name: c.name,
      Type: c.type,
      Essential: c.essential || false
    }));

    const incomesData = incomes.map(i => ({
      Account: i.accountId?.name || 'Inaccessible',
      Category: i.categoryId?.name || 'Other',
      Amount: i.amount,
      Date: formatDate(i.date),
      Description: i.description || ''
    }));

    const expensesData = expenses.map(e => ({
      Account: e.accountId?.name || 'Inaccessible',
      Category: e.categoryId?.name || 'Other',
      Amount: e.amount,
      Date: formatDate(e.date),
      Description: e.description || ''
    }));

    const budgetsData = budgets.map(b => ({
      Category: b.categoryId?.name || 'Other',
      LimitAmount: b.limitAmount,
      Duration: b.duration,
      StartDate: formatDate(b.startDate),
      EndDate: formatDate(b.endDate)
    }));

    const emisData = emis.map(e => ({
      Description: e.description,
      TotalAmount: e.totalAmount,
      PaymentAmount: e.paymentAmount,
      Frequency: e.frequency,
      StartDate: formatDate(e.startDate),
      EndDate: formatDate(e.endDate),
      NextPaymentDate: formatDate(e.nextPaymentDate),
      Account: e.linkedAccountId?.name || 'Inaccessible'
    }));

    // 3. Assemble Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(accountsData), 'Accounts');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categoriesData), 'Categories');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomesData), 'Incomes');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesData), 'Expenses');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(budgetsData), 'Budgets');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(emisData), 'EMIs');

    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=finintel_backup.xlsx');
    res.send(excelBuffer);

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/backup/restore
// @access  Private
router.post('/restore', async (req, res, next) => {
  const { fileData } = req.body;
  const userId = req.user.id;

  if (!fileData) {
    return res.status(400).json({
      success: false,
      message: 'Base64 encoded fileData is required'
    });
  }

  // Tracking maps for rollback fallback
  const createdAccounts = [];
  const createdCategories = [];
  const createdIncomes = [];
  const createdExpenses = [];
  const createdBudgets = [];
  const createdEMIs = [];

  const rollback = async () => {
    console.log('[System Recovery] Initiating rollback deletion...');
    try {
      if (createdIncomes.length > 0) await Income.deleteMany({ _id: { $in: createdIncomes } });
      if (createdExpenses.length > 0) await Expense.deleteMany({ _id: { $in: createdExpenses } });
      if (createdBudgets.length > 0) await Budget.deleteMany({ _id: { $in: createdBudgets } });
      if (createdEMIs.length > 0) await EMI.deleteMany({ _id: { $in: createdEMIs } });
      if (createdAccounts.length > 0) await Account.deleteMany({ _id: { $in: createdAccounts } });
      if (createdCategories.length > 0) await Category.deleteMany({ _id: { $in: createdCategories } });
      console.log('[System Recovery] Rollback complete.');
    } catch (err) {
      console.error('[Critical Cleanup Error] Rollback deletion offset failure:', err);
    }
  };

  try {
    const buffer = Buffer.from(fileData, 'base64');
    let wb;
    try {
      wb = XLSX.read(buffer, { type: 'buffer' });
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Excel archive. Parsing failed.'
      });
    }

    // 1. Verify required worksheets
    const requiredSheets = ['Accounts', 'Categories', 'Incomes', 'Expenses', 'Budgets', 'EMIs'];
    for (const sheetName of requiredSheets) {
      if (!wb.SheetNames.includes(sheetName)) {
        return res.status(400).json({
          success: false,
          message: `Validation Error: Missing required worksheet named "${sheetName}".`
        });
      }
    }

    // 2. Parse worksheets
    const accountsRows = XLSX.utils.sheet_to_json(wb.Sheets['Accounts']);
    const categoriesRows = XLSX.utils.sheet_to_json(wb.Sheets['Categories']);
    const incomesRows = XLSX.utils.sheet_to_json(wb.Sheets['Incomes']);
    const expensesRows = XLSX.utils.sheet_to_json(wb.Sheets['Expenses']);
    const budgetsRows = XLSX.utils.sheet_to_json(wb.Sheets['Budgets']);
    const emisRows = XLSX.utils.sheet_to_json(wb.Sheets['EMIs']);

    // 3. Keep caches of resolved ID lookups
    const accountMap = {};
    const categoryMap = {};

    // --- SHEET 1: ACCOUNTS VALIDATION & CREATION ---
    for (let idx = 0; idx < accountsRows.length; idx++) {
      const row = accountsRows[idx];
      const lineNum = idx + 2;

      if (!row.Name || !row.Type) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [Accounts] line ${lineNum}: Missing required columns Name or Type.`
        });
      }

      // Check existing account
      let account = await Account.findOne({ userId, name: row.Name });
      if (!account) {
        account = await Account.create({
          userId,
          name: row.Name,
          type: row.Type,
          balance: Number(row.Balance) || 0,
          creditLimit: row.CreditLimit ? Number(row.CreditLimit) : undefined
        });
        createdAccounts.push(account._id);
      }
      accountMap[row.Name] = account._id;
    }

    // --- SHEET 2: CATEGORIES VALIDATION & CREATION ---
    for (let idx = 0; idx < categoriesRows.length; idx++) {
      const row = categoriesRows[idx];
      const lineNum = idx + 2;

      if (!row.Name || !row.Type) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [Categories] line ${lineNum}: Missing Category Name or Type.`
        });
      }

      // Check existing user or default category
      let category = await Category.findOne({
        $or: [
          { userId, name: row.Name, type: row.Type },
          { isDefault: true, name: row.Name, type: row.Type }
        ]
      });

      if (!category) {
        category = await Category.create({
          userId,
          name: row.Name,
          type: row.Type,
          essential: row.Essential === true || String(row.Essential).toLowerCase().trim() === 'true'
        });
        createdCategories.push(category._id);
      }
      categoryMap[row.Name] = category._id;
    }

    // --- SHEET 3: INCOMES VALIDATION & CREATION ---
    for (let idx = 0; idx < incomesRows.length; idx++) {
      const row = incomesRows[idx];
      const lineNum = idx + 2;

      if (!row.Account || !row.Category || row.Amount === undefined || !row.Date) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [Incomes] line ${lineNum}: Missing Account, Category, Amount or Date.`
        });
      }

      const accId = accountMap[row.Account];
      if (!accId) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [Incomes] line ${lineNum}: Account "${row.Account}" has no matching definition in Accounts tab.`
        });
      }

      const catId = categoryMap[row.Category];
      if (!catId) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [Incomes] line ${lineNum}: Category "${row.Category}" has no matching definition in Categories tab.`
        });
      }

      const amt = Number(row.Amount);
      if (isNaN(amt) || amt <= 0) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [Incomes] line ${lineNum}: Amount must be a positive integer/float value.`
        });
      }

      const income = await Income.create({
        userId,
        accountId: accId,
        categoryId: catId,
        amount: amt,
        date: new Date(row.Date),
        description: row.Description || ''
      });
      createdIncomes.push(income._id);
    }

    // --- SHEET 4: EXPENSES VALIDATION & CREATION ---
    for (let idx = 0; idx < expensesRows.length; idx++) {
      const row = expensesRows[idx];
      const lineNum = idx + 2;

      if (!row.Account || !row.Category || row.Amount === undefined || !row.Date) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [Expenses] line ${lineNum}: Missing Account, Category, Amount or Date.`
        });
      }

      const accId = accountMap[row.Account];
      if (!accId) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [Expenses] line ${lineNum}: Account "${row.Account}" has no matching definition in Accounts tab.`
        });
      }

      const catId = categoryMap[row.Category];
      if (!catId) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [Expenses] line ${lineNum}: Category "${row.Category}" has no matching definition in Categories tab.`
        });
      }

      const amt = Number(row.Amount);
      if (isNaN(amt) || amt <= 0) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [Expenses] line ${lineNum}: Amount must be a positive number.`
        });
      }

      const expense = await Expense.create({
        userId,
        accountId: accId,
        categoryId: catId,
        amount: amt,
        date: new Date(row.Date),
        description: row.Description || ''
      });
      createdExpenses.push(expense._id);
    }

    // --- SHEET 5: BUDGETS VALIDATION & CREATION ---
    for (let idx = 0; idx < budgetsRows.length; idx++) {
      const row = budgetsRows[idx];
      const lineNum = idx + 2;

      if (!row.Category || row.LimitAmount === undefined || !row.Duration || !row.StartDate || !row.EndDate) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [Budgets] line ${lineNum}: Missing Category, LimitAmount, Duration, StartDate or EndDate.`
        });
      }

      const catId = categoryMap[row.Category];
      if (!catId) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [Budgets] line ${lineNum}: Category "${row.Category}" has no matching definition in Categories tab.`
        });
      }

      const lAmt = Number(row.LimitAmount);
      if (isNaN(lAmt) || lAmt <= 0) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [Budgets] line ${lineNum}: LimitAmount must be a positive number.`
        });
      }

      const budgetConfig = await Budget.create({
        userId,
        categoryId: catId,
        limitAmount: lAmt,
        duration: row.Duration,
        startDate: new Date(row.StartDate),
        endDate: new Date(row.EndDate)
      });
      createdBudgets.push(budgetConfig._id);
    }

    // --- SHEET 6: EMIs VALIDATION & CREATION ---
    for (let idx = 0; idx < emisRows.length; idx++) {
      const row = emisRows[idx];
      const lineNum = idx + 2;

      if (!row.Description || row.TotalAmount === undefined || row.PaymentAmount === undefined || !row.StartDate || !row.EndDate || !row.NextPaymentDate || !row.Account) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [EMIs] line ${lineNum}: Missing Description, TotalAmount, PaymentAmount, StartDate, EndDate, NextPaymentDate or Account.`
        });
      }

      const accId = accountMap[row.Account];
      if (!accId) {
        await rollback();
        return res.status(400).json({
          success: false,
          message: `Validation Error on sheet [EMIs] line ${lineNum}: Account "${row.Account}" has no matching definition in Accounts tab.`
        });
      }

      const emi = await EMI.create({
        userId,
        description: row.Description,
        totalAmount: Number(row.TotalAmount),
        paymentAmount: Number(row.PaymentAmount),
        frequency: row.Frequency || 'monthly',
        startDate: new Date(row.StartDate),
        endDate: new Date(row.EndDate),
        nextPaymentDate: new Date(row.NextPaymentDate),
        linkedAccountId: accId
      });
      createdEMIs.push(emi._id);
    }

    res.status(200).json({
      success: true,
      message: `Database restore successfully completed. Created: ${createdAccounts.length} accounts, ${createdCategories.length} categories, ${createdIncomes.length} incomes, ${createdExpenses.length} expenses, ${createdBudgets.length} budgets, and ${createdEMIs.length} loans EMIs.`
    });

  } catch (error) {
    await rollback();
    next(error);
  }
});

export default router;
