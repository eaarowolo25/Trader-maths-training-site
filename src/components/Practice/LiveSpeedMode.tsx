'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { generateQuestion, Question } from '@/lib/arithmetic';
import { getMultiplicationTip } from '@/lib/shortcuts';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, Target, X, Trophy, AlertCircle, Lightbulb } from 'lucide-react';

export default function LiveSpeedMode({ onExit }: { onExit: () => void }) {
  const { 
    configs, 
    activeTypes, 
    sessionDuration, 
    addSession,
    isAuditory,
    isFatigue
  } = useGameStore();

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(sessionDuration);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [gameState, setGameState] = useState<'countdown' | 'playing' | 'finished'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [activeTip, setActiveTip] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(0);

  const nextQuestion = () => {
    const type = activeTypes[Math.floor(Math.random() * activeTypes.length)];
    const question = generateQuestion(configs[type]);
    setCurrentQuestion(question);
    questionStartTimeRef.current = Date.now();
    setUserInput('');
    
    if (isAuditory) {
      speak(question.text);
    }
  };

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text.replace('×', 'times').replace('÷', 'divided by'));
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'countdown') {
      setGameState('playing');
      startTimeRef.current = Date.now();
      nextQuestion();
    }
  }, [countdown]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      finishGame();
    }
  }, [timeLeft, gameState]);

  const finishGame = () => {
    setGameState('finished');
    const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    addSession({
      id: Math.random().toString(36).substr(2, 9),
      startTime: startTimeRef.current,
      endTime: Date.now(),
      score,
      totalQuestions,
      accuracy,
      questions: history,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserInput(val);

    if (currentQuestion && val === currentQuestion.answer.toString()) {
      submitAnswer(parseFloat(val));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userInput !== '') {
      submitAnswer(parseFloat(userInput));
    }
  };

  const submitAnswer = (val: number) => {
    if (!currentQuestion) return;

    const isCorrect = val === currentQuestion.answer;
    const timeTaken = Date.now() - questionStartTimeRef.current;

    // Check for tip if incorrect and multiplication
    if (!isCorrect && currentQuestion.type === 'multiplication') {
      const parts = currentQuestion.text.split(' × ');
      const tip = getMultiplicationTip(parseInt(parts[0]), parseInt(parts[1]));
      setActiveTip(tip);
    } else {
      setActiveTip(null);
    }

    setHistory([...history, {
      question: currentQuestion.text,
      answer: currentQuestion.answer,
      userAnswer: val,
      correct: isCorrect,
      timeTaken,
      type: currentQuestion.type,
      tip: !isCorrect && currentQuestion.type === 'multiplication' ? getMultiplicationTip(parseInt(currentQuestion.text.split(' × ')[0]), parseInt(currentQuestion.text.split(' × ')[1])) : null
    }]);

    if (isCorrect) {
      setScore(score + 1);
      setLastCorrect(true);
    } else {
      setLastCorrect(false);
    }

    setTotalQuestions(totalQuestions + 1);
    nextQuestion();
    setTimeout(() => setLastCorrect(null), 500);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      inputRef.current?.focus();
    }
  }, [gameState, currentQuestion]);

  if (gameState === 'countdown') {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <motion.span 
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-9xl font-bold neon-text font-mono"
        >
          {countdown}
        </motion.span>
        <p className="mt-8 text-muted-foreground uppercase tracking-[0.3em] font-bold">Synchronizing Terminal</p>
      </div>
    );
  }

  if (gameState === 'finished') {
    const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const qpm = (totalQuestions / (sessionDuration / 60)).toFixed(1);
    const benchmark = Math.min(Math.round((parseFloat(qpm) / 40) * (accuracy / 100) * 100), 100);

    return (
      <div className="max-w-4xl mx-auto space-y-8 py-12">
        <div className="terminal-card text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
            <motion.div initial={{ width: 0 }} animate={{ width: `${benchmark}%` }} className="h-full bg-primary" />
          </div>
          
          <Trophy size={48} className="mx-auto text-primary mb-4 mt-4" />
          <h2 className="text-4xl font-bold tracking-tight">SESSION TELEMETRY</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-border/50 mt-8">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Final Score</p>
              <p className="text-4xl font-mono font-bold text-primary">{score}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Accuracy</p>
              <p className="text-4xl font-mono font-bold">{accuracy}%</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Questions/Min</p>
              <p className="text-4xl font-mono font-bold">{qpm}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Elite Rank</p>
              <p className="text-4xl font-mono font-bold text-secondary">{benchmark}%</p>
            </div>
          </div>
          
          <div className="pt-8 flex justify-center gap-4">
            <button onClick={onExit} className="bg-primary text-background px-10 py-3 rounded-sm font-bold hover:bg-primary/90 transition-all uppercase tracking-widest text-xs">
              Return to Terminal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="terminal-card">
            <h3 className="text-sm font-bold mb-6 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={16} className="text-accent" />
              Error Log & Shortcuts
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {history.filter(h => !h.correct).length > 0 ? (
                history.filter(h => !h.correct).reverse().map((item, idx) => (
                  <div key={idx} className="p-4 border border-accent/20 bg-accent/5 rounded-sm space-y-2">
                    <div className="flex justify-between font-mono text-sm">
                      <span className="text-accent font-bold">{item.question} = {item.answer}</span>
                      <span className="text-muted-foreground">Your: {item.userAnswer}</span>
                    </div>
                    {item.tip && (
                      <div className="flex gap-2 items-start text-[11px] text-primary/80 leading-relaxed bg-primary/5 p-2 rounded-sm border border-primary/10">
                        <Lightbulb size={14} className="shrink-0 mt-0.5" />
                        <span>{item.tip}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground italic text-sm">
                  Perfect accuracy achieved. No errors recorded.
                </div>
              )}
            </div>
          </div>

          <div className="terminal-card">
            <h3 className="text-sm font-bold mb-6 uppercase tracking-widest">Performance Distribution</h3>
            <div className="space-y-2">
              {history.slice(-10).reverse().map((item, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-sm border ${item.correct ? 'border-primary/20 bg-primary/5' : 'border-accent/20 bg-accent/5'} text-xs font-mono`}>
                  <span>{item.question}</span>
                  <div className="flex items-center gap-4">
                    <span className={item.correct ? 'text-primary' : 'text-accent'}>{item.userAnswer}</span>
                    <span className="text-[10px] text-muted-foreground">{(item.timeTaken / 1000).toFixed(2)}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full max-w-5xl mx-auto transition-all duration-300 ${isFatigue && lastCorrect === false ? 'animate-pulse' : ''}`}>
      {/* Header Stats */}
      <div className="flex items-center justify-between mb-16 px-4">
        <div className="flex items-center gap-12">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Time Remaining</p>
            <div className="flex items-center gap-2">
              <Timer size={18} className={timeLeft < 10 ? 'text-accent animate-pulse' : 'text-primary'} />
              <span className={`text-3xl font-mono font-bold ${timeLeft < 10 ? 'text-accent' : ''}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Solved</p>
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-primary" />
              <span className="text-3xl font-mono font-bold text-primary">{score}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right hidden md:block">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Accuracy</p>
            <div className="flex items-center gap-2 justify-end">
              <Target size={14} className="text-secondary" />
              <span className="text-xl font-mono font-bold">{totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 100}%</span>
            </div>
          </div>
          <button onClick={onExit} className="p-2 hover:bg-accent/10 hover:text-accent rounded-full transition-all">
            <X size={28} />
          </button>
        </div>
      </div>

      {/* Game Stage */}
      <div className="flex flex-col items-center justify-center pt-12 relative">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQuestion?.text}
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className={`text-7xl md:text-9xl font-bold mb-16 font-mono tracking-tighter text-center transition-all ${isAuditory ? 'opacity-0 blur-xl pointer-events-none' : ''}`}
          >
            {currentQuestion?.text}
          </motion.div>
        </AnimatePresence>

        <div className="relative w-full max-w-xl group">
          <input
            ref={inputRef}
            type="number"
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={`w-full bg-card border-2 p-8 text-5xl text-center font-mono rounded-sm transition-all outline-none ${
              lastCorrect === true ? 'border-primary shadow-[0_0_30px_rgba(0,255,204,0.2)]' : 
              lastCorrect === false ? 'border-accent shadow-[0_0_30px_rgba(255,0,85,0.2)]' : 
              'border-border focus:border-primary/40'
            }`}
            placeholder="INPUT ANSWER"
            autoComplete="off"
          />
          
          <AnimatePresence>
            {activeTip && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -bottom-24 left-0 right-0 p-4 bg-primary/10 border border-primary/20 rounded-sm text-xs flex items-center gap-3"
              >
                <Lightbulb size={18} className="text-primary shrink-0" />
                <span className="text-primary/90 italic">{activeTip}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {isAuditory && (
        <div className="fixed bottom-12 left-0 right-0 flex justify-center">
          <div className="px-6 py-2 bg-primary/20 border border-primary/30 rounded-full flex items-center gap-3 animate-pulse">
            <Volume2 size={16} className="text-primary" />
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Auditory Transmission Active</span>
          </div>
        </div>
      )}
    </div>
  );
}
