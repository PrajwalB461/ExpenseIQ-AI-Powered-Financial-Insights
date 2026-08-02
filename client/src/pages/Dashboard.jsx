import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Download, 
  Sparkles, 
  Calendar, 
  Filter, 
  Tag, 
  Search, 
  ArrowUpRight,
  Info,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import API from '../api';

const COLORS = [
  '#a78bfa', // violet-400
  '#22d3ee', // cyan-400
  '#f472b6', // pink-400
  '#fbbf24', // amber-400
  '#34d399', // emerald-400
  '#f87171', // red-400
  '#60a5fa'  // blue-400
];

const Dashboard = () => {
  const [data, setData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netSavings: 0,
    spendByCategory: [],
    spendTrend: [],
    topCategories: []
  });
  
  const [insights, setInsights] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters State
  const [preset, setPreset] = useState('this-month'); // this-month | last-month | this-year | custom
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Handle Preset Changes
  useEffect(() => {
    const now = new Date();
    let start = '';
    let end = '';

    if (preset === 'this-month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      start = first.toISOString().split('T')[0];
      end = last.toISOString().split('T')[0];
    } else if (preset === 'last-month') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      start = first.toISOString().split('T')[0];
      end = last.toISOString().split('T')[0];
    } else if (preset === 'this-year') {
      const first = new Date(now.getFullYear(), 0, 1);
      const last = new Date(now.getFullYear(), 11, 31);
      start = first.toISOString().split('T')[0];
      end = last.toISOString().split('T')[0];
    }

    if (preset !== 'custom') {
      setFromDate(start);
      setToDate(end);
    }
  }, [preset]);

  // Fetch baseline categories for filters
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get('/categories');
        if (res.data?.success) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load categories catalog:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch overview data and insights
  const fetchDashboardData = async () => {
    if (!fromDate || !toDate) return;
    
    setLoading(true);
    setInsightsLoading(true);
    setError('');

    const query = `?from=${fromDate}&to=${toDate}${categoryId ? `&categoryId=${categoryId}` : ''}`;

    try {
      // Parallel get overview + insights
      const [overviewRes, insightsRes] = await Promise.all([
        API.get(`/dashboard/overview${query}`),
        API.get(`/dashboard/insights${query}`)
      ]);

      if (overviewRes.data?.success) {
        setData(overviewRes.data.data);
      }
      if (insightsRes.data?.success) {
        setInsights(insightsRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard metrics data.');
    } finally {
      setLoading(false);
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fromDate, toDate, categoryId]);

  // Trigger export
  const handleExport = async () => {
    try {
      const query = `?from=${fromDate}&to=${toDate}${categoryId ? `&categoryId=${categoryId}` : ''}`;
      const res = await API.get(`/dashboard/export${query}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FinIntel_Finance_Report_${fromDate}_to_${toDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Excel report exportation failed:', err);
      alert('Failed to construct and download Excel report.');
    }
  };

  // Indian Rupee custom formatter
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(val);
  };

  // Custom Tick Date label formater
  const formatTrendTick = (label) => {
    if (!label) return '';
    const date = new Date(label);
    if (isNaN(date.getTime())) return label;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs font-semibold text-slate-350">
      
      {/* Financial Welcome Deck Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/60 to-indigo-900/60 p-6 border border-violet-850 bg-slate-900/40 shadow-xl">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-violet-600/20 blur-2xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-xl font-black text-white">Financial Intelligence Control Center</h1>
            <p className="mt-1 text-slate-300">
              Welcome back to your active asset center. Analyze historical cashflows, generate rule-based savings insights, or download full details.
            </p>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-650 hover:bg-violet-600 text-white px-5 py-2.5 font-bold transition-all bg-violet-600 cursor-pointer shadow-lg shadow-violet-950/20"
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* FILTER BAR PRESSETS */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-violet-400" />
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Asset Filter Panel</span>
          </div>
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Showing Real-Time Dynamic Indicators</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {/* Preset Buttons */}
          <div>
            <label className="text-[9px] uppercase text-slate-400 block mb-1">Time Preset Range</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 bg-slate-950 appearance-none font-semibold cursor-pointer"
            >
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* From Date Inputs */}
          <div>
            <label className="text-[9px] uppercase text-slate-400 block mb-1">Start Date</label>
            <input
              type="date"
              value={fromDate}
              disabled={preset !== 'custom'}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 font-semibold disabled:opacity-40"
            />
          </div>

          {/* To Date Inputs */}
          <div>
            <label className="text-[9px] uppercase text-slate-400 block mb-1">End Date</label>
            <input
              type="date"
              value={toDate}
              disabled={preset !== 'custom'}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 font-semibold disabled:opacity-40"
            />
          </div>

          {/* Category Filter dropdown */}
          <div>
            <label className="text-[9px] uppercase text-slate-400 block mb-1">Category Classification</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-violet-500 bg-slate-950 appearance-none font-semibold cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name} ({cat.type === 'income' ? 'Inflow' : 'Outflow'})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-red-400">
          <AlertTriangle className="h-4.5 w-4.5 animate-bounce" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI SCARY CARDS */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Total Income Inflow Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl flex flex-col justify-between hover:border-violet-500/35 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Consolidated Income</span>
            <span className="h-6 w-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-emerald-450 block text-emerald-400">
              {loading ? '₹--' : formatINR(data.totalIncome)}
            </span>
            <p className="text-[8px] text-slate-500 mt-1 uppercase font-bold">Total earnings mapped to assets</p>
          </div>
        </div>

        {/* Total Expense Outflow Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl flex flex-col justify-between hover:border-violet-500/35 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Consolidated Deficit</span>
            <span className="h-6 w-6 rounded bg-rose-500/10 flex items-center justify-center text-rose-455 text-rose-450 border border-rose-500/20">
              <TrendingDown className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-rose-400 block">
              {loading ? '₹--' : formatINR(data.totalExpense)}
            </span>
            <p className="text-[8px] text-slate-500 mt-1 uppercase font-bold">Total spend decumulations</p>
          </div>
        </div>

        {/* Net Savings Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl flex flex-col justify-between hover:border-violet-500/35 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Net Surplus / Savings</span>
            <span className="h-6 w-6 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Wallet className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <span className={`text-2xl font-black block ${data.netSavings >= 0 ? 'text-violet-405 text-violet-400' : 'text-amber-500'}`}>
              {loading ? '₹--' : formatINR(data.netSavings)}
            </span>
            <p className="text-[8px] text-slate-500 mt-1 uppercase font-bold">Inflows subtracted by outflows</p>
          </div>
        </div>
      </div>

      {/* CHART PANEL LAYOUT GRID */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Area Lines Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Daily Outflow Trend Chart</h3>
            <p className="text-[9px] text-slate-550 text-slate-500 uppercase tracking-wider font-bold">Tracking transactional volume changes over timeline</p>
          </div>
          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full flex justify-center items-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500/25 border-t-violet-500" />
              </div>
            ) : data.spendTrend && data.spendTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.spendTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#475569" 
                    fontSize={9} 
                    tickFormatter={formatTrendTick}
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#090d16', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }} 
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Spends']}
                    labelFormatter={formatTrendTick}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#f43f5e" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#spendColor)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col justify-center items-center border border-dashed border-slate-800 rounded-xl bg-slate-950/10">
                <Calendar className="h-8 w-8 text-slate-650 text-slate-600 mb-2" />
                <span className="text-xs text-slate-500 font-medium">No trend metrics log data matches selection.</span>
              </div>
            )}
          </div>
        </div>

        {/* Categorical Distribution Pie Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Spend Breakdown by Category</h3>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Relative percentage splits of outflow distributions</p>
          </div>
          <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
            {loading ? (
              <div className="h-full flex justify-center items-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500/25 border-t-violet-500" />
              </div>
            ) : data.spendByCategory && data.spendByCategory.length > 0 ? (
              <>
                <div className="h-56 w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.spendByCategory}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {data.spendByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#090d16', 
                          borderColor: '#1e293b', 
                          borderRadius: '12px',
                          color: '#cbd5e1',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                        formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Total']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Categorical custom Legends list */}
                <div className="flex-1 space-y-2.5 max-h-56 overflow-y-auto w-full px-2">
                  {data.spendByCategory.map((item, index) => (
                    <div key={item.category} className="flex justify-between items-center gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span 
                          className="h-2.5 w-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-white font-bold truncate max-w-[100px]">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-300 font-bold block">{formatINR(item.amount)}</span>
                        <span className="text-[9px] text-slate-500 block">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full w-full flex flex-col justify-center items-center border border-dashed border-slate-800 rounded-xl bg-slate-950/10">
                <Tag className="h-8 w-8 text-slate-600 mb-2" />
                <span className="text-xs text-slate-500 font-medium">No category subdivisions logged.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI STRATEGIC FINANCIAL INSIGHTS */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Sparkles className="h-4.5 w-4.5 text-violet-400" />
          <div>
            <h3 className="text-sm font-bold text-white">System Insight Engine Actions</h3>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Rule-based predictive analysis and spending alert triggers</p>
          </div>
        </div>

        {insightsLoading ? (
          <div className="py-6 flex justify-center items-center">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-violet-500/20 border-t-violet-500" />
          </div>
        ) : insights.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {insights.map((insight, idx) => {
              const isAnomaly = insight.includes('Anomaly');
              const isIncrease = insight.includes('increased');
              const isDecrease = insight.includes('decreased') || insight.includes('Great job');
              
              let borderClass = 'border-slate-800 bg-slate-950/40';
              let iconColor = 'text-violet-405 text-violet-400';
              if (isAnomaly) {
                borderClass = 'border-amber-500/20 bg-amber-500/5';
                iconColor = 'text-amber-500';
              } else if (isIncrease) {
                borderClass = 'border-rose-500/20 bg-rose-500/5';
                iconColor = 'text-rose-400';
              } else if (isDecrease) {
                borderClass = 'border-emerald-500/25 bg-emerald-500/5';
                iconColor = 'text-emerald-450 text-emerald-400';
              }

              return (
                <div key={idx} className={`rounded-xl border p-4.5 flex gap-3 text-xs leading-relaxed text-slate-300 font-semibold items-start transition-all hover:scale-[1.01] ${borderClass}`}>
                  <span className={`mt-0.5 shrink-0 ${iconColor}`}>
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span>{insight}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/10">
            <Info className="h-8 w-8 text-slate-650 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Add more transaction logs to populate strategic advice feeds.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
