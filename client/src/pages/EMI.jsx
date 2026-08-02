import React, { useState, useEffect } from 'react';
import { Calendar, Calculator, AlertTriangle, Plus, Trash2, Clock, Info } from 'lucide-react';
import API from '../api';
import LedgerCard from '../components/LedgerCard';

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
      setError(err.response?.data?.message || 'Failed to sync EMI records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchEMIsAndChecks();
  }, []);

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
      
      {/* Cashflow deplete alerts feeds */}
      {warnings.length > 0 && (
        <div className="rounded border border-danger/20 bg-danger/5 p-5 text-ink-red flex items-start gap-4">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 animate-pulse text-danger" />
          <div className="space-y-1.5">
            <h4 className="font-bold text-sm font-serif">Repayment Liquidity Risk Alert</h4>
            <p className="text-[10px] text-ink-muted">
              The following installments fall due within the next 7 days and exceed safe account bounds:
            </p>
            <div className="mt-2 space-y-2">
              {warnings.map((w, index) => (
                <div key={index} className="bg-surface rounded border border-rule p-3">
                  <span className="font-bold text-ink block uppercase tracking-wider text-[10px]">
                    {w.description} (Source: {w.accountName})
                  </span>
                  <p className="text-[10px] text-ink-red tracking-tight mt-1 font-mono">
                    Required Payout: ₹{w.paymentAmount.toLocaleString('en-IN')} | Reserve Balance: ₹{w.currentBalance.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Operation Alert messages feeds */}
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

      {/* Grid container layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Span - Lists and Stretch Planner stubs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active EMI Schedules list */}
          <LedgerCard title="Active Loan Repayments" subtitle="Standing Debt Commitments">
            {loading ? (
              <div className="py-12 flex justify-center items-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            ) : emis.length > 0 ? (
              <div className="space-y-4 pt-2">
                {emis.map((emi) => {
                  const status = emi.status;
                  let badgeColors = 'border-brand text-ink-green bg-ink-green/5';

                  if (status === 'overdue') {
                    badgeColors = 'border-danger text-ink-red bg-danger/5';
                  } else if (status === 'due soon') {
                    badgeColors = 'border-warning text-warning bg-warning/5';
                  }

                  return (
                    <div 
                      key={emi._id}
                      className="rounded border border-rule bg-surface p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 my-auto">
                        <div className="flex items-center gap-2">
                          <span className="text-ink text-sm font-bold uppercase font-serif">
                            {emi.description}
                          </span>
                          <span className={`px-2 py-0.5 rounded border text-[8px] tracking-widest font-bold uppercase ${badgeColors}`}>
                            {status}
                          </span>
                        </div>
                        <div className="space-y-0.5 text-[10px] text-ink-muted">
                          <p>
                            Repayment size:{' '}
                            <span className="text-ink font-bold font-mono">₹{formatINR(emi.paymentAmount)}</span> ({emi.frequency})
                          </p>
                          <p>
                            Source account: <span className="text-ink font-bold">{emi.linkedAccountId?.name || 'Inaccessible'}</span> (Bal: ₹{(emi.linkedAccountId?.balance || 0).toLocaleString('en-IN')})
                          </p>
                          <p>
                            Next due date limit: <span className="text-accent-brass font-bold">{formatShortDate(emi.nextPaymentDate)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleMarkPaid(emi._id)}
                          className="flex items-center gap-1 bg-brand hover:bg-brand-hover text-white rounded px-3.5 py-2 transition-colors text-[10px] cursor-pointer"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => handleDeleteEMI(emi._id)}
                          className="text-ink-muted hover:text-ink-red p-2 hover:bg-bg rounded cursor-pointer transition-colors outline-none"
                          title="Cancel Plan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-rule rounded bg-surface/10">
                <Clock className="h-6 w-6 text-ink-muted mx-auto mb-2" />
                <p className="text-xs text-ink-muted font-medium font-serif">No loan schedules registered yet.</p>
              </div>
            )}
          </LedgerCard>

          {/* Payoff Planner & Refinancing suggestions - Stretch Goals stubs */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Payoff Planner card */}
            <LedgerCard title="Snowball Payoff Planner" subtitle="ACCELERATED FORECLOSURE MODEL">
              <p className="text-[10px] text-ink-muted leading-relaxed font-semibold">
                Formulate accelerated payoff goals based on the Snowball or Avalanche debt reduction frameworks. Forecast target foreclosure months based on dynamic index modifiers.
              </p>
              <div className="pt-2 text-[10px] text-accent-brass italic font-bold">TODO: Enable Snowball Payoffs</div>
            </LedgerCard>

            {/* Refinancing Suggestions card */}
            <LedgerCard title="Refinancing Audit" subtitle="INTEREST RATE INDEX MONITOR">
              <p className="text-[10px] text-ink-muted leading-relaxed font-semibold">
                Audits registered interest rates against prevailing bank lending indexes in real time, calculating foreclosure feasibility and warning when refinancing margins deliver returns.
              </p>
              <div className="pt-2 text-[10px] text-accent-brass italic font-bold">TODO: Evaluate Loan Refinancing</div>
            </LedgerCard>

          </div>

        </div>

        {/* Right Span - Inputs configure form & slider Estimator */}
        <div className="space-y-6">
          
          {/* Add EMI form */}
          <LedgerCard title="Register Loan calendar" subtitle="Configure recurring repayment rulesets">
            <form onSubmit={handleAddEMI} className="space-y-4 pt-2">
              <div>
                <label className="text-[9px] uppercase text-ink-muted block mb-1 font-bold">Repayment Label</label>
                <input
                  type="text"
                  placeholder="e.g. SBI Car Loan EMI"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] uppercase text-ink-muted block mb-1 font-bold">Total Loan Sum</label>
                  <input
                    type="number"
                    placeholder="Principal sum"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase text-ink-muted block mb-1 font-bold">EMI Payout Size</label>
                  <input
                    type="number"
                    placeholder="EMI size"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase text-ink-muted block mb-1 font-bold">Amortization Interval</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand font-semibold cursor-pointer"
                >
                  <option value="monthly">Monthly installment</option>
                  <option value="biweekly">Bi-weekly installment</option>
                  <option value="weekly">Weekly installment</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] uppercase text-ink-muted block mb-1 font-bold">Start date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase text-ink-muted block mb-1 font-bold">End date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase text-ink-muted block mb-1 font-bold">Funding Account Source</label>
                <select
                  value={linkedAccountId}
                  onChange={(e) => setLinkedAccountId(e.target.value)}
                  className="w-full rounded border border-rule bg-surface px-3 py-2.5 text-ink focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option value="" disabled>Select Asset Target</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.name} (Bal: ₹{acc.balance.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded bg-brand hover:bg-brand-hover text-white px-5 py-2.5 font-bold transition-all cursor-pointer outline-none"
              >
                Register Repayment Rule
              </button>
            </form>
          </LedgerCard>

          {/* Interactive Calculator Slider */}
          <LedgerCard title="Amortization Estimator" subtitle="Amortization Calculation Sandbox">
            <div className="space-y-4 text-[10px] pt-2">
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-ink-muted font-bold">Loan Amount (P)</span>
                  <span className="text-ink font-bold font-mono">₹{calcPrincipal.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="1000000"
                  step="10000"
                  value={calcPrincipal}
                  onChange={(e) => setCalcPrincipal(Number(e.target.value))}
                  className="w-full h-1 bg-surface rounded appearance-none cursor-pointer accent-brass"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-ink-muted font-bold">Annual Rate (R)</span>
                  <span className="text-ink font-bold font-mono">{calcRate}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="24"
                  step="0.5"
                  value={calcRate}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  className="w-full h-1 bg-surface rounded appearance-none cursor-pointer accent-brass"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-ink-muted font-bold">Tenure (N)</span>
                  <span className="text-ink font-bold font-mono">{calcTenure} Months</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="120"
                  step="6"
                  value={calcTenure}
                  onChange={(e) => setCalcTenure(Number(e.target.value))}
                  className="w-full h-1 bg-surface rounded appearance-none cursor-pointer accent-brass"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5 border-t border-rule pt-4 font-mono">
                <div>
                  <span className="text-ink-muted uppercase tracking-wide block text-[8px] font-bold">Repayment Size</span>
                  <span className="text-sm font-bold text-accent-brass">₹{emiCalculatorVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo</span>
                </div>
                <div>
                  <span className="text-ink-muted uppercase tracking-wide block text-[8px] font-bold">Interest Cost</span>
                  <span className="text-sm font-bold text-ink-red">₹{totalInterestPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>
          </LedgerCard>

        </div>

      </div>

    </div>
  );
};

export default EMI;
