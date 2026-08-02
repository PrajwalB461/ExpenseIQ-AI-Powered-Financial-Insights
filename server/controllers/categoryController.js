import Category from '../models/Category.js';
import { seedDefaultCategories } from '../services/categoryService.js';

// @desc    Get user categories, potentially filtered by type (income / expense)
// @route   GET /api/v1/categories
// @access  Private
export const getCategories = async (req, res, next) => {
  const { type } = req.query;
  const userId = req.user.id;

  try {
    const filter = { userId };
    if (type) {
      filter.type = type;
    }

    let categories = await Category.find(filter).sort({ name: 1 });
    
    // Auto-seed fallback for legacy accounts / registration fallback scenarios
    if (categories.length === 0) {
      await seedDefaultCategories(userId);
      categories = await Category.find(filter).sort({ name: 1 });
    }

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a custom category for the user
// @route   POST /api/v1/categories
// @access  Private
export const createCategory = async (req, res, next) => {
  const { name, type } = req.body;
  const userId = req.user.id;

  try {
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both category name and type'
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Category type must be either income or expense'
      });
    }

    // Check for duplicate custom category (case-insensitive check)
    const duplicate = await Category.findOne({
      userId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      type
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `A category named "${name}" already exists for type "${type}".`
      });
    }

    const category = await Category.create({
      userId,
      name: name.trim(),
      type,
      isDefault: false
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};
