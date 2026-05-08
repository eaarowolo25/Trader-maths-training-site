'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { generateQuestion, Question } from '@/lib/arithmetic';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, Target, X, Trophy } from 'lucide-react';

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
  
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(0);

  // Initialize first question
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

  // Start countdown
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

  // Game timer
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

    // Auto-submit if the value matches the answer (for speed)
    // Or if the user presses Enter (handled in onKeyDown)
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

    setHistory([...history, {
      question: currentQuestion.text,
      answer: currentQuestion.answer,
      userAnswer: val,
      correct: isCorrect,
      timeTaken,
      type: currentQuestion.type,
    }]);

    if (isCorrect) {
      setScore(score + 1);
      setLastCorrect(true);
    } else {
      setLastCorrect(false);
    }

    setTotalQuestions(totalQuestions + 1);
    nextQuestion();

    // Reset feedback after a delay
    setTimeout(() => setLastCorrect(null), 500);
  };

  // Focus input on mount and state change
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
          className="text-9xl font-bold neon-text"
        >
          {countdown}
        </motion.span>
        <p className="mt-8 text-muted-foreground uppercase tracking-widest">Prepare for Transmission</p>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-12">
        <div className="terminal-card text-center space-y-4">
          <Trophy size={48} className="mx-auto text-primary mb-2" />
          <h2 className="text-4xl font-bold">SESSION COMPLETE</h2>
          <div className="grid grid-cols-3 gap-8 py-8 border-y border-border/50">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Final Score</p>
              <p className="text-3xl font-mono font-bold text-primary">{score}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Accuracy</p>
              <p className="text-3xl font-mono font-bold">{totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Solved</p>
              <p className="text-3xl font-mono font-bold">{totalQuestions}</p>
            </div>
          </div>
          <div className="pt-4">
            <button 
              onClick={onExit}
              className="bg-primary text-background px-8 py-2 rounded-sm font-bold hover:bg-primary/90 transition-colors"
            >
              RETURN TO TERMINAL
            </button>
          </div>
        </div>

        <div className="terminal-card">
          <h3 className="text-lg font-bold mb-4">Detailed Breakdown</h3>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
            {history.slice().reverse().map((item, idx) => (
              <div key={idx} className={`flex items-center justify-between p-2 rounded-sm text-sm font-mono ${item.correct ? 'bg-primary/5 text-primary/80' : 'bg-accent/5 text-accent'}`}>
                <span>{item.question} = {item.answer}</span>
                <div className="flex items-center gap-4">
                  <span>{item.userAnswer}</span>
                  <span className="text-[10px] opacity-50">{(item.timeTaken / 1000).toFixed(2)}s</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full max-w-4xl mx-auto ${isFatigue && lastCorrect === false ? 'animate-pulse bg-accent/5' : ''}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Timer size={20} className="text-muted-foreground" />
            <span className={`text-2xl font-mono font-bold ${timeLeft < 10 ? 'text-accent animate-pulse' : ''}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-primary" />
            <span className="text-2xl font-mono font-bold text-primary">{score}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Target size={18} />
          <span className="text-sm font-mono">{totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 100}%</span>
        </div>
        <button onClick={onExit} className="hover:text-accent transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Main Game Area */}
      <div className="flex flex-col items-center justify-center pt-20">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQuestion?.text}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`text-6xl md:text-8xl font-bold mb-12 font-mono tracking-tighter ${isAuditory ? 'opacity-20 blur-sm' : ''}`}
          >
            {currentQuestion?.text}
          </motion.div>
        </AnimatePresence>

        <div className="relative w-full max-w-md">
          <input
            ref={inputRef}
            type="number"
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={`w-full bg-card border-2 p-6 text-4xl text-center font-mono rounded-sm transition-all outline-none ${
              lastCorrect === true ? 'border-primary shadow-[0_0_15px_rgba(0,255,204,0.3)]' : 
              lastCorrect === false ? 'border-accent shadow-[0_0_15px_rgba(255,0,85,0.3)]' : 
              'border-border focus:border-primary/50'
            }`}
            placeholder="TYPE ANSWER"
            autoComplete="off"
          />
          <div className="absolute -bottom-8 left-0 right-0 text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Enter to submit • Auto-advance enabled
          </div>
        </div>
      </div>
    </div>
  );
}
