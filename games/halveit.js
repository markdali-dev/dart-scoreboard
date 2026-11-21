// Halve-It (rules confirmed by Mark, 2026-11-21):
// - A fixed list of targets, one per round, chosen from preset lists.
// - Score whatever you hit on the round's target:
//     plain number (e.g. 20): any ring, full value (single 20, double 40, triple 60);
//     D7: only double 7s (14 each); T10: only triple 10s (30 each);
//     Bull: outer 25 and inner 50 both count; Inner bull: only the inner bull (50).
// - Miss the target with all three darts and your total is halved, rounding down.
// - Highest total after the last round wins (a tie is a shared win).
// - Individual players only.

import { dartScore } from '../js/core/dart.js';

// A target is { n: number (25 = bull), m: null | 2 | 3 } where m means "only this ring".
const t = (n, m = null) => ({ n, m });
export const TARGET_LISTS = {
  classic: [t(20), t(16), t(7, 2), t(14), t(10, 3), t(17), t(25)],
  long: [t(19), t(18), t(20, 2), t(15), t(19, 3), t(16), t(16, 2), t(13), t(20, 3), t(25)],
  tough: [t(20, 2), t(20, 3), t(16, 2), t(19, 3), t(10, 2), t(17, 3), t(25, 2)],
};

export function targetLabel({ n, m }) {
  if (n === 25) return m === 2 ? 'Inner bull' : 'Bull';
  return (m === 2 ? 'D' : m === 3 ? 'T' : '') + n;
}

// Short wording for the hint bar, so it fits on one line on a phone.
function targetHelp({ n, m }) {
  if (n === 25) return m === 2 ? 'Inner bull only' : 'Bull (25 or 50)';
  if (m === 2) return `Double ${n}s`;
  if (m === 3) return `Triple ${n}s`;
  return `Any ${n}`;
}

export function hitsTarget(dart, target) {
  if (dart.number !== target.n) return false;
  return target.m === null || dart.multiplier === target.m;
}

const listText = (key) => TARGET_LISTS[key].map(targetLabel).join(' · ');

export default {
  id: 'halveit',
  name: 'Halve-It',
  group: 'Party',
  rules: 'One target per round. Score what you hit on it; miss it with all three darts and your total is halved. Highest total at the end wins.',
  options: [
    {
      id: 'list',
      label: 'Targets',
      help: 'Which list of targets to play',
      type: 'choice',
      choices: [
        { value: 'classic', label: 'Classic', description: `7 rounds: ${listText('classic')}` },
        { value: 'long', label: 'Long', description: `10 rounds: ${listText('long')}` },
        { value: 'tough', label: 'Tough', description: `7 rounds: ${listText('tough')}` },
      ],
      default: 'classic',
    },
  ],
  minPlayers: 1,
  maxPlayers: 5,
  teams: false,
  showLastDarts: true, // other players' cards keep their last 3 darts

  describe(options) {
    const name = { classic: 'Classic', long: 'Long', tough: 'Tough' }[options.list];
    return `Halve-It · ${name} (${TARGET_LISTS[options.list].length} rounds)`;
  },

  init(sides, options) {
    return {
      names: sides.map((s) => s.members[0]),
      targets: TARGET_LISTS[options.list],
      totals: sides.map(() => 0),
      results: sides.map(() => []), // per round: points scored, or 'halved'
      round: 1,
      turnSide: null,
      turnPoints: 0,
      turnHits: 0,
      over: false,
      event: null,
    };
  },

  applyDart(state, dart, ctx) {
    const s = ctx.side;
    state.event = null;
    state.round = ctx.round;
    if (ctx.dartIndex === 0) { state.turnSide = s; state.turnPoints = 0; state.turnHits = 0; }
    const target = state.targets[ctx.round - 1];
    if (hitsTarget(dart, target)) {
      const points = dartScore(dart);
      state.turnHits += 1;
      state.turnPoints += points;
      state.totals[s] += points;
    }
    if (ctx.dartIndex < 2) return { state, endTurn: false };

    // End of turn: no hits means the total is halved.
    if (state.turnHits === 0) {
      const before = state.totals[s];
      state.totals[s] = Math.floor(before / 2);
      state.results[s][ctx.round - 1] = 'halved';
      state.event = { kind: 'bust', text: before > 0 ? `Halved! ${before} → ${state.totals[s]}` : 'Halved!' };
    } else {
      state.results[s][ctx.round - 1] = state.turnPoints;
      if (state.turnPoints >= 100) state.event = { kind: 'big', text: `+${state.turnPoints}` };
    }
    // The game ends when the last player finishes the last round.
    if (ctx.round === state.targets.length && s === ctx.sideCount - 1) state.over = true;
    else if (s === ctx.sideCount - 1) state.round = ctx.round + 1;
    return { state, endTurn: true };
  },

  isOver: (state) => state.over,

  getResult(state) {
    const best = Math.max(...state.totals);
    const order = state.totals.map((_, i) => i).sort((a, b) => state.totals[b] - state.totals[a]);
    return { winners: order.filter((i) => state.totals[i] === best), standings: order };
  },

  getScoreboard(state, { current } = {}) {
    return state.totals.map((total, i) => {
      const done = state.results[i];
      const last = done.length ? done[done.length - 1] : undefined;
      return {
        main: total,
        turnPoints: i === current && state.turnSide === i ? state.turnPoints : undefined,
        stats: last === undefined ? [] : [last === 'halved' ? 'Last round: halved' : `Last round: +${last}`],
      };
    });
  },

  getHint(state) {
    const target = state.targets[state.round - 1];
    const next = state.targets[state.round];
    return {
      label: `Round ${state.round}/${state.targets.length}:`,
      parts: [`${targetHelp(target)}${next ? ` · next ${targetLabel(next)}` : ''}`],
    };
  },
};
