import React, { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import Papa from 'papaparse';
import { Transaction, TransactionType } from '../types';
import { categorizeMultipleTransactions } from '../services/gemini';

interface Props {
  onImport: (transactions: Omit<Transaction, 'id'>[]) => void;
  setIsProcessing: () => void;
  uid: string;
}

export const CSVUpload: React.FC<Props> = ({ onImport, setIsProcessing, uid }) => {
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsProcessing(true)
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const rawData = results.data as any[];

        // Map common CSV headers to our format
        const descriptions = rawData.map(row => row.description || row.Description || row.Name || row.name || '');
        const categories = await categorizeMultipleTransactions(descriptions);

        const transactions: Omit<Transaction, 'id'>[] = rawData.map((row, index) => {
          const amount = parseFloat(row.amount || row.Amount || row.value || row.Value || '0');
          const date = row.date || row.Date || new Date().toISOString();
          const type = ((row.type || row.Type || (amount > 0 ? 'income' : 'expense')).toLowerCase() === 'income' ? 'income' : 'expense') as TransactionType;
          const output = {
            description: descriptions[index] || 'Other',
            amount: Math.abs(amount),
            date: new Date(date).toISOString(),
            category: categories[index] || 'Other',
            userId: uid,
            type
          }
          return output
        }).filter(t => t.description && !isNaN(t.amount));
        console.log("transactions: ", transactions)
        onImport(transactions);
      }
    });
  }, [onImport]);

  return (
    <div className="relative overflow-hidden flex items-center bg-gray-800 border border-gray-700 px-4 py-1.5 rounded hover:bg-gray-700 transition-colors cursor-pointer group">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <div className="flex items-center gap-2 text-gray-300 pointer-events-none">
        <Upload size={14} />
        <span className="text-xs font-medium">Import CSV</span>
      </div>
    </div>
  );
};
