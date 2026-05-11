'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { CheckCircle2, XCircle, Clock, Trophy, ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'basic' | 'intermediate' | 'advanced';
}

const QUESTION_BANK: Question[] = [
  // Easy
  {
    id: 'p1',
    text: "What is the probability of rolling a 4 or 5 on a fair 6-sided die?",
    options: ["1/6", "1/3", "1/2", "2/3"],
    correctAnswer: "1/3",
    explanation: "There are 2 favorable outcomes (4 and 5) out of 6 total possibilities. 2/6 = 1/3.",
    difficulty: 'easy',
    category: 'basic'
  },
  {
    id: 'p2',
    text: "Probability of drawing a Red card from a standard 52-card deck?",
    options: ["1/4", "1/2", "1/13", "1/52"],
    correctAnswer: "1/2",
    explanation: "Half the cards in a standard deck are red (hearts and diamonds).",
    difficulty: 'easy',
    category: 'basic'
  },
  // Medium
  {
    id: 'p3',
    text: "Probability of getting exactly 2 heads in 3 fair coin flips?",
    options: ["1/4", "3/8", "1/2", "5/8"],
    correctAnswer: "3/8",
    explanation: "Total outcomes: 2^3 = 8. Favorable: HHT, HTH, THH (3). Probability = 3/8.",
    difficulty: 'medium',
    category: 'intermediate'
  },
  {
    id: 'p4',
    text: "A bag has 3 red and 2 blue marbles. Probability of picking 2 red marbles without replacement?",
    options: ["3/10", "9/25", "3/5", "1/2"],
    correctAnswer: "3/10",
    explanation: "P(1st Red) = 3/5. P(2nd Red | 1st Red) = 2/4. (3/5) * (2/4) = 6/20 = 3/10.",
    difficulty: 'medium',
    category: 'intermediate'
  },
  // Hard
  {
    id: 'p5',
    text: "Expected Value (EV) of a game: 30% chance to win $10, 70% chance to lose $5.",
    options: ["+$1.50", "-$0.50", "-$1.00", "+$0.50"],
    correctAnswer: "-$0.50",
    explanation: "EV = (0.30 * 10) + (0.70 * -5) = 3 - 3.5 = -0.5.",
    difficulty: 'hard',
    category: 'advanced'
  }
];

export default function ProbabilityMode() {
  const [phase, setPhase] = useState<'menu' | 'playing' | 'summary'>('menu');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'all'>('all');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTimes, setElapsedTimes] = useState<number[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  const startSession = () => {
    let filtered = [...QUESTION_BANK];
    if (difficulty !== 'all') {
      filtered = QUESTION_BANK.filter(q => q.difficulty === difficulty);
    }
    // Shuffle questions
    filtered.sort(() => Math.random() - 0.5);
    setQuestions(filtered.slice(0, 10)); // Take 10
    setCurrentQuestionIdx(0);
    setUserAnswers([]);
    setElapsedTimes([]);
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());
    setPhase('playing');
    setShowExplanation(false);
  };

  const handleAnswer = (answer: string) => {
    if (showExplanation) return;
    
    const now = Date.now();
    setElapsedTimes([...elapsedTimes, now - questionStartTime]);
    setUserAnswers([...userAnswers, answer]);
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setQuestionStartTime(Date.now());
      setShowExplanation(false);
    } else {
      setPhase('summary');
    }
  };

  const correctCount = userAnswers.filter((ans, idx) => ans === questions[idx].correctAnswer).length;
  const avgTime = elapsedTimes.length > 0 ? elapsedTimes.reduce((a, b) => a + b, 0) / elapsedTimes.length : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Probability Training</h2>
          <p className="text-muted-foreground">Master mental probability and expected value calculations.</p>
        </div>
      </div>

      {phase === 'menu' && (
        <div className="terminal-card py-12 text-center space-y-8">
          <div className="flex justify-center gap-4">
            {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 py-2 rounded-sm border font-mono text-xs uppercase tracking-widest transition-all ${
                  difficulty === d ? 'bg-primary text-background border-primary' : 'border-border hover:border-muted'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <button
            onClick={startSession}
            className="bg-primary text-background px-10 py-4 rounded-sm font-bold tracking-[0.2em] text-sm hover:opacity-90 transition-all"
          >
            START TRAINING SESSION
          </button>
        </div>
      )}

      {phase === 'playing' && questions.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center text-xs font-mono text-muted-foreground">
            <span>QUESTION {currentQuestionIdx + 1} OF {questions.length}</span>
            <span className="bg-muted/20 px-2 py-1 rounded capitalize">{questions[currentQuestionIdx].difficulty}</span>
          </div>

          <div className="terminal-card py-8 px-10">
            <h3 className="text-xl font-medium mb-8 leading-relaxed">
              {questions[currentQuestionIdx].text}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions[currentQuestionIdx].options.map((option, idx) => {
                const isSelected = userAnswers[currentQuestionIdx] === option;
                const isCorrect = option === questions[currentQuestionIdx].correctAnswer;
                let variant = "border-border hover:border-primary/50";
                
                if (showExplanation) {
                  if (isCorrect) variant = "border-primary bg-primary/10 text-primary";
                  else if (isSelected) variant = "border-destructive bg-destructive/10 text-destructive";
                  else variant = "border-border opacity-50";
                }

                return (
                  <button
                    key={idx}
                    disabled={showExplanation}
                    onClick={() => handleAnswer(option)}
                    className={`p-4 text-left border rounded-sm transition-all font-mono text-sm flex justify-between items-center ${variant}`}
                  >
                    {option}
                    {showExplanation && isCorrect && <CheckCircle2 size={18} />}
                    {showExplanation && isSelected && !isCorrect && <XCircle size={18} />}
                  </button>
                );
              })}
            </div>
          </div>

          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="terminal-card border-primary/30 bg-primary/5 p-6"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 text-primary">
                  <BookOpen size={20} />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-sm uppercase tracking-widest text-primary">Explanation</p>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {questions[currentQuestionIdx].explanation}
                  </p>
                  <button
                    onClick={nextQuestion}
                    className="mt-4 flex items-center gap-2 bg-primary text-background px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest"
                  >
                    Next Question <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {phase === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryMetric label="Accuracy" value={`${Math.round((correctCount / questions.length) * 100)}%`} icon={<Trophy size={20} />} />
            <SummaryMetric label="Avg Time" value={`${(avgTime / 1000).toFixed(1)}s`} icon={<Clock size={20} />} />
            <SummaryMetric label="Score" value={`${correctCount}/${questions.length}`} icon={<CheckCircle2 size={20} />} />
          </div>

          <div className="terminal-card">
            <h3 className="text-lg font-bold mb-4 uppercase tracking-widest">Session Review</h3>
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border-b border-border/30 last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium line-clamp-1">{q.text}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{q.difficulty} • {q.category}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono">{(elapsedTimes[idx] / 1000).toFixed(1)}s</span>
                    {userAnswers[idx] === q.correctAnswer ? (
                      <CheckCircle2 size={18} className="text-primary" />
                    ) : (
                      <XCircle size={18} className="text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase('menu')}
            className="w-full bg-primary text-background py-4 rounded-sm font-bold tracking-widest text-sm hover:opacity-90"
          >
            RETURN TO MENU
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryMetric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="terminal-card p-6 flex items-center justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted mb-1 font-bold">{label}</p>
        <p className="text-2xl font-bold font-mono">{value}</p>
      </div>
      <div className="text-primary/40">{icon}</div>
    </div>
  );
}
