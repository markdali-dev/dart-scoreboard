// Assassin — Mark's house rules (not standard Killer):
// - Each player has a unique number 1-20 (never the bull).
// - Numbers: drawn at random by the app, or by an off-hand throw on the
//   Number draw screen before the game (duplicates refused).
// - Everyone starts with 3 lives; most is 6.
// - Hitting your own number adds lives: single +1, double +2, triple +3 (max 6).
// - A player with 6 lives is an Assassin. Only Assassins do damage.
// - An Assassin hitting another player's number takes lives: single 1, double 2, triple 3.
//   They can hit anyone, Assassin or not. A non-Assassin hitting another number does nothing.
// - Dropping below 6 loses Assassin status until you build back up to 6.
// - 0 lives = out. Last player standing wins. Always individual (no teams).

import { shuffle } from '../js/core/setup.js';

export const START_LIVES = 3;
export const MAX_LIVES = 6;

export default {
  id: 'assassin',
  name: 'Assassin',
  group: 'Core',
  rules: 'Everyone gets a number and 3 lives. Hit your own number to gain lives (up to 6). At 6 you’re an Assassin: hit other players’ numbers to take their lives. Last one standing wins.',
  options: [
    {
      id: 'assign',
      label: 'Numbers',
      help: 'How each player gets their number',
      type: 'choice',
      choices: [
        { value: 'random', label: 'Random', description: 'The app hands out numbers' },
        { value: 'throw', label: 'Throw', description: 'Each player throws off-hand before the game; tap the number they hit' },
      ],
      default: 'random',
    },
  ],
  minPlayers: 2,
  maxPlayers: 5,
  teams: false,

  keyLabels: { 25: 'Bull' },
  art: { name: 'barrel', place: 'before-hint' }, // gun-barrel graphic between the cards and the hint bar
  describe: (options) => `Assassin · ${options.assign === 'throw' ? 'Thrown' : 'Random'} numbers`,

  // True when the Number draw screen must run before the game starts.
  needsNumberDraw: (options) => options.assign === 'throw',

  // Fixes everyone's number once, at game start.
  prepareOptions(options, rng = Math.random, sides = []) {
    const given = options.numbers;
    // Drawn numbers are only kept in Throw mode; Random always deals fresh ones.
    const valid = options.assign === 'throw' && Array.isArray(given) && given.length === sides.length
      && new Set(given).size === given.length && given.every((n) => Number.isInteger(n) && n >= 1 && n <= 20);
    const numbers = valid ? [...given] : shuffle([...Array(20)].map((_, i) => i + 1), rng).slice(0, sides.length);
    return { ...options, numbers };
  },

  init(sides, options) {
    return {
      names: sides.map((s) => s.members[0]),
      numbers: options.numbers,
      lives: sides.map(() => START_LIVES),
      darts: sides.map(() => 0),
      winner: null,
      event: null,
    };
  },

  applyDart(state, dart, ctx) {
    const s = ctx.side;
    state.event = null;
    state.darts[s] += 1;
    if (dart.number === 0 || dart.number === 25) return { state, endTurn: false };
    const m = dart.multiplier;

    if (state.numbers[s] === dart.number) {
      const before = state.lives[s];
      state.lives[s] = Math.min(MAX_LIVES, before + m);
      if (before < MAX_LIVES && state.lives[s] === MAX_LIVES) {
        state.event = { kind: 'big', text: `${state.names[s]} is an Assassin!` };
      }
      return { state, endTurn: false };
    }

    const victim = state.numbers.indexOf(dart.number);
    const isAssassin = state.lives[s] === MAX_LIVES;
    if (victim < 0 || !isAssassin || state.lives[victim] === 0) return { state, endTurn: false };

    state.lives[victim] = Math.max(0, state.lives[victim] - m);
    if (state.lives[victim] === 0) {
      state.event = { kind: 'bust', text: `${state.names[victim]} is out!` };
      const alive = state.lives.map((l, i) => i).filter((i) => state.lives[i] > 0);
      if (alive.length === 1) {
        state.winner = alive[0];
        state.event = { kind: 'win' };
        return { state, endTurn: true };
      }
    }
    return { state, endTurn: false };
  },

  isOver: (state) => state.winner !== null,
  isOut: (state, side) => state.lives[side] === 0,

  getResult(state) {
    const order = state.lives.map((_, i) => i).sort((a, b) => state.lives[b] - state.lives[a]);
    return { winners: [state.winner], standings: [state.winner, ...order.filter((i) => i !== state.winner)] };
  },

  // The big number on each card is the player's own target number, so everyone
  // can see what to aim at. Lives show as pips.
  getScoreboard(state) {
    return state.numbers.map((n, i) => ({
      main: n,
      mainLabel: 'No.',
      lives: { have: state.lives[i], max: MAX_LIVES, risk: 3 }, // first 3 dots red at 3 lives or fewer
      badge: state.lives[i] === MAX_LIVES ? 'Assassin' : state.lives[i] === 0 ? 'Out' : null,
      out: state.lives[i] === 0,
      stats: [], // lives are shown as dots next to the name
    }));
  },

  getHint(state, { side }) {
    const mine = state.numbers[side];
    if (state.lives[side] < MAX_LIVES) return { label: 'Aim:', parts: [`Your ${mine}s to gain lives`] };
    const targets = state.numbers.filter((_, i) => i !== side && state.lives[i] > 0);
    return { label: 'Attack:', parts: [targets.join(', ')] };
  },
};
