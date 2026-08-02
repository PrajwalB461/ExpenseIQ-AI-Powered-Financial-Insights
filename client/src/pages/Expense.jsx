import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, Calendar, ChevronLeft, ChevronRight, Check, X, AlertTriangle } from 'lucide-react';
import API from '../api';
import { useNotification } from '../context/NotificationContext';
import LedgerCard from '../components/LedgerCard';
import LedgerRow from '../components/LedgerRow';
import DateInput from '../components/DateInput';

const Expense = () => {
  const { showNotification } = useNotification();
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Summary Metrics State
  const [summary, setSummary] = useState({
    totalSpend: 0,
    essentialSplit: { essential: 0, discretionary: 0 }
  });

  // Modals Visibility
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active records
  const [activeExpense, setActiveExpense] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    categoryId: '',
    essentialType: 'all'
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
  const [newCatEssential, setNewCatEssential] = useState(false);
  const [newCatError, setNewCatError] = useState('');
  const [newCatLoading, setNewCatLoading] = useState(false);

  const fetchBaselines = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        API.get('/accounts'),
        API.get('/categories?type=expense')
      ]);

      if (accRes.data?.success) setAccounts(accRes.data.data);
      if (catRes.data?.success) setCategories(catRes.data.data);
    } catch (err) {
      console.error('Failed to load baseline elements:', err);
    }
  };

  const fetchSummary = async () => {
    try {
      const { from, to } = filters;
      let queryParams = '';
      if (from || to) {
        queryParams = `?${from ? `from=${from}` : ''}${from && to ? '&' : ''}${to ? `to=${to}` : ''}`;
      }
      const res = await API.get(`/expense/summary${queryParams}`);
      if (res.data?.success && res.data.data) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Failed to retrieve summary metrics:', err);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    setError('');
    try {
      const { from, to, categoryId } = filters;
      let queryParams = `?page=${pagination.page}&limit=${pagination.limit}`;

      if (from) queryParams += `&from=${from}`;
      if (to) queryParams += `&to=${to}`;
      if (categoryId) queryParams += `&categoryId=${categoryId}`;

      const res = await API.get(`/expense${queryParams}`);
      if (res.data?.success) {
        setExpenses(res.data.data);
        if (res.data.pagination) {
          setPagination(prev => ({
            ...prev,
            pages: res.data.pagination.pages,
            total: res.data.pagination.total
          }));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve expense transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaselines();
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
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
        type: 'expense',
        essential: newCatEssential
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
        setNewCatEssential(false);
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
      const res = await API.post('/expense', {
        accountId,
        categoryId,
        amount: parseFloat(amount),
        date,
        description
      });

      if (res.data?.success) {
        setSuccess('Expense logged successfully! Linked account updated.');
        if (res.data.warning) {
          showNotification(res.data.warning, 'warning', 8000);
        }
        setAddForm({
          accountId: accounts[0]?._id || '',
          categoryId: categories[0]?._id || '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          description: ''
        });
        setIsAddModalOpen(false);
        fetchExpenses();
        fetchSummary();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record expense entry.');
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
      const res = await API.put(`/expense/${activeExpense._id}`, {
        accountId,
        categoryId,
        amount: parseFloat(amount),
        date,
        description
      });

      if (res.data?.success) {
        setSuccess('Expense transaction modified. Re-balanced target account assets.');
        if (res.data.warning) {
          showNotification(res.data.warning, 'warning', 8000);
        }
        setIsEditModalOpen(false);
        setActiveExpense(null);
        fetchExpenses();
        fetchSummary();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update expense log.');
    }
  };

  const handleDeleteConfirm = async () => {
    setError('');
    try {
      const res = await API.delete(`/expense/${activeExpense._id}`);
      if (res.data?.success) {
        setSuccess('Expense log deleted. Linked account balance reversed.');
        setIsDeleteModalOpen(false);
        setActiveExpense(null);
        fetchExpenses();
        fetchSummary();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete expense record.');
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

  const openEditModal = (exp) => {
    setError('');
    setSuccess('');
    setShowNewCatInput(false);
    setActiveExpense(exp);

    setEditForm({
      accountId: exp.accountId?._id || exp.accountId || '',
      categoryId: exp.categoryId?._id || exp.categoryId || '',
      amount: exp.amount,
      date: new Date(exp.date).toISOString().split('T')[0],
      description: exp.description || ''
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (exp) => {
    setError('');
    setActiveExpense(exp);
    setIsDeleteModalOpen(true);
  };

  const handleSortToggle = () => {
    const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(nextOrder);
    setExpenses(prev => [...prev].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return nextOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }));
  };

  // Client-side filtering by essential tag
  const displayedExpenses = expenses.filter(exp => {
    const isEssential = exp.essential === true || exp.categoryId?.essential === true;
    if (filters.essentialType === 'essential') return isEssential;
    if (filters.essentialType === 'discretionary') return !isEssential;
    return true;
  });

  const pageSum = displayedExpenses.reduce((sum, item) => sum + item.amount, 0);

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

      {/* Summary strip above the table */}
      <div className="grid gap-6 sm:grid-cols-4 items-stretch">
        {/* Total Spend */}
        <LedgerCard className="h-full flex flex-col justify-between">
          <div className="min-h-[32px] flex flex-col justify-start">
            <h3 className="font-serif font-display text-sm font-bold text-ink leading-tight">Debit (Total Spends)</h3>
            <p className="text-ink-muted text-[10px] uppercase font-bold tracking-wider mt-1">Debit outgo totals</p>
          </div>
          <div className="flex-1 flex flex-col justify-end mt-2 border-t border-rule pt-3 text-right">
            <span className="text-xl font-bold font-mono text-ink-red tabular-nums block">
              ₹{summary.totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </LedgerCard>

        {/* Essential Spend */}
        <LedgerCard className="h-full flex flex-col justify-between">
          <div className="min-h-[32px] flex flex-col justify-start">
            <h3 className="font-serif font-display text-sm font-bold text-ink leading-tight">Needs (Essential)</h3>
            <p className="text-ink-muted text-[10px] uppercase font-bold tracking-wider mt-1">Required Operating Capital</p>
          </div>
          <div className="flex-1 flex flex-col justify-end mt-2 border-t border-rule pt-3 text-right">
            <span className="text-xl font-bold font-mono text-ink-green tabular-nums block">
              ₹{summary.essentialSplit.essential.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </LedgerCard>

        {/* Discretionary Spend */}
        <LedgerCard className="h-full flex flex-col justify-between">
          <div className="min-h-[32px] flex flex-col justify-start">
            <h3 className="font-serif font-display text-sm font-bold text-ink leading-tight">Wants (Discretionary)</h3>
            <p className="text-ink-muted text-[10px] uppercase font-bold tracking-wider mt-1">Leisure / Wants Outflows</p>
          </div>
          <div className="flex-1 flex flex-col justify-end mt-2 border-t border-rule pt-3 text-right">
            <span className="text-xl font-bold font-mono text-accent-brass tabular-nums block">
              ₹{summary.essentialSplit.discretionary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </LedgerCard>

        {/* Ratio bar */}
        <LedgerCard className="h-full flex flex-col justify-between">
          <div className="min-h-[32px] flex flex-col justify-start">
            <h3 className="font-serif font-display text-sm font-bold text-ink leading-tight">Audit Ratios</h3>
            <p className="text-ink-muted text-[10px] uppercase font-bold tracking-wider mt-1">Needs vs Wants Ratio</p>
          </div>
          <div className="flex-1 flex flex-col justify-end mt-2 border-t border-rule pt-3">
            <div className="h-2 w-full rounded bg-surface/50 overflow-hidden flex border border-rule">
              {summary.totalSpend > 0 ? (
                <>
                  <div
                    className="h-full bg-ink-green transition-all duration-300"
                    style={{ width: `${(summary.essentialSplit.essential / summary.totalSpend) * 100}%` }}
                  />
                  <div
                    className="h-full bg-accent-brass transition-all duration-300"
                    style={{ width: `${(summary.essentialSplit.discretionary / summary.totalSpend) * 100}%` }}
                  />
                </>
              ) : (
                <div className="h-full w-full bg-surface" />
              )}
            </div>
            <div className="mt-2 flex justify-between text-[9px] font-bold">
              <span className="text-ink-green">
                {summary.totalSpend > 0 ? `${((summary.essentialSplit.essential / summary.totalSpend) * 100).toFixed(0)}% Need` : '0% Need'}
              </span>
              <span className="text-accent-brass">
                {summary.totalSpend > 0 ? `${((summary.essentialSplit.discretionary / summary.totalSpend) * 100).toFixed(0)}% Want` : '0% Want'}
              </span>
            </div>
          </div>
        </LedgerCard>
      </div>

      {/* Filter panel */}
      <LedgerCard title="Search constraints" subtitle="Filter double-entry book lines">
        <div className="grid gap-4 sm:grid-cols-5 items-end pt-2">
          <div>
            <label className="text-[9px] uppercase text-ink-muted block mb-1.5 font-bold">From Date</label>
            <DateInput
              value={filters.from}
              onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
              className="h-9 font-mono"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase text-ink-muted block mb-1.5 font-bold">To Date</label>
            <DateInput
              value={filters.to}
              onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
              className="h-9 font-mono"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase text-ink-muted block mb-1.5 font-bold">Category Code</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full h-9 rounded border border-rule bg-surface px-3 text-ink text-xs focus:outline-none focus:border-brand font-semibold cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] uppercase text-ink-muted block mb-1.5 font-bold">Allocation Type</label>
            <select
              value={filters.essentialType}
              onChange={(e) => setFilters(prev => ({ ...prev, essentialType: e.target.value }))}
              className="w-full h-9 rounded border border-rule bg-surface px-3 text-ink text-xs focus:outline-none focus:border-brand font-semibold cursor-pointer"
            >
              <option value="all">All Outflows</option>
              <option value="essential">Essential (Needs)</option>
              <option value="discretionary">Discretionary (Wants)</option>
            </select>
          </div>
          <div className="flex sm:justify-end">
            <button
              onClick={() => setFilters({ from: '', to: '', categoryId: '', essentialType: 'all' })}
              className="h-9 text-[9px] text-accent-brass hover:underline uppercase font-bold tracking-wider cursor-pointer font-sans"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </LedgerCard>

      {/* Main ledger list container */}
      <LedgerCard title="Expenses Outflow Book" subtitle={`${pagination.total} records total`}>
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
            Record Debit (Outflow)
          </button>
        </div>

        {/* Ledger Rows */}
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : displayedExpenses.length > 0 ? (
          <div className="border border-rule rounded divide-y divide-rule overflow-hidden">
            {displayedExpenses.map((exp) => {
              const isEssential = exp.essential === true || exp.categoryId?.essential === true;
              return (
                <div key={exp._id} className="group relative">
                  <LedgerRow
                    label={exp.description || 'Outflow Transaction'}
                    categoryName={`${exp.categoryId?.name || 'Outflow'} | ${exp.accountId?.name || 'Source'} | ${isEssential ? 'Need' : 'Want'}`}
                    amount={exp.amount}
                    isExpense={true}
                    date={new Date(exp.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                    rightElement={
                      <div className="flex items-center gap-2 mr-2">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1 hover:text-brand text-ink-muted rounded border border-transparent hover:border-rule bg-surface/50 cursor-pointer transition-all"
                          title="Edit Entry"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(exp)}
                          className="p-1 hover:text-ink-red text-ink-muted rounded border border-transparent hover:border-danger/30 bg-surface/50 cursor-pointer transition-all"
                          title="Delete Entry"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    }
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 rounded border border-dashed border-rule bg-surface/10">
            <Calendar className="h-8 w-8 text-ink-muted mx-auto mb-2" />
            <p className="text-xs text-ink-muted font-medium">No recorded expense outflows match search query parameters.</p>
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

      {/* ==================== ADD EXPENSE MODAL ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md">
            <LedgerCard>
              <div className="flex justify-between items-center border-b border-rule pb-3.5 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-ink leading-tight">Log Debit Entry (Outflow)</h3>
                  <p className="text-[9px] text-ink-muted uppercase font-bold tracking-wider mt-0.5">Record asset source outgo</p>
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
                  <label className="text-ink-muted uppercase tracking-widest text-[9px] block mb-1 font-bold">Funding Source Account</label>
                  <select
                    required
                    value={addForm.accountId}
                    onChange={(e) => setAddForm(prev => ({ ...prev, accountId: e.target.value }))}
                    className="w-full rounded border border-rule bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                  >
                    <option value="" disabled>Select Outflow Account</option>
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>{acc.name} (₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-ink-muted uppercase tracking-widest text-[9px] font-bold">Outflow Classification Code</label>
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
                        <option key={cat._id} value={cat._id}>{cat.name} ({cat.essential ? 'Need' : 'Want'})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-bg p-3 rounded border border-rule space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="Category name"
                          className="flex-1 rounded border border-rule bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={newCatLoading}
                          onClick={handleCreateCategory}
                          className="rounded bg-brand px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-brand-hover cursor-pointer"
                        >
                          Create
                        </button>
                      </div>
                      {newCatError && <span className="text-[9px] text-ink-red block">{newCatError}</span>}

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="newCatEssential"
                          checked={newCatEssential}
                          onChange={(e) => setNewCatEssential(e.target.checked)}
                          className="rounded bg-surface border-rule text-brand focus:ring-0 focus:outline-none"
                        />
                        <label htmlFor="newCatEssential" className="text-[9px] text-ink-muted uppercase tracking-widest cursor-pointer select-none font-bold">
                          Essential / Operational need (Rent, Food, Bills)
                        </label>
                      </div>
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
                    <DateInput
                      required
                      value={addForm.date}
                      onChange={(e) => setAddForm(prev => ({ ...prev, date: e.target.value }))}
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
                    placeholder="e.g. Swiggy food delivery"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded bg-brand hover:bg-brand-hover py-3 text-xs font-bold text-white transition-all cursor-pointer outline-none"
                  >
                    Log Outflow (Debit)
                  </button>
                </div>
              </form>
            </LedgerCard>
          </div>
        </div>
      )}

      {/* ==================== EDIT EXPENSE MODAL ==================== */}
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
                  onClick={() => { setIsEditModalOpen(false); setActiveExpense(null); }}
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
                  <label className="text-ink-muted uppercase tracking-widest text-[9px] block mb-1 font-bold">Funding Source Account</label>
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
                    <label className="text-ink-muted uppercase tracking-widest text-[9px] font-bold">Outflow Classification Code</label>
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
                    <div className="bg-bg p-3 rounded border border-rule space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="Category name"
                          className="flex-1 rounded border border-rule bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={newCatLoading}
                          onClick={handleCreateCategory}
                          className="rounded bg-brand px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-brand-hover cursor-pointer"
                        >
                          Create
                        </button>
                      </div>
                      {newCatError && <span className="text-[9px] text-ink-red block">{newCatError}</span>}

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="newCatEssentialEdit"
                          checked={newCatEssential}
                          onChange={(e) => setNewCatEssential(e.target.checked)}
                          className="rounded bg-surface border-rule text-brand focus:ring-0 focus:outline-none"
                        />
                        <label htmlFor="newCatEssentialEdit" className="text-[9px] text-ink-muted uppercase tracking-widest cursor-pointer select-none font-bold">
                          Essential / Operational need (Rent, Food, Bills)
                        </label>
                      </div>
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
                    <DateInput
                      required
                      value={editForm.date}
                      onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
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
                <h3 className="text-sm font-bold text-ink mb-1.5">Delete Outflow Entry?</h3>
                <p className="text-[10px] text-ink-muted mb-5 leading-normal">
                  Deletions will permanently reverse the Debit balance of <span className="font-bold text-ink">₹{activeExpense?.amount?.toLocaleString('en-IN')}</span> from account <span className="font-bold text-ink">"{activeExpense?.accountId?.name}"</span>.
                </p>

                {error && (
                  <div className="mb-4 rounded border border-danger/25 bg-danger/5 p-3 text-ink-red text-left font-semibold">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setIsDeleteModalOpen(false); setActiveExpense(null); }}
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

export default Expense;
