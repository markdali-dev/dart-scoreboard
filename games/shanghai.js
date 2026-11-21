// Shanghai (rules confirmed by Mark, 2026-11-21):
// - Rounds 1-7 or 1-20 (setting). In round N only number N scores.
// - Each hit scores its value: single N = N, double = 2N, triple = 3N.
// - A single, a double and a triple of the round's number in the same turn
//   (any order) is a "Shanghai" and wins on the spot.
// - Otherwise the highest total after the last round wins; a tie is shared.
// - Individual players only.
// Screen: the same bullseye target as Halve-It (the round's number on the bull).

import { dartScore } from '../js/core/dart.js';

export default {
  id: 'shanghai',
  name: 'Shanghai',
  group: 'Party',
  rules: 'In round 1 only 1s score, round 2 only 2s, and so on. Hit a single, double and triple of the number in one turn for a Shanghai and win instantly. Otherwise highest total wins.',
  options: [
    {
      id: 'rounds',
      label: 'Rounds',
      help: 'How many numbers to play through',
      type: 'choice',
      choices: [
        { value: 7, label: '1–7', description: 'Quick game: 7 rounds' },
        { value: 20, label: '1–20', description: 'Long game: 20 rounds' },
      ],
      default: 7,
    },
  ],
  minPlayers: 1,
  maxPlayers: 5,
  teams: false,
  showLastDarts: true, // other players' cards keep their last 3 darts

  describe: (options) => `Shanghai · ${options.rounds} rounds`,

  init(sides, options) {
    return {
      names: sides.map((s) => s.members[0]),
      rounds: options.rounds,
      totals: sides.map(() => 0),
      results: sides.map(() => []), // points per round
      round: 1,
      turnSide: null,
      turnPoints: 0,
      rings: [],         // which rings (1, 2, 3) of the number were hit this turn
      over: false,
      shanghai: null,    // the player who hit a Shanghai, if anyone did
      event: null,
    };
  },

  applyDart(state, dart, ctx) {
    const s = ctx.side;
    state.event = null;
    state.round = ctx.round;
    if (ctx.dartIndex === 0) { state.turnSide = s; state.turnPoints = 0; state.rings = []; }
    if (dart.number === ctx.round) {
      const points = dartScore(dart);
      state.turnPoints += points;
      state.totals[s] += points;
      if (!state.rings.includes(dart.multiplier)) state.rings.push(dart.multiplier);
    }

    // Single + double + triple of the number in one turn: instant win.
    if (state.rings.length === 3) {
      state.results[s][ctx.round - 1] = state.turnPoints;
      state.shanghai = s;
      state.over = true;
      state.event = { kind: 'win' };
      return { state, endTurn: true };
    }
    if (ctx.dartIndex < 2) return { state, endTurn: false };

    state.results[s][ctx.round - 1] = state.turnPoints;
    if (ctx.round === state.rounds && s === ctx.sideCount - 1) state.over = true;
    else if (s === ctx.sideCount - 1) state.round = ctx.round + 1;
    return { state, endTurn: true };
  },

  isOver: (state) => state.over,

  getResult(state) {
    const order = state.totals.map((_, i) => i).sort((a, b) => state.totals[b] - state.totals[a]);
    if (state.shanghai !== null) {
      return { winners: [state.shanghai], standings: [state.shanghai, ...order.filter((i) => i !== state.shanghai)], shanghai: true, kicker: 'Shanghai!' };
    }
    const best = Math.max(...state.totals);
    return { winners: order.filter((i) => state.totals[i] === best), standings: order };
  },

  getScoreboard(state, { current } = {}) {
    return state.totals.map((total, i) => {
      const done = state.results[i];
      const last = done.length ? done[done.length - 1] : undefined;
      return {
        main: total,
        turnPoints: i === current && state.turnSide === i ? state.turnPoints : undefined,
        // Only the current player's card shows the "Last round" line (one line per other card).
        stats: i !== current || last === undefined ? [] : [`Last round: +${last}`],
      };
    });
  },

  // Same bullseye target screen as Halve-It.
  getHint(state) {
    const n = state.round;
    return {
      bullseye: true,
      big: true, // plain 1-2 digit numbers: drawn larger on the bull (Mark, 2026-11-21)
      value: String(n),
      help: `Any ${n}; single, double and triple for a Shanghai`,
      round: `${n}/${state.rounds}`,
      next: n < state.rounds ? String(n + 1) : 'Last round',
    };
  },
};
