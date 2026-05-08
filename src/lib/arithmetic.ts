export type ArithmeticType = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'percentage' | 'fraction' | 'decimal';

export interface QuestionConfig {
  type: ArithmeticType;
  minDigits?: number;
  maxDigits?: number;
  leftDigits?: number;
  rightDigits?: number;
  decimals?: number;
  allowNegatives?: boolean;
  integerOnly?: boolean;
}

export interface Question {
  text: string;
  answer: number;
  type: ArithmeticType;
  timestamp: number;
}

export function generateQuestion(config: QuestionConfig): Question {
  const { type, leftDigits = 1, rightDigits = 1, decimals = 0, allowNegatives = false } = config;

  let num1: number;
  let num2: number;
  let text: string;
  let answer: number;

  const getRange = (digits: number) => {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return { min, max };
  };

  const getRandom = (digits: number) => {
    const { min, max } = getRange(digits);
    let val = Math.floor(Math.random() * (max - min + 1)) + min;
    if (allowNegatives && Math.random() > 0.5) val *= -1;
    return val;
  };

  const applyDecimals = (val: number, places: number) => {
    if (places === 0) return val;
    return parseFloat((val / Math.pow(10, places)).toFixed(places));
  };

  switch (type) {
    case 'addition':
      num1 = getRandom(leftDigits);
      num2 = getRandom(rightDigits);
      text = `${num1} + ${num2}`;
      answer = num1 + num2;
      break;

    case 'subtraction':
      num1 = getRandom(leftDigits);
      num2 = getRandom(rightDigits);
      text = `${num1} - ${num2}`;
      answer = num1 - num2;
      break;

    case 'multiplication':
      num1 = getRandom(leftDigits);
      num2 = getRandom(rightDigits);
      text = `${num1} × ${num2}`;
      answer = num1 * num2;
      break;

    case 'division': {
      // For exact division, we generate the answer first
      const divisor = getRandom(rightDigits);
      const quotient = getRandom(leftDigits);
      num1 = divisor * quotient;
      num2 = divisor;
      text = `${num1} ÷ ${num2}`;
      answer = quotient;
      break;
    }

    case 'decimal': {
      num1 = applyDecimals(getRandom(leftDigits + decimals), decimals);
      num2 = applyDecimals(getRandom(rightDigits + decimals), decimals);
      const op = Math.random() > 0.5 ? '+' : '-';
      text = `${num1} ${op} ${num2}`;
      answer = op === '+' ? num1 + num2 : num1 - num2;
      break;
    }

    case 'percentage': {
      // e.g. 15% of 80
      const percent = [5, 10, 15, 20, 25, 50, 75][Math.floor(Math.random() * 7)];
      const base = getRandom(2) * 10;
      text = `${percent}% of ${base}`;
      answer = (percent / 100) * base;
      break;
    }

    default:
      num1 = getRandom(1);
      num2 = getRandom(1);
      text = `${num1} + ${num2}`;
      answer = num1 + num2;
  }

  return {
    text,
    answer: parseFloat(answer.toFixed(4)),
    type,
    timestamp: Date.now(),
  };
}
