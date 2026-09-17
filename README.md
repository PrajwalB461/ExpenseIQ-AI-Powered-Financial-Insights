# ExpenseIQ – AI-Powered Financial Insights

ExpenseIQ is a **MERN stack expense management application** built to help users manage their personal finances in one place.

Users can add accounts, record income and expenses, create budgets, and view their financial activity through a dashboard. The project also includes an **AI-powered assistant** that provides insights based on financial data.

## Features

* User registration and login
* Password strength validation
* Add and manage multiple accounts
* Add and track income and expenses
* Create and manage budgets
* Dashboard with financial summaries
* Charts for spending analysis
* AI-powered financial insights
* JWT-based authentication
* Password hashing with Bcrypt
## Screenshots
## Registration Page
<img width="957" height="401" alt="Registration" src="https://github.com/user-attachments/assets/5e01c842-d387-4577-93b3-bc62b925a838" />
## Dashboard
<img width="959" height="401" alt="Dashboard" src="https://github.com/user-attachments/assets/018d1e06-aa79-413a-a9bb-861d6bf6d798" />
## Accounts
<img width="957" height="398" alt="Accounts" src="https://github.com/user-attachments/assets/c07595e8-9187-44e4-b933-ddbaae849da4" />
## Income
<img width="958" height="403" alt="Income" src="https://github.com/user-attachments/assets/7c039b5a-3cb2-4223-8475-e71cb0527d99" />
## Budget
<img width="959" height="399" alt="Budget" src="https://github.com/user-attachments/assets/619cdf2d-846b-416d-b840-144373c5f5ee" />
## AI Assistant
<img width="959" height="400" alt="AI Assistant" src="https://github.com/user-attachments/assets/55bf27bc-6758-4c10-b971-39c6a32f42e5" />
## Profile Page
<img width="959" height="401" alt="Profile" src="https://github.com/user-attachments/assets/e974859f-c48c-4bd3-8748-972a3da1a4ee" />

* **Frontend:** React, Vite, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB, Mongoose
* **Authentication:** JWT, Bcrypt
* **AI:** Groq API
* **Charts:** Recharts

## How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/PrajwalB461/ExpenseIQ-AI-Powered-Financial-Insights.git
cd ExpenseIQ-AI-Powered-Financial-Insights
```

### 2. Start the Backend

```bash
cd server
npm install
npm run dev
```

### 3. Start the Frontend

Open another terminal and run:

```bash
cd client
npm install
npm run dev
```

Vite will show the local URL in the terminal. It is usually:

```text
http://localhost:5173
```

## Environment Variables

Create a `.env` file inside the `server` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

Do not commit your `.env` file or API keys to GitHub.

## Author

**Prajwal Bharambe**

GitHub: [@PrajwalB461](https://github.com/PrajwalB461)
