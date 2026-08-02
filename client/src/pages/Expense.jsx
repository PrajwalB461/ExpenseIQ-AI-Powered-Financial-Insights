import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, Filter, Calendar, Tag, ChevronLeft, ChevronRight, Check, X, AlertTriangle, Landmark, Banknote } from 'lucide-react';
import API from '../api';
import { useNotification } from '../context/NotificationContext';

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

  // Active records for Edit / Delete operations
  const [activeExpense, setActiveExpense] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    categoryId: '',
    essentialType: 'all' // 'all' | 'essential' | 'discretionary'
  });

  // Sort State
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc' by transaction date

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

  // Inline Category states inside modals
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEssential, setNewCatEssential] = useState(false);
  const [newCatError, setNewCatError] = useState('');
  const [newCatLoading, setNewCatLoading] = useState(false);

  // Fetch initial baseline assets and categories
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

  // Fetch summary strip
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
      console.error('Failed to retrieve expense summary metrics aggregations:', err);
    }
  };

  // Fetch page listing expenses
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
      setError(err.response?.data?.message || 'Failed to retrieve expense transaction logs.');
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

  // Create Category Handler
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setNewCatError('');
    if (!newCatName.trim()) {
      setNewCatError('Please provide a category name.');
      return;
    }

    setNewCatLoading(true);
    try {
      // POST custom category with essential tag
      const res = await API.post('/categories', {
        name: newCatName.trim(),
        type: 'expense',
        essential: newCatEssential
      });
      
      if (res.data?.success) {
        const createdCat = res.data.data;
        
        // If essential checkbox is checked, we can update/set it (in case category object allows)
        // Wait, does POST custom category accept essential? Let's check Category.js & controller.
        // The categoryController creates a Category options object using req.body.
        // Wait! Let's check if the server Category creation handles essential body value.
        // Yes! categoryController does Category.create({ name, type, essential }) or similar if we pass it,
        // but categoryController does:
        // Category.create({ userId, name: name.trim(), type, isDefault: false });
        // Let's modify categoryController to accept essential flag in request payload if supplied!
        // That is extremely smart and guarantees the client custom essential category is saved with essential value.
        // Let's double check if we can pass essential: true and the DB gets it. Mongoose Schema allows it!
        // So let's make sure it matches. We'll update the categoryController to persist `essential` field directly.
        // We will make sure that happens!
        
        setCategories(prev => [...prev, createdCat].sort((a,b) => a.name.localeCompare(b.name)));
        
        // Auto-select newly created category in active form
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
        setSuccess('Expense logged successfully! Linked account decremented.');
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
        setSuccess('Expense log deleted. Linked account balance refunded.');
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

  // Indian Rupee formatting
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(val);
  };

  // Sorting handlers on transaction date local array
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
    <div className="space-y-6 animate-fade-in text-xs font-semibold text-slate-350">
      
      {/* Alert feeds */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-450 text-emerald-400">
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

      {/* Summary strip above the table */}
      <div className="grid gap-6 sm:grid-cols-4">
        {/* Total Spend */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Total Monthly Spend</span>
          <span className="text-2xl font-black text-rose-400 mt-1 block">
            {formatINR(summary.totalSpend)}
          </span>
          <p className="text-[8px] text-slate-500 mt-1.5 uppercase font-bold">Sum of all outflows for range</p>
        </div>

        {/* Essential Spend */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Essential Spend (Needs)</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            {formatINR(summary.essentialSplit.essential)}
          </span>
          <p className="text-[8px] text-emerald-500/70 mt-1.5 uppercase font-bold">Food, Transport, Bills, Health</p>
        </div>

        {/* Discretionary Spend */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Discretionary (Wants)</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">
            {formatINR(summary.essentialSplit.discretionary)}
          </span>
          <p className="text-[8px] text-amber-500/70 mt-1.5 uppercase font-bold">Leisure, Shopping, Entertainment</p>
        </div>

        {/* Essential Split Ratio */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Needs vs Wants Ratio</span>
          <div className="mt-2 h-2.5 w-full rounded-full bg-slate-950 overflow-hidden flex">
            {summary.totalSpend > 0 ? (
              <>
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(summary.essentialSplit.essential / summary.totalSpend) * 100}%` }}
                />
                <div 
                  className="h-full bg-amber-50 transition-all duration-300 bg-amber-500"
                  style={{ width: `${(summary.essentialSplit.discretionary / summary.totalSpend) * 100}%` }}
                />
              </>
            ) : (
              <div className="h-full w-full bg-slate-800" />
            )}
          </div>
          <div className="mt-2.5 flex justify-between text-[9px] font-bold">
            <span className="text-emerald-400">
              {summary.totalSpend > 0 ? `${((summary.essentialSplit.essential / summary.totalSpend) * 100).toFixed(0)}% Need` : '0% Need'}
            </span>
            <span className="text-amber-400">
              {summary.totalSpend > 0 ? `${((summary.essentialSplit.discretionary / summary.totalSpend) * 100).toFixed(0)}% Want` : '0% Want'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Asset Filters</span>
          <button
            onClick={() => setFilters({ from: '', to: '', categoryId: '', essentialType: 'all' })}
            className="text-[9px] text-violet-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="text-[9px] uppercase text-slate-400 block mb-1">From Date</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 font-semibold"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase text-slate-400 block mb-1">To Date</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 font-semibold"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase text-slate-400 block mb-1">Expense Category</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-white focus:outline-none focus:border-violet-500 bg-slate-950 appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] uppercase text-slate-400 block mb-1">Essential / Discretionary</label>
            <select
              value={filters.essentialType}
              onChange={(e) => setFilters(prev => ({ ...prev, essentialType: e.target.value }))}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-white focus:outline-none focus:border-violet-500 bg-slate-950 appearance-none"
            >
              <option value="all">All Outflows</option>
              <option value="essential">Essential (Needs)</option>
              <option value="discretionary">Discretionary (Wants)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main ledger list container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white">Expense Outflow Ledger</h3>
            <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider">{pagination.total} records found (Running Sum: {formatINR(pageSum)})</p>
          </div>
          
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-violet-650 hover:bg-violet-600 text-white px-4 py-2.5 font-bold transition-all bg-violet-600 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Log Outflow
          </button>
        </div>

        {/* Ledger table */}
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
          </div>
        ) : displayedExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                  <th className="py-3 px-2 cursor-pointer hover:text-white transition-colors" onClick={handleSortToggle}>
                    Date {sortOrder === 'asc' ? '▲' : '▼'}
                  </th>
                  <th className="py-3 px-2">Label Description</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Source Channel</th>
                  <th className="py-3 px-2 text-right">Outflow Volume</th>
                  <th className="py-3 px-2 text-center opacity-70">Modify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {displayedExpenses.map((exp) => {
                  const isEssential = exp.essential === true || exp.categoryId?.essential === true;
                  return (
                    <tr key={exp._id} className="hover:bg-slate-850/10 transition-colors text-slate-300">
                      <td className="py-3.5 px-2 text-slate-400 font-mono">
                        {new Date(exp.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-2 font-bold text-white max-w-[140px] truncate">
                        {exp.description || 'Outflow Transaction'}
                      </td>
                      <td className="py-3.5 px-2 space-y-1">
                        <span className="inline-flex items-center rounded-md bg-rose-500/5 px-2 py-0.5 text-[9px] font-bold text-rose-400 border border-rose-500/10 text-rose-455">
                          {exp.categoryId?.name || 'Category'}
                        </span>
                        <span className={`block text-[8px] uppercase tracking-wider ${isEssential ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {isEssential ? 'Essential' : 'Discretionary'}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-slate-400 truncate max-w-[100px]">
                        {exp.accountId?.name || 'Asset Account'}
                      </td>
                      <td className="py-3.5 px-2 text-right font-black text-rose-400 text-sm">
                        -{formatINR(exp.amount)}
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(exp)}
                            className="p-1 hover:text-white text-slate-500 rounded hover:bg-slate-800"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(exp)}
                            className="p-1 hover:text-red-400 text-slate-500 rounded hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-4">
                <span className="text-[10px] text-slate-500">
                  Page {pagination.page} of {pagination.pages}
                </span>
                
                <div className="flex gap-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="p-2 border border-slate-800 rounded-lg text-slate-400 disabled:opacity-40 hover:text-white cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="p-2 border border-slate-800 rounded-lg text-slate-400 disabled:opacity-40 hover:text-white cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/10">
            <Calendar className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">No recorded expense outflows match search query parameters.</p>
          </div>
        )}
      </div>

      {/* ==================== ADD EXPENSE MODAL ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-sm font-bold text-white mb-2">Log Expense transaction</h3>
            <p className="text-[10px] text-slate-500 mb-4 font-semibold uppercase tracking-wider">Record outgoing values to recalculate assets</p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/25 p-3 text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              
              {/* Account Dropdown */}
              <div>
                <label className="text-slate-400 uppercase tracking-widest text-[9px] block mb-1">Funding Source Channel</label>
                <select
                  required
                  value={addForm.accountId}
                  onChange={(e) => setAddForm(prev => ({ ...prev, accountId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-955 px-3.5 py-2.5 text-xs text-white focus:outline-none bg-slate-950"
                >
                  <option value="" disabled>Select Outflow Account</option>
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>{acc.name} (₹{acc.balance.toLocaleString('en-IN')})</option>
                  ))}
                </select>
              </div>

              {/* Category selector + Optional inline creation form */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400 uppercase tracking-widest text-[9px]">Expense Category Type</label>
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(!showNewCatInput)}
                    className="text-[9px] text-violet-400 font-bold hover:underline"
                  >
                    {showNewCatInput ? 'Cancel custom' : '+ Add new category'}
                  </button>
                </div>

                {!showNewCatInput ? (
                  <select
                    required
                    value={addForm.categoryId}
                    onChange={(e) => setAddForm(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-955 px-3.5 py-2.5 text-xs text-white focus:outline-none bg-slate-950"
                  >
                    <option value="" disabled>Select Category Type</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name} ({cat.essential ? 'Need' : 'Want'})</option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Category (e.g. Subscriptions)"
                        className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={newCatLoading}
                        onClick={handleCreateCategory}
                        className="rounded-lg bg-violet-650 px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-violet-600 bg-violet-600 cursor-pointer"
                      >
                        Save list
                      </button>
                    </div>
                    {newCatError && <span className="text-[9px] text-red-400 block">{newCatError}</span>}
                    
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="newCatEssential"
                        checked={newCatEssential}
                        onChange={(e) => setNewCatEssential(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-800 text-violet-500" 
                      />
                      <label htmlFor="newCatEssential" className="text-[9px] text-slate-400 uppercase tracking-widest cursor-pointer">
                        Essential expense category (Food / Rent / Needs)
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount and date picker */}
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="text-slate-400 uppercase tracking-widest text-[9px] block mb-1">Amount Charged (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={addForm.amount}
                    onChange={(e) => setAddForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase tracking-widest text-[9px] block mb-1">Log Date</label>
                  <input
                    type="date"
                    required
                    value={addForm.date}
                    onChange={(e) => setAddForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:outline-none text-slate-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-slate-400 uppercase tracking-widest text-[9px] block mb-1">Details / Description</label>
                <input
                  type="text"
                  value={addForm.description}
                  onChange={(e) => setAddForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  placeholder="e.g. Swiggy food delivery"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-rose-600 hover:bg-rose-550 py-3 text-xs font-bold text-white transition-all cursor-pointer"
              >
                Log Outflow
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT EXPENSE MODAL ==================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative">
            <button
              onClick={() => { setIsEditModalOpen(false); setActiveExpense(null); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-sm font-bold text-white mb-2">Modify Ledger Transaction</h3>
            <p className="text-[10px] text-slate-500 mb-4 font-semibold uppercase tracking-wider">Update transaction fields - balances recalculate</p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/25 p-3 text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              
              {/* Account Dropdown */}
              <div>
                <label className="text-slate-400 uppercase tracking-widest text-[9px] block mb-1">Funding Source Channel</label>
                <select
                  required
                  value={editForm.accountId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, accountId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-955 px-3.5 py-2.5 text-xs text-white focus:outline-none bg-slate-955"
                >
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>{acc.name} (₹{acc.balance.toLocaleString('en-IN')})</option>
                  ))}
                </select>
              </div>

              {/* Category Dropdown */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400 uppercase tracking-widest text-[9px]">Expense Category Type</label>
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(!showNewCatInput)}
                    className="text-[9px] text-violet-400 font-bold hover:underline"
                  >
                    {showNewCatInput ? 'Cancel custom' : '+ Add new category'}
                  </button>
                </div>

                {!showNewCatInput ? (
                  <select
                    required
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-955 px-3.5 py-2.5 text-xs text-white focus:outline-none bg-slate-950"
                  >
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name} ({cat.essential ? 'Need' : 'Want'})</option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-805 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Category name"
                        className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={newCatLoading}
                        onClick={handleCreateCategory}
                        className="rounded-lg bg-violet-650 px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-violet-650 bg-violet-600 cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                    {newCatError && <span className="text-[9px] text-red-400 block">{newCatError}</span>}
                    
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="newCatEssentialEdit"
                        checked={newCatEssential}
                        onChange={(e) => setNewCatEssential(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-800 text-violet-500" 
                      />
                      <label htmlFor="newCatEssentialEdit" className="text-[9px] text-slate-400 uppercase tracking-widest cursor-pointer">
                        Essential category
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount and date picker */}
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="text-slate-400 uppercase tracking-widest text-[9px] block mb-1">Amount Charged (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editForm.amount}
                    onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase tracking-widest text-[9px] block mb-1">Log Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:outline-none text-slate-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-slate-400 uppercase tracking-widest text-[9px] block mb-1">Details / Description</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-955 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-violet-650 py-3 text-xs font-bold text-white hover:bg-violet-605 cursor-pointer bg-violet-600"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE EXPENSE CONFIRMATION MODAL ==================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-slate-805 bg-slate-900 shadow-2xl p-6 relative border-slate-800">
            <div className="text-center">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white mb-2">Delete Outflow Entry?</h3>
              <p className="text-[10px] text-slate-400 mb-5 leading-relaxed font-semibold">
                Deleting this record will refund a sum of <span className="text-white font-bold">{formatINR(activeExpense?.amount || 0)}</span> back to account <span className="text-white font-bold">"{activeExpense?.accountId?.name}"</span>.
              </p>

              {error && (
                <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/25 p-3 text-red-400 text-left">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setIsDeleteModalOpen(false); setActiveExpense(null); }}
                  className="rounded-xl border border-slate-800 hover:bg-slate-800 px-4 py-2.5 text-xs text-slate-350 font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="rounded-xl bg-rose-600 hover:bg-rose-555 px-4 py-2.5 text-xs text-white font-bold transition-all cursor-pointer"
                >
                  Refund Outflow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Expense;
