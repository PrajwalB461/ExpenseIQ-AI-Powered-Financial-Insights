import Category from '../models/Category.js';

export const seedDefaultCategories = async (userId) => {
  const defaultIncomeCategories = ['Salary', 'Freelance', 'Investment', 'Other'];
  const defaultExpenseCategories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];

  try {
    const categoriesToSeed = [];

    // Map income categories
    for (const name of defaultIncomeCategories) {
      categoriesToSeed.push({
        userId,
        name,
        type: 'income',
        isDefault: true
      });
    }

    // Map expense categories
    const essentialExpenses = ['Food', 'Transport', 'Bills', 'Health'];
    for (const name of defaultExpenseCategories) {
      categoriesToSeed.push({
        userId,
        name,
        type: 'expense',
        isDefault: true,
        essential: essentialExpenses.includes(name)
      });
    }

    // Insert all if not already present
    await Category.insertMany(categoriesToSeed, { ordered: false });
    console.log(`[Database] Seeded default categories for user ${userId} successfully.`);
  } catch (error) {
    // If some duplicate key error occurs, ignorable
    console.log(`[Database] Categories seeding detail message for user ${userId}:`, error.message);
  }
};
