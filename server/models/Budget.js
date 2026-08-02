import mongoose from 'mongoose';

const BudgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  limitAmount: {
    type: Number,
    required: true,
    min: [0.01, 'Limit must be positive']
  },
  duration: {
    type: String,
    enum: ['monthly', 'weekly', 'custom'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can only have one active budget per category at a given date range to avoid redundant items
BudgetSchema.index({ userId: 1, categoryId: 1, startDate: 1, endDate: 1 }, { unique: true });

export default mongoose.model('Budget', BudgetSchema);
