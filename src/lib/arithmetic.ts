export type ArithmeticType = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'percentage' | 'fraction' | 'decimal' | 'indices';

export interface QuestionConfig {
  type: ArithmeticType;
  leftMin?: number;
  leftMax?: number;
  rightMin?: number;
  rightMax?: number;
  decimals?: number;
  allowNegatives?: boolean;
  integerOnly?: boolean;
}

export interface Question {
  text: string;
  answer: number;
  type: ArithmeticType;
  difficulty: number;
  timestamp: number;
}

export function generateQuestion(config: QuestionConfig): Question {
  const { type, leftMin = 2, leftMax = 100, rightMin = 2, rightMax = 100, decimals = 0, allowNegatives = false } = config;

  let num1: number;
  let num2: number;
  let text: string;
  let answer: number;

  const getRandomInRange = (min: number, max: number) => {
    let val = Math.floor(Math.random() * (max - min + 1)) + min;
    if (allowNegatives && Math.random() > 0.5) val *= -1;
    return val;
  };

  const applyDecimals = (val: number, places: number) => {
    if (places === 0) return val;
    return parseFloat((val / Math.pow(10, places)).toFixed(places));
  };

  const calculateDifficulty = (n1: number, n2: number, t: ArithmeticType) => {
    let score = 1;
    const abs1 = Math.abs(n1);
    const abs2 = Math.abs(n2);
    
    if (t === 'multiplication') {
      score = (abs1 * abs2) / 100;
      if (abs1 > 12 && abs2 > 12) score *= 1.5;
    } else if (t === 'addition' || t === 'subtraction') {
      score = (abs1 + abs2) / 100;
    } else if (t === 'indices') {
      score = Math.pow(abs1, abs2) / 100;
    }
    
    return parseFloat(score.toFixed(2));
  };

  switch (type) {
    case 'addition':
      num1 = getRandomInRange(leftMin, leftMax);
      num2 = getRandomInRange(rightMin, rightMax);
      text = `${num1} + ${num2}`;
      answer = num1 + num2;
      break;

    case 'subtraction':
      num1 = getRandomInRange(leftMin, leftMax);
      num2 = getRandomInRange(rightMin, rightMax);
      text = `${num1} - ${num2}`;
      answer = num1 - num2;
      break;

    case 'multiplication':
      num1 = getRandomInRange(leftMin, leftMax);
      num2 = getRandomInRange(rightMin, rightMax);
      text = `${num1} × ${num2}`;
      answer = num1 * num2;
      break;

    case 'division':
      num2 = getRandomInRange(rightMin, rightMax);
      answer = getRandomInRange(leftMin, leftMax);
      num1 = num2 * answer;
      text = `${num1} ÷ ${num2}`;
      break;

    case 'indices':
      // Usually smaller exponents for mental math
      num1 = getRandomInRange(leftMin, leftMax);
      num2 = getRandomInRange(rightMin, Math.min(rightMax, 3)); // Restrict to squared/cubed mostly
      text = `${num1}^${num2}`;
      answer = Math.pow(num1, num2);
      break;

    case 'decimal': {
      num1 = applyDecimals(getRandomInRange(leftMin * 10, leftMax * 10), decimals);
      num2 = applyDecimals(getRandomInRange(rightMin * 10, rightMax * 10), decimals);
      const op = Math.random() > 0.5 ? '+' : '-';
      text = `${num1} ${op} ${num2}`;
      answer = op === '+' ? num1 + num2 : num1 - num2;
      break;
    }

    case 'percentage': {
      const percent = [5, 10, 15, 20, 25, 50, 75, 12.5, 33.3][Math.floor(Math.random() * 9)];
      const base = getRandomInRange(1, 100) * 10;
      text = `${percent}% of ${base}`;
      answer = (percent / 100) * base;
      break;
    }

    default:
      num1 = getRandomInRange(2, 10);
      num2 = getRandomInRange(2, 10);
      text = `${num1} + ${num2}`;
      answer = num1 + num2;
  }

  return {
    text,
    answer: parseFloat(answer.toFixed(4)),
    type,
    difficulty: calculateDifficulty(num1, num2, type),
    timestamp: Date.now(),
  };
}
