// A dart is { number: 0-20 or 25, multiplier: 1 | 2 | 3 }. Number 0 is a miss.
// Triple 25 does not exist. Double 25 is the inner bull.

export const MISS = Object.freeze({ number: 0, multiplier: 1 });

export function isValidDart(dart) {
  if (!dart || typeof dart !== 'object') return false;
  const { number, multiplier } = dart;
  if (![1, 2, 3].includes(multiplier)) return false;
  if (!Number.isInteger(number)) return false;
  if (number === 0) return multiplier === 1;
  if (number === 25) return multiplier !== 3;
  return number >= 1 && number <= 20;
}

// Builds a clean dart. A miss pressed with Double/Triple is still just a miss.
// Returns null for impossible darts (e.g. triple 25).
export function makeDart(number, multiplier = 1) {
  const dart = number === 0 ? { ...MISS } : { number, multiplier };
  return isValidDart(dart) ? Object.freeze(dart) : null;
}

export function dartScore(dart) {
  return dart.number * dart.multiplier;
}

export function isDouble(dart) {
  return dart.number !== 0 && dart.multiplier === 2;
}

export function isTriple(dart) {
  return dart.multiplier === 3;
}

// Short label for dart slots and checkout hints: "T20", "D16", "7", "25", "BULL", "Miss".
export function dartLabel(dart) {
  if (dart.number === 0) return 'Miss';
  if (dart.number === 25) return dart.multiplier === 2 ? 'BULL' : '25';
  const prefix = { 1: '', 2: 'D', 3: 'T' }[dart.multiplier];
  return prefix + dart.number;
}
