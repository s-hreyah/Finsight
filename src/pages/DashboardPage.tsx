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
    getDoc,
    setDoc,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { AuthPage } from './components/AuthPage';
import setupLocatorUI from "@locator/runtime";


export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const data = await fetchUserById(user.uid);
                console.log("data: ", data)
                setUser(data);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    console.log("user:from here", user)

    useEffect(() => {
        if (!error) return;

        const timer = setTimeout(() => {
            setError(null);
        }, 3000);

        return () => clearTimeout(timer);
    }, [error]);

    useEffect(() => {
        if (!success) return;

        const timer = setTimeout(() => {
            setSuccess(null);
        }, 3000);

        return () => clearTimeout(timer);
    }, [success]);
    useEffect(() => {
        if (!user) {
            setTransactions([]);
            return;
        }

        if (process.env.NODE_ENV === "development") {
            setupLocatorUI();
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
            // setIsProcessing(true);
            setError(null);
            setSuccess(null);

            await addDoc(collection(db, 'transactions'), {
                ...newTransaction,
                userId: user.uid
            });
            setSuccess("Transaction added successfully ");
        } catch (err) {
            console.error(err);
            setError("Failed to add transaction ");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImportTransactions = async (newTransactions: Omit<Transaction, 'id' | 'userId'>[]) => {
        if (!user) return;
        try {
            // setIsProcessing(true);
            setError(null);
            setSuccess(null);

            const batch = writeBatch(db);
            newTransactions.forEach(t => {
                const newRef = doc(collection(db, 'transactions'));
                batch.set(newRef, { ...t, userId: user.uid });
            });

            setSuccess("Transactions imported successfully ");
            console.log("Transactions imported successfully ")

            await batch.commit();
        } catch (error) {
            console.error("Error importing transactions:", error);
            setError("Failed to import transactions ");
        }
        finally {
            setIsProcessing(false);
        }
    };


    const fetchUserById = async (uid: string) => {
        try {
            const docRef = doc(db, "users", uid); // collection name + document ID
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log("Document data:", docSnap.data());
                return docSnap.data();
            } else {
                console.log("No such document!");
                return null;
            }
        } catch (error) {
            console.error("Error fetching document:", error);
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

        <><motion.div
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
        </>
    )
}