import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  NotebookPen,
  Download,
  Sparkles,
  Calendar,
  Filter,
  Tag,
  Info,
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
  Cell
} from 'recharts';
import API from '../api';
import LedgerCard from '../components/LedgerCard';
import DateInput from '../components/DateInput';
import { useAuth } from '../context/AuthContext';
import OnboardingModal from '../components/OnboardingModal';

const COLORS = [
  'var(--brand)',
  'var(--accent-brass)',
  'var(--ink-green)',
  'var(--warning)',
  'var(--ink-red)',
  'var(--danger)'
];

const Dashboard = () => {
  const { user } = useAuth();
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

  // Filters presets
  const [preset, setPreset] = useState('this-month');
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get('/categories');
        if (res.data?.success) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const fetchDashboardData = async () => {
    if (!fromDate || !toDate) return;

    setLoading(true);
    setInsightsLoading(true);
    setError('');

    const query = `?from=${fromDate}&to=${toDate}${categoryId ? `&categoryId=${categoryId}` : ''}`;

    try {
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
      setError(err.response?.data?.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fromDate, toDate, categoryId]);

  const handleExport = async () => {
    try {
      const query = `?from=${fromDate}&to=${toDate}${categoryId ? `&categoryId=${categoryId}` : ''}`;
      const res = await API.get(`/backup/export${query}`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ledger_Backup_${fromDate}_to_${toDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Excel report exportation failed:', err);
      alert('Failed to construct and download Excel workbook backup.');
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const formatTrendTick = (label) => {
    if (!label) return '';
    const date = new Date(label);
    if (isNaN(date.getTime())) return label;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6 text-xs text-ink font-semibold">

      {/* Welcome Banner */}
      <LedgerCard className="relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="font-serif font-display text-2xl font-bold tracking-tight text-ink">General Ledger Balance</h1>
            <p className="mt-1 text-ink-muted">
              Verify book entries, audit monthly categories, and generate strategic bookkeeping insights for the period.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 rounded bg-brand hover:bg-brand-hover text-white px-5 py-2.5 font-bold transition-all cursor-pointer shadow-xs outline-none"
          >
            <Download className="h-4 w-4" />
            Export Ledger Workbook
          </button>
        </div>
      </LedgerCard>

      {/* FILTER BAR PRESSETS */}
      <LedgerCard title="Audit Filter Panel" subtitle="Configure Reporting Constraints">
        <div className="grid gap-4 sm:grid-cols-4 items-end pt-2">
          <div>
            <label className="text-[9px] uppercase text-ink-muted block mb-1.5 font-bold">Reporting Frequency</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full h-9 rounded border border-rule bg-surface px-3 text-xs text-ink focus:outline-none focus:border-brand font-semibold cursor-pointer"
            >
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] uppercase text-ink-muted block mb-1.5 font-bold">Start Date</label>
            <DateInput
              value={fromDate}
              disabled={preset !== 'custom'}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 font-mono"
            />
          </div>

          <div>
            <label className="text-[9px] uppercase text-ink-muted block mb-1.5 font-bold">End Date</label>
            <DateInput
              value={toDate}
              disabled={preset !== 'custom'}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 font-mono"
            />
          </div>

          <div>
            <label className="text-[9px] uppercase text-ink-muted block mb-1.5 font-bold">Category Account Filter</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-9 rounded border border-rule bg-surface px-3 text-xs text-ink focus:outline-none focus:border-brand font-semibold cursor-pointer font-sans"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name} ({cat.type !== 'income' ? 'Debit' : 'Credit'})</option>
              ))}
            </select>
          </div>
        </div>
      </LedgerCard>

      {error && (
        <div className="flex items-center gap-2 rounded border border-danger/20 bg-danger/5 p-4 text-ink-red">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI STAT CARDS */}
      <div className="grid gap-6 sm:grid-cols-3 items-stretch">
        {/* Total Income Inflow Card */}
        <LedgerCard className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between min-h-[32px] gap-2">
            <span className="text-[9px] uppercase font-bold text-ink-muted tracking-wider leading-tight line-clamp-2">Credit (Total Income)</span>
            <span className="h-6 w-6 rounded bg-ink-green/10 flex items-center justify-center text-ink-green border border-ink-green/20 shrink-0 font-sans">
              <TrendingUp className="h-3.5 w-3.5" aria-label="Income (credit)" title="Income (credit)" />
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-end mt-4 border-t border-rule pt-3">
            <span className="text-xl font-bold font-mono text-ink-green tabular-nums text-right w-full block">
              {loading ? '₹--' : `₹${formatINR(data.totalIncome)}`}
            </span>
          </div>
        </LedgerCard>

        {/* Total Expense Outflow Card */}
        <LedgerCard className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between min-h-[32px] gap-2">
            <span className="text-[9px] uppercase font-bold text-ink-muted tracking-wider leading-tight line-clamp-2">Debit (Total Expenses)</span>
            <span className="h-6 w-6 rounded bg-ink-red/10 flex items-center justify-center text-ink-red border border-ink-red/20 shrink-0 font-sans">
              <TrendingDown className="h-3.5 w-3.5" aria-label="Expense (credit)" title="Expense (credit)" />
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-end mt-4 border-t border-rule pt-3">
            <span className="text-xl font-bold font-mono text-ink-red tabular-nums text-right w-full block">
              {loading ? '₹--' : `₹${formatINR(data.totalExpense)}`}
            </span>
          </div>
        </LedgerCard>

        {/* Net Savings Card */}
        <LedgerCard className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between min-h-[32px] gap-2">
            <span className="text-[9px] uppercase font-bold text-ink-muted tracking-wider leading-tight line-clamp-2">Net Balance Surplus</span>
            <span className="h-6 w-6 rounded bg-accent-brass/10 flex items-center justify-center text-accent-brass border border-accent-brass/20 shrink-0">
              <NotebookPen className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-end mt-4 border-t border-rule pt-3">
            <span className={`text-xl font-bold font-mono w-full text-right tabular-nums block ${data.netSavings >= 0 ? 'text-ink-green' : 'text-ink-red'}`}>
              {loading ? '₹--' : `${data.netSavings >= 0 ? '+' : ''}₹${formatINR(data.netSavings)}`}
            </span>
          </div>
        </LedgerCard>
      </div>

      {/* CHART PANEL LAYOUT GRID */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Area Lines Chart */}
        <LedgerCard title="Daily Outflow Account Trend">
          <div className="h-72 w-full pt-4">
            {loading ? (
              <div className="h-full flex justify-center items-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            ) : data.spendTrend && data.spendTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.spendTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ink-red)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--ink-red)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" opacity={0.4} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--ink-muted)"
                    fontSize={9}
                    tickFormatter={formatTrendTick}
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--ink-muted)"
                    fontSize={10}
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--rule)',
                      borderRadius: '6px',
                      color: 'var(--ink)',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Debit Amount']}
                    labelFormatter={formatTrendTick}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--ink-red)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#spendColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col justify-center items-center border border-dashed border-rule rounded bg-surface/10">
                <Calendar className="h-6 w-6 text-ink-muted mb-2" />
                <span className="text-xs text-ink-muted font-medium">No trend metrics matches current period filters parameter.</span>
              </div>
            )}
          </div>
        </LedgerCard>

        {/* Categorical Distribution Pie Chart */}
        <LedgerCard title="Outflow Breakdown by Account Code">
          <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {loading ? (
              <div className="h-full flex justify-center items-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
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
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {data.spendByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--surface)',
                          borderColor: 'var(--rule)',
                          borderRadius: '6px',
                          color: 'var(--ink)',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                        formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Credit Sum']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-2 max-h-56 overflow-y-auto w-full px-2">
                  {data.spendByCategory.map((item, index) => (
                    <div key={item.category} className="flex justify-between items-center gap-2 text-xs border-b border-rule/50 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-ink font-bold truncate max-w-[100px]">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-ink font-mono font-bold block tabular-nums">{formatINR(item.amount)}</span>
                        <span className="text-[9px] text-ink-muted block font-mono">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full w-full flex flex-col justify-center items-center border border-dashed border-rule rounded bg-surface/10">
                <Tag className="h-6 w-6 text-ink-muted mb-2" />
                <span className="text-xs text-ink-muted font-medium">No categorical subdivisions posted.</span>
              </div>
            )}
          </div>
        </LedgerCard>
      </div>

      {/* AI STRATEGIC FINANCIAL INSIGHTS */}
      <LedgerCard title="Strategic Audit Analysis Alerts" subtitle="
      
      Ledger Verification Feed">
        {insightsLoading ? (
          <div className="py-6 flex justify-center items-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : insights.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            {insights.map((insight, idx) => {
              const isAnomaly = insight.includes('Anomaly');
              const isIncrease = insight.includes('increased');
              const isDecrease = insight.includes('decreased') || insight.includes('Great job');

              let borderClass = 'border-rule bg-surface';
              let iconColor = 'text-accent-brass';
              if (isAnomaly) {
                borderClass = 'border-warning/30 bg-surface';
                iconColor = 'text-warning';
              } else if (isIncrease) {
                borderClass = 'border-danger/30 bg-surface';
                iconColor = 'text-ink-red';
              } else if (isDecrease) {
                borderClass = 'border-ink-green/30 bg-surface';
                iconColor = 'text-ink-green';
              }

              return (
                <div key={idx} className={`rounded border p-3.5 flex gap-3 text-xs leading-relaxed text-ink font-semibold items-start transition-all ${borderClass}`}>
                  <span className={`mt-0.5 shrink-0 ${iconColor}`}>
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span>{insight}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-rule rounded bg-surface/10 pt-2">
            <Info className="h-6 w-6 text-ink-muted mx-auto mb-2" />
            <p className="text-xs text-ink-muted font-medium font-serif">Add more double-entry transactions to trigger automated balancing alerts.</p>
          </div>
        )}
      </LedgerCard>

      <OnboardingModal
        isOpen={!!(user && !user.hasCompletedOnboarding)}
        onClose={() => {}}
      />
    </div>
  );
};

export default Dashboard;
