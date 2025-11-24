import React from 'react';
import { AppStats, Word } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StatsViewProps {
  stats: AppStats;
  vocab: Word[];
}

export const StatsView: React.FC<StatsViewProps> = ({ stats, vocab }) => {
  // Mock data for line chart (since we don't store full history in this simple app)
  const lineData = [
    { name: 'Mon', count: Math.floor(stats.todayLearned * 0.5) },
    { name: 'Tue', count: Math.floor(stats.todayLearned * 0.8) },
    { name: 'Wed', count: Math.floor(stats.todayLearned * 0.6) },
    { name: 'Thu', count: Math.floor(stats.todayLearned * 1.2) },
    { name: 'Fri', count: Math.floor(stats.todayLearned * 0.9) },
    { name: 'Sat', count: Math.floor(stats.todayLearned * 1.5) },
    { name: 'Sun', count: stats.todayLearned },
  ];

  const newCount = vocab.filter(w => w.srs.reps === 0).length;
  const learningCount = vocab.filter(w => w.srs.reps > 0 && w.srs.interval < 21).length;
  const masteredCount = vocab.filter(w => w.srs.interval >= 21).length;

  const pieData = [
    { name: '新词', value: newCount, color: '#e2e8f0' },
    { name: '学习中', value: learningCount, color: '#3b82f6' },
    { name: '已掌握', value: masteredCount, color: '#22c55e' },
  ];

  return (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-xl font-bold text-slate-800">学习统计</h2>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-500 mb-4">近7天学习趋势 (模拟)</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{r: 3, fill: '#2563eb'}} activeDot={{r: 5}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-500 mb-4">单词掌握度分布</h3>
        <div className="h-48 w-full flex items-center justify-center">
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={pieData}
                 cx="50%"
                 cy="50%"
                 innerRadius={60}
                 outerRadius={80}
                 paddingAngle={5}
                 dataKey="value"
                 stroke="none"
               >
                 {pieData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.color} />
                 ))}
               </Pie>
               <Tooltip />
             </PieChart>
           </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 text-xs mt-2">
          {pieData.map(d => (
            <div key={d.name} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}></div>
              <span className="text-slate-500">{d.name} ({d.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};