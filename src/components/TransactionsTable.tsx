import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';
import { Transaction } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { format, parseISO } from 'date-fns';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export const TransactionsTable: React.FC<Props> = ({ transactions, onDelete }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(transactions.map(t => t.category)))];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                             t.category.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, search, filterType, filterCategory]);

  return (
    <div className="flex flex-col border border-gray-800 rounded-lg overflow-hidden bg-[#0F1115]">
      <div className="p-3 border-b border-gray-800 bg-gray-900/30 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
          <input
            type="text"
            placeholder="Search Ledger..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0A0B0D] border border-gray-800 rounded px-9 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-[#0A0B0D] border border-gray-800 rounded px-3 py-1.5 text-xs text-gray-400 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#0A0B0D] border border-gray-800 rounded px-3 py-1.5 text-xs text-gray-400 focus:outline-none focus:border-emerald-500/50 capitalize"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-900/50 border-b border-gray-800 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              <th className="px-5 py-3 col-span-2">Description</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-right w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredTransactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-800/30 transition-colors group text-xs">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      t.type === 'income' ? "bg-emerald-500" : "bg-gray-700"
                    )} />
                    <span className="text-white font-medium">{t.description}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                    t.type === 'income' ? "bg-emerald-900/40 text-emerald-400" : "bg-gray-800 text-gray-400"
                  )}>
                    {t.category}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500 font-mono">
                  {format(parseISO(t.date), 'yyyy.MM.dd')}
                </td>
                <td className={cn(
                  "px-5 py-3 text-right font-mono",
                  t.type === 'income' ? "text-emerald-400" : "text-white"
                )}>
                  {t.type === 'income' ? '+' : ''}{formatCurrency(t.amount)}
                </td>
                <td className="px-5 py-3 text-right">
                  <button 
                    onClick={() => onDelete(t.id)}
                    className="text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredTransactions.length === 0 && (
          <div className="py-12 text-center text-gray-600 text-[11px] uppercase tracking-widest italic">
            Ledger Empty / Buffer Null
          </div>
        )}
      </div>
    </div>
  );
};
