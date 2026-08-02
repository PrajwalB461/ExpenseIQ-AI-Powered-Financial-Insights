import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, Plus, Calendar, ArrowUpRight, AlertTriangle, Info } from 'lucide-react';
import API from '../api';
import LedgerCard from '../components/LedgerCard';

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
  const [duration, setDuration] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
        const expenseCats = categoriesRes.data.data.filter(c => c.type === 'expense');
        setCategories(expenseCats);
        if (expenseCats.length > 0 && !categoryId) {
          setCategoryId(expenseCats[0]._id);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download budget logs.');
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
      console.error('Failed to resolve suggestions:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSuggestions();
  }, []);

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
          setError('Custom budgets require both start and end dates.');
          return;
        }
        payload.startDate = startDate;
        payload.endDate = endDate;
      } else {
        if (startDate) payload.startDate = startDate;
      }

      const res = await API.post('/budgets', payload);

      if (res.data?.success) {
        setSuccess('Budget threshold configured.');
        setLimitAmount('');
        setStartDate('');
        setEndDate('');
        fetchData();
        fetchSuggestions();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to establish budget target details.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget limit threshold?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await API.delete(`/budgets/${id}`);
      if (res.data?.success) {
        setSuccess('Budget deleted.');
        fetchData();
        fetchSuggestions();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Delete operation failed.');
    }
  };

  const handleUseSuggestion = (sug) => {
    setCategoryId(sug.categoryId);
    setLimitAmount(sug.suggestedLimit.toString());
    setDuration('monthly');
    setSuccess(`Imported monthly limit proposal (₹${sug.suggestedLimit.toLocaleString()}) for category "${sug.categoryName}".`);
    setTimeout(() => setSuccess(''), 4000);
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const formatShortDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 text-xs text-ink font-semibold">
      
      {error && (
        <div className="flex items-center gap-2 rounded border border-danger/25 bg-danger/5 p-4 text-ink-red">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded border border-ink-green/20 bg-ink-green/5 p-4 text-ink-green">
          <Info className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid Split Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Columns - Active Budgets list & suggestions */}
        <div className="lg:col-span-2 space-y-6">
          
          <LedgerCard title="Active Budget Thresholds" subtitle="Monitored Expense Caps">
            {loading ? (
              <div className="py-12 flex justify-center items-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            ) : budgets.length > 0 ? (
              <div className="space-y-4 pt-2">
                {budgets.map((budget) => {
                  const percent = budget.percentUsed;
                  
                  // Color status based on bounds: low usage (brand), high usage (warning 80%+), risk overflow (danger 100%+)
                  let progressColor = 'bg-brand';
                  let textColor = 'text-ink-green';
                  let statusLabel = 'SURPLUS SAFE';

                  if (percent >= 100) {
                    progressColor = 'bg-danger';
                    textColor = 'text-ink-red';
                    statusLabel = 'LIMIT EXCEEDED!';
                  } else if (percent >= 80) {
                    progressColor = 'bg-warning';
                    textColor = 'text-warning';
                    statusLabel = 'HIGH USAGE ALERT';
                  }

                  return (
                    <div 
                      key={budget._id}
                      className="rounded border border-rule bg-surface p-4.5 space-y-3"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-ink text-sm font-bold uppercase font-serif">
                              {budget.categoryId?.name || 'Category'}
                            </span>
                            <span className="px-2 py-0.5 rounded border border-rule bg-bg text-[8px] text-ink-muted uppercase tracking-wider font-bold">
                              {budget.duration}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-ink-muted mt-1 flex items-center gap-1.5 font-semibold">
                            <Calendar className="h-3 w-3" />
                            Active Interval: {formatShortDate(budget.startDate)} - {formatShortDate(budget.endDate)}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDelete(budget._id)}
                          className="text-ink-muted hover:text-ink-red p-1 hover:bg-bg rounded cursor-pointer transition-colors outline-none"
                          title="Remove Threshold Limit"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-xs border-t border-rule/50 pt-2 font-mono">
                        <div>
                          <span className="text-ink-muted">Debit Spent:</span>{' '}
                          <span className={`font-bold tabular-nums ${textColor}`}>₹{formatINR(budget.spentSoFar)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-ink-muted">Credit Limit:</span>{' '}
                          <span className="text-ink font-bold tabular-nums">₹{formatINR(budget.limitAmount)}</span>
                        </div>
                      </div>

                      {/* Progress bar with theme bounds */}
                      <div className="space-y-1">
                        <div className="w-full h-2 rounded bg-bg border border-rule overflow-hidden">
                          <div 
                            className={`h-full ${progressColor} transition-all duration-300`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold tracking-wider text-ink-muted mt-0.5">
                          <span className="font-mono">{percent.toFixed(1)}% limit utilized</span>
                          <span className={textColor}>{statusLabel}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-rule rounded bg-surface/10">
                <Info className="h-6 w-6 text-ink-muted mx-auto mb-2" />
                <p className="text-xs text-ink-muted font-medium font-serif">No active category budget thresholds configured.</p>
              </div>
            )}
          </LedgerCard>

          {/* Historical advice panel suggestions */}
          <LedgerCard title="Projections & Suggested Budgets" subtitle="Autonomous Historical Calculations">
            <p className="text-[10px] text-ink-muted font-semibold leading-relaxed pt-1">
              Suggestions represent calculated average monthly spend limits computed over historical transaction lines.
            </p>

            {suggestionsLoading ? (
              <div className="py-6 flex justify-center items-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            ) : suggestions.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                {suggestions.map((sug) => (
                  <div 
                    key={sug.categoryId}
                    className="rounded border border-rule bg-surface p-4 space-y-3 relative hover:border-brand/40 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2 border-b border-rule/50 pb-2">
                      <div>
                        <span className="text-ink font-bold font-serif text-xs block uppercase">
                          {sug.categoryName}
                        </span>
                        <span className="text-[9px] text-ink-muted mt-0.5 block uppercase tracking-wider font-bold">
                          {sug.monthsHistory} Months Scope
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-accent-brass font-bold text-sm block font-mono">
                          ₹{sug.suggestedLimit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-[8px] text-ink-muted block uppercase tracking-wider">Suggested Cap</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-ink-muted leading-relaxed">
                      {sug.reason}
                    </p>

                    <button
                      onClick={() => handleUseSuggestion(sug)}
                      className="w-full flex items-center justify-center gap-1.5 rounded border border-rule bg-bg hover:bg-surface text-ink px-3 py-1.5 font-bold transition-all text-[10px] cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      Apply Proposal
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-rule rounded bg-surface/10">
                <Info className="h-6 w-6 text-ink-muted mx-auto mb-2" />
                <p className="text-[10px] text-ink-muted font-serif">A minimum of one monthly category transaction is required to project suggestions.</p>
              </div>
            )}
          </LedgerCard>

        </div>

        {/* Right Columns - Budget Config Form */}
        <div className="lg:col-span-1">
          <LedgerCard title="Configure Account Limit" subtitle="Establish new reporting safety threshold" className="sticky top-6">
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-[9px] uppercase text-ink-muted block mb-1 font-bold">Expense category Type</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand font-semibold cursor-pointer"
                >
                  <option value="" disabled>Select Expense Class</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase text-ink-muted block mb-1 font-bold">Limit Amount (₹ volume)</label>
                <input
                  type="number"
                  placeholder="Enter limit threshold"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase text-ink-muted block mb-1 font-bold">Duration Cycle</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand font-semibold cursor-pointer"
                >
                  <option value="monthly">Monthly Cycle</option>
                  <option value="weekly">Weekly Cycle</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {duration === 'custom' && (
                <div className="grid grid-cols-2 gap-3 pb-1">
                  <div>
                    <label className="text-[9px] uppercase text-ink-muted block mb-1 font-bold">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded border border-rule bg-surface px-2 py-1.5 text-xs text-ink focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase text-ink-muted block mb-1 font-bold">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded border border-rule bg-surface px-2 py-1.5 text-xs text-ink focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              )}

              {duration !== 'custom' && (
                <div>
                  <label className="text-[9px] uppercase text-ink-muted block mb-1 font-bold">Effective From Date (Optional)</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                  />
                  <p className="text-[8px] text-ink-muted mt-1 uppercase font-semibold">Defaults to start of the calendar month</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded bg-brand hover:bg-brand-hover text-white px-5 py-2.5 font-bold transition-all cursor-pointer outline-none"
              >
                <Plus className="h-4 w-4" />
                Commit Budget Cap
              </button>
            </form>
          </LedgerCard>
        </div>

      </div>

    </div>
  );
};

export default Budgeting;
