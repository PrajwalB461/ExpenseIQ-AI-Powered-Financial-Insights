import React, { useState } from 'react';
import { 
  PlusCircle, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Wallet 
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

const mockExpenses = [
  { id: '1', title: 'Whole Foods Grocery Run', date: 'Jul 30, 2026', category: 'Grocery', amount: 245.50, account: 'Amex Gold' },
  { id: '2', title: 'Starbucks Coffee', date: 'Jul 29, 2026', category: 'Dining Out', amount: 18.75, account: 'Amex Gold' },
  { id: '3', title: 'Monthly Apartment Rent', date: 'Jul 28, 2026', category: 'Housing', amount: 1800.00, account: 'Chase Checking' },
  { id: '4', title: 'Cyberpunk Game Preorder', date: 'Jul 25, 2026', category: 'Shopping', amount: 79.99, account: 'Chase Checking' },
  { id: '5', title: 'Electric & Gas Utility Utility Bill', date: 'Jul 22, 2026', category: 'Utilities', amount: 135.20, account: 'Chase Checking' },
];

const mockPieData = [
  { name: 'Housing', value: 1800, color: '#6366f1' },
  { name: 'Grocery', value: 550, color: '#10b981' },
  { name: 'Utilities', value: 245, color: '#f59e0b' },
  { name: 'Dining Out', value: 180, color: '#ec4899' },
  { name: 'Shopping', value: 310, color: '#a855f7' },
];

const Expense = () => {
  const [expenses, setExpenses] = useState(mockExpenses);
  const [form, setForm] = useState({ title: '', amount: '', date: '', category: 'Grocery', account: 'Amex Gold' });
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.date) return;

    const newExp = {
      id: String(expenses.length + 1),
      title: form.title,
      date: new Date(form.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      category: form.category,
      amount: parseFloat(form.amount),
      account: form.account
    };

    setExpenses([newExp, ...expenses]);
    setForm({ title: '', amount: '', date: '', category: 'Grocery', account: 'Amex Gold' });
    setSuccessMsg('Expense logged cleanly.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Alert Warning for budget threshold (micro interaction design) */}
      <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-400">
        <AlertTriangle className="h-5.5 w-5.5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
        <div>
          <h4 className="font-extrabold text-white text-[13px]">Critical Threshold Warning</h4>
          <p className="mt-1 text-slate-400 text-xs text-slate-350">
            Your 'Shopping' category spending (${expenses.filter(e => e.category === 'Shopping').reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}) has reached <span className="font-bold text-red-400">92%</span> of your monthly limit ($400).
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Log form (Span 1) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm h-fit">
          <h2 className="text-lg font-bold text-white mb-1">Log Outflow</h2>
          <p className="text-xs text-slate-400 mb-6 font-medium">Record outgoing values and allocate them to categories</p>

          {successMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expense Label</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none transition-all placeholder-slate-600"
                placeholder="e.g. Spotify Premium"
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount ($)</label>
                <input
                  type="number"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none transition-all placeholder-slate-650"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date Charged</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none transition-all text-slate-400"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none transition-all appearance-none bg-slate-950"
                >
                  <option value="Grocery">Grocery</option>
                  <option value="Dining Out">Dining Out</option>
                  <option value="Housing">Housing</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Funding Source</label>
                <select
                  value={form.account}
                  onChange={(e) => setForm({ ...form, account: e.target.value })}
                  className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none transition-all appearance-none bg-slate-950"
                >
                  <option value="Chase Checking">Chase Checking</option>
                  <option value="Amex Gold">Amex Gold</option>
                  <option value="PayPal Wallet">PayPal Wallet</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-bold text-white shadow-lg hover:bg-violet-500 active:bg-violet-700 focus:outline-none transition-all cursor-pointer"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              Record Outflow
            </button>
          </form>
        </div>

        {/* Category distribution and log values */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts vs Metrics */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Visual Recharts distribution */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm flex flex-col items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 self-start">Categorical Allocation</h3>
              <div className="h-56 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockPieData}
                      cx="55%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {mockPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#1e293b', 
                        borderRadius: '12px',
                        fontSize: '11px' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 w-full text-[10px] text-slate-400 font-semibold border-t border-slate-800/80 pt-4">
                {mockPieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span>{d.name} (${d.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Expense indicator */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Monthly Outflows</h4>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-rose-450 text-rose-400">${totalExpense.toLocaleString()}</span>
                  <span className="text-xs text-rose-500">logged</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Largest:</span>
                  <span className="font-bold text-white">Housing ($1,800.00)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Payment Ratio:</span>
                  <span className="font-bold text-white">Debit 62% / Credit 38%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
            <h3 className="text-base font-bold text-white mb-4">Expense Report Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-2">Label</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Card/Account</th>
                    <th className="py-3 px-2">DateCharged</th>
                    <th className="py-3 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-850/20 transition-colors text-slate-350">
                      <td className="py-3.5 px-2 font-semibold text-white">{exp.title}</td>
                      <td className="py-3.5 px-2">
                        <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/10">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-slate-400">{exp.account}</td>
                      <td className="py-3.5 px-2 text-slate-400">{exp.date}</td>
                      <td className="py-3.5 px-2 text-right font-black text-rose-400">-${exp.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expense;
