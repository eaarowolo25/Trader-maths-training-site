'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { generateQuestion, Question } from '@/lib/arithmetic';
import { getMultiplicationTip } from '@/lib/shortcuts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  X, 
  Zap, 
  Lightbulb, 
  RotateCcw,
  Timer,
  Play,
  Layers,
  ZapOff,
  BookOpen,
  Shuffle,
  CheckCircle2,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';

export default function LadderMode({ onExit }: { onExit: () => void }) {
  const { ladderConfig, ladderPerformance, updateLadderConfig, recordLadderAttempt } = useGameStore();
  const [view, setView] = useState<'config' | 'playing' | 'summary'>('config');
  const [rung, setRung] = useState(1);
  const [sequentialIndex, setSequentialIndex] = useState(ladderConfig.rightMin);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(ladderConfig.timeLimit);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState<any[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<number>(null);
  const startTimeRef = useRef<number>(null);
  const questionStartTimeRef = useRef<number>(0);

  const startLadder = () => {
    setView('playing');
    setRung(1);
    setSessionStats([]);
    setSequentialIndex(ladderConfig.rightMin);
    nextRung(1, ladderConfig.rightMin);
  };

  const nextRung = (level: number, nextSequentialIndex: number) => {
    let question: Question;
    
    if (ladderConfig.isSequential) {
      // Sequential logic
      const right = nextSequentialIndex > ladderConfig.rightMax ? ladderConfig.rightMin : nextSequentialIndex;
      question = {
        text: `${ladderConfig.leftNumber} × ${right}`,
        answer: ladderConfig.leftNumber * right,
        type: 'multiplication',
        difficulty: 1,
        timestamp: Date.now()
      };
    } else {
      // Weighted Random logic (Feedback Loop)
      // 30% chance to pick a "weak" problem from history if available
      const performanceEntries = Object.entries(ladderPerformance)
        .filter(([q]) => q.startsWith(`${ladderConfig.leftNumber} ×`));
      
      const weakPoints = performanceEntries
        .filter(([_, stats]) => stats.avgTime > 3 || stats.errorCount > 0)
        .map(([q]) => q);

      if (Math.random() < 0.3 && weakPoints.length > 0) {
        const picked = weakPoints[Math.floor(Math.random() * weakPoints.length)];
        const [l, r] = picked.split(' × ').map(Number);
        question = {
          text: picked,
          answer: l * r,
          type: 'multiplication',
          difficulty: 1.5,
          timestamp: Date.now()
        };
      } else {
        question = generateQuestion({
          type: 'multiplication',
          leftMin: ladderConfig.leftNumber,
          leftMax: ladderConfig.leftNumber,
          rightMin: ladderConfig.rightMin,
          rightMax: ladderConfig.rightMax
        });
      }
    }
    
    setCurrentQuestion(question);
    setUserInput('');
    setIsCorrect(null);
    setIsFlipped(false);
    setTimeLeft(ladderConfig.timeLimit);
    questionStartTimeRef.current = performance.now();
    
    if (ladderConfig.isCountdown) {
      cancelTimer();
      startTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animateTimer);
    }
  };

  const animateTimer = (time: number) => {
    if (startTimeRef.current === null) startTimeRef.current = time;
    const elapsed = (time - startTimeRef.current) / 1000;
    const remaining = Math.max(0, ladderConfig.timeLimit - elapsed);
    
    setTimeLeft(remaining);

    if (remaining <= 0) {
      handleTimeout();
    } else {
      requestRef.current = requestAnimationFrame(animateTimer);
    }
  };

  const handleTimeout = () => {
    cancelTimer();
    const timeTaken = ladderConfig.timeLimit * 1000;
    if (currentQuestion) {
      recordLadderAttempt(currentQuestion.text, timeTaken, false);
      setSessionStats(prev => [...prev, { ...currentQuestion, timeTaken, correct: false }]);
    }
    setIsCorrect(false);
    setIsFlipped(true);
  };

  const cancelTimer = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    startTimeRef.current = null;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentQuestion || userInput === '' || isFlipped) return;

    cancelTimer();
    const timeTaken = performance.now() - questionStartTimeRef.current;
    const correct = parseFloat(userInput) === currentQuestion.answer;
    
    recordLadderAttempt(currentQuestion.text, timeTaken, correct);
    setSessionStats(prev => [...prev, { ...currentQuestion, timeTaken, correct }]);

    setIsCorrect(correct);

    if (correct) {
      setTimeout(() => {
        const nextIdx = sequentialIndex + 1;
        setRung(prev => prev + 1);
        setSequentialIndex(nextIdx);
        nextRung(rung + 1, nextIdx);
      }, 600);
    } else {
      setIsFlipped(true);
    }
  };

  const handleRetryAction = () => {
    setUserInput('');
    setIsCorrect(null);
    setIsFlipped(false);
    questionStartTimeRef.current = performance.now();
    if (ladderConfig.isCountdown) {
      startTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animateTimer);
    }
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const finishSession = () => {
    cancelTimer();
    setView('summary');
  };

  const tip = currentQuestion ? getMultiplicationTip(
    parseInt(currentQuestion.text.split(' × ')[0]), 
    parseInt(currentQuestion.text.split(' × ')[1])
  ) : null;

  useEffect(() => {
    if (view === 'playing' && !isFlipped) {
      inputRef.current?.focus();
    }
    return () => cancelTimer();
  }, [view, isFlipped, currentQuestion]);

  if (view === 'config') {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center border border-primary/20">
              <Layers className="text-primary" size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-bold uppercase tracking-tight">Ladder Config</h2>
              <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em]">Mental Specialization Protocol</p>
            </div>
          </div>
          <button onClick={onExit} className="p-2 hover:bg-accent/10 hover:text-accent rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="terminal-card space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] text-muted uppercase tracking-[0.2em] font-bold block">Base Multiplier</label>
                  <input 
                    type="number"
                    max="100"
                    value={ladderConfig.leftNumber}
                    onChange={(e) => updateLadderConfig({ leftNumber: Math.min(100, parseInt(e.target.value) || 0) })}
                    className="w-full bg-background border border-border p-4 text-3xl text-center font-mono rounded-sm focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] text-muted uppercase tracking-[0.2em] font-bold block">Target Range</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number"
                      max="100"
                      value={ladderConfig.rightMin}
                      onChange={(e) => updateLadderConfig({ rightMin: Math.min(100, parseInt(e.target.value) || 0) })}
                      className="w-full bg-background border border-border p-4 text-xl text-center font-mono rounded-sm outline-none"
                    />
                    <span className="text-muted font-bold text-xs">TO</span>
                    <input 
                      type="number"
                      max="100"
                      value={ladderConfig.rightMax}
                      onChange={(e) => updateLadderConfig({ rightMax: Math.min(100, parseInt(e.target.value) || 0) })}
                      className="w-full bg-background border border-border p-4 text-xl text-center font-mono rounded-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-4 bg-background border border-border rounded-sm">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-sm ${ladderConfig.isSequential ? 'bg-secondary/10 text-secondary' : 'bg-muted/10 text-muted'}`}>
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-tight">Learning Mode</p>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">Sequential 1-100 Mastery</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => updateLadderConfig({ isSequential: !ladderConfig.isSequential })}
                    className={`w-12 h-6 rounded-full transition-all relative ${ladderConfig.isSequential ? 'bg-secondary' : 'bg-muted/20'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${ladderConfig.isSequential ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-background border border-border rounded-sm">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-sm ${ladderConfig.isCountdown ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted'}`}>
                      <Timer size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-tight">Countdown Timer</p>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">Auto-fail upon expiration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {ladderConfig.isCountdown && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-muted">Secs:</span>
                        <input 
                          type="number"
                          value={ladderConfig.timeLimit}
                          onChange={(e) => updateLadderConfig({ timeLimit: parseInt(e.target.value) })}
                          className="w-12 bg-card border border-border p-1 text-center font-mono text-xs rounded-sm outline-none"
                        />
                      </div>
                    )}
                    <button 
                      onClick={() => updateLadderConfig({ isCountdown: !ladderConfig.isCountdown })}
                      className={`w-12 h-6 rounded-full transition-all relative ${ladderConfig.isCountdown ? 'bg-primary' : 'bg-muted/20'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${ladderConfig.isCountdown ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={startLadder}
                className={`w-full py-4 rounded-sm font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-md group ${
                  ladderConfig.isSequential ? 'bg-secondary hover:bg-secondary/90' : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {ladderConfig.isSequential ? <BookOpen size={20} /> : <Shuffle size={20} />}
                {ladderConfig.isSequential ? 'Initialize Learning' : 'Engage Flashcards'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="terminal-card bg-secondary/5 border-secondary/20">
              <div className="flex items-center gap-2 text-secondary mb-4">
                <TrendingDown size={18} />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Feedback Loop</h4>
              </div>
              <p className="text-xs leading-relaxed text-muted font-medium italic">
                The terminal tracks your latency per operand. Slower responses will reoccur 30% more frequently during flashcard sessions to force neural optimization.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'summary') {
    const weakPoints = sessionStats
      .filter(s => !s.correct || s.timeTaken > 3000)
      .sort((a, b) => b.timeTaken - a.timeTaken)
      .slice(0, 5);

    return (
      <div className="max-w-2xl mx-auto space-y-8 py-12">
        <div className="terminal-card text-center space-y-6 border-primary/30">
          <Trophy size={48} className="mx-auto text-primary" />
          <h2 className="text-3xl font-bold uppercase tracking-widest">Mastery Report</h2>
          
          <div className="grid grid-cols-2 gap-4 py-8 border-y border-border/50">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-widest mb-1">Total Solved</p>
              <p className="text-4xl font-mono font-bold">{sessionStats.filter(s => s.correct).length}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-widest mb-1">Avg Latency</p>
              <p className="text-4xl font-mono font-bold text-primary">
                {(sessionStats.reduce((acc, s) => acc + s.timeTaken, 0) / sessionStats.length / 1000).toFixed(2)}s
              </p>
            </div>
          </div>

          <div className="text-left space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-secondary">
              <AlertTriangle size={14} />
              Latency Bottlenecks
            </h3>
            <div className="space-y-2">
              {weakPoints.map((s, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-background border border-border rounded-sm font-mono text-sm">
                  <span className="font-bold">{s.text}</span>
                  <span className="text-accent">{(s.timeTaken / 1000).toFixed(2)}s</span>
                </div>
              ))}
              {weakPoints.length === 0 && (
                <p className="text-sm italic text-muted">Optimal neural response achieved for all operands.</p>
              )}
            </div>
          </div>

          <button onClick={() => setView('config')} className="w-full py-4 bg-primary text-white rounded-sm font-bold uppercase tracking-widest hover:bg-primary/90 transition-all">
            Return to Config
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col items-center justify-center relative perspective-1000 w-full">
      <div className="absolute top-0 right-0 flex items-center gap-4 z-20">
        <button 
          onClick={finishSession}
          className="px-4 py-1.5 bg-foreground/5 hover:bg-foreground/10 text-[10px] font-bold uppercase tracking-widest border border-border rounded-sm transition-all flex items-center gap-2"
        >
          <CheckCircle2 size={14} className="text-primary" />
          Finish Session
        </button>
        <button onClick={onExit} className="p-2 hover:bg-accent/10 hover:text-accent rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Progress Visualization */}
      <div className="absolute top-0 left-0 flex items-center gap-2 overflow-x-auto max-w-full pb-4 scrollbar-none no-scrollbar">
        {Array.from({ length: 15 }).map((_, i) => (
          <div 
            key={i}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all font-mono text-[10px] font-bold ${
              rung === i + 1 ? 'border-primary bg-primary text-white scale-110 shadow-[0_0_10px_rgba(0,255,204,0.3)]' :
              rung > i ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border text-muted/30'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      <div className="w-full max-w-xl">
        <div className={`relative transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front: Question */}
          <div className={`text-center space-y-12 backface-hidden flex flex-col items-center ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className={`text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded-sm ${ladderConfig.isSequential ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                  {ladderConfig.isSequential ? 'Sequential Learning' : 'Ladder Rung'} {rung}
                </span>
                {ladderConfig.isCountdown && (
                  <div className="flex items-center gap-1 text-primary">
                    <Timer size={12} />
                    <span className="text-[10px] font-mono font-bold">{timeLeft.toFixed(1)}s</span>
                  </div>
                )}
              </div>
              <div className="text-8xl md:text-9xl font-bold font-mono tracking-tighter neon-text transition-all">
                {currentQuestion?.text}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="relative w-full">
              <input
                ref={inputRef}
                type="number"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isFlipped}
                className={`w-full bg-card border-2 p-8 text-5xl text-center font-mono rounded-sm transition-all outline-none ${
                  isCorrect === false ? 'border-accent shadow-[0_0_20px_rgba(255,0,85,0.2)]' : 'border-border focus:border-primary/50'
                }`}
                placeholder="?"
                autoComplete="off"
              />
              
              {ladderConfig.isCountdown && !isFlipped && (
                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-border/20 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ease-linear ${timeLeft < 1.5 ? 'bg-accent' : 'bg-primary'}`}
                    style={{ width: `${(timeLeft / ladderConfig.timeLimit) * 100}%` }}
                  />
                </div>
              )}
            </form>
          </div>

          {/* Back: Tip/Correction */}
          <div className={`absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-full terminal-card border-secondary/50 bg-card p-10 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ZapOff size={120} />
              </div>

              <div className="space-y-1 relative">
                <div className="flex items-center gap-3 text-secondary mb-2">
                  <Lightbulb size={24} />
                  <h3 className="text-xl font-bold uppercase tracking-widest">Correction Link</h3>
                </div>
                <p className="text-muted text-[10px] uppercase font-bold tracking-widest">Target Solution</p>
                <p className="text-6xl font-mono font-bold text-primary">
                  {currentQuestion?.answer}
                </p>
              </div>

              {tip && (
                <div className="p-5 bg-secondary/5 border-l-4 border-secondary rounded-sm relative">
                  <h4 className="text-[10px] uppercase font-bold text-secondary mb-2 tracking-widest">Neural Shortcut</h4>
                  <p className="text-sm italic leading-relaxed text-foreground font-medium">{tip}</p>
                </div>
              )}

              <button 
                onClick={handleRetryAction}
                className="w-full py-5 bg-secondary text-white rounded-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-secondary/90 transition-all shadow-lg active:scale-95"
              >
                <RotateCcw size={20} />
                Reset Rung
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
