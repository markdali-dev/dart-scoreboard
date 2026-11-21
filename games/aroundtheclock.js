// Around the Clock (rules confirmed by Mark, 2026-11-21):
// - Hit 1 to 20 in order. 1 player for practice, or up to 5 racing.
// - Rings option: Any (single moves on 1 number, double 2, triple 3), Doubles only or
//   Triples only (only that ring counts, and each hit moves on 1).
// - Finish on the bull option (off by default): after 20, hit either bull to finish.
//   A double or triple near the end never skips the bull.
// - First to finish wins, but the round is played out so everyone gets the same turns;
//   everyone who finishes in that round shares the win.
// Screen: the bullseye target with the thrower's number, how far they are, and Next.

const NUMBERS = [...Array(20)].map((_, i) => i + 1);

export default {
  id: 'aroundtheclock',
  name: 'Around the Clock',
  group: 'Practice',
  rules: 'Hit 1 to 20 in order. With any ring, a double moves you on 2 numbers and a triple 3. First to finish wins; the round is played out so everyone gets the same turns.',
  options: [
    {
      id: 'rings',
      label: 'Rings',
      help: 'Which hits count',
      type: 'choice',
      choices: [
        { value: 'any', label: 'Any', description: 'Any ring; double skips 1 number, triple skips 2' },
        { value: 'double', label: 'Doubles', description: 'Only doubles count' },
        { value: 'triple', label: 'Triples', description: 'Only triples count' },
      ],
      default: 'any',
    },
    { id: 'bull', label: 'Finish on bull', type: 'toggle', default: false },
  ],
  minPlayers: 1,
  maxPlayers: 5,
  teams: false,
  showLastDarts: true, // other players' cards keep their last 3 darts

  describe: (options) => `Around the Clock · ${{ any: 'Any ring', double: 'Doubles', triple: 'Triples' }[options.rings]}${options.bull ? ' · Bull' : ''}`,

  init(sides, options) {
    return {
      targets: options.bull ? [...NUMBERS, 25] : NUMBERS,
      rings: options.rings,
      pos: sides.map(() => 0),       // index into targets; targets.length = finished
      darts: sides.map(() => 0),     // darts thrown so far
      finishedIn: sides.map(() => null), // darts used to finish
      over: false,
      event: null,
    };
  },

  applyDart(state, dart, ctx) {
    const s = ctx.side;
    const last = state.targets.length;
    state.event = null;
    state.darts[s] += 1;

    const target = state.targets[state.pos[s]];
    if (dart.number === target) {
      if (target === 25) state.pos[s] += 1; // either bull
      else if (state.rings === 'any') {
        // Skip ahead, but never past the bull when finishing on it.
        const cap = target <= 20 && last === 21 ? 20 : last;
        state.pos[s] = Math.min(state.pos[s] + dart.multiplier, cap);
      } else if (dart.multiplier === (state.rings === 'double' ? 2 : 3)) state.pos[s] += 1;
    }

    const finished = state.pos[s] >= last;
    if (finished) {
      state.pos[s] = last;
      state.finishedIn[s] = state.darts[s];
    }
    const turnOver = finished || ctx.dartIndex >= 2;
    // The round ends after the last player's turn; the game ends then if anyone finished.
    if (turnOver && s === ctx.sideCount - 1 && state.finishedIn.some((d) => d !== null)) state.over = true;
    return { state, endTurn: turnOver };
  },

  isOver: (state) => state.over,

  getResult(state) {
    const order = state.pos.map((_, i) => i).sort((a, b) =>
      state.pos[b] - state.pos[a] || (state.finishedIn[a] ?? 0) - (state.finishedIn[b] ?? 0));
    const winners = order.filter((i) => state.finishedIn[i] !== null);
    return {
      winners,
      standings: order,
      kicker: winners.length === 1 ? `Finished in ${state.finishedIn[winners[0]]} darts` : undefined,
    };
  },

  // Big number on each card: the number that player is aiming at.
  getScoreboard(state, { current } = {}) {
    return state.pos.map((p, i) => {
      const done = p >= state.targets.length;
      const t = state.targets[p];
      return {
        main: done ? 'Done' : t === 25 ? 'Bull' : t,
        mainLabel: done ? '' : 'On',
        badge: done ? 'Finished' : undefined,
        stats: i === current ? [`Darts: ${state.darts[i]}`] : [],
      };
    });
  },

  getHint(state, { side }) {
    const p = state.pos[side];
    const label = (n) => (n === 25 ? 'Bull' : n === undefined ? 'Finish' : String(n));
    const t = state.targets[p];
    const ringWord = { any: 'Any', double: 'Double', triple: 'Triple' }[state.rings];
    return {
      bullseye: true,
      big: true,
      value: label(t),
      help: t === 25 ? 'Either bull' : `${ringWord} ${t}`,
      leftLabel: 'Done',
      round: `${p}/${state.targets.length}`,
      next: label(state.targets[p + 1]),
    };
  },
};
