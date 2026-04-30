export type TransactionType = 'income' | 'expense';
export type NotificationType = 'budget_alert' | 'reminder' | 'income_update' | 'system';
export type NotificationStatus = 'read' | 'unread';


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

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  status: NotificationStatus;
  userId: string;
  metadata?: any;
}
export interface Budget {
  categoryId: string;
  limit: number;
  period: 'monthly' | 'weekly';
}

