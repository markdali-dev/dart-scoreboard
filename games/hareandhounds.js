// Hare and Hounds (rules confirmed by Mark, 2026-11-21):
// - The first player in the throw order is the hare; everyone else is a hound (2-5 players).
// - Everyone works clockwise round the board, hitting their current number to move on:
//   single = 1 segment, double = 2, triple = 3. Only the current number counts.
// - The hare starts on 20 and must get all the way round and back to 20.
// - Hounds start 2 numbers behind the hare (on 12).
// - A hound that reaches the hare's number catches it and wins.
//   The hare wins by hitting 20 again (home) before being caught.
// Screen: the bullseye target (the thrower's number) with the board map round it.

// Clockwise order of the numbers, starting at 20.
export const BOARD = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
export const HOME = BOARD.length + 1; // 20, all the way round, then 20 again
const HOUND_START = -2;               // 2 numbers behind 20 (12)

// Position -> the number to aim at. Positions run -2..20 (20 = the final 20).
export const numberAt = (pos) => BOARD[((pos % 20) + 20) % 20];

// Animal icons (Mark, 2026-11-21): a red bunny for the hare, and each hound its own
// colour, the same on its card and on the board map round the bullseye.
export const HARE_COLOR = '#e0413b';
export const HOUND_COLORS = ['#f5c542', '#ff8c42', '#f3e7c9', '#c39bff'];
const animalFor = (i) => (i === 0
  ? { kind: 'hare', color: HARE_COLOR }
  : { kind: 'hound', color: HOUND_COLORS[(i - 1) % HOUND_COLORS.length] });

export default {
  id: 'hareandhounds',
  name: 'Hare and Hounds',
  group: 'Party',
  rules: 'The first player is the hare, starting on 20 and racing clockwise round the board back to 20. Everyone else is a hound, starting 2 numbers behind. Single moves 1, double 2, triple 3. Catch the hare to win, or get the hare home.',
  options: [],
  minPlayers: 2,
  maxPlayers: 5,
  teams: false,

  describe: () => 'Hare and Hounds',

  init(sides) {
    return {
      names: sides.map((s) => s.members[0]),
      pos: sides.map((_, i) => (i === 0 ? 0 : HOUND_START)), // side 0 is the hare
      winner: null,
      how: null,       // 'home' or 'caught'
      event: null,
    };
  },

  applyDart(state, dart, ctx) {
    const s = ctx.side;
    state.event = null;
    if (dart.number !== numberAt(state.pos[s]) || dart.number === 25) return { state, endTurn: false };
    state.pos[s] += dart.multiplier;

    if (s === 0 && state.pos[0] >= HOME) {
      state.pos[0] = HOME;
      state.winner = 0;
      state.how = 'home';
      state.event = { kind: 'win' };
      return { state, endTurn: true };
    }
    if (s !== 0 && state.pos[s] >= state.pos[0]) {
      state.winner = s;
      state.how = 'caught';
      state.event = { kind: 'win' };
      return { state, endTurn: true };
    }
    return { state, endTurn: false };
  },

  isOver: (state) => state.winner !== null,

  getResult(state) {
    const others = state.pos.map((_, i) => i).filter((i) => i !== state.winner)
      .sort((a, b) => state.pos[b] - state.pos[a]);
    return {
      winners: [state.winner],
      standings: [state.winner, ...others],
      kicker: state.how === 'home' ? 'The hare made it home!' : 'Caught!',
    };
  },

  // Big number on each card: the number that player is aiming at. Cards stay one line
  // (no stats) so the bullseye has room; it shows the thrower's gap or lead.
  getScoreboard(state) {
    return state.pos.map((p, i) => ({
      main: i === 0 && p >= HOME ? 'Home' : numberAt(p),
      mainLabel: 'On',
      animal: animalFor(i), // shown next to the name instead of a badge
      stats: [],
    }));
  },

  getHint(state, { side }) {
    const p = state.pos[side];
    const hare = side === 0;
    const nearestHound = Math.max(...state.pos.slice(1));
    const gap = hare ? p - nearestHound : state.pos[0] - p;
    const nextPos = p + 1;
    return {
      bullseye: true,
      noFoot: true, // Mark: no Gap/Next line here; the bullseye and board map get the space
      value: String(numberAt(p)),
      help: hare ? 'You are the hare' : 'You are a hound',
      leftLabel: hare ? 'Lead' : 'Gap',
      round: String(gap),
      next: hare && nextPos >= HOME ? 'Home' : String(numberAt(nextPos)),
      // Where everyone is on the board: each player's animal sits outside the outer ring
      // at the angle of the number they're on (20 at the top, clockwise).
      ring: state.pos.map((pp, i) => {
        const number = numberAt(Math.min(pp, HOME - 1));
        return { number, angle: BOARD.indexOf(number) * 18 - 90, ...animalFor(i), current: i === side };
      }),
    };
  },
};
