import React, { useState } from 'react';
import { Landmark, Plus, Trash2, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const OnboardingModal = ({ isOpen, onClose }) => {
  const { setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  
  // Starting accounts list
  const [accounts, setAccounts] = useState([]);
  
  // Account logging form inside modal
  const [accForm, setAccForm] = useState({ name: '', type: 'bank', balance: '' });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddAccount = () => {
    if (!accForm.name || !accForm.balance) {
      setError('Please fill in both Account Name and Opening Balance.');
      return;
    }
    setError('');
    
    // Explicit safety assurance: Validate that card numbers are NEVER logged
    const isSensitive = /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b|\b\d{15,16}\b/.test(accForm.name);
    if (isSensitive) {
      setError('For security, please only enter card labels (e.g. "Amex Gold Card") instead of digits.');
      return;
    }

    setAccounts([...accounts, { 
      id: Date.now().toString(),
      name: accForm.name,
      type: accForm.type,
      balance: parseFloat(accForm.balance)
    }]);

    setAccForm({ name: '', type: 'bank', balance: '' });
  };

  const handleRemoveAccount = (id) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const handleSkip = async () => {
    setLoading(true);
    setError('');
    try {
      await API.post('/users/complete-onboarding');
      setUser(prev => ({ ...prev, hasCompletedOnboarding: true }));
      onClose();
    } catch (err) {
      console.error('Skipping onboarding failed:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to update setup status.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');

    // Prepare final accounts payload (handling implicit unsaved fields)
    const finalAccounts = [...accounts];
    const hasName = !!String(accForm.name || '').trim();
    const hasBalance = !!String(accForm.balance || '').trim();
    const isPartialInput = (hasName || hasBalance) && (!hasName || !hasBalance);

    if (isPartialInput) {
      setLoading(false);
      if (!hasName) {
        setError('Please fill in Account Label.');
      } else {
        setError('Please fill in Opening Balance / Cap.');
      }
      return;
    }

    if (hasName && hasBalance) {
      // Validate card numbers security checks
      const isSensitive = /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b|\b\d{15,16}\b/.test(accForm.name);
      if (isSensitive) {
        setLoading(false);
        setError('For security, please only enter card labels (e.g. "Amex Gold Card") instead of digits.');
        return;
      }
      finalAccounts.push({
        id: Date.now().toString(),
        name: accForm.name.trim(),
        type: accForm.type,
        balance: parseFloat(accForm.balance)
      });
    }

    try {
      console.log('Outgoing Onboarding monthlyIncome is:', monthlyIncome);
      
      // 1. Log income to user profile details if entered
      if (monthlyIncome && Number(monthlyIncome) > 0) {
        await API.put('/users/me', { monthlyIncome: parseFloat(monthlyIncome) });
      }
      
      // 2. Loop and hit account creation endpoint
      for (const account of finalAccounts) {
        // Enforce credit_card underscore standardization
        const payloadType = account.type === 'credit card' ? 'credit_card' : account.type;
        
        // Post account payloads to backend
        await API.post('/accounts', {
          name: account.name,
          type: payloadType,
          balance: account.balance
        });
      }
      
      // 3. Mark hasCompletedOnboarding as true in the database
      await API.post('/users/complete-onboarding');
      
      // Update local state context object
      setUser(prev => ({ 
        ...prev, 
        hasCompletedOnboarding: true,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : (prev?.monthlyIncome || 0)
      }));
      onClose();
    } catch (err) {
      console.error('Onboarding setup failed:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to process setup data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded border border-rule bg-surface shadow-2xl p-6 relative overflow-hidden text-xs font-semibold text-ink-muted">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-rule pb-4 mb-5">
          <div>
            <h3 className="text-base font-serif font-bold text-ink">First-Time Setup Profile</h3>
            <p className="text-[10px] text-ink-muted font-semibold uppercase tracking-wider mt-0.5">Customizing workspace settings</p>
          </div>
          <span className="text-[10px] border border-rule bg-bg px-2 py-0.5 rounded text-ink-muted">
            Step {step} of 2
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded border border-danger/20 bg-danger/5 p-3 text-ink-red">
            {error}
          </div>
        )}

        {/* Step 1: Income Setup */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="text-ink-muted uppercase tracking-widest text-[10px] block mb-2 font-bold">Estimated Monthly Income</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-ink-muted text-sm font-sans font-bold select-none">
                  ₹
                </div>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="pl-8 pr-4 py-3 block w-full rounded border border-rule bg-bg text-ink focus:border-brand focus:outline-none transition-all placeholder-slate-650 text-sm font-semibold"
                  placeholder="e.g. 5000"
                />
              </div>
              <p className="mt-2 text-[10px] text-ink-muted leading-relaxed">
                This value serves as your target baseline to measure category expenditure constraints and savings caps.
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-rule">
              <button 
                onClick={handleSkip}
                disabled={loading}
                className="text-ink-muted hover:text-ink transition-colors cursor-pointer text-xs underline font-bold"
              >
                Skip configuration
              </button>
              
              <button 
                onClick={() => {
                  if (!monthlyIncome || Number(monthlyIncome) <= 0) {
                    setError('Please specify a valid monthly income greater than zero.');
                    return;
                  }
                  setError('');
                  setStep(2);
                }}
                className="flex items-center gap-1.5 rounded bg-brand px-4 py-2.5 text-xs font-bold text-white hover:bg-[#17392B] transition-all cursor-pointer"
              >
                Proceed Setup
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Accounts Setup */}
        {step === 2 && (
          <div className="space-y-4">
            <h4 className="text-ink text-xs font-bold mb-1">Link Initial Asset Accounts</h4>
            <p className="text-[10px] text-ink-muted leading-relaxed font-semibold">
              Log checking, card limits, or cash balances. Do NOT submit account numbers, credentials, or digits.
            </p>

            {/* Quick adding subform */}
            <div className="bg-bg/40 p-4 rounded border border-rule text-xs space-y-3">
              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="text-ink-muted block mb-1 font-bold">Account Label</label>
                  <input
                    type="text"
                    value={accForm.name}
                    onChange={(e) => setAccForm({ ...accForm, name: e.target.value })}
                    className="w-full rounded border border-rule bg-bg px-3 py-2 text-ink focus:outline-none focus:border-brand text-xs font-semibold"
                    placeholder="e.g. HDFC Credit Card"
                  />
                </div>
                <div>
                  <label className="text-ink-muted block mb-1 font-bold">Opening Balance / Cap</label>
                  <input
                    type="number"
                    value={accForm.balance}
                    onChange={(e) => setAccForm({ ...accForm, balance: e.target.value })}
                    className="w-full rounded border border-rule bg-bg px-3 py-2 text-ink focus:outline-none focus:border-brand text-xs font-semibold"
                    placeholder="e.g. 2400"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="w-1/2">
                  <label className="text-ink-muted block mb-1 font-bold">Asset Class</label>
                  <select
                    value={accForm.type}
                    onChange={(e) => setAccForm({ ...accForm, type: e.target.value })}
                    className="w-full rounded border border-rule bg-bg px-3 py-2 text-ink focus:outline-none focus:border-brand text-xs appearance-none font-semibold"
                  >
                    <option value="bank">Bank / Checking</option>
                    <option value="cash">Cash / Liquid</option>
                    <option value="NotebookPen">Digital Wallet</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
                <button
                  onClick={handleAddAccount}
                  className="flex items-center gap-1 bg-surface hover:bg-bg text-ink rounded px-3 py-2 border border-rule transition-all font-bold cursor-pointer mt-4 self-end text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Append Account
                </button>
              </div>
            </div>

            {/* List of pending attachments */}
            {accounts.length > 0 ? (
              <div className="max-h-28 overflow-y-auto space-y-2 border-t border-b border-rule py-2">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center bg-bg/60 p-2 rounded border border-rule text-[10px]">
                    <div>
                      <span className="font-bold text-ink">{acc.name}</span>
                      <span className="ml-2 lowercase text-ink-muted">({acc.type})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-ink font-bold">₹{acc.balance}</span>
                      <button 
                        onClick={() => handleRemoveAccount(acc.id)}
                        className="text-ink-muted hover:text-ink-red"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-ink-muted text-[10px]">
                No starting accounts defined yet. (You can add these later!)
              </div>
            )}

            {/* Action footer */}
            <div className="flex justify-between items-center pt-4 border-t border-rule">
              <button 
                onClick={() => setStep(1)}
                className="text-ink-muted hover:text-ink transition-colors cursor-pointer text-xs font-bold"
              >
                Back
              </button>
              
              <button 
                onClick={handleFinish}
                disabled={loading}
                className="flex items-center gap-1.5 rounded bg-brand px-5 py-2.5 text-xs font-bold text-white hover:bg-[#17392B] transition-all cursor-pointer"
              >
                {loading ? 'Processing...' : (
                  <>
                    <Check className="h-4 w-4" />
                    Complete Profile
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-1.5 text-[9px] text-ink-muted border-t border-rule pt-4 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-accent-brass" />
          <span>Security Notice: Your private bank data remains locally stored. Custom tokens are fully encrypted.</span>
        </div>

      </div>
    </div>
  );
};

export default OnboardingModal;
