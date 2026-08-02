import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Income entry must belong to a user']
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Income entry must target an active asset account']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Income entry must declare a category class']
  },
  amount: {
    type: Number,
    required: [true, 'Please specify an income amount'],
    min: [0.01, 'Income amount must be greater than zero']
  },
  date: {
    type: Date,
    required: [true, 'Please specify the transaction date'],
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

const Income = mongoose.model('Income', incomeSchema);

export default Income;
