import mongoose from 'mongoose';
import EMI from '../models/EMI.js';
import Expense from '../models/Expense.js';
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
    const isStandaloneError = 
      error.message.includes('replica set') || 
      error.message.includes('transaction') || 
      error.message.includes('session') ||
      error.codeName === 'CommandNotSupportedOnReplicaSetMemberWithoutJournaling' ||
      error.code === 263 ||
      error.message.includes('Sessions are not supported');

    if (isStandaloneError) {
      console.warn('[Database WARNING] Standalone server node fallback.');
      return await operation(null);
    }
    throw error;
  } finally {
    session.endSession();
  }
};

// @desc    Create a new EMI schedule
// @route   POST /api/v1/emis
// @access  Private
export const createEMI = async (req, res, next) => {
  const { description, totalAmount, paymentAmount, startDate, endDate, frequency, linkedAccountId } = req.body;
  const userId = req.user.id;

  try {
    if (!description || !totalAmount || !paymentAmount || !startDate || !endDate || !linkedAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required fields.'
      });
    }

    // Verify account exists
    const account = await Account.findOne({ _id: linkedAccountId, userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Linked account not found or unauthorized'
      });
    }

    const emi = await EMI.create({
      userId,
      description,
      totalAmount: parseFloat(totalAmount),
      paymentAmount: parseFloat(paymentAmount),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      frequency: frequency || 'monthly',
      nextPaymentDate: new Date(startDate), // defaulting to start date initially
      linkedAccountId
    });

    res.status(201).json({
      success: true,
      data: emi
    });

  } catch (error) {
    next(error);
  }
};

