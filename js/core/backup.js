// Backup and restore: everything the app keeps (players, History, the unfinished game and
// the setup choices) as one JSON file, so it can be moved to another phone.
// Pure functions so they can be tested; saving files is done by the Settings screen.

const KIND = 'dart-scoreboard-backup';

export function makeBackup({ roster, history, current, setup }, now = new Date()) {
  return { kind: KIND, version: 1, savedAt: now.toISOString(), roster, history, current: current ?? null, setup: setup ?? null };
}

// File name like dart-scoreboard-2026-11-21.json
export const backupFileName = (now = new Date()) => `dart-scoreboard-${now.toISOString().slice(0, 10)}.json`;

// Checks a backup file's text. Returns the data, or throws an Error with a plain message.
export function readBackup(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('That file is not a Dart Scoreboard backup.'); }
  if (!data || data.kind !== KIND) throw new Error('That file is not a Dart Scoreboard backup.');
  if (data.version !== 1) throw new Error('That backup is from a newer version of the app.');
  if (!Array.isArray(data.roster) || !Array.isArray(data.history)) throw new Error('That backup is damaged.');
  const okPlayer = (p) => p && typeof p.id === 'string' && typeof p.name === 'string';
  const okMatch = (m) => m && typeof m.id === 'string' && typeof m.gameId === 'string' && Array.isArray(m.sides) && Array.isArray(m.darts);
  if (!data.roster.every(okPlayer) || !data.history.every(okMatch) || (data.current && !okMatch(data.current))) {
    throw new Error('That backup is damaged.');
  }
  return data;
}
