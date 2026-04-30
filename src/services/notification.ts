import { db } from './firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { Notification, Budget } from '../types';

/* -------------------- REFERENCES -------------------- */

export const notificationsRef = (userId: string) =>
  query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );

export const budgetsRef = (userId: string) =>
  collection(db, 'users', userId, 'budgets');

/* -------------------- NOTIFICATIONS -------------------- */

// Real-time notifications
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Notification[];

    notifications.sort((a, b) => {
      const aTime =
        a.timestamp instanceof Timestamp
          ? a.timestamp.toMillis()
          : new Date(a.timestamp as string).getTime();

      const bTime =
        b.timestamp instanceof Timestamp
          ? b.timestamp.toMillis()
          : new Date(b.timestamp as string).getTime();

      return bTime - aTime;
    });

    callback(notifications);
  });
};

// Mark single notification
export const markNotificationAsRead = async (id: string) => {
  await updateDoc(doc(db, 'notifications', id), {
    status: 'read',
  });
};

// Mark all notifications (optimized with batch)
export const markAllNotificationsAsRead = async (userId: string) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('status', '==', 'unread')
  );

  const snapshot = await getDocs(q);

  const batch = writeBatch(db);

  snapshot.docs.forEach((d) => {
    batch.update(d.ref, { status: 'read' });
  });

  await batch.commit();
};

// Delete notification
export const deleteNotification = async (id: string) => {
  await deleteDoc(doc(db, 'notifications', id));
};

// Create notification
export const createNotification = async (data: {
  type: Notification['type'];
  title: string;
  message: string;
  userId: string;
  metadata?: any;
}) => {
  await addDoc(collection(db, 'notifications'), {
    ...data,
    status: 'unread',
    timestamp: serverTimestamp(),
  });
};

/* -------------------- BUDGETS -------------------- */
export const checkbudgetAlerts = async (
  userId: string,
  transactions: any[]
) => {
  const budgets = await getUserBudgets(userId);

  const currentMonth = new Date().toISOString().slice(0, 7);

  for (const budget of budgets) {

    const spent = transactions
      .filter((t) => {
        const isExpense = t.type === 'expense';

        const categoryMatch =
          t.category?.toLowerCase() === budget.categoryId?.toLowerCase();

        const dateMatch =
          t.date &&
          new Date(t.date).toISOString().startsWith(currentMonth);

        return isExpense && categoryMatch && dateMatch;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    if (spent > budget.limit) {

      const existing = await getDocs(
        query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          where('type', '==', 'budget_alert'),
          where('metadata.categoryId', '==', budget.categoryId)
        )
      );

      if (existing.empty) {
        await createNotification({
          type: 'budget_alert',
          title: 'Budget Exceeded',
          message: `You exceeded ${budget.categoryId} budget. Spent ₹${spent} / ₹${budget.limit}`,
          userId,
          metadata: {
            categoryId: budget.categoryId,
            limit: budget.limit,
            spent,
            period: currentMonth,
          },
        });
      }
    }
  }
};

export const getUserBudgets = async (userId: string): Promise<Budget[]> => {
  const snapshot = await getDocs(budgetsRef(userId));
  return snapshot.docs.map((d) => d.data() as Budget);
};

/* -------------------- BUDGET ALERTS -------------------- */

export const checkBudgetAlerts = async (
  userId: string,
  transactions: any[]
) => {
  const budgets = await getUserBudgets(userId);

  const currentMonth = new Date().toISOString().slice(0, 7);

  for (const budget of budgets) {
    const spent = transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.category === budget.categoryId &&
          t.date?.startsWith(currentMonth)
      )
      .reduce((sum, t) => sum + t.amount, 0);

    if (spent > budget.limit) {
      const existing = await getDocs(
        query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          where('type', '==', 'budget_alert'),
          where('metadata.categoryId', '==', budget.categoryId)
        )
      );

      if (existing.empty) {
        await createNotification({
          type: 'budget_alert',
          title: 'Budget Exceeded',
          message: `You exceeded ${budget.categoryId} budget. Spent ₹${spent} / ₹${budget.limit}`,
          userId,
          metadata: {
            categoryId: budget.categoryId,
            limit: budget.limit,
            spent,
            period: currentMonth,
          },
        });
      }
    }
  }
};

/* -------------------- EXTRA NOTIFICATIONS -------------------- */

export const createIncomeNotification = async (
  userId: string,
  amount: number,
  description: string
) => {
  await createNotification({
    type: 'income_update',
    title: 'Income Received',
    message: `${description}: ₹${amount} credited`,
    userId,
    metadata: { amount, description },
  });
};

export const createReminderNotification = async (
  userId: string,
  message: string
) => {
  await createNotification({
    type: 'reminder',
    title: 'Reminder',
    message,
    userId,
  });
};

export const createSystemNotification = async (
  userId: string,
  title: string,
  message: string,
  metadata?: any
) => {
  await createNotification({
    type: 'system',
    title,
    message,
    userId,
    metadata,
  });
};