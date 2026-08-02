import React from 'react';

const LedgerRow = ({ label, categoryName, amount, isExpense, date, description, rightElement }) => {
  const formattedAmount = isExpense 
    ? `-₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : `+₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-[12px_1fr_auto_80px] md:grid-cols-[16px_140px_1fr_100px_80px_120px] items-center gap-2 md:gap-4 py-3 border-b border-rule hover:bg-surface/40 px-3 md:px-4 transition-colors text-xs w-full">
      {/* [category-dot] */}
      <div className="flex items-center justify-center">
        <span className={`h-2 w-2 rounded-full shrink-0 ${isExpense ? 'bg-ink-red/80' : 'bg-ink-green/80'}`} />
      </div>

      {/* [category-tag] */}
      <span className="hidden md:block text-ink-muted text-[10px] uppercase font-bold tracking-wider truncate">
        {categoryName || 'General'}
      </span>

      {/* [description] */}
      <div className="flex flex-col min-w-0 pr-1 md:pr-2">
        <span className="text-ink font-semibold truncate leading-tight">{label}</span>
        <div className="flex items-center gap-1.5 mt-0.5 md:hidden">
          <span className="text-[9px] text-[#A8863C] font-bold uppercase tracking-wider truncate">
            {categoryName ? categoryName.split('|')[0] : 'General'}
          </span>
          {date && <span className="text-[9px] text-ink-muted font-mono">• {date}</span>}
        </div>
        {description && <span className="hidden md:inline text-[10px] text-ink-muted truncate mt-0.5 font-medium">{description}</span>}
      </div>

      {/* [date] */}
      <span className="hidden md:block text-[10px] text-ink-muted font-mono leading-none tabular-nums truncate">
        {date || '--'}
      </span>

      {/* [actions] */}
      <div className="flex items-center justify-center shrink-0">
        {rightElement || <div className="h-6 w-16" />}
      </div>

      {/* [amount] */}
      <span className={`tabular-nums text-right font-bold font-mono text-sm leading-none shrink-0 ${isExpense ? 'text-ink-red' : 'text-ink-green'}`}>
        {formattedAmount}
      </span>
    </div>
  );
};

export default LedgerRow;
