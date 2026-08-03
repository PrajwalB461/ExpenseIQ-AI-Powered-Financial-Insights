/**
 * Validates a password against the Ledger password policy.
 * Returns an array of unmet rule messages. If valid, the array is empty.
 */
export const validatePassword = (password) => {
  const unmet = [];

  const pwd = password || '';

  if (pwd.length < 8) {
    unmet.push("Password must be at least 8 characters.");
  }
  if (!/[A-Z]/.test(pwd)) {
    unmet.push("Password must include at least one uppercase letter (A-Z).");
  }
  if (!/[a-z]/.test(pwd)) {
    unmet.push("Password must include at least one lowercase letter (a-z).");
  }
  if (!/[0-9]/.test(pwd)) {
    unmet.push("Password must include at least one number (0-9).");
  }
  if (!/[^A-Za-z0-9]/.test(pwd)) {
    unmet.push("Password must include at least one symbol (e.g. ! @ # $ % ^ & *).");
  }

  return unmet;
};
