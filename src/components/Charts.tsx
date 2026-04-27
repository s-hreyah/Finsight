import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Transaction } from '../types';
import { getMonthlyStats } from '../services/ml';
import { formatCurrency } from '../lib/utils';

interface Props {
  transactions: Transaction[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Charts: React.FC<Props> = ({ transactions }) => {
  const monthlyData = useMemo(() => getMonthlyStats(transactions), [transactions]);
  
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categories: { [key: string]: number } = {};
    expenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
      {/* Monthly Cash Flow */}
      <div className="bg-[#0F1115] p-5 rounded-lg border border-gray-800">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Cash Flow Volatility</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'JetBrains Mono' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'JetBrains Mono' }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0F1115', borderRadius: '4px', border: '1px solid #374151', fontSize: '10px' }}
                itemStyle={{ fontSize: '10px' }}
                formatter={(val: number) => [formatCurrency(val), '']}
              />
              <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-[#0F1115] p-5 rounded-lg border border-gray-800">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Sector Allocation</h3>
        <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0F1115', borderRadius: '4px', border: '1px solid #374151', fontSize: '10px' }}
                        formatter={(val: number) => [formatCurrency(val), '']}
                    />
                    <Legend 
                      iconType="rect" 
                      formatter={(value) => <span className="text-[10px] uppercase text-gray-400 font-bold tracking-tighter">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
