// Player stats worked out from History (the saved dart-by-dart log of every finished
// game), so nothing extra is stored. Stats for version 1 (CLAUDE.md):
// - Record: games played and won (team games count for each teammate).
// - X01: 3-dart average (points per 3 darts, busts score 0), best checkout, and
//   double % (darts thrown with a one-dart double finish left, that checked out).
// - Cricket: marks per round (marks that counted per turn): overall, best and worst game.
// - All X01 and Cricket darts: darts thrown and triple % (darts that hit a triple).
// Stats belong to the person throwing, so teammates are counted separately.

import { replayTurns, computeState } from './engine.js';
import { getGame } from './registry.js';
import { dartScore } from './dart.js';

const blank = () => ({
  played: 0, won: 0,
  x01: { points: 0, darts: 0, bestOut: 0, outTries: 0, outHits: 0 },
  cricket: { marks: 0, turns: 0, games: [] }, // games: marks per round in each game
  darts: 0, triples: 0,
});

// A score you can finish with one double (D1-D20 or the inner bull).
const oneDartFinish = (n) => (n >= 2 && n <= 40 && n % 2 === 0) || n === 50;

export function computeStats(history) {
  const players = new Map();
  const get = (name) => { if (!players.has(name)) players.set(name, blank()); return players.get(name); };

  for (const match of history) {
    let turns, result;
    try {
      getGame(match.gameId);
      turns = replayTurns(match);
      result = computeState(match).result;
    } catch { continue; } // a game that can't be replayed is skipped

    match.sides.forEach((side, i) => side.members.forEach((name) => {
      const p = get(name);
      p.played += 1;
      if (result?.winners?.includes(i)) p.won += 1;
    }));

    const perGame = new Map(); // cricket: name -> { marks, turns }
    for (const t of turns) {
      const p = get(t.thrower);
      if (match.gameId === 'x01') {
        const scoreBefore = t.before.scores[t.side];
        const scoreAfter = t.after.scores[t.side];
        p.x01.points += scoreBefore - scoreAfter;
        p.x01.darts += t.darts.length;
        if (scoreAfter === 0) p.x01.bestOut = Math.max(p.x01.bestOut, scoreBefore);
        if (t.after.outRule === 'double' && t.before.opened[t.side]) {
          let left = scoreBefore;
          for (const d of t.darts) {
            if (oneDartFinish(left)) {
              p.x01.outTries += 1;
              if (left - dartScore(d) === 0 && d.multiplier === 2) p.x01.outHits += 1;
            }
            left -= dartScore(d);
            if (left <= 1) break; // finished or bust
          }
        }
      }
      if (match.gameId === 'cricket') {
        const marks = t.after.markCount[t.side] - t.before.markCount[t.side];
        p.cricket.marks += marks;
        p.cricket.turns += 1;
        const g = perGame.get(t.thrower) ?? { marks: 0, turns: 0 };
        g.marks += marks; g.turns += 1;
        perGame.set(t.thrower, g);
      }
      if (match.gameId === 'x01' || match.gameId === 'cricket') {
        p.darts += t.darts.length;
        p.triples += t.darts.filter((d) => d.multiplier === 3).length;
      }
    }
    for (const [name, g] of perGame) get(name).cricket.games.push(g.marks / g.turns);
  }
  return players;
}

// Rounded numbers ready for the screen ('–' when there's nothing to show yet).
export const pct = (hit, of) => (of ? `${Math.round((hit / of) * 100)}%` : '–');
export const avg = (sum, of, places = 1) => (of ? (sum / of).toFixed(places) : '–');
