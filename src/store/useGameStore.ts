import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ArithmeticType, QuestionConfig } from '@/lib/arithmetic';

export type ThemeType = 'terminal-dark' | 'bloomberg-light';

export interface GameAttempt {
  promptId?: string;
  attemptIndex?: number;
  question: string;
  answer: number;
  userAnswer: number;
  correct: boolean;
  timeTaken: number;
  type: ArithmeticType;
  difficulty?: number;
  tip?: string | null;
}

export interface GuidedRecommendation {
  title: string;
  summary: string;
  focusTypes: ArithmeticType[];
  duration: number;
  targetMetric: string;
}

export interface GameSession {
  id: string;
  startTime: number;
  endTime: number;
  score: number;
  totalQuestions: number;
  accuracy: number;
  firstPassPrecision?: number;
  attemptEfficiency?: number;
  questions: GameAttempt[];
  qualityScore?: number;
  recoveryRate?: number;
  topErrorTags?: string[];
}

export interface ConcentrationTransition {
  from: number;
  to: number;
  ms: number;
}

export interface ConcentrationSession {
  id: string;
  startTime: number;
  endTime: number;
  totalMs: number;
  rangeStart?: number;
  rangeEnd?: number;
  misclickCount: number;
  splitTimesMs: number[];
  rangeBandAveragesMs?: number[];
  rangeBandTotalsMs?: number[];
  rangeBandCounts?: number[];
  slowTransitions: ConcentrationTransition[];
  slowdownIndex: number;
  spatialInefficiency: number;
  recoveryAfterErrorMs: number;
  primaryBottlenecks: string[];
}

interface LadderConfig {
  leftNumber: number;
  rightMin: number;
  rightMax: number;
  timeLimit: number;
  isCountdown: boolean;
  isSequential: boolean;
}

interface PerformanceMetric {
  avgTime: number;
  totalAttempts: number;
  errorCount: number;
}

interface GameState {
  // Settings
  theme: ThemeType;
  configs: Record<ArithmeticType, QuestionConfig>;
  activeTypes: ArithmeticType[];
  sessionDuration: number;
  isAuditory: boolean;
  isFatigue: boolean;
  speechRate: number;

  // Ladder Config & Performance
  ladderConfig: LadderConfig;
  ladderPerformance: Record<string, PerformanceMetric>; // Key: "L x R"

  // History
  history: GameSession[];
  concentrationHistory: ConcentrationSession[];
  bestScore: number;
  totalQuestionsSolved: number;

  // Actions
  setTheme: (theme: ThemeType) => void;
  updateConfig: (type: ArithmeticType, config: Partial<QuestionConfig>) => void;
  updateLadderConfig: (config: Partial<LadderConfig>) => void;
  recordLadderAttempt: (question: string, timeTaken: number, isCorrect: boolean) => void;
  toggleType: (type: ArithmeticType) => void;
  setPracticeSetup: (payload: {
    activeTypes: ArithmeticType[];
    duration?: number;
    configOverrides?: Partial<Record<ArithmeticType, Partial<QuestionConfig>>>;
  }) => void;
  addSession: (session: GameSession) => void;
  addConcentrationSession: (session: ConcentrationSession) => void;
  setSessionDuration: (duration: number) => void;
  toggleAuditory: () => void;
  toggleFatigue: () => void;
}

const DEFAULT_CONFIGS: Record<ArithmeticType, QuestionConfig> = {
  addition: { type: 'addition', leftMin: 10, leftMax: 99, rightMin: 10, rightMax: 99 },
  subtraction: { type: 'subtraction', leftMin: 10, leftMax: 99, rightMin: 10, rightMax: 99 },
  multiplication: { type: 'multiplication', leftMin: 2, leftMax: 12, rightMin: 2, rightMax: 100 },
  division: { type: 'division', leftMin: 2, leftMax: 12, rightMin: 2, rightMax: 100 },
  percentage: { type: 'percentage' },
  fraction: { type: 'fraction' },
  decimal: { type: 'decimal', leftMin: 1, leftMax: 10, rightMin: 1, rightMax: 10, decimals: 1 },
  indices: { type: 'indices', leftMin: 2, leftMax: 20, rightMin: 2, rightMax: 3 },
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      theme: 'terminal-dark',
      configs: DEFAULT_CONFIGS,
      activeTypes: ['addition', 'subtraction', 'multiplication'],
      sessionDuration: 120,
      isAuditory: false,
      isFatigue: false,
      speechRate: 1.0,
      ladderConfig: {
        leftNumber: 17,
        rightMin: 1,
        rightMax: 100,
        timeLimit: 5,
        isCountdown: true,
        isSequential: false,
      },
      ladderPerformance: {},
      history: [],
      concentrationHistory: [],
      bestScore: 0,
      totalQuestionsSolved: 0,

      setTheme: (theme) => set({ theme }),

      updateConfig: (type, config) =>
        set((state) => ({
          configs: {
            ...state.configs,
            [type]: { ...state.configs[type], ...config },
          },
        })),

      updateLadderConfig: (config) =>
        set((state) => ({
          ladderConfig: { ...state.ladderConfig, ...config },
        })),

      recordLadderAttempt: (question, timeTaken, isCorrect) =>
        set((state) => {
          const current = state.ladderPerformance[question] || { avgTime: 0, totalAttempts: 0, errorCount: 0 };
          const newAttempts = current.totalAttempts + 1;
          const newAvgTime = (current.avgTime * current.totalAttempts + timeTaken) / newAttempts;
          
          return {
            ladderPerformance: {
              ...state.ladderPerformance,
              [question]: {
                avgTime: newAvgTime,
                totalAttempts: newAttempts,
                errorCount: current.errorCount + (isCorrect ? 0 : 1),
              },
            },
          };
        }),

      toggleType: (type) =>
        set((state) => ({
          activeTypes: state.activeTypes.includes(type)
            ? state.activeTypes.filter((t) => t !== type)
            : [...state.activeTypes, type],
        })),

      setPracticeSetup: ({ activeTypes, duration, configOverrides }) =>
        set((state) => {
          const nextConfigs = { ...state.configs };
          if (configOverrides) {
            Object.entries(configOverrides).forEach(([type, override]) => {
              if (!override) return;
              const typed = type as ArithmeticType;
              nextConfigs[typed] = { ...nextConfigs[typed], ...override };
            });
          }

          return {
            activeTypes,
            sessionDuration: duration ?? state.sessionDuration,
            configs: nextConfigs,
          };
        }),

      addSession: (session) =>
        set((state) => ({
          history: [session, ...state.history].slice(0, 100),
          bestScore: Math.max(state.bestScore, session.score),
          totalQuestionsSolved: state.totalQuestionsSolved + session.totalQuestions,
        })),

      addConcentrationSession: (session) =>
        set((state) => ({
          concentrationHistory: [session, ...state.concentrationHistory].slice(0, 100),
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
