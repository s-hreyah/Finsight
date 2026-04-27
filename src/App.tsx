/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Transaction } from './types';
import { TransactionForm } from './components/TransactionForm';
import { CSVUpload } from './components/CSVUpload';
import { Analytics } from './components/Analytics';
import { Charts } from './components/Charts';
import { TransactionsTable } from './components/TransactionsTable';
import { Wallet, LogOut, LayoutDashboard, History, Settings, Bell, Loader2 } from 'lucide-react';
import { formatCurrency, cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { AuthPage } from './components/AuthPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      
      // Sort client-side by date
      setTransactions(txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => {
      console.error("Firestore Listen Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      income: totalIncome,
      expenses: totalExpenses,
      balance: totalIncome - totalExpenses
    };
  }, [transactions]);

  const handleAddTransaction = async (newTransaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        ...newTransaction,
        userId: user.uid
      });
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const handleImportTransactions = async (newTransactions: Omit<Transaction, 'id' | 'userId'>[]) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      newTransactions.forEach(t => {
        const newRef = doc(collection(db, 'transactions'));
        batch.set(newRef, { ...t, userId: user.uid });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error importing transactions:", error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-gray-300 font-sans flex overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <aside className="w-64 border-r border-gray-800 flex flex-col bg-[#0F1115] shrink-0">
        <div className="p-6">
          <h1 className="text-white font-bold tracking-tight text-xl">FINSIGHT<span className="text-emerald-500">.AI</span></h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Predictive Ledger v1.0</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'history', label: 'Transactions', icon: History },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all",
                activeTab === item.id 
                  ? "bg-gray-800 text-white" 
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden">
              {user.photoURL ? <img src={user.photoURL} alt="" /> : user.email?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.email}</p>
              <button 
                onClick={handleLogout}
                className="text-[10px] text-gray-500 hover:text-rose-400 flex items-center gap-1 transition-colors mt-0.5"
              >
                <LogOut size={10} /> Disconnect
              </button>
            </div>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg">
            <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Model Status</p>
            <p className="text-xs text-emerald-200">Regression Engine Active</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header / Global Stats */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#0A0B0D] shrink-0">
          <div className="flex space-x-12">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Net Balance</p>
              <p className="text-lg font-mono text-white">{formatCurrency(stats.balance)}</p>
            </div>
            <div className="pl-12 border-l border-gray-800">
              <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest">Monthly Income</p>
              <p className="text-lg font-mono text-white">{formatCurrency(stats.income)}</p>
            </div>
            <div className="pl-12 border-l border-gray-800">
              <p className="text-[10px] text-rose-500 uppercase font-bold tracking-widest">Total Expenses</p>
              <p className="text-lg font-mono text-white">{formatCurrency(stats.expenses)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CSVUpload onImport={handleImportTransactions} />
            <TransactionForm onAdd={handleAddTransaction} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 high-density-scrollbar">
          {activeTab === 'dashboard' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key="dashboard"
              className="max-w-7xl mx-auto"
            >
              <div className="mb-8">
                <Analytics transactions={transactions} />
                <Charts transactions={transactions} />
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Activity</h3>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest"
                  >
                    View Full Archive →
                  </button>
                </div>
                <TransactionsTable 
                  transactions={transactions.slice(0, 10)} 
                  onDelete={handleDeleteTransaction}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key="history"
              className="max-w-7xl mx-auto"
            >
               <div className="mb-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Transaction Ledger</h2>
                <p className="text-xs text-gray-500">Historical archive of all recorded financial events.</p>
              </div>
              <TransactionsTable 
                transactions={transactions} 
                onDelete={handleDeleteTransaction}
              />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
