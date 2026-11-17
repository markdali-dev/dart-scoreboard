// X01: count down from the start score to exactly zero.
//
// In rule:  the dart that starts your scoring (before it, darts count for nothing).
// Out rule: the dart that finishes the game.
// Bust: going below zero, leaving a score that can't be finished under the
// Out rule, or reaching zero on the wrong ring. The score goes back to what it
// was at the start of the turn (an In opened that turn is undone too).
// The inner bull counts as a double.

import { dartScore, dartLabel } from '../js/core/dart.js';

const RING_CHOICES = [
  { value: 'open', label: 'Open', description: 'Any dart counts' },
  { value: 'double', label: 'Double', description: 'Must be a double (bull counts)' },
  { value: 'triple', label: 'Triple', description: 'Must be a triple' },
  { value: 'master', label: 'Master', description: 'A double or a triple (bull counts)' },
];

const RING_TEXT = { double: 'a double', triple: 'a triple', master: 'a double or triple' };

// Does this dart satisfy an In/Out rule?
export function fitsRule(dart, rule) {
  if (dart.number === 0) return false;
  if (rule === 'open') return true;
  if (rule === 'double') return dart.multiplier === 2;
  if (rule === 'triple') return dart.multiplier === 3;
  return dart.multiplier === 2 || dart.multiplier === 3; // master
}

// Lowest score that can still be finished under the Out rule.
function minFinish(rule) {
  return { open: 1, double: 2, master: 2, triple: 3 }[rule];
}

export default {
  id: 'x01',
  name: 'X01',
  group: 'Core',
  rules: 'Count down from the start score to exactly zero. Go below zero, or leave a score you can’t finish, and the turn is a bust.',
  options: [
    {
      id: 'start',
      label: 'Start',
      help: 'The score everyone counts down from',
      type: 'choice',
      choices: [
        { value: 301, label: '301' },
        { value: 501, label: '501' },
        { value: 701, label: '701' },
      ],
      customLabel: 'Type your own start score',
      custom: { min: 2, max: 9999 },
      default: 501,
    },
    { id: 'in', label: 'In', help: 'The dart that starts your scoring', type: 'choice', choices: RING_CHOICES, default: 'open' },
    { id: 'out', label: 'Out', help: 'The dart that finishes the game', type: 'choice', choices: RING_CHOICES, default: 'double' },
  ],
  // Checkout hints ("Out: T20 D16") are always shown; not a setting.
  minPlayers: 1,
  maxPlayers: 5,
  teams: true,

  init(sides, options) {
    return {
      start: options.start,
      inRule: options.in,
      outRule: options.out,
      scores: sides.map(() => options.start),
      opened: sides.map(() => options.in === 'open'),
      darts: sides.map(() => 0),       // darts thrown, for the average
      last: sides.map(() => null),     // last finished turn: { points, bust }
      turnStart: null,                 // { side, score, opened } for the turn in progress
      winner: null,
      event: null,                     // feedback for the screen: bust, big score, win
    };
  },

  applyDart(state, dart, ctx) {
    const s = ctx.side;
    state.event = null;
    if (ctx.dartIndex === 0) state.turnStart = { side: s, score: state.scores[s], opened: state.opened[s] };
    state.darts[s] += 1;

    if (!state.opened[s]) {
      if (!fitsRule(dart, state.inRule)) return endIfLast(state, ctx);
      state.opened[s] = true;
    }

    const left = state.scores[s] - dartScore(dart);
    const bust = left < 0 || (left === 0 && !fitsRule(dart, state.outRule)) || (left > 0 && left < minFinish(state.outRule));
    if (bust) {
      state.scores[s] = state.turnStart.score;
      state.opened[s] = state.turnStart.opened;
      state.last[s] = { points: 0, bust: true };
      state.event = { kind: 'bust', text: 'Bust' };
      return { state, endTurn: true };
    }

    state.scores[s] = left;
    if (left === 0) {
      state.winner = s;
      state.last[s] = { points: state.turnStart.score, bust: false };
      state.event = { kind: 'win' };
      return { state, endTurn: true };
    }
    return endIfLast(state, ctx);
  },

  isOver: (state) => state.winner !== null,

  getResult(state) {
    const order = state.scores.map((_, i) => i).sort((a, b) => state.scores[a] - state.scores[b]);
    return { winners: [state.winner], standings: order };
  },

  getScoreboard(state) {
    return state.scores.map((score, i) => {
      const avg = state.darts[i] ? ((state.start - score) / state.darts[i]) * 3 : 0;
      const last = state.last[i];
      return {
        main: score,
        turnPoints: state.turnStart?.side === i ? state.turnStart.score - score : 0,
        stats: [
          last ? `Last ${last.bust ? 'Bust' : last.points}` : null,
          `Avg ${avg.toFixed(1)}`,
          `${state.darts[i]} ${state.darts[i] === 1 ? 'dart' : 'darts'}`,
        ].filter(Boolean),
      };
    });
  },

  // Checkout suggestion for the thrower, or a reminder of the In rule.
  getHint(state, { side, dartsLeft }) {
    if (!state.opened[side]) return { label: 'In:', parts: [`Hit ${RING_TEXT[state.inRule]} to start`] };
    const route = findCheckout(state.scores[side], dartsLeft, state.outRule);
    return route ? { label: 'Out:', parts: route.map(dartLabel) } : null;
  },
};

