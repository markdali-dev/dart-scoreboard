// The game registry. The app shell only ever talks to games through here,
// so it never needs to know anything about a specific game.

export const GROUPS = ['Core', 'Cricket', 'Party', 'Practice'];

const REQUIRED_FUNCTIONS = ['init', 'applyDart', 'isOver', 'getResult', 'getScoreboard'];

const games = new Map();

// Throws a clear error if a game module is missing something the shell relies on.
export function validateGame(game) {
  const problems = [];
  if (!game || typeof game !== 'object') throw new Error('Game module must be an object');
  if (typeof game.id !== 'string' || !game.id) problems.push('id (string)');
  if (typeof game.name !== 'string' || !game.name) problems.push('name (string)');
  if (!GROUPS.includes(game.group)) problems.push(`group (one of ${GROUPS.join(', ')})`);
  if (typeof game.rules !== 'string') problems.push('rules (string)');
  if (!Array.isArray(game.options)) problems.push('options (array)');
  if (!Number.isInteger(game.minPlayers) || game.minPlayers < 1) problems.push('minPlayers (>= 1)');
  if (!Number.isInteger(game.maxPlayers) || game.maxPlayers < game.minPlayers || game.maxPlayers > 5) {
    problems.push('maxPlayers (between minPlayers and 5)');
  }
  if (typeof game.teams !== 'boolean') problems.push('teams (true/false)');
  for (const fn of REQUIRED_FUNCTIONS) {
    if (typeof game[fn] !== 'function') problems.push(`${fn}()`);
  }
  for (const fn of ['getHint', 'isOut', 'prepareOptions', 'describe', 'getRows', 'getKeys']) {
    if (fn in game && typeof game[fn] !== 'function') problems.push(`${fn}() must be a function if given`);
  }
  if (game.board === 'marks' && typeof game.getRows !== 'function') problems.push('getRows() (needed for a marks board)');
  if (problems.length) {
    throw new Error(`Game "${game.id ?? '?'}" is missing or has invalid: ${problems.join('; ')}`);
  }
}

export function registerGame(game) {
  validateGame(game);
  if (games.has(game.id)) throw new Error(`Game id "${game.id}" is already registered`);
  games.set(game.id, Object.freeze(game));
}

export function getGame(id) {
  const game = games.get(id);
  if (!game) throw new Error(`Unknown game "${id}"`);
  return game;
}

export function listGames() {
  return [...games.values()];
}

// { Core: [...], Cricket: [...], Party: [...], Practice: [...] } in registration order.
export function gamesByGroup() {
  const out = Object.fromEntries(GROUPS.map((g) => [g, []]));
  for (const game of games.values()) out[game.group].push(game);
  return out;
}

// Starting option values for a game, e.g. { start: 501, in: 'open', out: 'double' }.
export function defaultOptions(game) {
  return Object.fromEntries(game.options.map((o) => [o.id, o.default]));
}

// Only for tests: start from an empty registry.
export function _clearRegistry() {
  games.clear();
}
