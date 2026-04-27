import * as ss from 'simple-statistics';
import { kmeans } from 'ml-kmeans';
import { Transaction, MonthlyStats, PredictionResult } from '../types';
import { format, parseISO, startOfMonth } from 'date-fns';

export function predictNextMonthExpenses(transactions: Transaction[]): PredictionResult | null {
  const expenses = transactions.filter(t => t.type === 'expense');
  if (expenses.length === 0) return null;

  // Group by month
  const monthlyTotals: { [key: string]: number } = {};
  expenses.forEach(t => {
    const month = format(parseISO(t.date), 'yyyy-MM');
    monthlyTotals[month] = (monthlyTotals[month] || 0) + t.amount;
  });

  const sortedMonths = Object.keys(monthlyTotals).sort();
  if (sortedMonths.length < 2) return null;

  // Convert months to indices (0, 1, 2...) for regression
  const data = sortedMonths.map((month, index) => [index, monthlyTotals[month]]);
  
  const line = ss.linearRegression(data);
  const nextIndex = sortedMonths.length;
  const predictedValue = Math.max(0, ss.linearRegressionLine(line)(nextIndex));

  // Calc next month string
  const lastDate = parseISO(sortedMonths[sortedMonths.length - 1] + '-01');
  const nextMonthDate = new Date(lastDate.setMonth(lastDate.getMonth() + 1));
  const nextMonthStr = format(nextMonthDate, 'MMMM yyyy');

  return {
    nextMonth: nextMonthStr,
    predictedExpense: predictedValue,
    confidence: Math.abs(line.m) < 0.1 ? 0.9 : 0.7 // Simple heuristic for now
  };
}

export function clusterSpendingPatterns(transactions: Transaction[]) {
  const expenses = transactions.filter(t => t.type === 'expense');
  if (expenses.length < 5) return [];

  // Feature engineering: simple [amount] for now
  const data = expenses.map(t => [t.amount]);
  
  const k = Math.min(3, expenses.length);
  const clusters = kmeans(data, k, {});

  const results = Array.from({ length: k }, (_, i) => ({
    label: '',
    transactions: [] as Transaction[],
    avgAmount: 0
  }));

  clusters.clusters.forEach((clusterIdx, itemIdx) => {
    results[clusterIdx].transactions.push(expenses[itemIdx]);
  });

  // Name clusters based on avg amount
  results.forEach(res => {
    res.avgAmount = res.transactions.reduce((acc, t) => acc + t.amount, 0) / res.transactions.length;
  });

  results.sort((a, b) => a.avgAmount - b.avgAmount);
  
  results[0].label = 'Small Daily Spends';
  if (results[1]) results[1].label = 'Regular Expenses';
  if (results[2]) results[2].label = 'High Impact Spends';

  return results;
}

export function getMonthlyStats(transactions: Transaction[]): MonthlyStats[] {
  const statsMap: { [key: string]: { income: number; expenses: number } } = {};
  
  transactions.forEach(t => {
    const month = format(parseISO(t.date), 'MMM yyyy');
    if (!statsMap[month]) statsMap[month] = { income: 0, expenses: 0 };
    
    if (t.type === 'income') {
      statsMap[month].income += t.amount;
    } else {
      statsMap[month].expenses += t.amount;
    }
  });

  return Object.entries(statsMap).map(([month, data]) => ({
    month,
    ...data
  })).sort((a, b) => {
    // Sort by date effectively
    return new Date(a.month).getTime() - new Date(b.month).getTime();
  });
}
