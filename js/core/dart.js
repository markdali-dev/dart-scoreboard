// A dart is { number: 0-20 or 25, multiplier: 1 | 2 | 3 }. Number 0 is a miss.
// Triple 25 does not exist. Double 25 is the inner bull.

export const MISS = Object.freeze({ number: 0, multiplier: 1 });

// Some games (Crackshot) score by board AREA instead of number. Those darts carry a
// `zone` as well; number/multiplier are filled in where they're known (bulls) and are
// 0/1 where the number doesn't matter.
export const ZONES = {
  inner: { number: 0, multiplier: 1, label: 'In' },       // inner single area
  bull: { number: 25, multiplier: 1, label: 'Bull' },     // outer bull (the Bull button)
  dbull: { number: 25, multiplier: 2, label: 'DB' },      // inner (double) bull
  fire: { number: 0, multiplier: 1, label: 'Fire' },      // triple ring, "ring of fire"
  miss: { number: 0, multiplier: 1, label: 'Miss' },      // outer single, double ring or off the board
};

export function zoneDart(zone) {
  const z = ZONES[zone];
  return z ? Object.freeze({ number: z.number, multiplier: z.multiplier, zone }) : null;
}

export function isValidDart(dart) {
  if (!dart || typeof dart !== 'object') return false;
  if (dart.zone !== undefined) {
    const z = ZONES[dart.zone];
    return !!z && dart.number === z.number && dart.multiplier === z.multiplier;
  }
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
  if (dart.zone) return ZONES[dart.zone].label;
  if (dart.number === 0) return 'Miss';
  if (dart.number === 25) return dart.multiplier === 2 ? 'BULL' : '25';
  const prefix = { 1: '', 2: 'D', 3: 'T' }[dart.multiplier];
  return prefix + dart.number;
}
