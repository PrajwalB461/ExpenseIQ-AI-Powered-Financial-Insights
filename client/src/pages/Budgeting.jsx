import React, { useState } from 'react';
import { Target, AlertCircle, Sparkles, Check } from 'lucide-react';

const initialBudgets = [
  { id: '1', category: 'Housing', limit: 2000, spent: 1800, color: 'bg-indigo-500', text: 'text-indigo-400' },
  { id: '2', category: 'Grocery', limit: 600, spent: 550, color: 'bg-emerald-505', colorClass: 'bg-emerald-500', text: 'text-emerald-400' },
  { id: '3', category: 'Utilities', limit: 300, spent: 245, colorClass: 'bg-yellow-500', text: 'text-yellow-405' },
  { id: '4', category: 'Dining Out', limit: 250, spent: 180, colorClass: 'bg-rose-500', text: 'text-rose-400' },
  { id: '5', category: 'Shopping', limit: 400, spent: 370, colorClass: 'bg-purple-500', text: 'text-purple-400' },
];

const Budgeting = () => {
  const [budgets, setBudgets] = useState(initialBudgets);
  const [editingId, setEditingId] = useState(null);
  const [editLimit, setEditLimit] = useState('');
  const [success, setSuccess] = useState('');

  const handleEdit = (id, currentLimit) => {
    setEditingId(id);
    setEditLimit(String(currentLimit));
  };

  const handleSave = (id) => {
    setBudgets(budgets.map(b => b.id === id ? { ...b, limit: Number(editLimit) } : b));
    setEditingId(null);
    setSuccess('Budget threshold updated successfully!');
    setTimeout(() => setSuccess(''), 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Monthly Budget Limits</h1>
          <p className="text-xs text-slate-400">Establish and monitor spending constraints per operational category</p>
        </div>
        
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-805 bg-slate-900 px-3.5 py-2 text-xs font-semibold border-slate-800">
          <Target className="h-4 w-4 text-violet-400" />
          <span className="text-slate-400">Total Cap: </span>
          <span className="text-white font-extrabold">${budgets.reduce((sum, b) => sum + b.limit, 0).toLocaleString()}</span>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          <Check className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Progress Cards Matrix */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const percent = Math.min(Math.round((budget.spent / budget.limit) * 107), 100);
          const ratioExpr = budget.spent / budget.limit;
          
          let alertTrigger = false;
          let progressColor = budget.colorClass || 'bg-violet-600';
          
          if (ratioExpr >= 0.9) {
            alertTrigger = true;
            progressColor = 'bg-rose-500';
          } else if (ratioExpr >= 0.8) {
            progressColor = 'bg-yellow-500';
          }

          return (
            <div 
              key={budget.id} 
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between"
            >
              {/* Category info */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{budget.category}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider rounded-md px-1.5 py-0.5 ${
                    alertTrigger 
                      ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20 text-rose-400' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {alertTrigger ? 'Extreme Risk' : 'Healthy'}
                  </span>
                </div>

                {/* Spending Progress representation bar */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400 font-medium">Spent: <span className="font-bold text-slate-200">${budget.spent}</span></span>
                    <span className="text-slate-400 font-medium">Limit: 
                      {editingId === budget.id ? (
                        <div className="inline-flex items-center gap-1.5 ml-1">
                          <input
                            type="number"
                            value={editLimit}
                            onChange={(e) => setEditLimit(e.target.value)}
                            className="w-16 rounded bg-slate-950 px-1 py-0.5 text-xs text-white border border-slate-800 focus:outline-none"
                            autoFocus
                          />
                          <button 
                            onClick={() => handleSave(budget.id)}
                            className="rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-violet-500"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span 
                          onClick={() => handleEdit(budget.id, budget.limit)}
                          className="font-bold text-slate-200 hover:text-violet-400 cursor-pointer underline decoration-dotted ml-1 transition-colors"
                        >
                          ${budget.limit}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Tailwind Progress Bar container */}
                  <div className="h-2 w-full rounded-full bg-slate-955 border border-slate-950 overflow-hidden bg-slate-950/60">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-medium">{percent}% consumed</span>
                    <span className="text-slate-500 font-medium">${budget.limit - budget.spent} remaining</span>
                  </div>
                </div>
              </div>

              {/* Warnings details inside Card */}
              {alertTrigger && (
                <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-rose-500/5 py-2 px-2 text-[10px] text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500 animate-pulse" />
                  <span>Limit exceeded warning active. Reduce outflows!</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Budget suggestion box */}
      <div className="rounded-2xl border border-dashed border-cyan-800 bg-cyan-950/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-4 items-start">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-sm shadow-cyan-500/5">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-cyan-400 text-sm">FinAI Budget Restructuring Projections</h4>
            <p className="mt-1 text-slate-400 text-xs leading-relaxed">
              Based on your last 30 days bills, dropping 'Dining Out' limit by $50 and increasing 'Grocery' limit by $50 will lower utility variance by 12.5%.
            </p>
          </div>
        </div>
        <button className="rounded-xl border border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400 text-xs font-bold px-4 py-2.5 transition-all text-center inline-block cursor-pointer">
          Apply Restructure
        </button>
      </div>
    </div>
  );
};

export default Budgeting;
