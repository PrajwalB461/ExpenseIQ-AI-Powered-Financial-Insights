import React, { useState } from 'react';
import { Percent, Calendar, DollarSign, Calculator } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const EMI = () => {
  const [principal, setPrincipal] = useState(50000);
  const [rate, setRate] = useState(7.5);
  const [tenure, setTenure] = useState(36); // In months

  // EMI Formula: [P x R x (1+R)^N]/[((1+R)^N)-1]
  const calculateEMI = () => {
    const monthlyRate = rate / 12 / 100;
    const P = principal;
    const R = monthlyRate;
    const N = tenure;

    if (rate === 0) return (P / N).toFixed(2);

    const emiValue = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    return isNaN(emiValue) ? '0.00' : emiValue.toFixed(2);
  };

  const emi = Number(calculateEMI());
  const totalPayment = emi * tenure;
  const totalInterest = Math.max(totalPayment - principal, 0);

  const chartData = [
    { name: 'Principal Loan Amount', value: principal, color: '#6366f1' },
    { name: 'Total Interest Payable', value: Math.round(totalInterest), color: '#06b6d4' }
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-3 animate-fade-in">
      {/* Parameter Sliders Panel */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm h-fit space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-bold text-white">EMI Calculator</h2>
        </div>
        <p className="text-xs text-slate-400 font-medium">Model loan repayment, interest values and monthly payout schedules</p>

        {/* Principal Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-405 text-slate-400">Loan Amount (P)</span>
            <span className="text-white">${principal.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="5000"
            max="500000"
            step="5000"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-violet-500 bg-slate-800"
          />
          <div className="flex justify-between text-[9px] text-slate-550 text-slate-500 font-extrabold">
            <span>$5K</span>
            <span>$250K</span>
            <span>$500K</span>
          </div>
        </div>

        {/* Rate of Interest Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-405 text-slate-400">Annual Interest Rate (R)</span>
            <span className="text-white">{rate}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-violet-500 bg-slate-800"
          />
          <div className="flex justify-between text-[9px] text-slate-550 text-slate-500 font-extrabold">
            <span>1%</span>
            <span>10%</span>
            <span>20%</span>
          </div>
        </div>

        {/* Tenure Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-405 text-slate-400">Tenure (Duration)</span>
            <span className="text-white">{tenure} Months ({Math.round(tenure / 12 * 10) / 10} yrs)</span>
          </div>
          <input
            type="range"
            min="6"
            max="120"
            step="6"
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-violet-500 bg-slate-800"
          />
          <div className="flex justify-between text-[9px] text-slate-550 text-slate-500 font-extrabold">
            <span>6 M</span>
            <span>60 M</span>
            <span>120 M</span>
          </div>
        </div>
      </div>

      {/* Analytics outputs panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Results grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-805 bg-slate-900/30 p-5 border-slate-800 text-center">
            <h4 className="text-[10px] font-bold text-slate-550 uppercase tracking-widest text-slate-500">Monthly EMI Payout</h4>
            <span className="text-2xl font-black text-violet-400 mt-2 block">${emi.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="rounded-2xl border border-slate-805 bg-slate-900/30 p-5 border-slate-800 text-center">
            <h4 className="text-[10px] font-bold text-slate-550 uppercase tracking-widest text-slate-500">Principal Amount</h4>
            <span className="text-2xl font-black text-slate-200 mt-2 block">${principal.toLocaleString()}</span>
          </div>
          <div className="rounded-2xl border border-slate-805 bg-slate-900/30 p-5 border-slate-800 text-center">
            <h4 className="text-[10px] font-bold text-slate-550 uppercase tracking-widest text-slate-500">Total Capital Cost</h4>
            <span className="text-2xl font-black text-cyan-405 text-cyan-400 mt-2 block">${totalPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Graphical visual allocation of loan components */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm grid gap-6 md:grid-cols-2 items-center">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Payment Breakdown</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Interest payment constitutes <span className="text-cyan-400">{(totalInterest / totalPayment * 100).toFixed(1)}%</span> of your total capital commitment of ${Math.round(totalPayment).toLocaleString()}.
            </p>

            <div className="space-y-2 border-t border-slate-800 pt-4 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-405 text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Principal
                </span>
                <span className="text-slate-200">${principal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-405 text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-cyan-500"></span> Compounded Interest
                </span>
                <span className="text-cyan-400">${Math.round(totalInterest).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Recharts Pie Rep */}
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b', 
                    borderRadius: '12px',
                    fontSize: '11px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EMI;
