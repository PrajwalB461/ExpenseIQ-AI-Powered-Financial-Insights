import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense-tracker';
  
  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    console.error(`[Database Error] Details: ${error}`);
    // We don't crash the server immediately if we want it to degrade gracefully, 
    // but standard practice is logging clearly. Let's keep it logged.
    // We can throw or exit, let's just log and throw so the server.js can catch and decide.
    throw error;
  }
};
