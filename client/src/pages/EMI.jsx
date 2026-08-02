import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  Calendar, 
  DollarSign, 
  Calculator, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  CheckCircle,
  Clock, 
  Sparkles,
  Lock,
  Info 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import API from '../api';

const EMI = () => {
  // Main Data States
  const [emis, setEmis] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add EMI Form State
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [linkedAccountId, setLinkedAccountId] = useState('');

  // Calculator Parameters
  const [calcPrincipal, setCalcPrincipal] = useState(50000);
  const [calcRate, setCalcRate] = useState(7.5);
  const [calcTenure, setCalcTenure] = useState(36); // In months

  const fetchAccounts = async () => {
    try {
      const res = await API.get('/accounts');
      if (res.data?.success) {
        setAccounts(res.data.data);
        if (res.data.data.length > 0 && !linkedAccountId) {
          setLinkedAccountId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to retrieve funding accounts:', err);
    }
  };

  const fetchEMIsAndChecks = async () => {
    setLoading(true);
    setError('');
    try {
      const [emisRes, warningsRes] = await Promise.all([
        API.get('/emis'),
        API.get('/emis/cash-flow-check')
      ]);

      if (emisRes.data?.success) {
        setEmis(emisRes.data.data);
      }
      if (warningsRes.data?.success) {
        setWarnings(warningsRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sync EMI records listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchEMIsAndChecks();
  }, []);

  // Make Installment Payment Action
  const handleMarkPaid = async (id) => {
    setError('');
    setSuccess('');
    try {
      const res = await API.post(`/emis/${id}/mark-paid`);
      if (res.data?.success) {
        setSuccess(res.data.message || 'EMI marked paid successfully.');
        fetchEMIsAndChecks();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Execution error during marking installment as paid.');
    }
  };

  // Create new EMI Schedule
  const handleAddEMI = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!description || !totalAmount || !paymentAmount || !startDate || !endDate || !linkedAccountId) {
      setError('Please fill in description, total amount, payment size, date fields, and specify a funding source.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post('/emis', {
        description,
        totalAmount: parseFloat(totalAmount),
        paymentAmount: parseFloat(paymentAmount),
        startDate,
        endDate,
        frequency,
        linkedAccountId
      });

      if (res.data?.success) {
        setSuccess('EMI repayment target established successfully.');
        setDescription('');
        setTotalAmount('');
        setPaymentAmount('');
        setStartDate('');
        setEndDate('');
        fetchEMIsAndChecks();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Creation rejected by backend guidelines.');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove EMI Plan
  const handleDeleteEMI = async (id) => {
    if (!window.confirm('Delete this EMI installment plan entirely? This cancels future payment checks.')) return;
    setError('');
    setSuccess('');
    try {
      const res = await API.delete(`/emis/${id}`);
      if (res.data?.success) {
        setSuccess('EMI canceled.');
        fetchEMIsAndChecks();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Delete operation failed.');
    }
  };

  // Repayment Calculator Outputs
  const calculateEMI = () => {
    const monthlyRate = calcRate / 12 / 100;
    const P = calcPrincipal;
    const R = monthlyRate;
    const N = calcTenure;

    if (calcRate === 0) return (P / N).toFixed(2);

    const emiValue = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    return isNaN(emiValue) ? '0.00' : emiValue.toFixed(2);
  };

  const emiCalculatorVal = Number(calculateEMI());
  const totalRepayment = emiCalculatorVal * calcTenure;
  const totalInterestPayable = Math.max(totalRepayment - calcPrincipal, 0);

  const chartData = [
    { name: 'Principal Amount', value: calcPrincipal, color: '#6366f1' },
    { name: 'Interest Cost', value: Math.round(totalInterestPayable), color: '#06b6d4' }
  ];

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const formatShortDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs font-semibold text-slate-350">
      
      {/* Title Jumbotron */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/60 to-indigo-900/60 p-6 border border-violet-850 bg-slate-900/40 shadow-xl">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-violet-600/20 blur-2xl"></div>
        <div className="relative">
          <h1 className="text-xl font-black text-white">Equity & Debt Installment Hub (EMI)</h1>
          <p className="mt-1 text-slate-300">
            Track standing commitments, forecast cash-flow depletion warning flags, and model amortizations automatically.
          </p>
        </div>
      </div>

      {/* Cashflow deplete alerts feeds */}
      {warnings.length > 0 && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-400 flex items-start gap-3 shadow-xl">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 animate-pulse text-red-500" />
          <div className="space-y-1">
            <h4 className="font-black text-sm text-white">Repayment Liquidity Risk Alert</h4>
            <p className="text-[10px] text-slate-350">
              The following installments fall due within the next 7 days and exceed safe account bounds:
            </p>
            <div className="mt-2 space-y-2">
              {warnings.map((w, index) => (
                <div key={index} className="bg-slate-950/40 rounded-xl p-3 border border-red-500/15">
                  <span className="font-extrabold text-white block uppercase tracking-wider text-[10px]">
                    {w.description} (Source: {w.accountName})
                  </span>
                  <p className="text-[10px] text-red-300 mt-1">
                    {w.riskMessage} Required Payout: <span className="font-extrabold text-white">₹{w.paymentAmount.toLocaleString('en-IN')}</span>. 
                    Current Liquid Reserve: <span className="font-extrabold text-white">₹{w.currentBalance.toLocaleString('en-IN')}</span>.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Operation Alert messages feeds */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-550/10 bg-red-500/10 p-4 text-red-400">
          <AlertTriangle className="h-4.5 w-4.5 animate-pulse" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-450 text-emerald-400">
          <CheckCircle className="h-4.5 w-4.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid container layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Left Span - Lists and Stretch Planner stubs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active EMI Schedules list */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-violet-400" />
                Active Loan Calendars
              </h3>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                {emis.length} ACTIVE PLANS
              </span>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center items-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
              </div>
            ) : emis.length > 0 ? (
              <div className="space-y-4">
                {emis.map((emi) => {
                  const status = emi.status;
                  let badgeColors = 'bg-violet-505 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';

                  if (status === 'overdue') {
                    badgeColors = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                  } else if (status === 'due soon') {
                    badgeColors = 'bg-amber-500/10 text-amber-550 text-amber-500 border border-amber-500/20';
                  }

                  return (
                    <div 
                      key={emi._id}
                      className="rounded-xl border border-slate-800 bg-slate-950/20 p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition"
                    >
                      <div className="space-y-1 my-auto">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-black uppercase text-slate-200">
                            {emi.description}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] tracking-widest font-bold uppercase ${badgeColors}`}>
                            {status}
                          </span>
                        </div>
                        <div className="space-y-0.5 text-[10px] text-slate-550 text-slate-500">
                          <p>
                            Repayment Size: <span className="text-white font-extrabold">₹{emi.paymentAmount.toLocaleString('en-IN')}</span> ({emi.frequency})
                          </p>
                          <p>
                            Source account: <span className="text-slate-400">{emi.linkedAccountId?.name || 'Inaccessible'}</span> (Bal: ₹{(emi.linkedAccountId?.balance || 0).toLocaleString('en-IN')})
                          </p>
                          <p>
                            Next due date limit: <span className="text-violet-400 font-extrabold">{formatShortDate(emi.nextPaymentDate)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleMarkPaid(emi._id)}
                          className="flex items-center gap-1 bg-violet-650 hover:bg-violet-600 text-white rounded-lg px-3.5 py-2 hover:scale-[1.01] transition-transform text-[10px] cursor-pointer bg-violet-600 shadow shadow-violet-950/20"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Mark Paid
                        </button>
                        <button
                          onClick={() => handleDeleteEMI(emi._id)}
                          className="text-slate-500 hover:text-rose-400 p-2 hover:bg-slate-900 rounded cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/15">
                <Info className="h-8 w-8 text-slate-600 mx-auto mb-2.5" />
                <p className="text-xs text-slate-500">No loan schedules registered yet.</p>
              </div>
            )}
          </div>

          {/* Payoff Planner & Refinancing suggestions - Stretch Goals stubs */}
          <div className="grid gap-6 md:grid-cols-2 opacity-80">
            
            {/* Payoff Planner card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4 hover:border-slate-700 transition">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calculator className="h-4.5 w-4.5 text-slate-500" />
                  Snowball Payoff Planner
                </h3>
                <span className="flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400 border border-slate-700">
                  Coming soon
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                Formulate accelerated payoff goals based on the Snowball or Avalanche debt reduction frameworks. Forecast target foreclosure months based on dynamic index modifiers.
              </p>
              <button 
                disabled 
                className="w-full pointer-events-none rounded-lg border border-slate-800 bg-slate-950 text-slate-600 px-3 py-2 text-center text-[10px] flex items-center justify-center gap-2"
              >
                <Lock className="h-3.5 w-3.5" />
                Enable Snowball Payoffs
              </button>
            </div>

            {/* Refinancing Suggestions card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4 hover:border-slate-700 transition">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-slate-500" />
                  Refinancing Audit
                </h3>
                <span className="flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400 border border-slate-700">
                  Coming soon
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                Audits registered interest rates against prevailing bank lending indexes in real time, calculating foreclosure feasibility and warning when refinancing margins deliver returns.
              </p>
              <button 
                disabled 
                className="w-full pointer-events-none rounded-lg border border-slate-800 bg-slate-950 text-slate-600 px-3 py-2 text-center text-[10px] flex items-center justify-center gap-2"
              >
                <Lock className="h-3.5 w-3.5" />
                Evaluate Loan Refinancing
              </button>
            </div>

          </div>

        </div>

        {/* Right Span - Inputs configure form & slider Estimator */}
        <div className="space-y-8">
          
          {/* Add EMI form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl space-y-4 hover:border-violet-500/25 transition-all">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="h-4.5 w-4.5 text-violet-400" />
                Register Loan Calendar
              </h3>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">Configure recurring repayment rulesets</p>
            </div>

            <form onSubmit={handleAddEMI} className="space-y-4">
              
              {/* Description */}
              <div>
                <label className="text-[9px] uppercase text-slate-400 block mb-1">Repayment Label</label>
                <input
                  type="text"
                  placeholder="e.g. SBI Car Loan EMI"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 font-semibold"
                />
              </div>

              {/* Grid values */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[9px] uppercase text-slate-400 block mb-1">Total Loan Amount</label>
                  <input
                    type="number"
                    placeholder="Principal sum"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase text-slate-400 block mb-1">Payment Payout</label>
                  <input
                    type="number"
                    placeholder="EMI installment"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 font-semibold"
                  />
                </div>
              </div>

              {/* Freq */}
              <div>
                <label className="text-[9px] uppercase text-slate-400 block mb-1">Amortization Interval</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 bg-slate-950 font-semibold cursor-pointer"
                >
                  <option value="monthly">Monthly installment</option>
                  <option value="biweekly">Bi-weekly installment</option>
                  <option value="weekly">Weekly installment</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[9px] uppercase text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 font-semibold text-slate-205"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase text-slate-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 font-semibold text-slate-205"
                  />
                </div>
              </div>

              {/* Account Dropdown Source */}
              <div>
                <label className="text-[9px] uppercase text-slate-400 block mb-1">Funding Account Source</label>
                <select
                  value={linkedAccountId}
                  onChange={(e) => setLinkedAccountId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 bg-slate-950 font-semibold cursor-pointer"
                >
                  <option value="" disabled>Select Asset Target</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.name} (Bal: ₹{acc.balance.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit btn */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-650 hover:bg-violet-600 text-white px-5 py-2.5 font-bold transition-all bg-violet-600 cursor-pointer shadow-lg shadow-violet-950/20 disabled:opacity-50"
              >
                <Plus className="h-4.5 w-4.5" />
                Register Repayment Rule
              </button>

            </form>
          </div>

          {/* Interactive Calculator Repayment Estimator Slider */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm space-y-6">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-violet-400" />
              <h3 className="text-sm font-bold text-white">Amortization Estimator</h3>
            </div>
            
            <div className="space-y-4 text-[10px]">
              
              {/* slider 1 */}
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Loan Amount (P)</span>
                  <span className="text-white">₹{calcPrincipal.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="1000000"
                  step="10000"
                  value={calcPrincipal}
                  onChange={(e) => setCalcPrincipal(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-violet-550"
                />
              </div>

              {/* slider 2 */}
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Annual Interest (R)</span>
                  <span className="text-white">{calcRate}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="24"
                  step="0.5"
                  value={calcRate}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-violet-550"
                />
              </div>

              {/* slider 3 */}
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Tenure Weeks/Months (N)</span>
                  <span className="text-white">{calcTenure} Months</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="120"
                  step="6"
                  value={calcTenure}
                  onChange={(e) => setCalcTenure(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-violet-550"
                />
              </div>

              {/* Display Result statistics */}
              <div className="grid grid-cols-2 gap-3.5 border-t border-slate-900 pt-4">
                <div>
                  <span className="text-slate-500 uppercase tracking-wide block text-[8px]">Repayment Payout</span>
                  <span className="text-sm font-black text-violet-400">₹{emiCalculatorVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-wide block text-[8px]">Interest Cost</span>
                  <span className="text-sm font-black text-cyan-400">₹{totalInterestPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default EMI;
