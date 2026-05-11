'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameStore, ConcentrationSession } from '@/store/useGameStore';
import { Clock, Target, X, AlertTriangle, Trophy } from 'lucide-react';

type GridCell = {
  value: number;
  row: number;
  col: number;
};

type CorrectEvent = {
  value: number;
  ts: number;
  row: number;
  col: number;
};

const GRID_SIZE = 10;
const GRID_TOTAL = GRID_SIZE * GRID_SIZE;
const START_VALUE = 0;

function shuffle(values: number[]) {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export default function ConcentrationGridMode({ onExit }: { onExit: () => void }) {
  const { addConcentrationSession } = useGameStore();
  const [phase, setPhase] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [mode, setMode] = useState<'sequential' | 'random'>('sequential');
  const [concurrentNumbers, setConcurrentNumbers] = useState(3);
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [nextExpected, setNextExpected] = useState(START_VALUE);
  const [targetSequence, setTargetSequence] = useState<number[]>([]);
  const [sequenceProgress, setSequenceProgress] = useState(0);
  const [rangeStart, setRangeStart] = useState(START_VALUE);
  const [rangeEnd, setRangeEnd] = useState(GRID_TOTAL - 1);
  const [misclickCount, setMisclickCount] = useState(0);
  const [misclickEvents, setMisclickEvents] = useState<Array<{ ts: number; row: number; col: number }>>([]);
  const [correctEvents, setCorrectEvents] = useState<CorrectEvent[]>([]);
  const [lastWrongCell, setLastWrongCell] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [summary, setSummary] = useState<null | ConcentrationSession>(null);

  const startTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== 'playing') {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = () => {
      setElapsedMs(Date.now() - startTimeRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [phase]);

  const generateRandomTarget = (n: number) => {
    const start = Math.floor(Math.random() * (GRID_TOTAL - n));
    return Array.from({ length: n }, (_, i) => start + i);
  };

  const startSession = () => {
    const shuffled = shuffle(Array.from({ length: GRID_TOTAL }, (_, i) => i));
    const built = shuffled.map((value, idx) => ({
      value,
      row: Math.floor(idx / GRID_SIZE),
      col: idx % GRID_SIZE,
    }));
    
    const normalizedStart = Math.max(START_VALUE, Math.min(rangeStart, GRID_TOTAL - 1));
    const normalizedEnd = Math.max(normalizedStart, Math.min(rangeEnd, GRID_TOTAL - 1));
    
    setRangeStart(normalizedStart);
    setRangeEnd(normalizedEnd);
    setGrid(built);
    setMisclickCount(0);
    setMisclickEvents([]);
    setCorrectEvents([]);
    setLastWrongCell(null);
    setSummary(null);
    setElapsedMs(0);
    startTimeRef.current = Date.now();
    
    if (mode === 'sequential') {
      setNextExpected(normalizedStart);
    } else {
      const seq = generateRandomTarget(concurrentNumbers);
      setTargetSequence(seq);
      setSequenceProgress(0);
    }
    
    setPhase('playing');
  };

  const finishSession = (events: CorrectEvent[], endTime: number) => {
    const totalMs = endTime - startTimeRef.current;
    const splitTimesMs = buildDecileSplits(events, startTimeRef.current, endTime);
    const rangeBandStats = buildRangeBandStats(events, startTimeRef.current);
    const transitions = buildTransitions(events, startTimeRef.current);
    const slowTransitions = [...transitions].sort((a, b) => b.ms - a.ms).slice(0, 8);
    const slowdownIndex = computeSlowdownIndex(events, startTimeRef.current, endTime);
    const spatialInefficiency = computeSpatialInefficiency(events);
    const recoveryAfterErrorMs = computeRecoveryAfterError(events, misclickEvents);
    const primaryBottlenecks = deriveBottlenecks({
      misclickCount,
      slowdownIndex,
      spatialInefficiency,
      slowTransitions,
      recoveryAfterErrorMs,
      totalMs,
    });

    const payload: ConcentrationSession = {
      id: `cg_${Date.now()}`,
      startTime: startTimeRef.current,
      endTime,
      totalMs,
      mode,
      concurrentNumbers: mode === 'random' ? concurrentNumbers : undefined,
      rangeStart: mode === 'sequential' ? rangeStart : undefined,
      rangeEnd: mode === 'sequential' ? rangeEnd : undefined,
      misclickCount,
      splitTimesMs,
      rangeBandAveragesMs: rangeBandStats.averages,
      rangeBandTotalsMs: rangeBandStats.totals,
      rangeBandCounts: rangeBandStats.counts,
      slowTransitions,
      slowdownIndex,
      spatialInefficiency,
      recoveryAfterErrorMs,
      primaryBottlenecks,
    };

    addConcentrationSession(payload);
    setSummary(payload);
    setElapsedMs(totalMs);
    setPhase('finished');
  };

  const handleCellClick = (cell: GridCell, idx: number) => {
    if (phase !== 'playing') return;
    const now = Date.now();
    
    if (mode === 'sequential') {
      if (cell.value !== nextExpected) {
        setMisclickCount((prev) => prev + 1);
        setMisclickEvents((prev) => [...prev, { ts: now, row: cell.row, col: cell.col }]);
        setLastWrongCell(idx);
        setTimeout(() => setLastWrongCell(null), 200);
        return;
      }

      const nextEvent: CorrectEvent = { value: cell.value, ts: now, row: cell.row, col: cell.col };
      const updated = [...correctEvents, nextEvent];
      setCorrectEvents(updated);
      if (nextExpected === rangeEnd) {
        finishSession(updated, now);
        return;
      }
      setNextExpected((prev) => prev + 1);
    } else {
      const expectedValue = targetSequence[sequenceProgress];
      if (cell.value !== expectedValue) {
        setMisclickCount((prev) => prev + 1);
        setMisclickEvents((prev) => [...prev, { ts: now, row: cell.row, col: cell.col }]);
        setLastWrongCell(idx);
        setTimeout(() => setLastWrongCell(null), 200);
        return;
      }

      const nextEvent: CorrectEvent = { value: cell.value, ts: now, row: cell.row, col: cell.col };
      const updated = [...correctEvents, nextEvent];
      setCorrectEvents(updated);
      
      if (sequenceProgress === concurrentNumbers - 1) {
        // Completed one sequence, generate next
        setTargetSequence(generateRandomTarget(concurrentNumbers));
        setSequenceProgress(0);
      } else {
        setSequenceProgress((prev) => prev + 1);
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Concentration Grid 10x10</h2>
          <p className="text-xs text-muted-foreground">
            {mode === 'sequential' 
              ? 'Click numbers in sequence for your selected range.' 
              : 'Find the randomly generated target sequences as fast as possible.'}
          </p>
        </div>
        <button onClick={onExit} className="p-2 hover:bg-accent/10 hover:text-accent rounded-full transition-all">
          <X size={26} />
        </button>
      </div>

      {phase !== 'ready' && (
        <div className="terminal-card py-2 px-3 flex flex-wrap items-center gap-4 text-xs font-mono">
          {mode === 'sequential' ? (
            <span><span className="text-muted-foreground">NEXT:</span> {nextExpected > 99 ? 'DONE' : nextExpected}</span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground">TARGET:</span>
              <span className="flex gap-1">
                {targetSequence.map((num, i) => (
                  <span key={i} className={i < sequenceProgress ? 'text-primary line-through opacity-50' : 'text-primary font-bold'}>
                    {num}{i < targetSequence.length - 1 ? ',' : ''}
                  </span>
                ))}
              </span>
            </span>
          )}
          <span><span className="text-muted-foreground">MISCLICKS:</span> {misclickCount}</span>
          <span><span className="text-muted-foreground">TIME:</span> {formatMs(elapsedMs, true)}</span>
          <span><span className="text-muted-foreground">CORRECT:</span> {correctEvents.length}</span>
          {mode === 'random' && phase === 'playing' && (
            <button 
              onClick={() => finishSession(correctEvents, Date.now())}
              className="ml-auto bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1 rounded-sm font-bold uppercase tracking-widest text-[10px]"
            >
              FINISH SESSION
            </button>
          )}
        </div>
      )}

      {phase === 'ready' && (
        <div className="terminal-card text-center py-14">
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setMode('sequential')}
              className={`px-4 py-2 rounded-sm border font-mono text-xs uppercase tracking-widest transition-all ${
                mode === 'sequential' ? 'bg-primary text-background border-primary' : 'border-border hover:border-muted'
              }`}
            >
              Sequential
            </button>
            <button
              onClick={() => setMode('random')}
              className={`px-4 py-2 rounded-sm border font-mono text-xs uppercase tracking-widest transition-all ${
                mode === 'random' ? 'bg-primary text-background border-primary' : 'border-border hover:border-muted'
              }`}
            >
              Random Finder
            </button>
          </div>

          <div className="max-w-sm mx-auto mb-6">
            {mode === 'sequential' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="text-left">
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1 font-bold">Range Start</label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={rangeStart}
                    onChange={(e) => setRangeStart(parseInt(e.target.value || '0', 10))}
                    className="w-full bg-card border border-border p-2 text-center font-mono text-sm rounded-sm"
                  />
                </div>
                <div className="text-left">
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1 font-bold">Range End</label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(parseInt(e.target.value || '99', 10))}
                    className="w-full bg-card border border-border p-2 text-center font-mono text-sm rounded-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="text-left">
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1 font-bold">Concurrent Numbers</label>
                <select
                  value={concurrentNumbers}
                  onChange={(e) => setConcurrentNumbers(parseInt(e.target.value, 10))}
                  className="w-full bg-card border border-border p-2 text-center font-mono text-sm rounded-sm"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === 'sequential' 
              ? 'One full run records timing diagnostics and a ranked post-assessment.'
              : 'Continuous training mode. Find as many target sequences as you can.'}
          </p>
          <button onClick={startSession} className="bg-primary text-background px-8 py-3 rounded-sm font-bold tracking-widest text-xs">
            START GRID
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <div className="mx-auto w-[min(92vw,78vh)] max-w-[640px] aspect-square grid grid-cols-10 gap-1">
          {grid.map((cell, idx) => {
            let isTarget = false;
            let isCompletedTarget = false;
            
            if (mode === 'sequential') {
              isCompletedTarget = cell.value < nextExpected || cell.value < rangeStart;
            } else {
              isTarget = targetSequence.includes(cell.value);
              isCompletedTarget = isTarget && targetSequence.indexOf(cell.value) < sequenceProgress;
            }

            return (
              <button
                key={`${cell.value}-${idx}`}
                onClick={() => handleCellClick(cell, idx)}
                className={`aspect-square rounded-sm border text-[clamp(10px,1.55vh,28px)] leading-none font-mono font-bold transition-all ${
                  isCompletedTarget
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : mode === 'random' && isTarget
                    ? 'bg-primary/10 border-primary/60 text-foreground'
                    : 'bg-card border-border text-foreground/90 hover:border-muted'
                } ${lastWrongCell === idx ? 'bg-destructive/20 border-destructive text-destructive' : ''}`}
              >
                {cell.value}
              </button>
            );
          })}
        </div>
      )}

      {phase === 'finished' && summary && (
        <div className="space-y-5">
          <div className="terminal-card">
            <h3 className="text-lg font-bold mb-3">Post Assessment</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Mode: <span className="font-mono uppercase">{summary.mode}</span>
              {summary.mode === 'sequential' 
                ? ` (${summary.rangeStart}-${summary.rangeEnd})` 
                : ` (N=${summary.concurrentNumbers})`}
            </p>
            <p className="text-sm mb-4">Total time: <span className="font-mono font-bold">{formatMs(summary.totalMs, true)}</span></p>
            <div className="space-y-2 text-sm">
              {summary.primaryBottlenecks.map((b: string, idx: number) => (
                <p key={idx} className="border border-border/40 rounded-sm px-3 py-2">{idx + 1}. {b}</p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="terminal-card">
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-3">Hesitation Map</h4>
              <div className="grid grid-cols-10 gap-0.5 aspect-square">
                {Array.from({ length: 100 }, (_, i) => {
                  const transition = summary.slowTransitions.find(t => t.to === i);
                  const intensity = transition ? Math.min(transition.ms / 3000, 1) : 0;
                  return (
                    <div 
                      key={i} 
                      className="aspect-square rounded-[1px] relative group"
                      style={{ 
                        backgroundColor: intensity > 0 
                          ? `rgba(239, 68, 68, ${intensity * 0.8})` 
                          : 'rgba(255,255,255,0.05)' 
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 bg-background/80 font-mono">
                        {i}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="terminal-card">
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-3">Slowest Transitions</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {summary.slowTransitions.map((t, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm border-b border-border/30 py-1">
                    <span>{t.from} → {t.to}</span>
                    <span className="font-mono">{formatMs(t.ms, true)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Metric label="Accuracy" value={`${Math.max(0, 100 - (summary.misclickCount * 2))}%`} icon={<Trophy size={14} />} />
            <Metric label="Spatial Inefficiency" value={summary.spatialInefficiency.toFixed(2)} icon={<Target size={14} />} />
            <Metric label="Recovery After Error" value={formatMs(summary.recoveryAfterErrorMs, true)} icon={<AlertTriangle size={14} />} />
          </div>

          <div className="flex gap-3">
            <button onClick={startSession} className="bg-primary text-background px-6 py-2 rounded-sm font-bold text-xs tracking-widest">
              RUN AGAIN
            </button>
            <button onClick={onExit} className="border border-border px-6 py-2 rounded-sm font-bold text-xs tracking-widest hover:border-muted">
              EXIT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="terminal-card flex items-center justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted mb-1 font-bold">{label}</p>
        <p className="text-xl font-bold font-mono">{value}</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">{icon}</div>
    </div>
  );
}

function buildDecileSplits(events: CorrectEvent[], startTs: number, endTs: number) {
  if (events.length === 0) return new Array(10).fill(0);
  const splits: number[] = [];
  for (let i = 0; i < 10; i += 1) {
    const startNum = i * 10;
    const endNum = i * 10 + 9;
    const startEvent = events.find((e) => e.value === startNum);
    const endEvent = events.find((e) => e.value === endNum);
    const from = startEvent ? startEvent.ts : i === 0 ? startTs : (events.find((e) => e.value === startNum - 1)?.ts ?? startTs);
    const to = endEvent ? endEvent.ts : endTs;
    splits.push(Math.max(0, to - from));
  }
  return splits;
}

function buildTransitions(events: CorrectEvent[], startTs: number) {
  return events.map((event, idx) => {
    const prevTs = idx === 0 ? startTs : events[idx - 1].ts;
    return {
      from: idx === 0 ? 0 : events[idx - 1].value,
      to: event.value,
      ms: Math.max(0, event.ts - prevTs),
    };
  });
}

function computeSlowdownIndex(events: CorrectEvent[], startTs: number, endTs: number) {
  if (events.length < 30) return 0;
  const firstThirtyEnd = events.find((e) => e.value === 29)?.ts ?? startTs;
  const seventyStart = events.find((e) => e.value === 70)?.ts ?? startTs;
  const earlyMs = Math.max(1, firstThirtyEnd - startTs);
  const lateMs = Math.max(1, endTs - seventyStart);
  const earlyRate = 30 / earlyMs;
  const lateRate = 30 / lateMs;
  return ((earlyRate - lateRate) / Math.max(earlyRate, 0.0001)) * 100;
}

function computeSpatialInefficiency(events: CorrectEvent[]) {
  if (events.length < 2) return 0;
  const distance = events.slice(1).reduce((sum, event, idx) => {
    const prev = events[idx];
    return sum + Math.abs(event.row - prev.row) + Math.abs(event.col - prev.col);
  }, 0);
  return distance / (events.length - 1);
}

function computeRecoveryAfterError(
  correctEvents: CorrectEvent[],
  misclicks: Array<{ ts: number; row: number; col: number }>
) {
  if (misclicks.length === 0) return 0;
  const delays = misclicks.map((m) => {
    const nextCorrect = correctEvents.find((e) => e.ts > m.ts);
    return nextCorrect ? nextCorrect.ts - m.ts : 0;
  }).filter((ms) => ms > 0);
  if (delays.length === 0) return 0;
  return delays.reduce((a, b) => a + b, 0) / delays.length;
}

function deriveBottlenecks(input: {
  misclickCount: number;
  slowdownIndex: number;
  spatialInefficiency: number;
  slowTransitions: Array<{ from: number; to: number; ms: number }>;
  recoveryAfterErrorMs: number;
  totalMs: number;
}) {
  const notes: string[] = [];
  if (input.slowdownIndex > 12) {
    notes.push(`Late-grid slowdown is high (${input.slowdownIndex.toFixed(1)}%). You started fast but pace dropped in the final third.`);
  }
  if (input.misclickCount > 6) {
    notes.push(`Misclick frequency is elevated (${input.misclickCount}). Visual targeting precision likely added avoidable delay.`);
  }
  if (input.recoveryAfterErrorMs > 1200) {
    notes.push(`Recovery after mistakes is slow (${formatMs(input.recoveryAfterErrorMs, true)} average). Practice instant reset after errors.`);
  }
  if (input.spatialInefficiency > 6.5) {
    notes.push(`Spatial pathing is inefficient (index ${input.spatialInefficiency.toFixed(2)}). Improve scan strategy to reduce long jumps.`);
  }
  if (input.slowTransitions.length > 0) {
    const top = input.slowTransitions[0];
    notes.push(`Largest hesitation occurred at ${top.from} → ${top.to} (${formatMs(top.ms, true)}).`);
  }
  if (notes.length === 0) {
    notes.push(`Strong consistency. Total completion ${formatMs(input.totalMs, true)} with no major diagnostic red flags.`);
  }
  return notes.slice(0, 4);
}

function buildRangeBandStats(events: CorrectEvent[], startTs: number) {
  const transitions = buildTransitions(events, startTs);
  const accum = Array.from({ length: 10 }, () => ({ total: 0, count: 0 }));
  transitions.forEach((t) => {
    if (t.to < 0 || t.to > 99) return;
    const band = Math.floor(t.to / 10);
    accum[band].total += t.ms;
    accum[band].count += 1;
  });
  return {
    totals: accum.map((b) => b.total),
    counts: accum.map((b) => b.count),
    averages: accum.map((b) => (b.count > 0 ? b.total / b.count : 0)),
  };
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
