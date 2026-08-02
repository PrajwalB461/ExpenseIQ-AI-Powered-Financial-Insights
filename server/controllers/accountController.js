import mongoose from 'mongoose';
import Account from '../models/Account.js';

// @desc    Create a new account
// @route   POST /api/v1/accounts
// @access  Private
export const createAccount = async (req, res, next) => {
  const { name, type, balance, creditLimit } = req.body;
  const userId = req.user.id;

  try {
    // Check if account name already exists for this user
    const existingAccount = await Account.findOne({ userId, name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: `An account named "${name}" already exists. Please choose a different label.`
      });
    }

    const accountData = {
      userId,
      name,
      type,
      balance: balance || 0
    };

    if (type === 'credit_card') {
      accountData.creditLimit = creditLimit;
    }

    const account = await Account.create(accountData);

    res.status(201).json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all accounts for authenticated user
// @route   GET /api/v1/accounts
// @access  Private
export const getAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ userId: req.user.id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: accounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get account details by ID (Scoped to owner)
// @route   GET /api/v1/accounts/:id
// @access  Private
export const getAccountById = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account ID parameter schema'
      });
    }

    const account = await Account.findById(id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Verify ownership
    if (account.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this account resource'
      });
    }

    res.status(200).json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update account details (Name, type, credit limit only - balance is barred)
// @route   PUT /api/v1/accounts/:id
// @access  Private
export const updateAccount = async (req, res, next) => {
  const { id } = req.params;
  const { name, type, creditLimit } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account ID parameter schema'
      });
    }

    const account = await Account.findById(id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Verify ownership
    if (account.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this account resource'
      });
    }

    // Enforce name uniqueness on rename
    if (name && name.toLowerCase() !== account.name.toLowerCase()) {
      const duplicate = await Account.findOne({
        userId: req.user.id,
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `An account named "${name}" already exists.`
        });
      }
    }

    // Perform updates only on permitted fields (balance update is explicitly blocked)
    if (name) account.name = name;
    if (type) {
      account.type = type;
      if (type !== 'credit_card') {
        account.creditLimit = undefined;
      }
    }
    if (type === 'credit_card' && creditLimit !== undefined) {
      account.creditLimit = creditLimit;
    }

    const updatedAccount = await account.save();

    res.status(200).json({
      success: true,
      data: updatedAccount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete account (Soft constraint check: block delete if transaction dependencies exist)
// @route   DELETE /api/v1/accounts/:id
// @access  Private
export const deleteAccount = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account ID parameter schema'
      });
    }

    const account = await Account.findById(id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Verify ownership
    if (account.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this account resource'
      });
    }

    // Dynamic checks: count transactions from registry if Transaction model is built.
    let linkedTransactionsCount = 0;
    if (mongoose.models.Transaction) {
      linkedTransactionsCount = await mongoose.model('Transaction').countDocuments({ accountId: id });
    }

    if (linkedTransactionsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete account with linked transactions. You have ${linkedTransactionsCount} associated transaction records.`
      });
    }

    await account.deleteOne();

    res.status(200).json({
      success: true,
      data: {
        message: 'Account deleted successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};
