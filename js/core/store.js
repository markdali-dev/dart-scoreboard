// Saves small bits of data on this device (browser localStorage).
// Every read and write is guarded: in a private window or with storage
// blocked, the app still works, it just doesn't remember things.

const PREFIX = 'dartscoreboard.';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
