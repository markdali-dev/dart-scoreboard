// Stats tab: one scrolling screen with a table per group (as in the reference app).
// Everything is worked out from History each time the tab opens.

import { computeStats, pct, avg } from '../core/stats.js';
import { esc } from './html.js';

function table(title, heads, rows, note) {
  if (!rows.length) return '';
  return `<section class="section">
    <h2>${esc(title)}</h2>
    <div class="stats-table-wrap"><table class="stats-table">
      <thead><tr><th>Player</th>${heads.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(([name, ...cells]) => `<tr><th scope="row">${esc(name)}</th>${cells.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>
    ${note ? `<p class="stats-note">${esc(note)}</p>` : ''}
  </section>`;
}

export function renderStats(ctx) {
  const stats = computeStats(ctx.state.history);
  // Roster order first, then anyone who has left the roster.
  const rosterNames = ctx.state.roster.map((p) => p.name);
  const names = [...rosterNames.filter((n) => stats.has(n)), ...[...stats.keys()].filter((n) => !rosterNames.includes(n)).sort()];
  const all = names.map((n) => [n, stats.get(n)]);

  const record = all.filter(([, p]) => p.played).map(([n, p]) => [n, p.played, p.won, pct(p.won, p.played)]);
  const x01 = all.filter(([, p]) => p.x01.darts).map(([n, p]) => [n, avg(p.x01.points * 3, p.x01.darts), p.x01.bestOut || '–', pct(p.x01.outHits, p.x01.outTries)]);
  const cricket = all.filter(([, p]) => p.cricket.turns).map(([n, p]) => {
    const g = p.cricket.games;
    return [n, g.length, avg(p.cricket.marks, p.cricket.turns, 2), Math.max(...g).toFixed(2), Math.min(...g).toFixed(2)];
  });
  const darts = all.filter(([, p]) => p.darts).map(([n, p]) => [n, p.darts, pct(p.triples, p.darts)]);

  const body = record.length
    ? table('Record', ['Played', 'Won', 'Win %'], record, 'All games. Team games count for each teammate.')
      + table('X01', ['Avg', 'Best out', 'Double %'], x01, 'Avg: points per 3 darts (busts score 0). Double %: darts thrown with a one-dart double finish left that checked out (Double out games).')
      + table('Cricket', ['Games', 'MPR', 'Best', 'Worst'], cricket, 'MPR: marks that counted per round, overall. Best and worst: single games.')
      + table('Darts', ['Thrown', 'Triple %'], darts, 'X01 and Cricket darts.')
    : '<section class="section"><p class="note">No finished games yet. Stats appear here once games are saved to History.</p></section>';

  return `
    <header class="topbar"><h1>Stats</h1><span class="count">${ctx.state.history.length} ${ctx.state.history.length === 1 ? 'game' : 'games'}</span></header>
    <main class="screen">${body}</main>`;
}
