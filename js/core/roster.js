// The saved list of player names (up to 15).
// Pure functions: each takes a roster and returns a new one, or throws a
// plain-language error the screen can show. Saving is done by the caller.
//
// A player is { id, name }. The id never changes, so renaming a player
// later keeps their history and stats attached.

export const MAX_ROSTER = 15;
export const MAX_NAME = 16;

export function cleanName(name) {
  return String(name ?? '').replace(/\s+/g, ' ').trim();
}

function checkName(roster, name, exceptId) {
  if (!name) throw new Error('Enter a name');
  if (name.length > MAX_NAME) throw new Error(`Names can be up to ${MAX_NAME} letters`);
  const taken = roster.some((p) => p.id !== exceptId && p.name.toLowerCase() === name.toLowerCase());
  if (taken) throw new Error(`${name} is already on the list`);
}

export function addPlayer(roster, rawName, makeId = newId) {
  const name = cleanName(rawName);
  if (roster.length >= MAX_ROSTER) throw new Error(`The list is full (${MAX_ROSTER} players)`);
  checkName(roster, name);
  return [...roster, { id: makeId(), name }];
}

export function renamePlayer(roster, id, rawName) {
  const name = cleanName(rawName);
  checkName(roster, name, id);
  return roster.map((p) => (p.id === id ? { ...p, name } : p));
}

export function removePlayer(roster, id) {
  return roster.filter((p) => p.id !== id);
}

export function newId() {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
