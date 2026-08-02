import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './utils/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import healthRoute from './routes/health.js';
import authRoute from './routes/auth.js';
import accountsRoute from './routes/accounts.js';
import categoriesRoute from './routes/categories.js';
import incomeRoute from './routes/income.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Keep it permissive in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect to Database
connectDB()
  .then(() => {
    console.log('[System] Database connection setup successful.');
  })
  .catch((err) => {
    console.warn(`[System WARNING] Database connection failed at startup: ${err.message}.`);
    console.warn('[System WARNING] The server will still run, but DB-dependent functions might fail.');
  });

// Debug route logger
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.originalUrl}`);
  next();
});

// Register routes
app.use('/api/v1/health', healthRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/accounts', accountsRoute);
app.use('/api/v1/categories', categoriesRoute);
app.use('/api/v1/income', incomeRoute);

// Catch-all route for unmatched API routes
app.all('*', (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.statusCode = 404;
  next(err);
});

// Central error handler
app.use(errorHandler);

// Start listening
const server = app.listen(PORT, () => {
  console.log(`[Success] Server is running on port ${PORT}`);
  console.log(`[Success] Health Check URL: http://localhost:${PORT}/api/v1/health`);
  
  // Graceful degradation checks
  if (!process.env.GROQ_API_KEY) {
    console.log('[Info] GROQ_API_KEY is not defined. AI functionality will degrade gracefully.');
  }
  if (!process.env.RESEND_API_KEY) {
    console.log('[Info] RESEND_API_KEY is not defined. Verification emails will degrade gracefully.');
  }
});

export default app;
