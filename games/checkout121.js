// 121 Checkout (rules confirmed by Mark, 2026-11-21):
// - Each player works on their own target, starting at 121, with 9 darts (3 turns) to
//   check it out, X01 style: double out, and a bust (below zero, 1 left, or zero not on a
//   double) loses the rest of that turn and puts the score back to the start of the turn.
// - Check out: the next target is one higher (121 -> 122). Fail: back to 121.
// - Each player gets a fixed number of targets (setting: 5 or 10). When everyone is done,
//   the highest target checked out wins; ties share. 1-5 players.
// Screen: X01-style cards (score left to check out) with the checkout suggestion.

import { dartScore, dartLabel } from '../js/core/dart.js';
import { findCheckout } from './x01.js';

export const START = 121;
export const TURNS_PER_TARGET = 3; // 9 darts

export default {
  id: 'checkout121',
  name: '121 Checkout',
  group: 'Practice',
  rules: 'Check out 121 in 9 darts, finishing on a double. Do it and your next target is 122; miss and you go back to 121. Highest checkout after all your targets wins.',
  options: [
    {
      id: 'targets',
      label: 'Targets',
      help: 'How many targets each player gets',
      type: 'choice',
      choices: [
        { value: 5, label: '5', description: 'Quick game: 5 targets each' },
        { value: 10, label: '10', description: 'Long game: 10 targets each' },
      ],
      default: 5,
    },
  ],
  minPlayers: 1,
  maxPlayers: 5,
  teams: false,
  slimThrower: true, // short screens: name and darts on one line, info line below

  describe: (options) => `121 Checkout · ${options.targets} targets`,

  init(sides, options) {
    return {
      targets: options.targets,
      target: sides.map(() => START),  // the target each player is working on
      score: sides.map(() => START),   // what's left to check out
      turnsUsed: sides.map(() => 0),   // turns used on the current target (of 3)
      dartsUsed: sides.map(() => 0),   // darts used on the current target (of 9)
      attempts: sides.map(() => 0),    // targets finished (checked out or not)
      best: sides.map(() => 0),        // highest target checked out
      checkouts: sides.map(() => 0),
      turnStart: null,
      event: null,
    };
  },

  applyDart(state, dart, ctx) {
    const s = ctx.side;
    state.event = null;
    if (ctx.dartIndex === 0) state.turnStart = { side: s, score: state.score[s] };
    state.dartsUsed[s] += 1;

    const left = state.score[s] - dartScore(dart);
    if (left < 0 || left === 1 || (left === 0 && dart.multiplier !== 2)) {
      state.score[s] = state.turnStart.score;
      state.event = { kind: 'bust', text: 'Bust' };
      endOfTurn(state, s);
      return { state, endTurn: true };
    }
    state.score[s] = left;

    if (left === 0) {
      state.best[s] = Math.max(state.best[s], state.target[s]);
      state.checkouts[s] += 1;
      state.event = { kind: 'big', text: `${state.target[s]} out!` };
      nextTarget(state, s, state.target[s] + 1);
      return { state, endTurn: true };
    }
    if (ctx.dartIndex === 2) endOfTurn(state, s);
    return { state, endTurn: false };
  },

  isOver: (state) => state.attempts.every((a) => a >= state.targets),
  isOut: (state, side) => state.attempts[side] >= state.targets, // done: skip their turns

  getResult(state) {
    const order = state.best.map((_, i) => i).sort((a, b) => state.best[b] - state.best[a] || state.checkouts[b] - state.checkouts[a]);
    const top = Math.max(...state.best);
    const winners = order.filter((i) => state.best[i] === top);
    return { winners, standings: order, kicker: top ? `Best checkout ${top}` : 'No checkouts' };
  },

  getScoreboard(state, { current } = {}) {
    return state.score.map((score, i) => {
      const done = state.attempts[i] >= state.targets;
      return {
        main: done ? (state.best[i] || '–') : score,
        mainLabel: done ? 'Best' : '',
        badge: done ? 'Done' : undefined,
        // Only the thrower's card has an info line, so 5 players fit on a short phone.
        stats: done || i !== current ? [] : [
          `Target ${state.target[i]} (${state.attempts[i] + 1}/${state.targets})`,
          `Dart ${Math.min(state.dartsUsed[i] + 1, 9)}/9`,
          `Best ${state.best[i] || '–'}`,
        ],
      };
    });
  },

  // Checkout suggestion, as in X01.
  getHint(state, { side, dartsLeft }) {
    const route = findCheckout(state.score[side], dartsLeft, 'double');
    return route ? { label: 'Out:', parts: route.map(dartLabel) } : null;
  },
};

// A turn ended without a checkout: after the 3rd turn the target is failed.
function endOfTurn(state, s) {
  state.turnsUsed[s] += 1;
  if (state.turnsUsed[s] >= TURNS_PER_TARGET) nextTarget(state, s, START);
}

function nextTarget(state, s, target) {
  state.attempts[s] += 1;
  state.target[s] = target;
  state.score[s] = target;
  state.turnsUsed[s] = 0;
  state.dartsUsed[s] = 0;
}
