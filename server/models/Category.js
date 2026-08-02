import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Default categories might not have a userId (null), which means they are system-wide defaults.
    // Or we duplicate them per user. The prompt says "seed a set of default categories on user creation".
    // So each user will have their own copies, making it extremely easy to customize or manage.
    required: [true, 'Category must belong to a user']
  },
  name: {
    type: String,
    required: [true, 'Please specify a category name'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Please specify the category type'],
    enum: ['income', 'expense']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  essential: {
    type: Boolean,
    default: false
  }
});

// Enforce unique categories per user & type
categorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

export default Category;
