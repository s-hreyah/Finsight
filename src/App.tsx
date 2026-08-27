import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Transaction, Notification } from './types';
import { TransactionForm } from './components/TransactionForm';
import { CSVUpload } from './components/CSVUpload';
import { Analytics } from './components/Analytics';
import { Charts } from './components/Charts';
import { TransactionsTable } from './components/TransactionsTable';
import { LogOut, LayoutDashboard, History, Loader2, Settings, Target } from 'lucide-react';
import { formatCurrency, cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    writeBatch
} from 'firebase/firestore';

import { AuthPage } from './components/AuthPage';
import setupLocatorUI from "@locator/runtime";
import ProfilePage from './components/Profile';
import { NotificationsPanel } from './components/NotificationPanel';
import Notes from "./pages/Notes";
import GoalsPage from "./pages/GoalPage";
import { subscribeToNotifications, createIncomeNotification, createSystemNotification } from './services/notification';

export default function App() {
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // ✅ ONLY SHOW HEADER ON THESE PAGES
    const showHeader =
        location.pathname === "/" ||
        location.pathname === "/history";

    // =========================
    // AUTH
    // =========================
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const userRef = doc(db, "users", user.uid);
                const snap = await getDoc(userRef);

                let userData;

                if (!snap.exists()) {
                    userData = {
                        uid: user.uid,
                        fullname: user.displayName || "",
                        email: user.email || "",
                        phone: user.phoneNumber || "",
                        photoURL: user.photoURL || "",
                        createdAt: new Date()
                    };
                    await setDoc(userRef, userData);
                } else {
                    userData = snap.data();
                    await setDoc(userRef, { email: user.email }, { merge: true });
                }

                setUser(userData);

            } catch (err) {
                console.error(err);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // =========================
    // TRANSACTIONS
    // =========================
    useEffect(() => {
        if (!user) return;

        if (process.env.NODE_ENV === "development") setupLocatorUI();

        const q = query(
            collection(db, 'transactions'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Transaction[];

            setTransactions(
                txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            );
        });

        return () => unsubscribe();
    }, [user]);

    // =========================
    // NOTIFICATIONS
    // =========================
    useEffect(() => {
        if (!user) return;
        const unsub = subscribeToNotifications(user.uid, setNotifications);
        return () => unsub();
    }, [user]);

    // =========================
    // STATS
    // =========================
    const stats = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
        return { income, expenses, balance: income - expenses };
    }, [transactions]);

    // =========================
    // ADD TRANSACTION
    // =========================
    const handleAddTransaction = async (data: any) => {
        if (!user) return;

        const newTx = { ...data, userId: user.uid };

        await addDoc(collection(db, 'transactions'), newTx);

        if (data.type === 'income') {
            await createIncomeNotification(user.uid, data.amount, data.description);
        }

        if (data.type === 'expense') {
            await createSystemNotification(
                user.uid,
                'Expense Recorded',
                `${data.description}: ₹${data.amount} spent`,
                { amount: data.amount, description: data.description, type: 'expense' }
            );
        }

        setSuccess("Transaction added");
    };

    // =========================
    // UPDATE
    // =========================
    const handleUpdateTransaction = async (id: string, category: string) => {
        await updateDoc(doc(db, 'transactions', id), { category });
        setSuccess("Updated");
    };

    const handleDeleteTransaction = async (id: string) => {
        await deleteDoc(doc(db, 'transactions', id));
    };

    const handleLogout = () => {
        signOut(auth);
        setUser(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!user) return <AuthPage />;

    return (
        <div className="min-h-screen flex bg-[#0A0B0D] text-gray-300">

            {/* SIDEBAR */}
            <aside className="w-64 border-r border-gray-800 flex flex-col bg-[#0F1115]">
                <div className="p-6">
                    <h1 className="text-white font-bold text-xl">
                        FINSIGHT
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {[
                        { path: "/", label: "Dashboard", icon: LayoutDashboard },
                        { path: "/history", label: "Transactions", icon: History },
                        { path: "/notes", label: "Notes", icon: Settings },
                        { path: "/goals", label: "Goals", icon: Target }
                    ].map(item => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-md",
                                location.pathname === item.path
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-400 hover:bg-gray-800"
                            )}
                        >
                            <item.icon size={16} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white cursor-pointer"
                            onClick={() => navigate("/profile")}
                        >
                            {user.photoURL ? <img src={user.photoURL} /> : user.fullname?.[0]}
                        </div>
                        <div>
                            <p className="text-xs text-white">{user.fullname}</p>
                            <button onClick={handleLogout} className="text-xs text-gray-500">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN */}
            <main className="flex-1 flex flex-col">

                {/* ✅ HEADER ONLY ON DASHBOARD + HISTORY */}
                {showHeader && (
                    <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8">
                        <div className="flex gap-10">
                            <div>
                                <p className="text-xs text-gray-500">Balance</p>
                                <p className="text-white">{formatCurrency(stats.balance)}</p>
                            </div>

                            <div>
                                <p className="text-xs text-emerald-500">Income</p>
                                <p>{formatCurrency(stats.income)}</p>
                            </div>

                            <div>
                                <p className="text-xs text-rose-500">Expense</p>
                                <p>{formatCurrency(stats.expenses)}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <CSVUpload onImport={() => { }} setIsProcessing={setIsProcessing} userId={user.uid} />
                            <TransactionForm onAdd={handleAddTransaction} />
                            <NotificationsPanel notifications={notifications} userId={user.uid} />
                        </div>
                    </header>
                )}

                {/* ROUTES */}
                <div className="p-6 flex-1 overflow-y-auto">
                    <Routes>
                        <Route path="/" element={
                            <>
                                <Analytics transactions={transactions} />
                                <Charts transactions={transactions} />
                                <TransactionsTable transactions={transactions.slice(0, 10)} onDelete={handleDeleteTransaction} onUpdate={handleUpdateTransaction} />
                            </>
                        } />

                        <Route path="/history" element={
                            <TransactionsTable transactions={transactions} onDelete={handleDeleteTransaction} onUpdate={handleUpdateTransaction} />
                        } />

                        <Route path="/notes" element={<Notes />} />
                        <Route path="/goals" element={<GoalsPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                    </Routes>
                </div>

                {/* LOADER */}
                <AnimatePresence>
                    {isProcessing && (
                        <motion.div className="fixed inset-0 flex items-center justify-center bg-black/50">
                            <Loader2 className="animate-spin text-emerald-500" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {success && <div className="fixed bottom-4 right-4 bg-green-500 p-3">{success}</div>}
                {error && <div className="fixed bottom-4 right-4 bg-red-500 p-3">{error}</div>}
            </main>
        </div>
    );
}