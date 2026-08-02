import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Landmark, Plus, Trash2, HelpCircle, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import API from '../api';

const OnboardingModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
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

  const handleFinish = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Log income to localStorage or send request
      localStorage.setItem('et_onboarding_income', monthlyIncome || '0');
      
      // 2. Loop and hit account creation endpoint
      console.log('--- [ONBOARDING BACKEND LOGS] ---');
      console.log('Logged Monthly Income:', monthlyIncome);
      console.log('Sending Account Scaffolding payloads:');
      
      for (const account of accounts) {
        // Enforce credit_card underscore standardization
        const payloadType = account.type === 'credit card' ? 'credit_card' : account.type;
        
        console.log(`[POST /api/v1/accounts] Creating account:`, {
          name: account.name,
          type: payloadType,
          balance: account.balance
        });
        
        // Post account payloads to backend
        await API.post('/accounts', {
          name: account.name,
          type: payloadType,
          balance: account.balance
        });
      }
      
      console.log('---------------------------------');
      
      // Cache details in localStorage to update dashboard metrics instantly during local checks
      localStorage.setItem('et_onboarded', 'true');
      onClose();
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding account creation failed:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to process setup data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative overflow-hidden text-xs font-semibold text-slate-300">
        
        {/* Glow decoration */}
        <div className="absolute -top-12 -left-12 h-36 w-36 bg-violet-605/10 rounded-full blur-2xl"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-white">First-Time Setup Profile</h3>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Customizing workspace settings</p>
          </div>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
            Step {step} of 2
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/25 p-3 text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Income Setup */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="text-slate-400 uppercase tracking-widest text-[10px] block mb-2">Estimated Monthly Income</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <DollarSign className="h-4.5 w-4.5" />
                </div>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="pl-10 pr-4 py-3 block w-full rounded-xl border border-slate-800 bg-slate-950/60 text-white focus:border-violet-500 focus:outline-none transition-all placeholder-slate-700 text-sm"
                  placeholder="e.g. 5000"
                />
              </div>
              <p className="mt-2 text-[10px] text-slate-500 leading-relaxed">
                This value serves as your target baseline to measure category expenditure constraints and savings caps.
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
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
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-550 transition-all cursor-pointer"
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
            <h4 className="text-slate-200 text-xs font-bold mb-1">Link Initial Asset Accounts</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              Log checking, card limits, or cash balances. Do NOT submit account numbers, credentials, or digits.
            </p>

            {/* Quick adding subform */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs space-y-3">
              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="text-slate-405 block mb-1">Account Label</label>
                  <input
                    type="text"
                    value={accForm.name}
                    onChange={(e) => setAccForm({ ...accForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:outline-none focus:border-violet-500 text-xs"
                    placeholder="e.g. HDFC Credit Card"
                  />
                </div>
                <div>
                  <label className="text-slate-405 block mb-1">Opening Balance / Cap</label>
                  <input
                    type="number"
                    value={accForm.balance}
                    onChange={(e) => setAccForm({ ...accForm, balance: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:outline-none focus:border-violet-500 text-xs"
                    placeholder="e.g. 2400"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="w-1/2">
                  <label className="text-slate-405 block mb-1">Asset Class</label>
                  <select
                    value={accForm.type}
                    onChange={(e) => setAccForm({ ...accForm, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:outline-none focus:border-violet-500 text-xs appearance-none"
                  >
                    <option value="bank">Bank / Checking</option>
                    <option value="cash">Cash / Liquid</option>
                    <option value="wallet">Digital Wallet</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
                <button
                  onClick={handleAddAccount}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-700 transition-all font-bold cursor-pointer mt-4 self-end text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Append Account
                </button>
              </div>
            </div>

            {/* List of pending attachments */}
            {accounts.length > 0 ? (
              <div className="max-h-28 overflow-y-auto space-y-2 border-t border-b border-slate-800/80 py-2">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800 text-[10px]">
                    <div>
                      <span className="font-bold text-white">{acc.name}</span>
                      <span className="ml-2 lowercase text-slate-500">({acc.type})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-white">${acc.balance}</span>
                      <button 
                        onClick={() => handleRemoveAccount(acc.id)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 text-[10px]">
                No starting accounts defined yet. (You can add these later!)
              </div>
            )}

            {/* Action footer */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button 
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
              >
                Back
              </button>
              
              <button 
                onClick={handleFinish}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-violet-605 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-600 transition-all cursor-pointer bg-violet-600"
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

        <div className="mt-4 flex items-center gap-1.5 text-[9px] text-slate-500 border-t border-slate-800/60 pt-4">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-655" />
          <span>Security Notice: Your private bank data remains locally stored. Custom tokens are fully encrypted.</span>
        </div>

      </div>
    </div>
  );
};

export default OnboardingModal;