// @desc    List all EMIs with calculated status badge
// @route   GET /api/v1/emis
// @access  Private
export const getEMIs = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const emis = await EMI.find({ userId })
      .populate('linkedAccountId', 'name balance')
      .sort({ nextPaymentDate: 1 });

    const now = new Date();
    // Normalize today for boundary accuracy
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueSoonLimit = new Date(today);
    dueSoonLimit.setDate(today.getDate() + 3);

    const emisWithStatus = emis.map(emi => {
      const nextDate = new Date(emi.nextPaymentDate);
      const nextPayNorm = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());

      let status = 'upcoming';
      if (nextPayNorm < today) {
        status = 'overdue';
      } else if (nextPayNorm <= dueSoonLimit) {
        status = 'due soon';
      }

      return {
        ...emi.toObject(),
        status
      };
    });

    res.status(200).json({
      success: true,
      data: emisWithStatus
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Edit custom EMI plans details
// @route   PUT /api/v1/emis/:id
// @access  Private
export const updateEMI = async (req, res, next) => {
  const { id } = req.params;
  const { description, totalAmount, paymentAmount, startDate, endDate, frequency, nextPaymentDate, linkedAccountId } = req.body;
  const userId = req.user.id;

  try {
    const emi = await EMI.findOne({ _id: id, userId });
    if (!emi) {
      return res.status(404).json({
        success: false,
        message: 'EMI schedule not found or access denied.'
      });
    }

    if (linkedAccountId) {
      const account = await Account.findOne({ _id: linkedAccountId, userId });
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Target asset account not found or unauthorized'
        });
      }
      emi.linkedAccountId = linkedAccountId;
    }

    if (description !== undefined) emi.description = description;
    if (totalAmount !== undefined) emi.totalAmount = parseFloat(totalAmount);
    if (paymentAmount !== undefined) emi.paymentAmount = parseFloat(paymentAmount);
    if (startDate !== undefined) emi.startDate = new Date(startDate);
    if (endDate !== undefined) emi.endDate = new Date(endDate);
    if (frequency !== undefined) emi.frequency = frequency;
    if (nextPaymentDate !== undefined) emi.nextPaymentDate = new Date(nextPaymentDate);

    await emi.save();

    res.status(200).json({
      success: true,
      data: emi
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Cancel/delete custom EMI record
// @route   DELETE /api/v1/emis/:id
// @access  Private
export const deleteEMI = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const emi = await EMI.findOneAndDelete({ _id: id, userId });
    if (!emi) {
      return res.status(404).json({
        success: false,
        message: 'EMI schedule not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      message: 'EMI schedule canceled.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Mark Payment, advance nextPay Date, decrement account balance, create transaction expense
// @route   POST /api/v1/emis/:id/mark-paid
// @access  Private
export const markEMIPaid = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const emi = await EMI.findOne({ _id: id, userId });
    if (!emi) {
      return res.status(404).json({
        success: false,
        message: 'EMI schedule not found'
      });
    }

    // Verify account exists
    const account = await Account.findOne({ _id: emi.linkedAccountId, userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Linked account has been deleted or is inaccessible.'
      });
    }

    // Capture or seed the default "EMI/Loan" Category
    let emiCategory = await Category.findOne({ userId, name: 'EMI/Loan', type: 'expense' });
    if (!emiCategory) {
      emiCategory = await Category.create({
        userId,
        name: 'EMI/Loan',
        type: 'expense',
        essential: true
      });
    }

    // Run writing operations dynamically
    await runInSession(async (session) => {
      const options = session ? { session } : {};

      // 1. Create matching expense transaction
      await Expense.create([{
        userId,
        accountId: emi.linkedAccountId,
        categoryId: emiCategory._id,
        amount: emi.paymentAmount,
        date: new Date(),
        description: `Installment Payment: ${emi.description}`,
        essential: true
      }], options);

      // 2. Charge Account balance
      await Account.findOneAndUpdate(
        { _id: emi.linkedAccountId },
        { $inc: { balance: -emi.paymentAmount } },
        { new: true, ...options }
      );

      // 3. Advance NextPaymentDate by Frequency Interval
      const currentNext = new Date(emi.nextPaymentDate);
      if (emi.frequency === 'weekly') {
        currentNext.setDate(currentNext.getDate() + 7);
      } else if (emi.frequency === 'biweekly') {
        currentNext.setDate(currentNext.getDate() + 14);
      } else {
        // Monthly
        currentNext.setMonth(currentNext.getMonth() + 1);
      }

      emi.nextPaymentDate = currentNext;
      await emi.save(options);
    });

    res.status(200).json({
      success: true,
      message: 'EMI installment marked paid. Balance charged and matched expense line item generated.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Perform safety warnings if accounts liquid balances cannot cover 7-day scheduled EMIs
// @route   GET /api/v1/emis/cash-flow-check
// @access  Private
export const cashFlowCheck = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const safetyLimit = new Date(today);
    safetyLimit.setDate(today.getDate() + 7);

    // Get all user EMIs
    const emis = await EMI.find({ userId }).populate('linkedAccountId');

    const warningBills = [];

    emis.forEach((emi) => {
      const nextPayNorm = new Date(emi.nextPaymentDate);
      
      // Match within the next 7 days (and not already overdue past 30 days)
      if (nextPayNorm >= today && nextPayNorm <= safetyLimit) {
        const balance = emi.linkedAccountId?.balance || 0;
        const remaining = balance - emi.paymentAmount;
        
        // Safety margin threshold setting: warning if drops below 1000 or negative
        if (remaining < 1000) {
          warningBills.push({
            emiId: emi._id,
            description: emi.description,
            paymentAmount: emi.paymentAmount,
            accountName: emi.linkedAccountId?.name || 'Linked Account',
            currentBalance: balance,
            riskMessage: remaining < 0 
              ? `Negative coverage risk: Account balance (₹${balance.toLocaleString('en-IN')}) is insufficient for ₹${emi.paymentAmount.toLocaleString('en-IN')}.`
              : `Safety margin alert: Account balance will drop below safe safety buffer limit (remaining ₹${remaining.toLocaleString('en-IN')}).`
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      data: warningBills
    });

  } catch (error) {
    next(error);
  }
};

/**
 * TODO: /api/v1/emis/payoff-planner (STUB)
 * 
 * Objectives:
 * 1. Allow the user to simulate accelerated payment scenarios (constant extra monthly payments vs one-off lump sums).
 * 2. Calculate remaining tenure, total interest paid, and early payoff date under normal vs accelerated routes.
 * 3. Required schema adjustments: Mappings for interest rate percentages, compounding parameters.
 */

/**
 * TODO: /api/v1/emis/refinancing-suggestions (STUB)
 * 
 * Objectives:
 * 1. Pull active loans interest rate details and query mock/external market indices.
 * 2. If modern market rates are lower (exceeding a threshold like 0.75%), calculate savings potential from refinancing.
 * 3. Computes net benefit subtracting loan closing costs or foreclosure fees.
 */
