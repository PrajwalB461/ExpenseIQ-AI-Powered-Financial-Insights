import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Account must belong to a user']
  },
  name: {
    type: String,
    required: [true, 'Please provide an account name'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Please specify the account type'],
    enum: {
      values: ['bank', 'cash', 'NotebookPen', 'credit_card'],
      message: 'Account type must be either bank, cash, NotebookPen, or credit_card'
    }
  },
  balance: {
    type: Number,
    required: [true, 'Please specify a starting balance'],
    default: 0
  },
  creditLimit: {
    type: Number,
    // Optional, only relevant for credit_card type
    required: function() {
      return this.type === 'credit_card';
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent user from having duplicate account names
accountSchema.index({ userId: 1, name: 1 }, { unique: true });

const Account = mongoose.model('Account', accountSchema);

export default Account;
