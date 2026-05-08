'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export default function AnalyticsDashboard() {
  const { history } = useGameStore();

  if (history.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-border/50 rounded-sm bg-background/30 text-muted-foreground italic">
        Insufficient telemetry data. Complete a session to generate analytics.
      </div>
    );
  }

  // Prepare trend data
  const trendData = history.slice(0, 10).reverse().map((s, idx) => ({
    name: `S${idx + 1}`,
    score: s.score,
    accuracy: s.accuracy,
  }));

  // Prepare category data
  const categoryStats: Record<string, { total: number, correct: number }> = {};
  history.forEach(session => {
    session.questions.forEach((q: any) => {
      if (!categoryStats[q.type]) {
        categoryStats[q.type] = { total: 0, correct: 0 };
      }
      categoryStats[q.type].total++;
      if (q.correct) categoryStats[q.type].correct++;
    });
  });

  const barData = Object.entries(categoryStats).map(([type, stats]) => ({
    type: type.toUpperCase(),
    accuracy: Math.round((stats.correct / stats.total) * 100),
  }));

  return (
    <div className="space-y-8">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#666" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#666" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', fontSize: '12px' }}
              itemStyle={{ color: '#00ffcc' }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#00ffcc" 
              strokeWidth={2} 
              dot={{ fill: '#00ffcc', r: 4 }} 
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="terminal-card">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Accuracy by Category</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis 
                  dataKey="type" 
                  type="category" 
                  stroke="#666" 
                  fontSize={8} 
                  width={80}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', fontSize: '10px' }}
                />
                <Bar dataKey="accuracy" radius={[0, 2, 2, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.accuracy > 80 ? '#00ffcc' : '#ff9900'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="terminal-card">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Volume Statistics</h4>
          <div className="space-y-3">
            <StatRow label="Total Samples" value={history.reduce((acc, s) => acc + s.totalQuestions, 0)} />
            <StatRow label="Avg Accuracy" value={`${(history.reduce((acc, s) => acc + s.accuracy, 0) / history.length).toFixed(1)}%`} />
            <StatRow label="Consistency" value="High" color="text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color = "text-foreground" }: { label: string, value: string | number, color?: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}
