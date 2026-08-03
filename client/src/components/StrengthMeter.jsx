import React from 'react';

/**
 * Computes strength details based on password rules and length bonus.
 */
export const computeStrength = (password) => {
  const pwd = password || '';
  
  const lengthMet = pwd.length >= 8;
  const upperMet = /[A-Z]/.test(pwd);
  const lowerMet = /[a-z]/.test(pwd);
  const digitMet = /[0-9]/.test(pwd);
  const symbolMet = /[^A-Za-z0-9]/.test(pwd);

  const rules = [
    { key: 'length', label: 'Password must be at least 8 characters.', met: lengthMet },
    { key: 'uppercase', label: 'Password must include at least one uppercase letter (A-Z).', met: upperMet },
    { key: 'lowercase', label: 'Password must include at least one lowercase letter (a-z).', met: lowerMet },
    { key: 'digit', label: 'Password must include at least one number (0-9).', met: digitMet },
    { key: 'symbol', label: 'Password must include at least one symbol (e.g. ! @ # $ % ^ & *).', met: symbolMet },
  ];

  const rulesPassedCount = rules.filter(r => r.met).length;

  let filledSegments = 0;
  let label = 'WEAK';
  let colorVal = 'var(--ink-red)';

  if (pwd.length > 0) {
    if (rulesPassedCount <= 2) {
      filledSegments = 1;
      label = 'WEAK';
      colorVal = 'var(--ink-red)';
    } else if (rulesPassedCount === 3 || rulesPassedCount === 4) {
      filledSegments = 2;
      label = 'FAIR';
      colorVal = 'var(--warning)';
    } else if (rulesPassedCount === 5) {
      if (pwd.length >= 12) {
        filledSegments = 4;
        label = 'VERY STRONG';
        colorVal = 'var(--accent-brass)';
      } else {
        filledSegments = 3;
        label = 'STRONG';
        colorVal = 'var(--ink-green)';
      }
    }
  }

  return {
    filledSegments,
    label,
    colorVal,
    rules
  };
};

const StrengthMeter = ({ password }) => {
  const { filledSegments, label, colorVal, rules } = computeStrength(password);

  return (
    <div className="mt-3 space-y-2.5">
      {/* Visual Tick Bars and Text Label */}
      <div className="flex items-center justify-between gap-4">
        {/* ledger column tick segments */}
        <div className="flex items-center gap-1.5 w-32 shrink-0">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="flex-1 h-[6px] transition-colors duration-150"
              style={{
                backgroundColor: index < filledSegments ? colorVal : 'var(--rule)',
              }}
            />
          ))}
        </div>
        
        {/* uppercase mono eyebrow label */}
        <div 
          className="font-mono text-[9px] uppercase tracking-wider font-bold"
          style={{ color: colorVal }}
        >
          STRENGTH: {label}
        </div>
      </div>

      {/* live checklist with met/unmet glyphs */}
      <div className="space-y-1 font-mono text-[9px] text-ink-muted">
        {rules.map((rule) => (
          <div key={rule.key} className="flex items-center gap-1.5 transition-colors duration-150">
            <span 
              className="font-bold inline-block w-3 text-center"
              style={{ color: rule.met ? 'var(--ink-green)' : 'var(--ink-muted)' }}
            >
              {rule.met ? '✓' : '✗'}
            </span>
            <span 
              className="font-semibold transition-colors duration-150"
              style={{ color: rule.met ? 'var(--ink)' : 'var(--ink-muted)' }}
            >
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrengthMeter;
