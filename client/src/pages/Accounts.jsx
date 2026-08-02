import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, AlertTriangle, Check, X } from 'lucide-react';
import API from '../api';
import LedgerCard from '../components/LedgerCard';

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
      setError(err.response?.data?.message || 'Failed to retrieve asset accounts.');
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
        setSuccess(`Account "${addForm.name}" integrated successfully.`);
        setAddForm({ name: '', type: 'bank', balance: '', creditLimit: '' });
        setIsAddModalOpen(false);
        fetchAccounts();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create new account.');
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
      setError(err.response?.data?.message || 'Failed to modify account.');
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
      setError(err.response?.data?.message || 'Delete operation blocked by server/transactions database guidelines.');
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

  const formatINR = (balance) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(balance);
  };

  const getAccountInsight = (account) => {
    if (account.type === 'credit_card') {
      const limit = account.creditLimit || 0;
      const usage = limit > 0 ? ((Math.abs(account.balance) / limit) * 100).toFixed(1) : 0;
      return `Credit line usage: ${usage}%`;
    }
    return `Asset liquid classification`;
  };

  const netBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="space-y-6 text-xs text-ink font-semibold">
      
      {/* Alert feeds */}
      {success && (
        <div className="flex items-center gap-2 rounded border border-ink-green/20 bg-ink-green/5 p-4 text-ink-green">
          <Check className="h-4.5 w-4.5" />
          <span>{success}</span>
        </div>
      )}

      {error && !isAddModalOpen && !isEditModalOpen && !isDeleteModalOpen && (
        <div className="flex items-center gap-2 rounded border border-danger/25 bg-danger/5 p-4 text-ink-red">
          <AlertTriangle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Top liquidity stat */}
      <LedgerCard title="Double-Entry Asset Balance" subtitle="Liquidity Ledger Aggregation">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div>
            <span className="text-2xl font-bold font-mono text-ink tracking-tight tabular-nums">
              ₹{formatINR(netBalance)}
            </span>
          </div>
          <button
            onClick={() => { setError(''); setSuccess(''); setIsAddModalOpen(true); }}
            className="flex items-center gap-1.5 rounded bg-brand hover:bg-brand-hover text-white px-4 py-2.5 font-bold transition-all cursor-pointer outline-none"
          >
            <Plus className="h-4 w-4" />
            Integrate Asset Channel
          </button>
        </div>
      </LedgerCard>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-ink tracking-wide font-serif">Integrated Asset Channels</h3>
        
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : accounts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((acc) => (
              <LedgerCard 
                key={acc._id}
                title={acc.name} 
                subtitle={acc.type.replace('_',' ').toUpperCase()}
              >
                <div className="flex flex-col justify-between h-28 pt-2">
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-ink-muted block mt-0.5">Asset Net Value</span>
                    <span className={`text-xl font-bold font-mono tabular-nums block ${acc.balance >= 0 ? 'text-ink-green' : 'text-ink-red'}`}>
                      ₹{formatINR(acc.balance)}
                    </span>
                    {acc.type === 'credit_card' && (
                      <span className="block text-[9px] text-ink-muted font-mono mt-0.5">
                        Limit: ₹{formatINR(acc.creditLimit || 0)}
                      </span>
                    )}
                  </div>
                  
                  <div className="border-t border-rule pt-2 flex justify-between items-center text-[10px]">
                    <span className="text-ink-muted italic font-medium">{getAccountInsight(acc)}</span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(acc)}
                        className="p-1 hover:text-brand text-ink-muted rounded border border-transparent hover:border-rule bg-surface/50 cursor-pointer transition-all"
                        title="Edit Account"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(acc)}
                        className="p-1 hover:text-ink-red text-ink-muted rounded border border-transparent hover:border-danger/30 bg-surface/50 cursor-pointer transition-all"
                        title="Delete Account"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </LedgerCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded border border-dashed border-rule bg-surface/10">
            <p className="text-xs text-ink-muted font-medium">No active asset channels logged. Please add an account.</p>
          </div>
        )}
      </div>

      {/* ==================== ADD ACCOUNT MODAL ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md">
            <LedgerCard>
              <div className="flex justify-between items-center border-b border-rule pb-3.5 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-ink leading-tight">Integrate Asset Channel</h3>
                  <p className="text-[9px] text-ink-muted uppercase font-bold tracking-wider mt-0.5">Define double-entry book node</p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-ink-muted hover:text-ink outline-none cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded border border-danger/20 bg-danger/5 p-3 text-ink-red font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-4 font-semibold">
                <div>
                  <label className="text-ink-muted uppercase tracking-widest text-[9px] font-bold">Account Label Name</label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full mt-1 rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                    placeholder="e.g. ICICI Bank Savings"
                  />
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <label className="text-ink-muted uppercase tracking-widest text-[9px] font-bold">Asset Class Type</label>
                    <select
                      value={addForm.type}
                      onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                      className="w-full mt-1 rounded border border-rule bg-surface px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-brand"
                    >
                      <option value="bank">Bank / Savings</option>
                      <option value="cash">Cash / Liquid</option>
                      <option value="wallet">Digital Wallet</option>
                      <option value="credit_card">Credit Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-ink-muted uppercase tracking-widest text-[9px] font-bold">Opening Balance (₹)</label>
                    <input
                      type="number"
                      required
                      value={addForm.balance}
                      onChange={(e) => setAddForm({ ...addForm, balance: e.target.value })}
                      className="w-full mt-1 rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand font-mono font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {addForm.type === 'credit_card' && (
                  <div>
                    <label className="text-ink-muted uppercase tracking-widest text-[9px] font-bold">Credit Limit (₹)</label>
                    <input
                      type="number"
                      required
                      value={addForm.creditLimit}
                      onChange={(e) => setAddForm({ ...addForm, creditLimit: e.target.value })}
                      className="w-full mt-1 rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand font-mono font-semibold"
                      placeholder="e.g. 100000"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded bg-brand py-3 text-xs font-bold text-white hover:bg-brand-hover cursor-pointer"
                >
                  Integrate Account
                </button>
              </form>
            </LedgerCard>
          </div>
        </div>
      )}

      {/* ==================== EDIT ACCOUNT MODAL ==================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md">
            <LedgerCard>
              <div className="flex justify-between items-center border-b border-rule pb-3.5 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-ink leading-tight">Modify Account Settings</h3>
                  <p className="text-[9px] text-ink-muted uppercase font-bold tracking-wider mt-0.5">Modify properties</p>
                </div>
                <button
                  onClick={() => { setIsEditModalOpen(false); setActiveAccount(null); }}
                  className="text-ink-muted hover:text-ink outline-none cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded border border-danger/20 bg-danger/5 p-3 text-ink-red font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4 font-semibold">
                <div>
                  <label className="text-ink-muted uppercase tracking-widest text-[9px] font-bold">Account Label Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full mt-1 rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-ink-muted uppercase tracking-widest text-[9px] font-bold">Asset Class Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="w-full mt-1 rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none"
                  >
                    <option value="bank">Bank / Savings</option>
                    <option value="cash">Cash / Liquid</option>
                    <option value="wallet">Digital Wallet</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>

                {editForm.type === 'credit_card' && (
                  <div>
                    <label className="text-ink-muted uppercase tracking-widest text-[9px] font-bold">Credit Limit (₹)</label>
                    <input
                      type="number"
                      required
                      value={editForm.creditLimit}
                      onChange={(e) => setEditForm({ ...editForm, creditLimit: e.target.value })}
                      className="w-full mt-1 rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none font-mono font-semibold"
                    />
                  </div>
                )}

                <div className="rounded border border-warning/20 bg-warning/5 p-3 text-[10px] text-warning leading-relaxed font-semibold">
                  Note: Account balance sheets must be adjusted through corresponding Ledger debit/credit postings. Direct updates are restricted.
                </div>

                <button
                  type="submit"
                  className="w-full rounded bg-brand py-3 text-xs font-bold text-white hover:bg-brand-hover cursor-pointer"
                >
                  Save Settings
                </button>
              </form>
            </LedgerCard>
          </div>
        </div>
      )}

      {/* ==================== DELETE ACCOUNT CONFIRMATION MODAL ==================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm">
            <LedgerCard>
              <div className="text-center">
                <AlertTriangle className="h-9 w-9 text-danger mx-auto mb-3" />
                <h3 className="text-sm font-bold text-ink mb-1.5">Confirm Delete Action</h3>
                <p className="text-[10px] text-ink-muted mb-5 leading-relaxed font-semibold text-center">
                  Are you sure you want to delete account "{activeAccount?.name}"?<br />
                  This operation is permanent.
                </p>

                {error && (
                  <div className="mb-4 rounded border border-danger/25 bg-danger/5 p-3 text-ink-red text-left font-semibold">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setIsDeleteModalOpen(false); setActiveAccount(null); }}
                    className="rounded border border-rule bg-surface hover:bg-bg px-4 py-2 text-xs text-ink font-bold transition-all cursor-pointer outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="rounded bg-danger hover:bg-[#8C2F22] px-4 py-2 text-xs text-white font-bold transition-all cursor-pointer outline-none"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </LedgerCard>
          </div>
        </div>
      )}

    </div>
  );
};

export default Accounts;
