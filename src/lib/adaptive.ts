import { ArithmeticType, QuestionConfig } from '@/lib/arithmetic';
import { GameAttempt, GameSession, GuidedRecommendation } from '@/store/useGameStore';

export const BENCHMARK_TARGET_QPM = 25;
const DIFFICULTY_BANDS = {
  easyMax: 0.9,
  mediumMax: 1.4,
  easyWeight: 0.8,
  mediumWeight: 1.0,
  hardWeight: 1.25,
} as const;

type TypeStats = {
  attempts: number;
  correct: number;
  totalTime: number;
};

type PromptGroup = {
  promptId: string;
  question: string;
  answer: number;
  type: ArithmeticType;
  difficulty?: number;
  attempts: GameAttempt[];
  firstAttemptCorrect: boolean;
  attemptCount: number;
  timeToCorrectMs: number;
};

export function buildGuidedRecommendation(
  history: GameSession[],
  configs: Record<ArithmeticType, QuestionConfig>
): {
  recommendation: GuidedRecommendation;
  configOverrides: Partial<Record<ArithmeticType, Partial<QuestionConfig>>>;
} {
  const ranked = rankWeakTypes(history);
  const focusTypes = ranked.slice(0, 2).map((item) => item.type);
  const fallback: ArithmeticType[] = ['multiplication', 'addition'];
  const chosen = focusTypes.length > 0 ? focusTypes : fallback;

  const configOverrides: Partial<Record<ArithmeticType, Partial<QuestionConfig>>> = {};
  chosen.forEach((type) => {
    const current = configs[type];
    const leftSpan = (current.leftMax ?? 100) - (current.leftMin ?? 2);
    const rightSpan = (current.rightMax ?? 100) - (current.rightMin ?? 2);
    configOverrides[type] = {
      leftMin: current.leftMin ?? 2,
      rightMin: current.rightMin ?? 2,
      leftMax: Math.max((current.leftMin ?? 2) + 6, (current.leftMin ?? 2) + Math.floor(leftSpan * 0.45)),
      rightMax: Math.max((current.rightMin ?? 2) + 6, (current.rightMin ?? 2) + Math.floor(rightSpan * 0.45)),
    };
  });

  const recommendation: GuidedRecommendation = {
    title: 'Next Best 5 Minutes',
    summary:
      chosen.length > 0
        ? `Focus on ${chosen.join(' + ')} with narrower ranges to lock first-pass precision, then rebuild speed.`
        : 'Start with multiplication + addition precision block to establish baseline.',
    focusTypes: chosen,
    duration: 300,
    targetMetric: 'Reach >=85% first-pass precision with stable response time.',
  };

  return { recommendation, configOverrides };
}

