// Keeping games: the one unfinished game (to resume) and the History of
// finished games. Pure functions so they can be tested; saving to the device
// is done by the caller.
//
// A saved game is the match record itself ({ id, gameId, options, sides, darts,
// startedAt }), plus finishedAt once it's over. Keeping the full dart log means
// any stat can be worked out later by replaying it.

export const MAX_HISTORY = 500; // newest kept; roughly 1-2 MB at most

// Call after every change to the game being played.
// - Unfinished: it becomes the saved current game (and leaves History, in case
//   an Undo just reopened a finished game).
// - Finished: it goes to the top of History and the current game is cleared.
export function recordMatch({ history, current }, match, isOver, now = new Date()) {
  const others = history.filter((h) => h.id !== match.id);
  if (!isOver) return { history: others, current: match };
  const existing = history.find((h) => h.id === match.id);
  const entry = { ...match, finishedAt: existing?.finishedAt ?? now.toISOString() };
  return { history: [entry, ...others].slice(0, MAX_HISTORY), current: current?.id === match.id ? null : current };
}

// True if starting a new game would replace an unfinished one.
export function wouldReplace(current) {
  return !!current;
}
