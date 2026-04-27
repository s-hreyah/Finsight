export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string; // ISO string
  amount: number;
  category: string;
  description: string;
  type: TransactionType;
  userId: string;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
}

export interface PredictionResult {
  nextMonth: string;
  predictedExpense: number;
  confidence: number;
}

export interface ClusterResult {
  categoryId: number;
  transactions: Transaction[];
  centroid: number[];
  label: string;
}
