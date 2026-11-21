// Catch 40 (rules confirmed by Mark, 2026-11-21):
// - Checkouts 61 to 100 in order (setting: 61-100, or a quick 61-80).
// - 6 darts (2 turns) at each target, double out, X01-style busts: a bust ends that turn
//   and puts the score back to where the turn started.
// - Points per target: finished within 2 darts = 3, on the 3rd dart = 2, darts 4-6 = 1,
//   not finished = 0. (A bust uses up the rest of that turn's darts.)
// - Everyone plays 61, then everyone plays 62, and so on: each player's first turn, then
//   second turns for anyone who hasn't finished. Most points wins; ties share. 1-5 players.
// Screen: X01-style cards with the checkout suggestion.

import { dartScore, dartLabel } from '../js/core/dart.js';
import { findCheckout } from './x01.js';

export const FIRST = 61;
const pointsFor = (dartNo) => (dartNo <= 2 ? 3 : dartNo === 3 ? 2 : 1);

export default {
  id: 'catch40',
  name: 'Catch 40',
  group: 'Practice',
  rules: 'Check out 61, then 62, all the way to 100, with 6 darts at each, finishing on a double. 3 points for a finish in 2 darts, 2 points in 3 darts, 1 point in 4 to 6. Most points wins.',
  options: [
    {
      id: 'last',
      label: 'Targets',
      help: 'Which checkouts to play',
      type: 'choice',
      choices: [
        { value: 100, label: '61–100', description: 'The full game: 40 targets' },
        { value: 80, label: '61–80', description: 'Quick game: 20 targets' },
      ],
      default: 100,
    },
  ],
  minPlayers: 1,
  maxPlayers: 5,
  teams: false,
  slimThrower: true, // short screens: name and darts on one line, info line below
  roundText: (state) => `Target ${state.target}`,

  describe: (options) => `Catch 40 · 61–${options.last}`,

  init(sides, options) {
    return {
      last: options.last,
      target: FIRST,
      score: sides.map(() => FIRST),   // what's left to check out
      turnsUsed: sides.map(() => 0),   // turns used on this target (of 2)
      done: sides.map(() => false),    // finished with this target (checked out or out of darts)
      points: sides.map(() => 0),
      lastPoints: sides.map(() => null), // points from the previous target
      checkouts: sides.map(() => 0),
      hold: null,   // after a target ends, players after this one wait so player 1 starts the next
      over: false,
      turnStart: null,
      event: null,
    };
  },

  applyDart(state, dart, ctx) {
    const s = ctx.side;
    state.event = null;
    if (s === 0) state.hold = null;
    if (ctx.dartIndex === 0) state.turnStart = { side: s, score: state.score[s] };

    const left = state.score[s] - dartScore(dart);
    if (left < 0 || left === 1 || (left === 0 && dart.multiplier !== 2)) {
      state.score[s] = state.turnStart.score;
      state.event = { kind: 'bust', text: 'Bust' };
      endOfTurn(state, s, ctx);
      return { state, endTurn: true };
    }
    state.score[s] = left;

    if (left === 0) {
      const pts = pointsFor(state.turnsUsed[s] * 3 + ctx.dartIndex + 1);
      state.points[s] += pts;
      state.checkouts[s] += 1;
      state.event = { kind: 'big', text: `+${pts}` };
      finishTarget(state, s, pts, ctx);
      return { state, endTurn: true };
    }
    if (ctx.dartIndex === 2) endOfTurn(state, s, ctx);
    return { state, endTurn: false };
  },

  isOver: (state) => state.over,
  // Skip players who are finished with this target, and (between targets) the players
  // after the last thrower, so the next target starts with the first player again.
  isOut: (state, side) => state.done[side] || (state.hold !== null && side > state.hold),

  getResult(state) {
    const order = state.points.map((_, i) => i).sort((a, b) => state.points[b] - state.points[a]);
    const top = state.points[order[0]];
    return {
      winners: order.filter((i) => state.points[i] === top),
      standings: order,
      kicker: `${top} of ${(state.last - FIRST + 1) * 3} points`,
    };
  },

  // Thrower: the score left to check out. Everyone else: their points.
  getScoreboard(state, { current } = {}) {
    return state.points.map((pts, i) => {
      const throwing = i === current;
      const last = state.lastPoints[i];
      return {
        main: throwing ? state.score[i] : pts,
        mainLabel: throwing ? 'Left' : 'Pts',
        stats: throwing ? [
          `Dart ${state.turnsUsed[i] * 3 + 1}–${state.turnsUsed[i] * 3 + 3} of 6`,
          `${pts} pts`,
          last === null ? null : `Last +${last}`,
        ].filter(Boolean) : [],
      };
    });
  },

  getHint(state, { side, dartsLeft }) {
    const route = findCheckout(state.score[side], dartsLeft, 'double');
    return route ? { label: 'Out:', parts: route.map(dartLabel) } : null;
  },
};

function endOfTurn(state, s, ctx) {
  state.turnsUsed[s] += 1;
  if (state.turnsUsed[s] >= 2) finishTarget(state, s, 0, ctx);
}

// This player is finished with the target. When everyone is, move everyone on.
function finishTarget(state, s, pts, ctx) {
  state.done[s] = true;
  state.lastPoints[s] = pts;
  if (!state.done.every(Boolean)) return;
  if (state.target >= state.last) { state.over = true; return; }
  state.target += 1;
  state.score = state.score.map(() => state.target);
  state.turnsUsed = state.turnsUsed.map(() => 0);
  state.done = state.done.map(() => false);
  state.hold = s; // players after s wait, so the first player starts the next target
}
