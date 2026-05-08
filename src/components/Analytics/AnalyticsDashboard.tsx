'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { buildPerformanceComparison, computeAdvancedAnalytics, computeDifficultyWeightedMetrics, groupAttemptsByPrompt } from '@/lib/adaptive';
import { 
  ComposedChart,
  LineChart,
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine
} from 'recharts';

export default function AnalyticsDashboard() {
  const { history, concentrationHistory } = useGameStore();
  const advanced = computeAdvancedAnalytics(history);
  const latest = history[0];
  const latestWeighted = latest
    ? computeDifficultyWeightedMetrics(
        latest.questions,
        Math.max((latest.endTime - latest.startTime) / 1000, 1)
      )
    : null;

  if (history.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-border/50 rounded-sm bg-background/30 text-muted-foreground italic">
        Insufficient telemetry data. Complete a session to generate analytics.
      </div>
    );
  }

  // Prepare trend data
  const trendData = history.slice(0, 10).reverse().map((s, idx) => buildPerformanceComparison(s, idx));
  const trendDataWithScore = history.slice(0, 10).reverse().map((s, idx) => {
    const base = buildPerformanceComparison(s, idx);
    return {
      ...base,
      rawScore: s.score,
    };
  });

  // Prepare category data
  const categoryStats: Record<string, { total: number, firstPassCorrect: number }> = {};
  history.forEach(session => {
    const grouped = groupAttemptsByPrompt(session.questions);
    grouped.forEach((group) => {
      if (!categoryStats[group.type]) {
        categoryStats[group.type] = { total: 0, firstPassCorrect: 0 };
      }
      categoryStats[group.type].total++;
      if (group.firstAttemptCorrect) categoryStats[group.type].firstPassCorrect++;
    });
  });

  const barData = Object.entries(categoryStats).map(([type, stats]) => ({
    type: type.toUpperCase(),
    firstPass: Math.round((stats.firstPassCorrect / stats.total) * 100),
  }));
  const concentrationBest = concentrationHistory.length > 0
    ? Math.min(...concentrationHistory.map((s) => s.totalMs))
    : null;
  const concentrationMedian = concentrationHistory.length > 0
    ? [...concentrationHistory.map((s) => s.totalMs)].sort((a, b) => a - b)[Math.floor(concentrationHistory.length / 2)]
    : null;
  const concentrationAvg = concentrationHistory.length > 0
    ? concentrationHistory.reduce((sum, s) => sum + s.totalMs, 0) / concentrationHistory.length
    : null;
  const concentrationTrend = concentrationHistory
    .slice(0, 12)
    .reverse()
    .map((s, idx) => ({
      name: `C${idx + 1}`,
      totalMs: s.totalMs,
      totalSec: parseFloat((s.totalMs / 1000).toFixed(1)),
      misclicks: s.misclickCount,
      slowdown: parseFloat(s.slowdownIndex.toFixed(1)),
    }));
  const avgMisclicks = concentrationHistory.length > 0
    ? concentrationHistory.reduce((sum, s) => sum + s.misclickCount, 0) / concentrationHistory.length
    : null;
  const avgSlowdown = concentrationHistory.length > 0
    ? concentrationHistory.reduce((sum, s) => sum + s.slowdownIndex, 0) / concentrationHistory.length
    : null;
  const concentrationRangeAverages = Array.from({ length: 10 }, (_, i) => {
    const label = `${i * 10}-${i * 10 + 9}`;
    let total = 0;
    let count = 0;
    concentrationHistory.forEach((session) => {
      const totals = session.rangeBandTotalsMs;
      const counts = session.rangeBandCounts;
      if (!totals || !counts || totals.length < 10 || counts.length < 10) {
        const arr = session.rangeBandAveragesMs;
        if (!arr || arr.length < 10) return;
        const value = arr[i];
        const bandCount = value > 0 ? 1 : 0;
        total += value * bandCount;
        count += bandCount;
        return;
      }
      const bandCount = counts[i] ?? 0;
      const bandTotal = totals[i] ?? 0;
      if (bandCount > 0) {
        total += bandTotal;
        count += bandCount;
      }
    });
    return {
      range: label,
      avgMs: count > 0 ? total / count : 0,
      avgSec: count > 0 ? parseFloat((total / count / 1000).toFixed(2)) : 0,
    };
  });

  return (
    <div className="space-y-8">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trendDataWithScore}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#666" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              yAxisId="count"
              orientation="left"
              stroke="#666" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              label={{ value: 'Score (count)', angle: -90, position: 'insideLeft', fill: '#666', fontSize: 10 }}
            />
            <YAxis 
              yAxisId="percent"
              orientation="right"
              stroke="#666" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              domain={[0, 100]}
              label={{ value: 'Benchmark (%)', angle: -90, position: 'insideRight', fill: '#666', fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', fontSize: '12px' }}
              itemStyle={{ color: '#00ffcc' }}
              formatter={(value, name, item) => {
                const payload = item?.payload as {
                  benchmarkGap: number;
                  difficultyBands: { easy: number; medium: number; hard: number };
                };
                if (name === 'Your Score (count)') return [`${value}`, name];
                if (name === 'Benchmark Gap') {
                  const v = typeof value === 'number' ? value : Number(value ?? 0);
                  return [`${v > 0 ? '+' : ''}${v.toFixed(1)}%`, 'Benchmark Gap'];
                }
                return [`${value}%`, name];
              }}
              labelFormatter={(label, payload) => {
                const p = payload?.[0]?.payload as {
                  benchmarkGap: number;
                  difficultyBands: { easy: number; medium: number; hard: number };
                } | undefined;
                if (!p) return `Session: ${label}`;
                const gap = `${p.benchmarkGap > 0 ? '+' : ''}${p.benchmarkGap.toFixed(1)}%`;
                return `Session: ${label} | Gap: ${gap} | Mix E:${p.difficultyBands.easy} M:${p.difficultyBands.medium} H:${p.difficultyBands.hard}`;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <ReferenceLine yAxisId="percent" y={85} stroke="#ff9900" strokeDasharray="4 4" />
            <Bar
              yAxisId="count"
              dataKey="rawScore"
              fill="#60a5fa"
              radius={[2, 2, 0, 0]}
              name="Your Score (count)"
            />
            <Line 
              yAxisId="percent"
              type="monotone" 
              dataKey="eliteBenchmark" 
              stroke="#00ffcc" 
              strokeWidth={2} 
              dot={{ fill: '#00ffcc', r: 4 }} 
              activeDot={{ r: 6, strokeWidth: 0 }}
              name="Elite Benchmark (%)"
            />
            <Line
              yAxisId="percent"
              type="monotone"
              dataKey="scoreTrend"
              stroke="#1d4ed8"
              strokeWidth={2}
              dot={{ fill: '#1d4ed8', r: 3 }}
              name="Your Score Trend (%)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-6">
        Weighted score uses band-based difficulty multipliers: Easy (&lt;0.9) 0.80x, Medium (0.9-1.4) 1.00x, Hard (&gt;1.4) 1.25x.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="terminal-card">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">First-Pass Precision by Category</h4>
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
                <Bar dataKey="firstPass" radius={[0, 2, 2, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.firstPass > 80 ? '#00ffcc' : '#ff9900'} />
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
            <StatRow label="Avg First-Pass %" value={`${(history.reduce((acc, s) => acc + (s.firstPassPrecision ?? s.accuracy), 0) / history.length).toFixed(1)}%`} />
            <StatRow label="Latest Avg Difficulty" value={latestWeighted ? latestWeighted.avgDifficulty : '-'} />
            <StatRow label="Weighted First-Pass %" value={latestWeighted ? `${latestWeighted.weightedFirstPassPrecision}%` : '-'} />
            <StatRow label="Attempt Efficiency" value={latestWeighted ? `${latestWeighted.attemptEfficiency}%` : '-'} />
            <StatRow label="Recovery Cost" value={latestWeighted ? `${latestWeighted.recoveryCostIndex}` : '-'} />
            <StatRow label="Weighted Benchmark" value={latestWeighted ? `${latestWeighted.weightedBenchmark}%` : '-'} color="text-secondary" />
            <StatRow label="Plateau Alert" value={advanced.plateauFlag ? 'Yes' : 'No'} color={advanced.plateauFlag ? 'text-accent' : 'text-primary'} />
          </div>
        </div>
      </div>

      <div className="terminal-card">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Concentration Grid Diagnostics</h4>
        {concentrationHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No concentration runs recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <StatRow label="Sessions" value={concentrationHistory.length} />
            <StatRow label="Best Time" value={formatMs(concentrationBest ?? 0, true)} color="text-primary" />
            <StatRow label="Median Time" value={formatMs(concentrationMedian ?? 0, true)} />
          </div>
        )}
        {concentrationHistory.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={concentrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', fontSize: '11px' }}
                    formatter={(value, key) => {
                      const numeric = typeof value === 'number' ? value : Number(value ?? 0);
                      if (key === 'totalSec') return [`${formatMs(numeric * 1000, true)}`, 'Completion'];
                      if (key === 'misclicks') return [`${numeric}`, 'Misclicks'];
                      return [`${numeric}%`, 'Slowdown'];
                    }}
                  />
                  <Line type="monotone" dataKey="totalSec" stroke="#00ffcc" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <StatRow label="Average Time" value={formatMs(concentrationAvg ?? 0, true)} />
              <StatRow label="Avg Misclicks" value={avgMisclicks ? avgMisclicks.toFixed(1) : '0.0'} />
              <StatRow label="Avg Slowdown" value={`${avgSlowdown ? avgSlowdown.toFixed(1) : '0.0'}%`} />
              <StatRow
                label="Latest Recovery"
                value={formatMs(concentrationHistory[0]?.recoveryAfterErrorMs ?? 0, true)}
              />
            </div>
          </div>
        )}
        {concentrationHistory.length > 0 && (
          <div className="mt-5">
            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Average Time By Number Range
            </h5>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={concentrationRangeAverages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="range" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', fontSize: '11px' }}
                    formatter={(value) => {
                      const numeric = typeof value === 'number' ? value : Number(value ?? 0);
                      return [`${formatMs(numeric * 1000, true)}`, 'Average Time'];
                    }}
                  />
                  <Bar dataKey="avgSec" fill="#34d399" radius={[2, 2, 0, 0]} name="Weighted Avg Time By Range" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="terminal-card">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Weakness Heatmap (Top Buckets)</h4>
          <div className="space-y-2">
            {advanced.weakness.length > 0 ? advanced.weakness.map((row) => (
              <div key={row.type} className="flex items-center justify-between text-sm border border-border/40 rounded-sm px-3 py-2">
                <span className="uppercase tracking-wide">{row.type}</span>
                <span className="font-mono">{row.weakness}</span>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground italic">Complete more sessions to build weak-point heatmap.</p>
            )}
          </div>
        </div>

        <div className="terminal-card">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Most Expensive Mistakes</h4>
          <div className="space-y-2">
            {advanced.expensiveMistakes.length > 0 ? advanced.expensiveMistakes.map((row, idx) => (
              <div key={`${row.question}-${idx}`} className="text-xs border border-border/40 rounded-sm px-3 py-2">
                <p className="font-mono">{row.question}</p>
                <p className="text-muted-foreground mt-1">{row.type.toUpperCase()} | Misses: {row.misses} | Time Lost: {row.timeLostSec}s</p>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground italic">No expensive mistakes identified yet.</p>
            )}
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

function formatMs(ms: number, withTenths = false) {
  const totalSeconds = Math.max(ms, 0) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  if (withTenths) {
    return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
  }
  return `${minutes}:${Math.floor(seconds).toString().padStart(2, '0')}`;
}
