// Cricket: close every number in play by hitting it 3 times.
// Single = 1 mark, double = 2, triple = 3. Outer bull = 1 mark, inner bull = 2.
//
// Scoring options:
//   none      - no points. First to close every number wins.
//   points    - extra hits on a number you've closed score its value for you,
//               until every opponent has closed it too. Win: close everything
//               with the most (or equal most) points.
//   cutthroat - extra hits give the points to every opponent who hasn't closed
//               that number. Win: close everything with the fewest (or equal fewest) points.
//
// Numbers: 15-20 and bull, or Wild card (6 different random numbers from 1-20, plus bull).
// Wild card numbers are drawn once when the game starts (prepareOptions) and saved
// with the game, so undo and resume always see the same numbers.

import { shuffle } from '../js/core/setup.js';

const STANDARD_TARGETS = [20, 19, 18, 17, 16, 15, 25];

export default {
  id: 'cricket',
  name: 'Cricket',
  group: 'Cricket',
  rules: 'Hit each number in play 3 times to close it. Single = 1 mark, double = 2, triple = 3; outer bull 1, inner bull 2.',
  options: [
    {
      id: 'scoring',
      label: 'Scoring',
      help: 'What happens when you keep hitting a number you’ve closed',
      type: 'choice',
      choices: [
        { value: 'none', label: 'No score', description: 'No points. First to close everything wins' },
        { value: 'points', label: 'Points', description: 'Score on your closed numbers until everyone closes them. Close everything with the most points to win' },
        { value: 'cutthroat', label: 'Cut-throat', description: 'Your extra hits add points to opponents who haven’t closed it. Close everything with the fewest points to win' },
      ],
      default: 'none',
    },
    {
      id: 'numbers',
      label: 'Numbers',
      help: 'Which numbers are in play',
      type: 'choice',
      choices: [
        { value: 'standard', label: 'Std: 15–20', description: 'Standard: 15 to 20 and the bull' },
        { value: 'wild', label: 'Wild card', description: '6 random numbers drawn at the start, plus the bull' },
      ],
      default: 'standard',
    },
  ],
  minPlayers: 1,
  maxPlayers: 5,
  teams: true,
  board: 'marks', // the playing screen shows a marks grid instead of score cards

  // Called once when the game is created: fixes the numbers in play.
  prepareOptions(options, rng = Math.random) {
    const targets = options.numbers === 'wild'
      ? [...shuffle([...Array(20)].map((_, i) => i + 1), rng).slice(0, 6).sort((a, b) => b - a), 25]
      : STANDARD_TARGETS;
    return { ...options, targets };
  },

  describe(options) {
    const scoring = { none: 'No score', points: 'Points', cutthroat: 'Cut-throat' }[options.scoring];
    return ['Cricket', scoring, options.numbers === 'wild' ? 'Wild card' : null].filter(Boolean).join(' · ');
  },

  init(sides, options) {
    const targets = options.targets ?? STANDARD_TARGETS;
    return {
      scoring: options.scoring,
      targets,
      marks: sides.map(() => targets.map(() => 0)), // 0-3 per number
      points: sides.map(() => 0),
      markCount: sides.map(() => 0), // marks that counted, for marks per round
      darts: sides.map(() => 0),
      winner: null,
      event: null,
    };
  },

  applyDart(state, dart, ctx) {
    const s = ctx.side;
    state.event = null;
    state.darts[s] += 1;
    const t = state.targets.indexOf(dart.number);
    if (t < 0) return { state, endTurn: false };

    const hits = dart.multiplier;
    const others = state.marks.map((_, i) => i).filter((i) => i !== s);
    const allOthersClosed = others.every((i) => state.marks[i][t] >= 3);
    const needed = 3 - state.marks[s][t];
    const used = Math.min(hits, Math.max(0, needed));
    const extra = hits - used;
    state.marks[s][t] += used;

    // Extra hits only matter while the number is still open for someone.
    if (extra > 0 && !allOthersClosed) {
      const value = dart.number * extra;
      if (state.scoring === 'points') state.points[s] += value;
      if (state.scoring === 'cutthroat') for (const i of others) if (state.marks[i][t] < 3) state.points[i] += value;
    }
    state.markCount[s] += used + (allOthersClosed || state.scoring === 'none' ? 0 : extra);

    for (let i = 0; i < state.marks.length; i++) {
      if (hasWon(state, i)) { state.winner = i; state.event = { kind: 'win' }; return { state, endTurn: true }; }
    }
    return { state, endTurn: false };
  },

  isOver: (state) => state.winner !== null,

  getResult(state) {
    const order = state.points.map((_, i) => i).sort((a, b) =>
      state.scoring === 'cutthroat' ? state.points[a] - state.points[b] : state.points[b] - state.points[a]);
    return { winners: [state.winner], standings: [state.winner, ...order.filter((i) => i !== state.winner)] };
  },

  getScoreboard(state) {
    return state.marks.map((marks, i) => ({
      main: state.scoring === 'none' ? null : state.points[i],
      marks,
      stats: [`MPR ${state.darts[i] ? ((state.markCount[i] / state.darts[i]) * 3).toFixed(2) : '0.00'}`],
    }));
  },

  // Rows for the marks grid: label, and whether everyone has closed it (dead).
  getRows(state) {
    return state.targets.map((n, t) => ({ label: n === 25 ? 'Bull' : String(n), dead: state.marks.every((m) => m[t] >= 3) }));
  },

  // Only the numbers in play get keys, lowest first and Bull last;
  // anything else is entered as 0 (miss).
  getKeys(state) {
    return [...state.targets].sort((a, b) => a - b);
  },
  keyLabels: { 25: 'Bull' }, // the bull key says "Bull" but still counts as 25
};

function hasWon(state, i) {
  if (!state.marks[i].every((m) => m >= 3)) return false;
  if (state.scoring === 'points') return state.points.every((p) => state.points[i] >= p);
  if (state.scoring === 'cutthroat') return state.points.every((p) => state.points[i] <= p);
  return true;
}
