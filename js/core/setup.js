// Setup-screen logic with no screen code in it, so it can be tested.
//
// "entries" is the list of players picked for the game, in throw order:
//   [{ playerId, name, team: 'A' | 'B' | ... }]
// team is only used when teams are switched on.

export const TEAM_LETTERS = ['A', 'B', 'C', 'D', 'E'];
export const MAX_TEAM_SIZE = 3;
export const MIN_TEAM_SIZE = 2;

// Next value when an option tile is tapped. Choices wrap around.
export function nextOptionValue(option, current) {
  if (option.type === 'toggle') return !current;
  const values = option.choices.map((c) => c.value);
  if (option.custom) values.push('custom');
  const at = values.indexOf(isCustomValue(option, current) ? 'custom' : current);
  return values[(at + 1) % values.length];
}

export function isCustomValue(option, value) {
  return !!option.custom && (value === 'custom' || (typeof value === 'number' && !option.choices.some((c) => c.value === value)));
}

export function optionLabel(option, value) {
  if (option.type === 'toggle') return value ? 'On' : 'Off';
  if (isCustomValue(option, value)) return value === 'custom' ? 'Custom' : String(value);
  return option.choices.find((c) => c.value === value)?.label ?? String(value);
}

// Most players allowed in the picked list.
export function maxEntries(game, teams) {
  return teams ? game.maxPlayers * MAX_TEAM_SIZE : game.maxPlayers;
}

// Next team letter when a player's team badge is tapped.
export function nextTeam(team) {
  return TEAM_LETTERS[(TEAM_LETTERS.indexOf(team) + 1) % TEAM_LETTERS.length];
}

// Default team for a newly added player: alternate A, B, A, B...
export function defaultTeam(index) {
  return TEAM_LETTERS[index % 2];
}

// Returns a plain-language reason the game can't start, or null if it can.
export function validateSetup(game, entries, { teams, options }) {
  for (const option of game.options) {
    if (option.custom && options[option.id] === 'custom') return `Enter a custom ${option.label.toLowerCase()}`;
  }
  if (teams) {
    if (!game.teams) return `${game.name} is played without teams`;
    const groups = groupTeams(entries);
    for (const [letter, members] of groups) {
      if (members.length < MIN_TEAM_SIZE) return `Team ${letter} needs at least ${MIN_TEAM_SIZE} players`;
      if (members.length > MAX_TEAM_SIZE) return `Team ${letter} has more than ${MAX_TEAM_SIZE} players`;
    }
    if (groups.size < game.minPlayers) return `${game.name} needs at least ${game.minPlayers} teams`;
    if (groups.size > game.maxPlayers) return `${game.name} allows at most ${game.maxPlayers} teams`;
    return null;
  }
  if (entries.length < game.minPlayers) {
    return game.minPlayers === 1 ? 'Add a player' : `${game.name} needs at least ${game.minPlayers} players`;
  }
  if (entries.length > game.maxPlayers) return `${game.name} allows at most ${game.maxPlayers} players`;
  return null;
}

// Turns the picked list into sides for the engine, in throw order.
// Teams go in the order they first appear in the list; teammates throw in list order.
// With random order on, the order of sides (and teammates within a team) is shuffled.
export function buildSides(entries, { teams, random }, rng = Math.random) {
  let sides = teams
    ? [...groupTeams(entries)].map(([letter, members]) => ({ name: `Team ${letter}`, members: members.map((e) => e.name) }))
    : entries.map((e) => ({ name: e.name, members: [e.name] }));
  if (random) {
    sides = shuffle(sides, rng).map((s) => ({ ...s, members: shuffle(s.members, rng) }));
  }
  return sides;
}

function groupTeams(entries) {
  const groups = new Map();
  for (const e of entries) {
    if (!groups.has(e.team)) groups.set(e.team, []);
    groups.get(e.team).push(e);
  }
  return groups;
}

// Fisher-Yates shuffle. Returns a new array.
export function shuffle(list, rng = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Moves one item to a new position (used by drag to reorder).
export function moveItem(list, from, to) {
  const out = [...list];
  const [item] = out.splice(from, 1);
  out.splice(to, 0, item);
  return out;
}
