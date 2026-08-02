import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Expense record must belong to a user']
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Expense record must specify a target asset account']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Expense record must specify a category classification']
  },
  amount: {
    type: Number,
    required: [true, 'Please specify an expense amount'],
    min: [0.01, 'Expense amount must be greater than zero']
  },
  date: {
    type: Date,
    required: [true, 'Please specify the expense log date'],
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  essential: {
    type: Boolean,
    required: [true, 'Please specify whether the expense is essential or discretionary'],
    default: false
  }
}, {
  timestamps: true
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
