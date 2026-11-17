// The match engine: turn order, teams, the dart log and undo.
// Shared by every game, so game modules only deal with scoring rules.
//
// A match is just data you can save as-is:
//   { gameId, options, sides, darts: [ {number, multiplier}, ... ] }
// A "side" is one player or one team: { name, members: ['Mark'] } or
// { name: 'Team A', members: ['Mark', 'Dean'] }. Teammates share one score
// and take turns throwing, one after the other.
//
// The current state is never stored. It is rebuilt by replaying the whole
// dart log from the start, which makes undo trivial: drop the last dart and
// replay. Every game gets undo for free.

import { getGame } from './registry.js';
import { isValidDart } from './dart.js';

export const DARTS_PER_TURN = 3;

export function createMatch({ gameId, options, sides }) {
  const game = getGame(gameId);
  if (!Array.isArray(sides) || sides.length < game.minPlayers || sides.length > game.maxPlayers) {
    throw new Error(`${game.name} needs ${game.minPlayers}-${game.maxPlayers} players or teams`);
  }
  for (const side of sides) {
    if (!side.members?.length) throw new Error(`"${side.name}" has no players`);
    if (side.members.length > 1 && !game.teams) throw new Error(`${game.name} does not support teams`);
    if (side.members.length > 3) throw new Error('Teams can have at most 3 players');
  }
  return {
    gameId,
    options: { ...options },
    sides: sides.map((s) => ({ name: s.name, members: [...s.members] })),
    darts: [],
    startedAt: new Date().toISOString(),
  };
}

// Rebuilds the full state by replaying every dart in the log.
export function computeState(match) {
  const game = getGame(match.gameId);
  let state = startState(game, match);
  for (const dart of match.darts) state = step(game, match, state, dart);
  return state;
}

// Returns a new match with one more dart. The old match is left unchanged.
export function throwDart(match, dart) {
  if (!isValidDart(dart)) throw new Error(`Invalid dart ${JSON.stringify(dart)}`);
  if (computeState(match).over) throw new Error('The game is already over');
  return { ...match, darts: [...match.darts, { number: dart.number, multiplier: dart.multiplier }] };
}

// Returns a new match without the last dart. Press again to keep stepping back,
// across turns and players, all the way to the start of the game.
export function undo(match) {
  if (!match.darts.length) return match;
  return { ...match, darts: match.darts.slice(0, -1) };
}

// The side that throws after the current one (for the "Next" tag), or null.
export function getOnDeck(match, state) {
  if (state.over) return null;
  const game = getGame(match.gameId);
  const count = match.sides.length;
  for (let i = 1; i < count; i++) {
    const side = (state.turn.side + i) % count;
    if (!game.isOut?.(state.game, side)) return side;
  }
  return null;
}

// ---------- internals ----------

function startState(game, match) {
  return {
    game: game.init(match.sides, match.options),
    turn: newTurn(match, 0, 1, [0]),
    sideTurns: match.sides.map(() => 0), // how many turns each side has completed
    turns: [], // completed turns: { side, thrower, round, darts }
    over: false,
    result: null,
  };
}

function newTurn(match, side, round, sideTurns) {
  const members = match.sides[side].members;
  const thrower = members[(sideTurns[side] ?? 0) % members.length];
  return { side, thrower, round, darts: [] };
}

function step(game, match, prev, dart) {
  if (prev.over) throw new Error('Dart log continues after the game ended');

  const turn = prev.turn;
  const context = {
    side: turn.side,
    thrower: turn.thrower,
    round: turn.round,
    dartIndex: turn.darts.length, // 0, 1 or 2
    dartsThisTurn: [...turn.darts],
    sideCount: match.sides.length,
  };

  // Hand the game a copy so a careless module can't change earlier states.
  const out = game.applyDart(structuredClone(prev.game), dart, context);
  if (!out || !('state' in out)) throw new Error(`${game.id}.applyDart must return { state, endTurn }`);

  const state = {
    ...prev,
    game: out.state,
    turn: { ...turn, darts: [...turn.darts, dart] },
  };

  if (game.isOver(state.game)) {
    return { ...closeTurn(state), over: true, result: game.getResult(state.game) };
  }

  const sideIsOut = game.isOut?.(state.game, turn.side) ?? false;
  if (out.endTurn || sideIsOut || state.turn.darts.length >= DARTS_PER_TURN) {
    return nextTurn(game, match, closeTurn(state));
  }
  return state;
}

function closeTurn(state) {
  const sideTurns = [...state.sideTurns];
  sideTurns[state.turn.side] += 1;
  return { ...state, sideTurns, turns: [...state.turns, state.turn] };
}

function nextTurn(game, match, state) {
  const count = match.sides.length;
  const current = state.turn.side;
  for (let i = 1; i <= count; i++) {
    const side = (current + i) % count;
    if (game.isOut?.(state.game, side)) continue;
    const round = side <= current ? state.turn.round + 1 : state.turn.round;
    return { ...state, turn: newTurn(match, side, round, state.sideTurns) };
  }
  throw new Error(`${game.id}: every side is out but isOver() returned false`);
}