export function groupAttemptsByPrompt(attempts: GameAttempt[]): PromptGroup[] {
  const grouped = new Map<string, GameAttempt[]>();
  attempts.forEach((attempt, index) => {
    const key = attempt.promptId ?? `${attempt.question}__${attempt.answer}__${index}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(attempt);
  });

  return Array.from(grouped.entries()).map(([promptId, rows]) => {
    const first = rows[0];
    const firstAttemptCorrect = !!first?.correct;
    const attemptCount = rows.length;
    const timeToCorrectMs = rows.reduce((sum, row) => sum + row.timeTaken, 0);
    return {
      promptId,
      question: first.question,
      answer: first.answer,
      type: first.type,
      difficulty: first.difficulty,
      attempts: rows,
      firstAttemptCorrect,
      attemptCount,
      timeToCorrectMs,
    };
  });
}

export function computePromptMetrics(attempts: GameAttempt[]) {
  const groups = groupAttemptsByPrompt(attempts);
  if (groups.length === 0) {
    return {
      firstPassPrecision: 0,
      attemptEfficiency: 0,
      recoveryRate: 0,
      solvedPrompts: 0,
      totalAttempts: 0,
    };
  }

  const firstPassCorrect = groups.filter((g) => g.firstAttemptCorrect).length;
  const firstPassPrecision = Math.round((firstPassCorrect / groups.length) * 100);
  const attemptEfficiency = parseFloat(((groups.length / attempts.length) * 100).toFixed(1));
  const resolvedInTwo = groups.filter((g) => g.attemptCount <= 2).length;
  const recoveryRate = Math.round((resolvedInTwo / groups.length) * 100);

  return {
    firstPassPrecision,
    attemptEfficiency,
    recoveryRate,
    solvedPrompts: groups.length,
    totalAttempts: attempts.length,
  };
}

export function rankWeakTypes(history: GameSession[]): Array<{ type: ArithmeticType; weakness: number }> {
  const stats: Partial<Record<ArithmeticType, TypeStats>> = {};
  const recent = history.slice(0, 20);

  recent.forEach((session) => {
    const groups = groupAttemptsByPrompt(session.questions);
    groups.forEach((group) => {
      const entry = stats[group.type] ?? { attempts: 0, correct: 0, totalTime: 0 };
      entry.attempts += 1;
      entry.correct += group.firstAttemptCorrect ? 1 : 0;
      entry.totalTime += group.timeToCorrectMs;
      stats[group.type] = entry;
    });
  });

  return (Object.entries(stats) as Array<[ArithmeticType, TypeStats]>)
    .map(([type, metric]) => {
      const firstPassPrecision = metric.attempts > 0 ? metric.correct / metric.attempts : 0;
      const avgSeconds = metric.attempts > 0 ? metric.totalTime / metric.attempts / 1000 : 0;
      const weakness = (1 - firstPassPrecision) * 70 + Math.min(avgSeconds / 6, 1) * 30;
      return { type, weakness: parseFloat(weakness.toFixed(2)) };
    })
    .sort((a, b) => b.weakness - a.weakness);
}

export function computeAdvancedAnalytics(history: GameSession[]) {
  const recent = history.slice(0, 25).reverse();
  const velocitySeries = recent.map((session, index) => {
    const minutes = Math.max((session.endTime - session.startTime) / 60000, 1 / 60);
    const qpm = session.totalQuestions / minutes;
    const qualityScore =
      session.qualityScore ??
      Math.round((((session.firstPassPrecision ?? session.accuracy) / 100) * 0.6 + Math.min(qpm / 40, 1) * 0.4) * 100);

    return {
      name: `S${index + 1}`,
      firstPassPrecision: session.firstPassPrecision ?? session.accuracy,
      qpm: parseFloat(qpm.toFixed(1)),
      quality: qualityScore,
    };
  });

  const slope = calculateSlope(velocitySeries.map((row) => row.quality));
  const plateauFlag = velocitySeries.length >= 4 && slope < 0.25;

  const weakness = rankWeakTypes(history).slice(0, 4);
  const expensiveMistakes = collectExpensiveMistakes(history);

  return {
    velocitySeries,
    plateauFlag,
    weakness,
    expensiveMistakes,
  };
}

export function computeDifficultyWeightedMetrics(
  attempts: GameAttempt[],
  durationSeconds: number
) {
  if (attempts.length === 0) {
    return {
      weightedAccuracy: 0,
      weightedFirstPassPrecision: 0,
      attemptEfficiency: 0,
      recoveryCostIndex: 0,
      avgDifficulty: 1,
      weightedQpm: 0,
      weightedBenchmark: 0,
    };
  }

  const groups = groupAttemptsByPrompt(attempts);
  if (groups.length === 0) {
    return {
      weightedAccuracy: 0,
      weightedFirstPassPrecision: 0,
      attemptEfficiency: 0,
      recoveryCostIndex: 0,
      avgDifficulty: 1,
      weightedQpm: 0,
      weightedBenchmark: 0,
    };
  }

  const weighted = groups.map((group) => {
    const raw = group.difficulty ?? 1;
    return difficultyBandWeight(raw);
  });
  const totalWeight = weighted.reduce((sum, w) => sum + w, 0);
  const firstPassWeight = groups.reduce((sum, group, idx) => sum + (group.firstAttemptCorrect ? weighted[idx] : 0), 0);
  const avgDifficulty = totalWeight / groups.length;
  const weightedFirstPassPrecision = totalWeight > 0 ? (firstPassWeight / totalWeight) * 100 : 0;

  const totalAttempts = attempts.length;
  const solvedPrompts = groups.length;
  const attemptEfficiency = totalAttempts > 0 ? solvedPrompts / totalAttempts : 0;

  const retries = groups.reduce((sum, group) => sum + Math.max(0, group.attemptCount - 1), 0);
  const retryPenalty = totalAttempts > 0 ? retries / totalAttempts : 0;
  const timePenalty = groups.length > 0
    ? groups.reduce((sum, group) => {
        const perAttempt = group.timeToCorrectMs / Math.max(group.attemptCount, 1);
        return sum + Math.max(0, (group.timeToCorrectMs - perAttempt) / Math.max(group.timeToCorrectMs, 1));
      }, 0) / groups.length
    : 0;
  const recoveryCostIndex = Math.min(100, Math.round((retryPenalty * 0.7 + timePenalty * 0.3) * 100));

  const durationMins = Math.max(durationSeconds / 60, 1 / 60);
  const qpm = solvedPrompts / durationMins;
  const difficultyFactor = Math.max(0.8, Math.min(avgDifficulty / 1.2, 1.35));
  const weightedQpm = qpm * difficultyFactor;
  const recoveryFactor = Math.max(0.65, 1 - recoveryCostIndex / 200);
  const weightedBenchmark = Math.min(
    Math.round((weightedQpm / BENCHMARK_TARGET_QPM) * (weightedFirstPassPrecision / 100) * recoveryFactor * 100),
    100
  );

  return {
    weightedAccuracy: Math.round(weightedFirstPassPrecision),
    weightedFirstPassPrecision: Math.round(weightedFirstPassPrecision),
    attemptEfficiency: parseFloat((attemptEfficiency * 100).toFixed(1)),
    recoveryCostIndex,
    avgDifficulty: parseFloat(avgDifficulty.toFixed(2)),
    weightedQpm: parseFloat(weightedQpm.toFixed(1)),
    weightedBenchmark,
  };
}

export function buildPerformanceComparison(
  session: GameSession,
  index: number
) {
  const durationSeconds = Math.max((session.endTime - session.startTime) / 1000, 1);
  const weighted = computeDifficultyWeightedMetrics(session.questions, durationSeconds);
  const groups = groupAttemptsByPrompt(session.questions);
  const difficultyBands = groups.reduce(
    (acc, g) => {
      const d = g.difficulty ?? 1;
      if (d < DIFFICULTY_BANDS.easyMax) acc.easy += 1;
      else if (d <= DIFFICULTY_BANDS.mediumMax) acc.medium += 1;
      else acc.hard += 1;
      return acc;
    },
    { easy: 0, medium: 0, hard: 0 }
  );

  return {
    name: `S${index + 1}`,
    weightedScore: weighted.weightedBenchmark,
    scoreTrend: weighted.weightedBenchmark,
    eliteBenchmark: 85,
    benchmarkGap: weighted.weightedBenchmark - 85,
    difficultyBands,
  };
}

function difficultyBandWeight(difficulty: number) {
  if (difficulty < DIFFICULTY_BANDS.easyMax) return DIFFICULTY_BANDS.easyWeight;
  if (difficulty <= DIFFICULTY_BANDS.mediumMax) return DIFFICULTY_BANDS.mediumWeight;
  return DIFFICULTY_BANDS.hardWeight;
}

function calculateSlope(values: number[]) {
  if (values.length < 2) return 0;
  return (values[values.length - 1] - values[0]) / (values.length - 1);
}

function collectExpensiveMistakes(history: GameSession[]) {
  const mistakeMap = new Map<string, { misses: number; totalTimeLost: number }>();
  history.slice(0, 25).forEach((session) => {
    const groups = groupAttemptsByPrompt(session.questions);
    groups.forEach((group) => {
      const misses = Math.max(0, group.attemptCount - 1);
      if (misses === 0) return;
      const key = `${group.type}::${group.question}`;
      const current = mistakeMap.get(key) ?? { misses: 0, totalTimeLost: 0 };
      current.misses += misses;
      current.totalTimeLost += group.timeToCorrectMs;
      mistakeMap.set(key, current);
    });
  });

  return Array.from(mistakeMap.entries())
    .map(([key, value]) => {
      const [type, question] = key.split('::');
      return {
        type,
        question,
        misses: value.misses,
        timeLostSec: parseFloat((value.totalTimeLost / 1000).toFixed(1)),
      };
    })
    .sort((a, b) => b.timeLostSec - a.timeLostSec)
    .slice(0, 5);
}
