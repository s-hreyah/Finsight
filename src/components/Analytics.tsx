import React from 'react';
import { TrendingUp, PieChart, Layers, Brain } from 'lucide-react';
import { Transaction } from '../types';
import { predictNextMonthExpenses, clusterSpendingPatterns } from '../services/ml';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';

interface Props {
  transactions: Transaction[];
}

export const Analytics: React.FC<Props> = ({ transactions }) => {
  const prediction = predictNextMonthExpenses(transactions);
  const clusters = clusterSpendingPatterns(transactions);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Prediction Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0F1115] border border-gray-800 p-5 rounded-lg relative overflow-hidden"
      >
        <div className="relative z-10">
          <h4 className="text-[10px] font-bold text-white mb-4 flex items-center tracking-widest uppercase">
            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 scale-75 animate-pulse"></span>
            Linear Regression Forecast
          </h4>
          
          {prediction ? (
            <div>
              <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">{prediction.nextMonth} Projection</p>
              <div className="text-3xl font-mono font-bold text-white mb-4">{formatCurrency(prediction.predictedExpense)}</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500" 
                    style={{ width: `${prediction.confidence * 100}%` }} 
                  />
                </div>
                <span className="text-[9px] font-bold text-gray-500 uppercase">
                  Confidence {Math.round(prediction.confidence * 100)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-600 text-[11px] py-4 uppercase tracking-tighter">
              Insufficient Data for Model Calibration
            </div>
          )}
        </div>
      </motion.div>

      {/* Clustering Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#0F1115] border border-gray-800 p-5 rounded-lg"
      >
        <h4 className="text-[10px] font-bold text-white mb-4 uppercase tracking-widest">
          Behavioral Clusters
        </h4>

        {clusters.length > 0 ? (
          <div className="space-y-4">
            {clusters.map((cluster, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div>
                  <div className="text-[11px] font-semibold text-gray-300 group-hover:text-white transition-colors">{cluster.label}</div>
                  <div className="text-[9px] text-gray-600 uppercase font-bold">{cluster.transactions.length} Samples detected</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-medium text-white">
                    Avg. {formatCurrency(cluster.avgAmount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-600 text-[11px] py-4 uppercase tracking-tighter">
            Clustering Analysis Offline
          </div>
        )}
      </motion.div>
    </div>
  );
};
