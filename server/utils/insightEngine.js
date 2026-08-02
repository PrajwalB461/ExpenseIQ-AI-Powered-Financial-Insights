/**
 * Generates rule-based financial insights from expense distributions.
 * @param {Array} expenses - Current period expenses.
 * @param {Array} prevExpenses - Previous equivalent period expenses.
 * @returns {Array<String>} Array of readable sentences.
 */
export const generateInsights = (expenses, prevExpenses) => {
  const insights = [];

  // Insight 1: Top 3 spending categories with amounts
  const categoryMap = {};
  expenses.forEach(exp => {
    const catName = exp.categoryId?.name || 'Other';
    categoryMap[catName] = (categoryMap[catName] || 0) + exp.amount;
  });

  const sortedCategories = Object.keys(categoryMap)
    .map(name => ({ name, amount: categoryMap[name] }))
    .sort((a, b) => b.amount - a.amount);

  if (sortedCategories.length > 0) {
    const top3 = sortedCategories.slice(0, 3)
      .map(c => `${c.name} (₹${c.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})`)
      .join(', ');
    insights.push(`Your top spending categories this period are: ${top3}.`);
  } else {
    insights.push('No expenses recorded in this period yet to identify top categories.');
  }

  // Insight 2: % change in total spend vs previous equivalent period
  const currentTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const prevTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (prevTotal > 0) {
    const pctChange = ((currentTotal - prevTotal) / prevTotal) * 100;
    if (pctChange > 0) {
      insights.push(`Your total spending increased by ${pctChange.toFixed(1)}% compared to the previous equivalent period (₹${currentTotal.toLocaleString('en-IN')} vs ₹${prevTotal.toLocaleString('en-IN')}).`);
    } else if (pctChange < 0) {
      insights.push(`Great job! Your total spending decreased by ${Math.abs(pctChange).toFixed(1)}% compared to the previous equivalent period (₹${currentTotal.toLocaleString('en-IN')} vs ₹${prevTotal.toLocaleString('en-IN')}).`);
    } else {
      insights.push(`Your total spending is unchanged compared to the previous period (₹${currentTotal.toLocaleString('en-IN')}).`);
    }
  } else if (currentTotal > 0) {
    insights.push(`No comparison data available from the previous equivalent period, but you logged ₹${currentTotal.toLocaleString('en-IN')} in outflows for the current period.`);
  }

  // Insight 3: Projected month-end total (based on average daily spend so far this month * days remaining)
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); 
  const startOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const currentDay = now.getDate();

  // Find expenses belonging strictly to this month
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= startOfMonth && d <= now;
  });

  const thisMonthSpend = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  if (thisMonthSpend > 0) {
    const avgDailySpend = thisMonthSpend / currentDay;
    const projectedMonthEnd = avgDailySpend * daysInMonth;
    const remainingDays = daysInMonth - currentDay;
    insights.push(`Based on your average daily spend of ₹${avgDailySpend.toFixed(0)} so far this month (${currentDay} days elapsed), your projected month-end spend is ₹${projectedMonthEnd.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (with ${remainingDays} days remaining).`);
  }

  // Insight 4: Flag if any single transaction this period is more than 2x the category's average transaction size
  const categoryCounts = {};
  expenses.forEach(exp => {
    const catName = exp.categoryId?.name || 'Other';
    if (!categoryCounts[catName]) {
      categoryCounts[catName] = { count: 0, sum: 0 };
    }
    categoryCounts[catName].count += 1;
    categoryCounts[catName].sum += exp.amount;
  });

  const categoryAverages = {};
  Object.keys(categoryCounts).forEach(cat => {
    categoryAverages[cat] = categoryCounts[cat].sum / categoryCounts[cat].count;
  });

  const anomalies = [];
  expenses.forEach(exp => {
    const catName = exp.categoryId?.name || 'Other';
    const avg = categoryAverages[catName];
    // Anomaly condition: single transaction amount is > 2x average AND we have at least 2 transactions in this class to make averages meaningful
    if (categoryCounts[catName].count >= 2 && exp.amount > 2 * avg) {
      anomalies.push(`₹${exp.amount.toLocaleString('en-IN')} on ${new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} in "${catName}"`);
    }
  });

  if (anomalies.length > 0) {
    insights.push(`⚠️ Anomaly detected: The following transactions exceeded their category averages by more than 2x: ${anomalies.slice(0, 2).join('; ')}.`);
  }

  return insights;
};
