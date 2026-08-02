import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const mockChartData = [
  { month: 'Jan', income: 4500, expenses: 3100 },
  { month: 'Feb', income: 5200, expenses: 3500 },
  { month: 'Mar', income: 4900, expenses: 3800 },
  { month: 'Apr', income: 6100, expenses: 4200 },
  { month: 'May', income: 5800, expenses: 3900 },
  { month: 'Jun', income: 7000, expenses: 4500 },
  { month: 'Jul', income: 7500, expenses: 4800 },
];

const mockTransactions = [
  { id: '1', title: 'Salary Credited', date: 'Jul 31, 2026', type: 'income', category: 'Salary', amount: 5000, account: 'Chase Checking' },
  { id: '2', title: 'Whole Foods Market', date: 'Jul 30, 2026', type: 'expense', category: 'Grocery', amount: -245.50, account: 'Amex Gold' },
  { id: '3', title: 'Starbucks Coffee', date: 'Jul 29, 2026', type: 'expense', category: 'Dining Out', amount: -18.75, account: 'Amex Gold' },
  { id: '4', title: 'Monthly Rent Payment', date: 'Jul 28, 2026', type: 'expense', category: 'Housing', amount: -1800.00, account: 'Chase Checking' },
  { id: '5', title: 'Freelance Design Project', date: 'Jul 27, 2026', type: 'income', category: 'Freelance', amount: 1500, account: 'PayPal Wallet' },
];

const Dashboard = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Alert (Micro-interaction details) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/60 to-indigo-900/60 p-6 border border-violet-800/40 shadow-xl">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-violet-550/20 blur-2xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">Financial Intelligence Space</h1>
            <p className="mt-1 text-sm text-slate-300">
              Welcome back to your active financial control deck. Your AI has computed 3 optimizations for your upcoming bills.
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-550 shadow-md cursor-pointer transition-all shrink-0">
            <Sparkles className="h-4 w-4" />
            Analyze with FinAI
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Net Worth Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm hover:border-slate-700/80 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Balance</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-all">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-white">$12,485.50</h3>
            <span className="text-xs font-semibold text-emerald-450 flex items-center gap-1 mt-1 text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              +14.2% from last month
            </span>
          </div>
        </div>

        {/* Income Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm hover:border-slate-700/80 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Income</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-450 group-hover:bg-emerald-500/20 transition-all text-emerald-400">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-white">$7,500.00</h3>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3" />
              Active salary & freelance streams
            </span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm hover:border-slate-700/80 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expenses</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-450 group-hover:bg-rose-500/20 transition-all text-rose-400">
              <TrendingDown className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-white">$4,800.00</h3>
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3" />
              64% of income budget used
            </span>
          </div>
        </div>

        {/* Credit Limit / Accounts Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm hover:border-slate-700/80 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Accounts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-all">
              <CreditCard className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-white">3 Portfolios</h3>
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-1">
              2 Checking/Card, 1 Wallet
            </span>
          </div>
        </div>
      </div>

      {/* Main Analytics Segment */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recharts Area Flow */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Cashflow Analytics</h2>
              <p className="text-xs text-slate-400">Comparing real-time income mapping vs expense outflows</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-violet-400">
                <span className="h-2 w-2 rounded-full bg-violet-500"></span> Income
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-500"></span> Expenses
              </span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b', 
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="income" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#incomeColor)" />
                <Area type="monotone" dataKey="expenses" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#expenseColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
            <p className="text-xs text-slate-400 mb-6">Latest transaction logs on connected accounts</p>
            
            <div className="space-y-4">
              {mockTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold border transition-colors ${
                      tx.type === 'income' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-450 text-rose-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-violet-400 transition-colors">
                        {tx.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{tx.date} • {tx.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {tx.type === 'income' ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-[9px] text-slate-505 font-bold uppercase tracking-wider text-slate-500 mt-0.5">{tx.account}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full mt-6 rounded-xl border border-slate-800/80 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-350 hover:text-white transition-all cursor-pointer text-center">
            View All Ledger Entries
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
