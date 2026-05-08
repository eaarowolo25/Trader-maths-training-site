import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ArithmeticType, QuestionConfig, Question } from '@/lib/arithmetic';

interface GameSession {
  id: string;
  startTime: number;
  endTime: number;
  score: number;
  totalQuestions: number;
  accuracy: number;
  questions: {
    question: string;
    answer: number;
    userAnswer: number;
    correct: boolean;
    timeTaken: number;
    type: ArithmeticType;
  }[];
}

interface GameState {
  // Settings
  configs: Record<ArithmeticType, QuestionConfig>;
  activeTypes: ArithmeticType[];
  sessionDuration: number; // in seconds
  isAuditory: boolean;
  isFatigue: boolean;
  speechRate: number;

  // History
  history: GameSession[];
  bestScore: number;
  totalQuestionsSolved: number;

  // Actions
  updateConfig: (type: ArithmeticType, config: Partial<QuestionConfig>) => void;
  toggleType: (type: ArithmeticType) => void;
  addSession: (session: GameSession) => void;
  setSessionDuration: (duration: number) => void;
  toggleAuditory: () => void;
  toggleFatigue: () => void;
}

const DEFAULT_CONFIGS: Record<ArithmeticType, QuestionConfig> = {
  addition: { type: 'addition', leftDigits: 2, rightDigits: 2 },
  subtraction: { type: 'subtraction', leftDigits: 2, rightDigits: 2 },
  multiplication: { type: 'multiplication', leftDigits: 2, rightDigits: 1 },
  division: { type: 'division', leftDigits: 2, rightDigits: 1 },
  percentage: { type: 'percentage' },
  fraction: { type: 'fraction' },
  decimal: { type: 'decimal', leftDigits: 1, rightDigits: 1, decimals: 1 },
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      configs: DEFAULT_CONFIGS,
      activeTypes: ['addition', 'subtraction', 'multiplication'],
      sessionDuration: 120,
      isAuditory: false,
      isFatigue: false,
      speechRate: 1.0,
      history: [],
      bestScore: 0,
      totalQuestionsSolved: 0,

      updateConfig: (type, config) =>
        set((state) => ({
          configs: {
            ...state.configs,
            [type]: { ...state.configs[type], ...config },
          },
        })),

      toggleType: (type) =>
        set((state) => ({
          activeTypes: state.activeTypes.includes(type)
            ? state.activeTypes.filter((t) => t !== type)
            : [...state.activeTypes, type],
        })),

      addSession: (session) =>
        set((state) => ({
          history: [session, ...state.history].slice(0, 100),
          bestScore: Math.max(state.bestScore, session.score),
          totalQuestionsSolved: state.totalQuestionsSolved + session.totalQuestions,
        })),

      setSessionDuration: (duration) => set({ sessionDuration: duration }),
      toggleAuditory: () => set((state) => ({ isAuditory: !state.isAuditory })),
      toggleFatigue: () => set((state) => ({ isFatigue: !state.isFatigue })),
    }),
    {
      name: 'trader-math-storage',
    }
  )
);
