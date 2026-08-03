# FinIntel AI — Autonomous MERN Stack Expense Tracker

A state-of-the-art MERN (MongoDB, Express, React, Node.js) financial management workspace equipped with autonomous budget modeling, graphical card dashboards, EMI amortization sliders, and AI reasoning workspaces.

---

## Repository Structure

```text
/
├── server/                 # Express backend API REST architecture
│   ├── controllers/        # Express router controller functions
│   ├── middleware/         # Custom auth validation and central error handlers
│   ├── models/             # Mongoose DB schema schemas
│   ├── routes/             # Routers under /api/v1 (health check, etc.)
│   ├── utils/              # Database connections & helper classes
│   ├── .env                # Server configuration secrets
│   └── server.js           # Server bootstrap runner entry point
│
└── client/                 # React frontend template (Vite + Tailwind CSS v4)
    ├── src/
    │   ├── api/            # Centralized Axios configuration base
    │   ├── components/     # Persistent Sidebar, Navbar header, Protect filters
    │   ├── context/        # Global AuthContext providers
    │   ├── hooks/          # Shared hook helpers
    │   ├── pages/          # Dashboard, Income, Expense, Budgets, EMI, AI Space
    │   ├── App.jsx         # App routes manager
    │   └── index.css       # Tailwind layers import entry
```

---

## Tech Stack Details

### Backend
- **Core**: Node.js & Express
- **Database Orm**: MongoDB via Mongoose
- **Authorization**: JSON Web Token (cookie-parser httpOnly mapping)
- **Validation**: express-validator

### Frontend
- **System**: React (Vite environment)
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Graphics**: Recharts
- **Icons**: Lucide React
- **Request Agent**: Axios

---

## Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended, current system uses v24.13.1)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (running locally on default port 27017 or a MongoDB Atlas URI)

---

### 1. Server Configuration & Setup

1. Open a terminal and navigate to the `/server` directory:
   ```bash
   cd server
   ```
2. Install npm package dependencies:
   ```bash
   npm install
   ```
3. Configure the environment by editing the `/server/.env` file:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/expense-tracker
   JWT_SECRET=default_secret_key_for_expense_tracker_ai_2026

   # Optional Integrations (If omitted, features degrade gracefully)
   GROQ_API_KEY=your-groq-key-here
   GROQ_MODEL=llama3-8b-8192
   ```
4. Fire up the API development server:
   ```bash
   npm run dev
   ```
5. Confirm server health. Open a browser and visit:
   `http://localhost:5000/api/v1/health`

---

### 2. Client Configuration & Setup

1. Open a terminal and navigate to the `/client` directory:
   ```bash
   cd client
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Boot up the Vite dev server:
   ```bash
   npm run dev
   ```
4. Access client web application at `http://localhost:5173` (or the port specified by Vite in the console).

---

## Features & Scaffolding Flow

- **Health Check Engine**: Dynamic verification dashboard querying `/api/v1/health`. Shows whether secondary key features (Groq) are connected or run under safe sandbox fallback modes.
- **Persistent Shell Layout**: The header displays real-time connection telemetry to the node server alongside a collapsing sidebar containing navigation items.
- **Mock Authenticator**: Allows entering sandbox page paths using the "Access Demo Workspace" instant login trigger, bypassing DB connections during early local setup.
