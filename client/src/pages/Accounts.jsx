import React, { useEffect, useState } from 'react';
import { CreditCard, Wallet, Plus, Trash2, Edit3, Landmark, Banknote, HelpCircle, Check, X, AlertTriangle } from 'lucide-react';
import API from '../api';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals visibility states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active target for edit/delete actions
  const [activeAccount, setActiveAccount] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({ name: '', type: 'bank', balance: '', creditLimit: '' });
  const [editForm, setEditForm] = useState({ name: '', type: 'bank', creditLimit: '' });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await API.get('/accounts');
      if (res.data?.success && res.data.data) {
        setAccounts(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve asset account credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!addForm.name || addForm.balance === '') {
      setError('Please provide a name and opening balance.');
      return;
    }

    try {
      const payload = {
        name: addForm.name,
        type: addForm.type,
        balance: parseFloat(addForm.balance),
      };

      if (addForm.type === 'credit_card') {
        payload.creditLimit = parseFloat(addForm.creditLimit || '0');
      }

      const res = await API.post('/accounts', payload);
      if (res.data?.success) {
        setSuccess(`Account "${addForm.name}" created successfully!`);
        setAddForm({ name: '', type: 'bank', balance: '', creditLimit: '' });
        setIsAddModalOpen(false);
        fetchAccounts();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create new account resource.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!editForm.name) {
      setError('Please provide an account name.');
      return;
    }

    try {
      const payload = {
        name: editForm.name,
        type: editForm.type,
      };

      if (editForm.type === 'credit_card') {
        payload.creditLimit = parseFloat(editForm.creditLimit || '0');
      }

      const res = await API.put(`/accounts/${activeAccount._id}`, payload);
      if (res.data?.success) {
        setSuccess(`Account "${editForm.name}" updated successfully.`);
        setIsEditModalOpen(false);
        setActiveAccount(null);
        fetchAccounts();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to modify account resources.');
    }
  };

  const handleDeleteConfirm = async () => {
    setError('');
    try {
      const res = await API.delete(`/accounts/${activeAccount._id}`);
      if (res.data?.success) {
        setSuccess('Account channel cleanly deleted.');
        setIsDeleteModalOpen(false);
        setActiveAccount(null);
        fetchAccounts();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Delete operation blocked by server guidelines.');
    }
  };

  const openEditModal = (account) => {
    setActiveAccount(account);
    setEditForm({
      name: account.name,
      type: account.type,
      creditLimit: account.creditLimit || '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (account) => {
    setActiveAccount(account);
    setIsDeleteModalOpen(true);
  };

  // Helper type icons
  const getAccountIcon = (type) => {
    switch (type) {
      case 'bank':
        return <Landmark className="h-5 w-5" />;
      case 'cash':
        return <Banknote className="h-5 w-5" />;
      case 'wallet':
        return <Wallet className="h-5 w-5" />;
      case 'credit_card':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Banknote className="h-5 w-5" />;
    }
  };

  // Helper card style gradients
  const getAccountGradient = (type) => {
    switch (type) {
      case 'bank':
        return 'from-slate-900 to-indigo-950 border-indigo-900/40 text-indigo-400';
      case 'cash':
        return 'from-slate-900 to-emerald-950 border-emerald-900/40 text-emerald-400';
      case 'wallet':
        return 'from-slate-900 to-purple-950 border-purple-900/40 text-purple-400';
      case 'credit_card':
        return 'from-slate-900 to-amber-950 border-amber-900/40 text-amber-400';
      default:
        return 'from-slate-900 to-slate-950 border-slate-800 text-slate-400';
    }
  };

  // Format currency wrapper to ₹ (Indian Rupee)
  const formatINR = (balance) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(balance);
  };

  // Simple insight placeholder rule-based line
  // TODO: Once the transactions module is built, compute monthly change.
  const getAccountInsight = (account) => {
    if (account.type === 'credit_card') {
      const limit = account.creditLimit || 0;
      const usage = limit > 0 ? ((Math.abs(account.balance) / limit) * 100).toFixed(1) : 0;
      return `Credit line usage estimated at ${usage}% (TODO: link transactions)`;
    }
    return `Balance changed by ₹0.00 this month (TODO: link transactions)`;
  };

  const netBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="space-y-6 animate-fade-in text-xs font-semibold text-slate-350">
      
      {/* Alert feeds */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
          <Check className="h-4.5 w-4.5" />
          <span>{success}</span>
        </div>
      )}

      {error && !isAddModalOpen && !isEditModalOpen && !isDeleteModalOpen && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-red-400">
          <AlertTriangle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Top liquidity stat */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-slate-550 block font-bold text-slate-500">Total Net Balances (₹)</h2>
          <span className="text-3xl font-black text-white mt-1 block tracking-tight">
            {formatINR(netBalance)}
          </span>
        </div>
        <button
          onClick={() => { setError(''); setSuccess(''); setIsAddModalOpen(true); }}
          className="flex items-center gap-1.5 rounded-xl bg-violet-650 hover:bg-violet-600 active:bg-violet-700 text-white px-4.5 py-3 font-bold transition-all cursor-pointer bg-violet-600 shadow-lg shadow-violet-900/10"
        >
          <Plus className="h-4 w-4" />
          Add Asset Account
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wide">Integrated Portfolios Overview</h3>
        
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
          </div>
        ) : accounts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((acc) => (
              <div
                key={acc._id}
                className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${getAccountGradient(
                  acc.type
                )} p-5 shadow-2xl flex flex-col justify-between h-48`}
              >
                {/* Brand info */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-white/80 border border-white/5">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{acc.name}</h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mt-0.5">{acc.type.replace('_',' ')}</span>
                    </div>
                  </div>
                  
                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg border border-white/5">
                    <button
                      onClick={() => openEditModal(acc)}
                      className="p-1.5 hover:text-white text-slate-450 hover:bg-white/10 rounded-md transition-all"
                      title="Edit Account"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(acc)}
                      className="p-1.5 hover:text-red-400 text-slate-450 hover:bg-red-500/10 rounded-md transition-all"
                      title="Delete Account"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Balance display */}
                <div className="my-2">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 text-white/40 block">Available Balance</span>
                  <span className="text-xl font-black text-white hover:scale-102 transition-transform duration-200 inline-block mt-0.5">
                    {formatINR(acc.balance)}
                  </span>
                  
                  {acc.type === 'credit_card' && (
                    <span className="block text-[9px] text-slate-400 mt-0.5 text-white/30 truncate">
                      Limit: {formatINR(acc.creditLimit || 0)}
                    </span>
                  )}
                </div>

                {/* Insight line */}
                <div className="border-t border-white/5 pt-2.5 text-[9px] tracking-wide text-slate-400 text-white/45 truncate">
                  {getAccountInsight(acc)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/10">
            <Landmark className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">No starting asset accounts configured. Integrate a channel to begin.</p>
          </div>
        )}
      </div>

      {/* ==================== ADD ACCOUNT MODAL ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-sm font-bold text-white mb-2">Integrate Financial Channel</h3>
            <p className="text-[10px] text-slate-500 mb-4 font-semibold uppercase tracking-wider">Create a new checking, cash, or credit asset</p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/25 p-3 text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 font-semibold">
              <div>
                <label className="text-slate-400 uppercase tracking-widest text-[9px]">Account Label Name</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white focus:border-violet-505 focus:outline-none"
                  placeholder="e.g. ICICI Bank Savings"
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="text-slate-400 uppercase tracking-widest text-[9px]">Asset Class Type</label>
                  <select
                    value={addForm.type}
                    onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-xs text-white focus:outline-none bg-slate-900"
                  >
                    <option value="bank">Bank / Savings</option>
                    <option value="cash">Cash / Liquid</option>
                    <option value="wallet">Digital Wallet</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 uppercase tracking-widest text-[9px]">Opening Balance (₹)</label>
                  <input
                    type="number"
                    required
                    value={addForm.balance}
                    onChange={(e) => setAddForm({ ...addForm, balance: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white focus:border-violet-505 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {addForm.type === 'credit_card' && (
                <div>
                  <label className="text-slate-400 uppercase tracking-widest text-[9px]">Credit Limit (₹)</label>
                  <input
                    type="number"
                    required
                    value={addForm.creditLimit}
                    onChange={(e) => setAddForm({ ...addForm, creditLimit: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white focus:border-violet-505 focus:outline-none"
                    placeholder="e.g. 100000"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-violet-650 py-3 text-xs font-bold text-white hover:bg-violet-605 cursor-pointer bg-violet-600"
              >
                Integrate Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT ACCOUNT MODAL ==================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative">
            <button
              onClick={() => { setIsEditModalOpen(false); setActiveAccount(null); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-sm font-bold text-white mb-2">Modify Account Settings</h3>
            <p className="text-[10px] text-slate-500 mb-4 font-semibold uppercase tracking-wider">Update name label and credit lines</p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/25 p-3 text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 font-semibold">
              <div>
                <label className="text-slate-400 uppercase tracking-widest text-[9px]">Account Label Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white focus:border-violet-505 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase tracking-widest text-[9px]">Asset Class Type</label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-xs text-white focus:outline-none bg-slate-900"
                >
                  <option value="bank">Bank / Savings</option>
                  <option value="cash">Cash / Liquid</option>
                  <option value="wallet">Digital Wallet</option>
                  <option value="credit_card">Credit Card</option>
                </select>
              </div>

              {editForm.type === 'credit_card' && (
                <div>
                  <label className="text-slate-400 uppercase tracking-widest text-[9px]">Credit Limit (₹)</label>
                  <input
                    type="number"
                    required
                    value={editForm.creditLimit}
                    onChange={(e) => setEditForm({ ...editForm, creditLimit: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white focus:border-violet-505 focus:outline-none"
                  />
                </div>
              )}

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] text-amber-550 leading-relaxed text-amber-500 font-semibold">
                Note: Balance amounts can only be adjusted via corresponding transactions logs. Direct adjustments are barred.
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-violet-650 py-3 text-xs font-bold text-white hover:bg-violet-605 cursor-pointer bg-violet-600"
              >
                Save Settings
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE ACCOUNT CONFIRMATION MODAL ==================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative">
            <div className="text-center">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white mb-2">Confirm Delete Action</h3>
              <p className="text-[10px] text-slate-400 mb-5 leading-relaxed font-semibold">
                Are you sure you want to delete account <span className="text-white font-bold">"{activeAccount?.name}"</span>?<br />
                This action is non-reversible.
              </p>

              {error && (
                <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/25 p-3 text-red-400 text-left">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setIsDeleteModalOpen(false); setActiveAccount(null); }}
                  className="rounded-xl border border-slate-800 hover:bg-slate-800 px-4 py-2.5 text-xs text-slate-300 font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="rounded-xl bg-red-600 hover:bg-red-505 px-4 py-2.5 text-xs text-white font-bold transition-all cursor-pointer"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Accounts;
