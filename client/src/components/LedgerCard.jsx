import React from 'react';

const LedgerCard = ({ children, className = '', title, subtitle }) => {
  return (
    <div className={`bg-surface border border-rule rounded-[6px] p-5 shadow-xs transition-all ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="font-serif font-display text-base font-bold text-ink leading-tight">{title}</h3>}
          {subtitle && <p className="text-ink-muted text-[10px] uppercase font-bold tracking-wider mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export default LedgerCard;
