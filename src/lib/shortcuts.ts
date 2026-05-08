export function getMultiplicationTip(num1: number, num2: number): string | null {
  // Shortcut for x11
  if (num1 === 11 || num2 === 11) {
    const other = num1 === 11 ? num2 : num1;
    if (other < 100) {
      return "Tip for x11: Add the digits of the other number and place the sum in the middle (e.g., 24 x 11: 2+4=6, result 264).";
    }
  }

  // Shortcut for x5
  if (num1 === 5 || num2 === 5) {
    return "Tip for x5: Multiply by 10 and divide by 2.";
  }

  // Shortcut for x15
  if (num1 === 15 || num2 === 15) {
    return "Tip for x15: Multiply by 10, then add half of that result to itself.";
  }

  // Shortcut for squaring numbers ending in 5
  if (num1 === num2 && num1 % 10 === 5) {
    const firstDigit = Math.floor(num1 / 10);
    return `Tip for squaring ${num1}: Multiply ${firstDigit} by ${firstDigit + 1} (${firstDigit * (firstDigit + 1)}) and append 25 at the end.`;
  }

  // Shortcut for x25
  if (num1 === 25 || num2 === 25) {
    return "Tip for x25: Divide by 4 and multiply by 100.";
  }
  
  // Decomposition tip for double digits
  if (num1 > 10 && num2 > 10) {
    const nearest10 = Math.round(num2 / 10) * 10;
    const diff = num2 - nearest10;
    return `Tip: Decompose into (${num1} x ${nearest10}) + (${num1} x ${diff}).`;
  }

  return null;
}
