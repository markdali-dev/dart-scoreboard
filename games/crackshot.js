// Crackshot (Mark's game from another dart bar; rules confirmed 2026-11-21):
// - 6 rounds, 3 darts per turn. Scoring is by where the dart lands, not the number:
//     Inner single +1, Bull (outer bull) +2, Double bull +3,
//     Ring of fire (triple ring) -2, Miss (outer single, double ring or off the board) -1.
// - Totals can go below zero.
// - Three bullseyes (Bull or Double bull) in one turn wins instantly.
// - Otherwise the highest total after 6 rounds wins.
// - Tie for the lead: sudden death. The tied players throw one dart each; highest
//   points wins; repeat (among those still tied) until one leads.
// - Individual players only.
// Entry: a vertical stack of area buttons instead of the number keypad.

export const ROUNDS = 6;
export const ZONE_POINTS = { inner: 1, bull: 2, dbull: 3, fire: -2, miss: -1 };

const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');

export default {
  id: 'crackshot',
  name: 'Crackshot',
  group: 'Party',
  rules: 'Six rounds. Score by where the dart lands: inner single +1, bull +2, double bull +3, ring of fire (triples) −2, anything else −1. Three bulls in one turn wins instantly.',
  options: [],
  minPlayers: 1,
  maxPlayers: 5,
  teams: false,
  showLastDarts: true,

  // The entry pad, top to bottom (Mark's layout). Items on the same row sit side by side.
  zonePad: [
    [{ zone: 'inner', label: 'Inner Single', points: '+1', tone: 'plus' }],
    [{ zone: 'bull', label: 'Bull', points: '+2', tone: 'plus2' }, { zone: 'dbull', label: 'Double Bull', points: '+3', tone: 'plus3' }],
    [{ zone: 'fire', label: 'Ring of Fire', points: '−2', tone: 'fire' }],
    [{ zone: 'miss', label: 'Miss', points: '−1', tone: 'minus' }, { undo: true }],
  ],

  describe: () => 'Crackshot · 6 rounds',

  init(sides) {
    return {
      names: sides.map((s) => s.members[0]),
      totals: sides.map(() => 0),
      results: sides.map(() => []), // points per round
      round: 1,
      turnSide: null,
      turnPoints: 0,
      turnBulls: 0,
      sudden: false,                  // in sudden death
      contenders: null,               // sides still in the sudden death
      suddenPoints: sides.map(() => null),
      winner: null,
      threeBulls: false,
      event: null,
    };
  },

  applyDart(state, dart, ctx) {
    const s = ctx.side;
    state.event = null;
    state.round = ctx.round;
    if (ctx.dartIndex === 0) { state.turnSide = s; state.turnPoints = 0; state.turnBulls = 0; }
    const points = ZONE_POINTS[dart.zone] ?? -1; // anything unrecognised counts as a miss

    // Sudden death: one dart each, tied leaders only.
    if (state.sudden) {
      state.suddenPoints[s] = points;
      state.turnPoints = points;
      const lastToThrow = !state.contenders.some((i) => i > s);
      if (lastToThrow) settleSuddenDeath(state);
      return { state, endTurn: true };
    }

    state.turnPoints += points;
    state.totals[s] += points;
    if (dart.zone === 'bull' || dart.zone === 'dbull') state.turnBulls += 1;

    // Three bulls in one turn: instant win.
    if (state.turnBulls === 3) {
      state.results[s][ctx.round - 1] = state.turnPoints;
      state.winner = s;
      state.threeBulls = true;
      state.event = { kind: 'win' };
      return { state, endTurn: true };
    }
    if (ctx.dartIndex < 2) return { state, endTurn: false };

    state.results[s][ctx.round - 1] = state.turnPoints;
    if (s === ctx.sideCount - 1) {
      if (ctx.round === ROUNDS) finishRegulation(state);
      else state.round = ctx.round + 1;
    }
    return { state, endTurn: true };
  },

  isOver: (state) => state.winner !== null,
  isOut: (state, side) => state.sudden && !state.contenders.includes(side),

  getResult(state) {
    const order = state.totals.map((_, i) => i).sort((a, b) => state.totals[b] - state.totals[a]);
    return {
      winners: [state.winner],
      standings: [state.winner, ...order.filter((i) => i !== state.winner)],
      kicker: state.threeBulls ? 'Three bulls!' : state.contenders ? 'Sudden death' : null,
    };
  },

  getScoreboard(state, { current } = {}) {
    return state.totals.map((total, i) => {
      const done = state.results[i];
      const last = done.length ? done[done.length - 1] : undefined;
      let stats = [];
      if (i === current && state.sudden) stats = ['Sudden death: one dart'];
      else if (i === current && last !== undefined) stats = [`Last round: ${signed(last)}`];
      else if (state.sudden && state.suddenPoints[i] !== null) stats = [`Sudden death: ${signed(state.suddenPoints[i])}`];
      return {
        main: total,
        turnPoints: i === current && state.turnSide === i && !state.sudden ? state.turnPoints : undefined,
        out: state.sudden && !state.contenders.includes(i),
        stats,
      };
    });
  },

  getHint(state) {
    if (state.sudden) return { label: 'Sudden death:', parts: ['One dart each, highest wins'] };
    return { label: `Round ${state.round}/${ROUNDS}:`, parts: ['3 bulls in one turn wins'] };
  },
};

// After round 6: a single leader wins; a tie starts sudden death among the leaders.
function finishRegulation(state) {
  const best = Math.max(...state.totals);
  const leaders = state.totals.map((_, i) => i).filter((i) => state.totals[i] === best);
  if (leaders.length === 1) {
    state.winner = leaders[0];
    state.event = { kind: 'win' };
  } else {
    state.sudden = true;
    state.contenders = leaders;
    state.suddenPoints = state.totals.map(() => null);
    state.event = { kind: 'info', text: 'Sudden death!' };
  }
}

// After every contender has thrown their one dart: the highest wins; ties go again.
function settleSuddenDeath(state) {
  const best = Math.max(...state.contenders.map((i) => state.suddenPoints[i]));
  const top = state.contenders.filter((i) => state.suddenPoints[i] === best);
  if (top.length === 1) {
    state.winner = top[0];
    state.event = { kind: 'win' };
  } else {
    state.contenders = top;
    state.event = { kind: 'info', text: 'Still tied: again!' };
  }
}
