// Baseball: 9 innings. In inning N only number N scores: single 1 run,
// double 2, triple 3. Highest total after 9 innings wins.
// Tie: the players (or teams) tied for the lead play extra innings
// (10, 11, ...) until one leads at the end of an inning. Everyone else sits out.
// Past inning 20 the target is the bull (outer 1 run, inner 2).

export default {
  id: 'baseball',
  name: 'Baseball',
  group: 'Core',
  rules: '9 innings. In inning 1 only 1s score, inning 2 only 2s, and so on. Single = 1 run, double = 2, triple = 3. Most runs wins; a tie goes to extra innings.',
  options: [],
  minPlayers: 1,
  maxPlayers: 5,
  teams: true,
  roundLabel: 'Inning',

  init(sides) {
    return {
      inning: 1,
      runs: sides.map(() => []),       // runs per inning, per side
      totals: sides.map(() => 0),
      out: sides.map(() => false),     // sat out of extra innings
      winner: null,
      event: null,
    };
  },

  applyDart(state, dart, ctx) {
    const s = ctx.side;
    state.event = null;
    const inning = ctx.round;
    state.inning = inning;
    const target = targetFor(inning);
    const runs = dart.number === target ? dart.multiplier : 0;
    state.runs[s][inning - 1] = (state.runs[s][inning - 1] ?? 0) + runs;
    state.totals[s] += runs;

    if (ctx.dartIndex < 2) return { state, endTurn: false };

    // Turn over. If this was the last side to throw this inning, check the score.
    const laterSide = state.out.some((o, i) => i > s && !o);
    if (!laterSide) {
      state.inning = inning + 1;
      if (inning >= 9) finishInning(state);
    }
    return { state, endTurn: true };
  },

  isOver: (state) => state.winner !== null,
  isOut: (state, side) => state.out[side],

  getResult(state) {
    const order = state.totals.map((_, i) => i).sort((a, b) => state.totals[b] - state.totals[a]);
    return { winners: [state.winner], standings: order };
  },

  getScoreboard(state) {
    return state.totals.map((total, i) => {
      const prev = state.inning > 1 ? state.runs[i][state.inning - 2] ?? 0 : null; // the inning before this one
      return {
        main: total,
        turnPoints: state.runs[i][state.inning - 1] ?? 0, // runs so far this inning
        out: state.out[i],
        stats: state.out[i]
          ? ['Out of extra innings']
          : prev === null ? [] : [`Inning ${state.inning - 1}: ${prev} ${prev === 1 ? 'run' : 'runs'}`],
      };
    });
  },

  getHint(state) {
    const t = targetFor(state.inning);
    return { label: `Inning ${state.inning}:`, parts: [t === 25 ? 'Hit the bull' : `Hit ${t}s`] };
  },

  // One big key: only this inning's number can score.
  getKeys(state) {
    return [targetFor(state.inning)];
  },
  keyLabels: { 25: 'Bull' },
  pad: 'target',                                  // two big tiles: Miss and the inning's number
  art: { name: 'diamond', place: 'before-pad' },  // faded diamond just above the tiles
};

export function targetFor(inning) {
  return inning <= 20 ? inning : 25;
}

function finishInning(state) {
  const active = state.totals.map((_, i) => i).filter((i) => !state.out[i]);
  const best = Math.max(...active.map((i) => state.totals[i]));
  const leaders = active.filter((i) => state.totals[i] === best);
  if (leaders.length === 1) {
    state.winner = leaders[0];
    state.event = { kind: 'win' };
  } else {
    for (const i of active) if (!leaders.includes(i)) state.out[i] = true;
    state.event = { kind: 'info', text: 'Extra inning!' };
  }
}