// ---------- checkout finder ----------
// Tries every route of 1, 2 or 3 darts that finishes exactly under the Out rule,
// and picks the one with the fewest darts, then the "easiest" by a simple cost:
// common setup darts (T20, T19, 20...) and favourite doubles (D20, D16...) cost least.

const ALL_DARTS = [];
for (const m of [3, 1, 2]) for (let n = 20; n >= 1; n--) ALL_DARTS.push({ number: n, multiplier: m });
ALL_DARTS.push({ number: 25, multiplier: 1 }, { number: 25, multiplier: 2 });

const FAVOURITE_DOUBLES = [20, 16, 18, 12, 10, 8, 14, 6, 4, 2];

function setupCost(d) {
  if (d.multiplier === 3) return { 20: 0, 19: 1, 18: 2, 17: 3 }[d.number] ?? 4;
  if (d.multiplier === 1) return d.number === 25 ? 4 : d.number >= 16 ? 1 : 2;
  return 8; // doubles are hard to aim at for setting up
}

function finishCost(d, rule) {
  if (d.number === 25 && d.multiplier === 2) return 3;
  if (d.multiplier === 2) {
    const i = FAVOURITE_DOUBLES.indexOf(d.number);
    return i < 0 ? 4 : i < 2 ? 0 : i < 6 ? 1 : 2;
  }
  if (d.multiplier === 3) return rule === 'triple' ? 0 : 3;
  return rule === 'open' ? 0 : 9;
}

export function findCheckout(score, dartsLeft, rule) {
  const finishers = ALL_DARTS.filter((d) => fitsRule(d, rule));
  const okLeft = (n) => n >= minFinish(rule);
  for (let n = 1; n <= dartsLeft; n++) {
    let best = null;
    const consider = (route, cost) => { if (!best || cost < best.cost) best = { route, cost }; };
    if (n === 1) {
      for (const f of finishers) if (dartScore(f) === score) consider([f], finishCost(f, rule));
    } else {
      for (const a of ALL_DARTS) {
        const r1 = score - dartScore(a);
        if (!okLeft(r1)) continue;
        if (n === 2) {
          for (const f of finishers) if (dartScore(f) === r1) consider([a, f], setupCost(a) + finishCost(f, rule));
        } else {
          for (const b of ALL_DARTS) {
            const r2 = r1 - dartScore(b);
            if (!okLeft(r2)) continue;
            for (const f of finishers) if (dartScore(f) === r2) consider([a, b, f], setupCost(a) + setupCost(b) + finishCost(f, rule));
          }
        }
      }
    }
    if (best) return best.route;
  }
  return null;
}

function endIfLast(state, ctx) {
  if (ctx.dartIndex === 2) {
    const start = state.turnStart.score;
    state.last[ctx.side] = { points: start - state.scores[ctx.side], bust: false };
    if (start - state.scores[ctx.side] >= 100) state.event = { kind: 'big', text: String(start - state.scores[ctx.side]) };
  }
  return { state, endTurn: false };
}
