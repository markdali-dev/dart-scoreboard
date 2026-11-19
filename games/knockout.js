// Knockout (rules confirmed by Mark, 2026-11-18):
// - Each player throws 3 darts; their turn total is the sum.
// - The very first turn of the game just sets the score to beat.
// - Every later turn must BEAT the previous player's total (a tie is not enough),
//   or the player loses a life.
// - The next player always has to beat whoever threw just before them,
//   even if that player failed.
// - Start with 3 or 5 lives (setting). 0 lives = out. Last player standing wins.
// - Individual players only.

import { dartScore } from '../js/core/dart.js';

export default {
  id: 'knockout',
  name: 'Knockout',
  group: 'Party',
  rules: 'Beat the previous player’s three-dart total or lose a life. A tie isn’t enough. Last player standing wins.',
  options: [
    {
      id: 'lives',
      label: 'Lives',
      help: 'How many lives everyone starts with',
      type: 'choice',
      choices: [
        { value: 3, label: '3', description: 'Quicker game' },
        { value: 5, label: '5', description: 'Longer game' },
      ],
      default: 3,
    },
  ],
  minPlayers: 2,
  maxPlayers: 5,
  teams: false,
  // No last-darts chips: the big "Last" total already shows each player's score,
  // and chips next to the life dots made 5 players overflow a small phone.

  init(sides, options) {
    return {
      names: sides.map((s) => s.members[0]),
      maxLives: options.lives,
      lives: sides.map(() => options.lives),
      target: null,       // the total to beat; null until the first turn is done
      last: sides.map(() => null), // each player's most recent turn total
      turnSide: null,
      turnTotal: 0,
      winner: null,
      event: null,
    };
  },

  applyDart(state, dart, ctx) {
    const s = ctx.side;
    state.event = null;
    if (ctx.dartIndex === 0) { state.turnSide = s; state.turnTotal = 0; }
    state.turnTotal += dartScore(dart);
    if (ctx.dartIndex < 2) return { state, endTurn: false };

    // Turn over: compare with the score to beat.
    const total = state.turnTotal;
    if (state.target !== null && total <= state.target) {
      state.lives[s] -= 1;
      if (state.lives[s] === 0) {
        state.event = { kind: 'bust', text: `${state.names[s]} is out!` };
        const alive = state.lives.map((_, i) => i).filter((i) => state.lives[i] > 0);
        if (alive.length === 1) {
          state.winner = alive[0];
          state.event = { kind: 'win' };
        }
      } else {
        state.event = { kind: 'bust', text: `${state.names[s]} loses a life` };
      }
    }
    state.last[s] = total;
    state.target = total; // the next player must beat this, pass or fail
    return { state, endTurn: true };
  },

  isOver: (state) => state.winner !== null,
  isOut: (state, side) => state.lives[side] === 0,

  getResult(state) {
    const order = state.lives.map((_, i) => i).sort((a, b) => state.lives[b] - state.lives[a]);
    return { winners: [state.winner], standings: [state.winner, ...order.filter((i) => i !== state.winner)] };
  },

  // Big number on each card: that player's last three-dart total.
  getScoreboard(state) {
    return state.lives.map((lives, i) => ({
      main: state.last[i] ?? '–',
      mainLabel: state.last[i] === null ? null : 'Last',
      turnPoints: state.turnSide === i ? state.turnTotal : undefined,
      lives: { have: lives, max: state.maxLives, risk: 1 }, // the last life shows red
      badge: lives === 0 ? 'Out' : null,
      out: lives === 0,
      stats: [],
    }));
  },

  getHint(state, { dartsLeft }) {
    if (state.target === null) return { label: 'First:', parts: ['Your total sets the score to beat'] };
    const need = state.target + 1;
    const sofar = dartsLeft < 3 && state.turnTotal ? ` · so far ${state.turnTotal}` : '';
    return { label: 'Beat:', parts: [`${state.target} (score ${need}+)${sofar}`] };
  },
};
