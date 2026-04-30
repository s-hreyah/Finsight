import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Transaction } from './types';
import { TransactionForm } from './components/TransactionForm';
import { CSVUpload } from './components/CSVUpload';
import { Analytics } from './components/Analytics';
import { Charts } from './components/Charts';
import { TransactionsTable } from './components/TransactionsTable';
import { LogOut, LayoutDashboard, History, Settings, Loader2 } from 'lucide-react';
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
    writeBatch
} from 'firebase/firestore';
import { AuthPage } from './components/AuthPage';
import setupLocatorUI from "@locator/runtime";
import ProfilePage from './components/Profile';

export default function App() {
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                let userData;

                if (!userSnap.exists()) {
                    
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
                    
                    userData = userSnap.data();

                    
                    await setDoc(userRef, {
                        ...userData,
                        email: user.email,
                    }, { merge: true });
                }

                setUser(userData);

            } catch (err) {
                console.error(err);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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

    const stats = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
        return { income, expenses, balance: income - expenses };
    }, [transactions]);

    const fetchUserById = async (uid: string) => {
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : null;
    };

    const handleAddTransaction = async (data: any) => {
        if (!user) return;
        await addDoc(collection(db, 'transactions'), { ...data, userId: user.uid });
        setSuccess("Transaction added ");
    };

    const handleDeleteTransaction = async (id: string) => {
        await deleteDoc(doc(db, 'transactions', id));
    };

    const handleImportTransactions = async (txs: any[]) => {
        if (!user) return;
        const batch = writeBatch(db);
        txs.forEach(t => {
            const ref = doc(collection(db, 'transactions'));
            batch.set(ref, { ...t, userId: user.uid });
        });
        await batch.commit();
        setSuccess("Imported ");
    };

    const handleLogout = () => {
        signOut(auth)
        setUser(null)
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
                    <h1 className="text-white font-bold text-xl">FINSIGHT<span className="text-emerald-500">.AI</span></h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {[
                        { path: "/", label: "Dashboard", icon: LayoutDashboard },
                        { path: "/history", label: "Transactions", icon: History }
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

                <div className="p-4 border-t border-gray-800 space-y-4">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden cursor-pointer" onClick={() => navigate("profile")}>
                            {user.photoURL ? <img src={user.photoURL} alt="" /> : user.fullname?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{user.fullname}</p>
                            <button
                                onClick={handleLogout}
                                className="text-[10px] text-gray-500 hover:text-rose-400 flex items-center gap-1 transition-colors mt-0.5"
                            >
                                <LogOut size={10} /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </aside >

            {/* MAIN */}
            < main className="flex-1 flex flex-col h-screen overflow-hidden" >

                {/* TOP BAR */}
                <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#0A0B0D] shrink-0" >
                    <div className="flex space-x-12">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Net Balance</p>
                            <p className="text-lg font-mono text-white">{formatCurrency(stats.balance)}</p>
                        </div>
                        <div className="pl-12 border-l border-gray-800">
                            <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest">Total Income</p>
                            <p className="text-lg font-mono text-white">{formatCurrency(stats.income)}</p>
                        </div>
                        <div className="pl-12 border-l border-gray-800">
                            <p className="text-[10px] text-rose-500 uppercase font-bold tracking-widest">Total Expenses</p>
                            <p className="text-lg font-mono text-white">{formatCurrency(stats.expenses)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <CSVUpload onImport={handleImportTransactions} setIsProcessing={setIsProcessing} userId={user.uid} />
                        <TransactionForm onAdd={handleAddTransaction} />
                    </div>
                </header>

                {/* ROUTES CONTENT */}
                <div div className="flex-1 p-6 overflow-y-auto" >
                    <Routes>

                        {/* Dashboard */}
                        <Route path="/" element={
                            <>
                                <Analytics transactions={transactions} />
                                <Charts transactions={transactions} />
                                <TransactionsTable
                                    transactions={transactions.slice(0, 10)}
                                    onDelete={handleDeleteTransaction}
                                />
                            </>
                        } />

                        {/* History */}
                        <Route path="/history" element={
                            <TransactionsTable
                                transactions={transactions}
                                onDelete={handleDeleteTransaction}
                            />
                        } />

                        {/* Profile */}
                        <Route path="/profile" element={<ProfilePage />} />

                    </Routes>
                </div>

                {/* LOADER */}
                <AnimatePresence>
                    {
                        isProcessing && (
                            <motion.div className="fixed inset-0 flex items-center justify-center bg-black/50">
                                <Loader2 className="animate-spin text-emerald-500" />
                            </motion.div>
                        )
                    }
                </AnimatePresence >

                {/* TOASTS */}
                {error && <div className="fixed bottom-4 right-4 bg-red-500 p-3">{error}</div>}
                {success && <div className="fixed bottom-4 right-4 bg-green-500 p-3">{success}</div>}

            </main >
        </div >
    );
}