import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, Filter, Calendar, ChevronLeft, ChevronRight, Check, X, AlertTriangle } from 'lucide-react';
import API from '../api';
import LedgerCard from '../components/LedgerCard';
import LedgerRow from '../components/LedgerRow';

const Income = () => {
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals Visibility
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active records
  const [activeIncome, setActiveIncome] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    categoryId: ''
  });

  // Sort State
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    limit: 10,
    total: 0
  });

  // Form states
  const [addForm, setAddForm] = useState({
    accountId: '',
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [editForm, setEditForm] = useState({
    accountId: '',
    categoryId: '',
    amount: '',
    date: '',
    description: ''
  });

  // Inline Category states
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatError, setNewCatError] = useState('');
  const [newCatLoading, setNewCatLoading] = useState(false);

  const fetchBaselines = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        API.get('/accounts'),
        API.get('/categories?type=income')
      ]);

      if (accRes.data?.success) setAccounts(accRes.data.data);
      if (catRes.data?.success) setCategories(catRes.data.data);
    } catch (err) {
      console.error('Failed to load baseline elements:', err);
    }
  };

  const fetchIncomes = async () => {
    setLoading(true);
    setError('');
    try {
      const { from, to, categoryId } = filters;
      let queryParams = `?page=${pagination.page}&limit=${pagination.limit}`;

      if (from) queryParams += `&from=${from}`;
      if (to) queryParams += `&to=${to}`;
      if (categoryId) queryParams += `&categoryId=${categoryId}`;

      const res = await API.get(`/income${queryParams}`);
      if (res.data?.success) {
        setIncomes(res.data.data);
        if (res.data.pagination) {
          setPagination(prev => ({
            ...prev,
            pages: res.data.pagination.pages,
            total: res.data.pagination.total
          }));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve income transaction logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaselines();
  }, []);

  useEffect(() => {
    fetchIncomes();
  }, [filters, pagination.page]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setNewCatError('');
    if (!newCatName.trim()) {
      setNewCatError('Please provide a category name.');
      return;
    }

    setNewCatLoading(true);
    try {
      const res = await API.post('/categories', {
        name: newCatName.trim(),
        type: 'income'
      });
      if (res.data?.success) {
        const createdCat = res.data.data;
        setCategories(prev => [...prev, createdCat].sort((a, b) => a.name.localeCompare(b.name)));

        if (isAddModalOpen) {
          setAddForm(prev => ({ ...prev, categoryId: createdCat._id }));
        } else if (isEditModalOpen) {
          setEditForm(prev => ({ ...prev, categoryId: createdCat._id }));
        }

        setNewCatName('');
        setShowNewCatInput(false);
      }
    } catch (err) {
      setNewCatError(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setNewCatLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { accountId, categoryId, amount, date, description } = addForm;
    if (!accountId || !categoryId || !amount) {
      setError('Please fill in Account, Category, and Amount.');
      return;
    }

    try {
      const res = await API.post('/income', {
        accountId,
        categoryId,
        amount: parseFloat(amount),
        date,
        description
      });

      if (res.data?.success) {
        setSuccess('Income logged successfully! Linked account updated.');
        setAddForm({
          accountId: accounts[0]?._id || '',
          categoryId: categories[0]?._id || '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          description: ''
        });
        setIsAddModalOpen(false);
        fetchIncomes();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record income entry.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { accountId, categoryId, amount, date, description } = editForm;
    if (!accountId || !categoryId || !amount) {
      setError('Please fill in Account, Category, and Amount.');
      return;
    }

    try {
      const res = await API.put(`/income/${activeIncome._id}`, {
        accountId,
        categoryId,
        amount: parseFloat(amount),
        date,
        description
      });

      if (res.data?.success) {
        setSuccess('Income transaction modified. Re-balanced target account assets.');
        setIsEditModalOpen(false);
        setActiveIncome(null);
        fetchIncomes();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update income log.');
    }
  };

  const handleDeleteConfirm = async () => {
    setError('');
    try {
      const res = await API.delete(`/income/${activeIncome._id}`);
      if (res.data?.success) {
        setSuccess('Income log deleted. Linked account balance reversed.');
        setIsDeleteModalOpen(false);
        setActiveIncome(null);
        fetchIncomes();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete income record.');
    }
  };

  const openAddModal = () => {
    setError('');
    setSuccess('');
    setShowNewCatInput(false);
    setAddForm({
      accountId: accounts[0]?._id || '',
      categoryId: categories[0]?._id || '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (inc) => {
    setError('');
    setSuccess('');
    setShowNewCatInput(false);
    setActiveIncome(inc);

    setEditForm({
      accountId: inc.accountId?._id || inc.accountId || '',
      categoryId: inc.categoryId?._id || inc.categoryId || '',
      amount: inc.amount,
      date: new Date(inc.date).toISOString().split('T')[0],
      description: inc.description || ''
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (inc) => {
    setError('');
    setActiveIncome(inc);
    setIsDeleteModalOpen(true);
  };

  const totalINR = incomes.reduce((sum, item) => sum + item.amount, 0);

  const handleSortToggle = () => {
    const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(nextOrder);
    setIncomes(prev => [...prev].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return nextOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }));
  };

  return (
    <div className="space-y-6 text-xs text-ink font-semibold">

      {/* Notifications */}
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

      {/* Top dashboard status cards */}
      <div className="grid gap-6 sm:grid-cols-3 items-stretch">
        {/* Dynamic accumulated totals */}
        <LedgerCard className="h-full flex flex-col justify-between">
          <div className="min-h-[32px] flex flex-col justify-start">
            <h3 className="font-serif font-display text-base font-bold text-ink leading-tight">Visible Inflow Credit</h3>
            <p className="text-ink-muted text-[10px] uppercase font-bold tracking-wider mt-1">Accumulated Income Streams</p>
          </div>
          <div className="flex-1 flex flex-col justify-end mt-2 border-t border-rule pt-3 text-right">
            <span className="text-2xl font-bold font-mono text-ink-green w-full tabular-nums block">
              +₹{totalINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </LedgerCard>

        {/* Date search filter card */}
        <div className="sm:col-span-2">
          <LedgerCard className="h-full flex flex-col justify-between">
            <div className="min-h-[32px] flex flex-col justify-start">
              <h3 className="font-serif font-display text-base font-bold text-ink leading-tight">Audit Search Filter</h3>
              <p className="text-ink-muted text-[10px] uppercase font-bold tracking-wider mt-1">Constraint Inputs</p>
            </div>
            <div className="flex-1 flex flex-col justify-end mt-2 border-t border-rule pt-3">
              <div className="grid gap-4 sm:grid-cols-4 items-end">
                <div>
                  <label className="text-[9px] uppercase text-ink-muted block mb-1.5 font-bold">From Date</label>
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full h-9 rounded border border-rule bg-surface px-3 text-xs text-ink focus:outline-none focus:border-brand font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase text-ink-muted block mb-1.5 font-bold">To Date</label>
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full h-9 rounded border border-rule bg-surface px-3 text-xs text-ink focus:outline-none focus:border-brand font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase text-ink-muted block mb-1.5 font-bold">Classification</label>
                  <select
                    value={filters.categoryId}
                    onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full h-9 rounded border border-rule bg-surface px-3 text-xs text-ink focus:outline-none focus:border-brand font-semibold cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex sm:justify-end">
                  <button
                    onClick={() => setFilters({ from: '', to: '', categoryId: '' })}
                    className="h-9 text-[9px] text-accent-brass hover:underline uppercase font-bold tracking-wider cursor-pointer font-sans"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </LedgerCard>
        </div>
      </div>

      {/* Main ledger list container */}
      <LedgerCard title="Earnings Credit Book" subtitle={`${pagination.total} records total`}>
        <div className="flex justify-between items-center mb-4 pt-2">
          <button
            onClick={handleSortToggle}
            className="rounded border border-rule bg-surface px-4 py-2 text-xs font-bold text-ink hover:bg-bg transition-all cursor-pointer outline-none"
          >
            Sort Date {sortOrder === 'asc' ? '▲' : '▼'}
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded bg-brand hover:bg-brand-hover text-white px-4 py-2 text-xs font-bold transition-all cursor-pointer outline-none"
          >
            <Plus className="h-4 w-4" />
            Record Credit entry
          </button>
        </div>

        {/* Ledger Rows */}
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : incomes.length > 0 ? (
          <div className="border border-rule rounded divide-y divide-rule overflow-hidden">
            {incomes.map((inc) => (
              <div key={inc._id} className="group relative">
                <LedgerRow
                  label={inc.description || 'Earnings Inflow'}
                  categoryName={`${inc.categoryId?.name || 'Inflow'} | ${inc.accountId?.name || 'Asset'}`}
                  amount={inc.amount}
                  isExpense={false}
                  date={new Date(inc.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                  rightElement={
                    <div className="flex items-center gap-2 mr-2">
                      <button
                        onClick={() => openEditModal(inc)}
                        className="p-1 hover:text-brand text-ink-muted rounded border border-transparent hover:border-rule bg-surface/50 cursor-pointer transition-all"
                        title="Edit Entry"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(inc)}
                        className="p-1 hover:text-ink-red text-ink-muted rounded border border-transparent hover:border-danger/30 bg-surface/50 cursor-pointer transition-all"
                        title="Delete Entry"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded border border-dashed border-rule bg-surface/10">
            <Calendar className="h-8 w-8 text-ink-muted mx-auto mb-2" />
            <p className="text-xs text-ink-muted font-medium">No recorded earnings flow records matched filter options.</p>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-rule pt-4 mt-4">
            <span className="text-[10px] text-ink-muted font-bold">
              Page {pagination.page} of {pagination.pages}
            </span>

            <div className="flex gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="p-2 border border-rule bg-surface rounded text-ink disabled:opacity-40 hover:bg-bg cursor-pointer transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="p-2 border border-rule bg-surface rounded text-ink disabled:opacity-40 hover:bg-bg cursor-pointer transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </LedgerCard>

      {/* ==================== ADD INCOME MODAL ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md">
            <LedgerCard>
              <div className="flex justify-between items-center border-b border-rule pb-3.5 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-ink leading-tight">Log Credit Entry</h3>
                  <p className="text-[9px] text-ink-muted uppercase font-bold tracking-wider mt-0.5">Record Asset Destination Inflow</p>
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

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="text-ink-muted uppercase tracking-widest text-[9px] block mb-1 font-bold">Asset Target Account</label>
                  <select
                    required
                    value={addForm.accountId}
                    onChange={(e) => setAddForm(prev => ({ ...prev, accountId: e.target.value }))}
                    className="w-full rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                  >
                    <option value="" disabled>Select Asset Account</option>
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>{acc.name} (₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-ink-muted uppercase tracking-widest text-[9px] font-bold">Inflow Classification Code</label>
                    <button
                      type="button"
                      onClick={() => setShowNewCatInput(!showNewCatInput)}
                      className="text-[9px] text-accent-brass font-bold hover:underline"
                    >
                      {showNewCatInput ? 'Cancel' : '+ Add Code Category'}
                    </button>
                  </div>

                  {!showNewCatInput ? (
                    <select
                      required
                      value={addForm.categoryId}
                      onChange={(e) => setAddForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full rounded border border-rule bg-surface px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-brand"
                    >
                      <option value="" disabled>Select Category Type</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex gap-2 bg-bg p-2 rounded border border-rule">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="Category name"
                          className="w-full rounded border border-rule bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                        />
                        {newCatError && <span className="text-[9px] text-ink-red block mt-1">{newCatError}</span>}
                      </div>
                      <button
                        type="button"
                        disabled={newCatLoading}
                        onClick={handleCreateCategory}
                        className="rounded bg-brand px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-brand-hover cursor-pointer"
                      >
                        Create
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <label className="text-ink-muted uppercase tracking-widest text-[9px] block mb-1 font-bold">Amount Volume (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={addForm.amount}
                      onChange={(e) => setAddForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand font-mono font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-ink-muted uppercase tracking-widest text-[9px] block mb-1 font-bold">Log Date</label>
                    <input
                      type="date"
                      required
                      value={addForm.date}
                      onChange={(e) => setAddForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-ink-muted uppercase tracking-widest text-[9px] block mb-1 font-bold">Description details</label>
                  <input
                    type="text"
                    value={addForm.description}
                    onChange={(e) => setAddForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                    placeholder="e.g. Dividend transfer Q2"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded bg-brand hover:bg-brand-hover py-3 text-xs font-bold text-white transition-all cursor-pointer outline-none"
                  >
                    Log Inflow (Credit)
                  </button>
                </div>
              </form>
            </LedgerCard>
          </div>
        </div>
      )}

      {/* ==================== EDIT INCOME MODAL ==================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md">
            <LedgerCard>
              <div className="flex justify-between items-center border-b border-rule pb-3.5 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-ink leading-tight">Edit entry</h3>
                  <p className="text-[9px] text-ink-muted uppercase font-bold tracking-wider mt-0.5">Modify logged transaction</p>
                </div>
                <button
                  onClick={() => { setIsEditModalOpen(false); setActiveIncome(null); }}
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

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="text-ink-muted uppercase tracking-widest text-[9px] block mb-1 font-bold">Asset Target Account</label>
                  <select
                    required
                    value={editForm.accountId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, accountId: e.target.value }))}
                    className="w-full rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                  >
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>{acc.name} (₹{acc.balance.toLocaleString('en-IN')})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-ink-muted uppercase tracking-widest text-[9px] font-bold">Inflow Classification Code</label>
                    <button
                      type="button"
                      onClick={() => setShowNewCatInput(!showNewCatInput)}
                      className="text-[9px] text-accent-brass font-bold hover:underline"
                    >
                      {showNewCatInput ? 'Cancel' : '+ Add Code Category'}
                    </button>
                  </div>

                  {!showNewCatInput ? (
                    <select
                      required
                      value={editForm.categoryId}
                      onChange={(e) => setEditForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full rounded border border-rule bg-surface px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-brand"
                    >
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex gap-2 bg-bg p-2 rounded border border-rule">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="Category name"
                          className="w-full rounded border border-rule bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                        />
                        {newCatError && <span className="text-[9px] text-ink-red block mt-1">{newCatError}</span>}
                      </div>
                      <button
                        type="button"
                        disabled={newCatLoading}
                        onClick={handleCreateCategory}
                        className="rounded bg-brand px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-brand-hover cursor-pointer"
                      >
                        Create
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <label className="text-ink-muted uppercase tracking-widest text-[9px] block mb-1 font-bold">Amount Volume (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={editForm.amount}
                      onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-ink-muted uppercase tracking-widest text-[9px] block mb-1 font-bold">Log Date</label>
                    <input
                      type="date"
                      required
                      value={editForm.date}
                      onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-ink-muted uppercase tracking-widest text-[9px] block mb-1 font-bold">Description details</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded bg-brand hover:bg-brand-hover py-3 text-xs font-bold text-white transition-all cursor-pointer outline-none"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </LedgerCard>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm">
            <LedgerCard>
              <div className="text-center">
                <AlertTriangle className="h-9 w-9 text-danger mx-auto mb-3" />
                <h3 className="text-sm font-bold text-ink mb-1.5">Delete Inflow Entry?</h3>
                <p className="text-[10px] text-ink-muted mb-5 leading-normal">
                  Deletions will permanently reverse the inflow balance of <span className="font-bold text-ink">₹{activeIncome?.amount?.toLocaleString('en-IN')}</span> from account <span className="font-bold text-ink">"{activeIncome?.accountId?.name}"</span>.
                </p>

                {error && (
                  <div className="mb-4 rounded border border-danger/25 bg-danger/5 p-3 text-ink-red text-left font-semibold">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setIsDeleteModalOpen(false); setActiveIncome(null); }}
                    className="rounded border border-rule bg-surface hover:bg-bg px-4 py-2 text-xs text-ink font-bold transition-all cursor-pointer outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="rounded bg-danger hover:bg-[#8C2F22] px-4 py-2 text-xs text-white font-bold transition-all cursor-pointer outline-none"
                  >
                    Confirm Deletion
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

export default Income;
