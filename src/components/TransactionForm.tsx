import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { categorizeTransaction } from '../services/gemini';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
}

export const TransactionForm: React.FC<Props> = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as TransactionType,
    category: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let category = formData.category;
    if (!category && formData.description) {
      category = await categorizeTransaction(formData.description);
    } else if (!category) {
      category = 'Uncategorized';
    }

    onAdd({
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date,
      type: formData.type,
      category
    } as Omit<Transaction, 'id' | 'userId'>);

    setFormData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      category: ''
    });
    setIsOpen(false);
    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-1.5 bg-emerald-600 text-xs text-white rounded hover:bg-emerald-500 font-bold transition-colors"
      >
        + Manual Entry
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0F1115] border border-gray-800 rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">New Transaction</h2>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex bg-[#0A0B0D] border border-gray-800 p-1 rounded-lg">
                  {(['expense', 'income'] as TransactionType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={cn(
                        "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all",
                        formData.type === type 
                          ? "bg-gray-800 text-white shadow-sm" 
                          : "text-gray-500 hover:text-gray-400"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
                  <input
                    required
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#0A0B0D] border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    placeholder="e.g. AWS Credits"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Amount</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-[#0A0B0D] border border-gray-800 rounded px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date</label>
                    <input
                      required
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-[#0A0B0D] border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Category (Optional)</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#0A0B0D] border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    placeholder="Auto-categorize"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white text-xs py-3 rounded font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-emerald-900/20"
                >
                  {loading ? 'Analyzing...' : 'Commit to Ledger'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
