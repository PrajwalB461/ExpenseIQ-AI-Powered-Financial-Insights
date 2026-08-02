import React from 'react';

const DateInput = ({ className = '', ...props }) => {
  return (
    <input
      type="date"
      className={`block w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand font-semibold ${className}`}
      {...props}
    />
  );
};

export default DateInput;
