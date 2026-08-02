import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Plus, 
  Calendar, 
  DollarSign, 
  Tag, 
  ArrowUpRight, 
  Activity, 
  AlertTriangle,
  Info 
} from 'lucide-react';
import API from '../api';

const Budgeting = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add budget form states
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [duration, setDuration] = useState('monthly'); // monthly | weekly | custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch initial budgets, categories and advice
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        API.get('/budgets'),
        API.get('/categories')
      ]);

      if (budgetsRes.data?.success) {
        setBudgets(budgetsRes.data.data);
      }
      if (categoriesRes.data?.success) {
        // filter categories, we only budget for OUTFLOW/EXPENSES
        const expenseCats = categoriesRes.data.data.filter(c => c.type === 'expense');
        setCategories(expenseCats);
        if (expenseCats.length > 0 && !categoryId) {
          setCategoryId(expenseCats[0]._id);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download your budget catalog.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const res = await API.get('/budgets/suggestions');
      if (res.data?.success) {
        setSuggestions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to resolve budget suggestions:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSuggestions();
  }, []);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!categoryId || !limitAmount) {
      setError('Please choose a category and specify a limit amount.');
      return;
    }

    try {
      const payload = {
        categoryId,
        limitAmount: parseFloat(limitAmount),
        duration
      };

      if (duration === 'custom') {
        if (!startDate || !endDate) {
          setError('Custom budgets require both a start date and an end date.');
          return;
        }
        payload.startDate = startDate;
        payload.endDate = endDate;
      } else {
        if (startDate) payload.startDate = startDate;
      }

      const res = await API.post('/budgets', payload);

      if (res.data?.success) {
        setSuccess('Budget target logged successfully.');
        setLimitAmount('');
        setStartDate('');
        setEndDate('');
        fetchData();
        fetchSuggestions(); // reload suggestions is useful
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to establish budget target details.');
    }
  };

  // Delete budget plan
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class budget limit?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await API.delete(`/budgets/${id}`);
      if (res.data?.success) {
        setSuccess('Budget plan deleted.');
        fetchData();
        fetchSuggestions();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Delete operation failed.');
    }
  };

  // Pre-fill fields from suggested values
  const handleUseSuggestion = (sug) => {
    setCategoryId(sug.categoryId);
    setLimitAmount(sug.suggestedLimit.toString());
    setDuration('monthly'); // default duration suggestions
    setSuccess(`Loaded suggested budget limit (₹${sug.suggestedLimit}) for category "${sug.categoryName}".`);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Indian Rupee standard parser helper
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(val);
  };

  // Format dates readable
  const formatShortDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs font-semibold text-slate-350">
      
      {/* Module Title Header area */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/60 to-indigo-900/60 p-6 border border-violet-850 bg-slate-900/40 shadow-xl">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-violet-600/20 blur-2xl"></div>
        <div className="relative">
          <h1 className="text-xl font-black text-white">Expense Budget Tracking Centre</h1>
          <p className="mt-1 text-slate-300">
            Designate safety bounds on expense subdivisions. Monitor your spends dynamically against custom targets with rule-based limit updates.
          </p>
        </div>
      </div>

      {/* Operation Alert messages feeds */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-red-400">
          <AlertTriangle className="h-4.5 w-4.5 animate-bounce animate-pulse" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-450 text-emerald-400">
          <Info className="h-4.5 w-4.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid Split Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Left Columns - Active Budgets list & suggestions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Budgets container */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-violet-400" />
                Active Category Budget Thresholds
              </h3>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono">
                {budgets.length} ACTIVE LIMITS
              </span>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center items-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
              </div>
            ) : budgets.length > 0 ? (
              <div className="space-y-4.5">
                {budgets.map((budget) => {
                  const percent = budget.percentUsed;
                  
                  // Color status calculations
                  let progressColor = 'bg-violet-500 bg-indigo-500';
                  let textColor = 'text-white';
                  let bgTrack = 'bg-slate-950';

                  if (percent >= 100) {
                    progressColor = 'bg-rose-500';
                    textColor = 'text-rose-455 text-rose-400';
                  } else if (percent >= 80) {
                    progressColor = 'bg-amber-500';
                    textColor = 'text-amber-450 text-amber-500';
                  }

                  return (
                    <div 
                      key={budget._id}
                      className="rounded-xl border border-slate-800 bg-slate-950/20 p-4.5 space-y-3 shadow-md hover:border-slate-700 transition-all"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-black uppercase">
                              {budget.categoryId?.name || 'Category'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-800/80 text-[8px] text-slate-400 uppercase tracking-wider font-bold">
                              {budget.duration}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 font-bold">
                            <Calendar className="h-3 w-3 text-slate-600" />
                            Active: {formatShortDate(budget.startDate)} - {formatShortDate(budget.endDate)}
                          </p>
                        </div>

                        <div className="text-right">
                          <button
                            onClick={() => handleDelete(budget._id)}
                            className="text-slate-600 hover:text-rose-400 p-1 hover:bg-slate-900 rounded cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Cap Limit details */}
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-slate-450 text-slate-400">Spent:</span>{' '}
                          <span className={`font-black ${textColor}`}>{formatINR(budget.spentSoFar)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-405 text-slate-400">Cap Limit:</span>{' '}
                          <span className="text-white font-black">{formatINR(budget.limitAmount)}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="w-full h-2 rounded-full overflow-hidden bg-slate-950 border border-slate-900">
                          <div 
                            className={`h-full ${progressColor} transition-all duration-500`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold tracking-wider text-slate-500 mt-0.5">
                          <span>{percent.toFixed(1)}% RATING used</span>
                          <span>{percent >= 100 ? 'BUDGET EXCEEDED' : percent >= 80 ? 'HIGH USAGE ALERT' : 'SURPLUS SAFE'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/15">
                <Info className="h-8 w-8 text-slate-600 mx-auto mb-2.5 animate-pulse" />
                <p className="text-xs text-slate-500 font-medium">No active category budget thresholds configured.</p>
              </div>
            )}
          </div>

          {/* Historical advice panel suggestions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-violet-400" />
              Dynamic Suggested Budgets advice
            </h3>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Our rule-based budget engine projects custom category caps pulling from historical expense patterns logged across your database.
            </p>

            {suggestionsLoading ? (
              <div className="py-6 flex justify-center items-center">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-violet-500/20 border-t-violet-500" />
              </div>
            ) : suggestions.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {suggestions.map((sug) => (
                  <div 
                    key={sug.categoryId}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3 relative hover:scale-[1.01] transition-transform"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-white font-black text-xs block uppercase">
                          {sug.categoryName}
                        </span>
                        <span className="text-[9px] text-slate-500 mt-0.5 block uppercase tracking-wider font-bold">
                          {sug.monthsHistory} Months Log Space
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-violet-400 font-black text-sm block">
                          ₹{sug.suggestedLimit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-[8px] text-slate-550 block font-mono">Suggested Cap</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed border-t border-slate-900 pt-2 text-slate-400">
                      {sug.reason}
                    </p>

                    <button
                      onClick={() => handleUseSuggestion(sug)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-violet-500/25 hover:border-violet-550 hover:bg-violet-900/10 text-violet-400 px-3 py-1.5 font-bold transition-all text-[10px] cursor-pointer mt-1"
                    >
                      <Plus className="h-3 w-3" />
                      Use Suggested
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/15">
                <Info className="h-8 w-8 text-slate-655 text-slate-600 mx-auto mb-2" />
                <p className="text-[10px] text-slate-500">Need at least one transaction registered in standard categories to build suggestions forecast.</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Columns - Glassmorphic Budget Design Form */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl space-y-4 hover:border-violet-500/20 transition-all sticky top-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="h-4.5 w-4.5 text-violet-400" />
                Configure Budget Limit
              </h3>
              <p className="text-[9px] text-slate-550 text-slate-500 uppercase tracking-wider font-bold">Write new limit configuration profiles</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Category Field */}
              <div>
                <label className="text-[9px] uppercase text-slate-400 block mb-1">Expense Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-slate-805 bg-slate-950 text-slate-205 border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-violet-500 bg-slate-950 font-semibold cursor-pointer"
                >
                  <option value="" disabled>Select Expense Class</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Limit Amount */}
              <div>
                <label className="text-[9px] uppercase text-slate-400 block mb-1">Limit Budget (₹ INR)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 select-none">₹</span>
                  <input
                    type="number"
                    placeholder="Enter limit threshold"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-2 text-white focus:outline-none focus:border-violet-500 font-semibold"
                  />
                </div>
              </div>

              {/* Duration Setting */}
              <div>
                <label className="text-[9px] uppercase text-slate-400 block mb-1">Interval Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 bg-slate-950 font-semibold cursor-pointer"
                >
                  <option value="monthly">Monthly Cycle</option>
                  <option value="weekly">Weekly Cycle</option>
                  <option value="custom">Custom Date Cycle</option>
                </select>
              </div>

              {/* Custom Date Ranges Fields */}
              {duration === 'custom' && (
                <div className="grid grid-cols-2 gap-3.5 animate-fade-in">
                  <div>
                    <label className="text-[9px] uppercase text-slate-400 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase text-slate-400 block mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Option to select Start Date for Monthly/Weekly too */}
              {duration !== 'custom' && (
                <div>
                  <label className="text-[9px] uppercase text-slate-400 block mb-1">Start Date (Optional)</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 font-semibold text-slate-205"
                  />
                  <p className="text-[8px] text-slate-500 mt-1 uppercase font-bold">Defaults to start of the calendar month</p>
                </div>
              )}

              {/* Submit active button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-650 hover:bg-violet-600 text-white px-5 py-2.5 font-bold transition-all bg-violet-600 cursor-pointer shadow-lg shadow-violet-950/20"
              >
                <Plus className="h-4.5 w-4.5" />
                Establish Budget
              </button>

            </form>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Budgeting;
