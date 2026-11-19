// History tab: finished games, newest first. Tap one to see its final board.

import { computeState } from '../core/engine.js';
import { getGame } from '../core/registry.js';
import { esc } from './html.js';
import { describeMatch, winnerText, renderMatch } from './matchScreen.js';

export function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
}

// Replays a saved game; returns null if it can't be shown (e.g. its game was removed).
function replay(entry) {
  try {
    getGame(entry.gameId);
    return computeState(entry);
  } catch {
    return null;
  }
}

export function renderHistory(ctx) {
  const rows = ctx.state.history.map((entry) => {
    const s = replay(entry);
    if (!s) return '';
    const players = entry.sides.map((side) => (side.members.length > 1 ? `${side.name}: ${side.members.join(', ')}` : side.members[0])).join(' · ');
    return `<li>
      <button class="history-row" data-act="open-entry" data-id="${esc(entry.id)}">
        <span class="history-top"><span class="history-game">${esc(describeMatch(entry))}</span><span class="history-date">${esc(formatDate(entry.finishedAt))}</span></span>
        <span class="history-winner"><span class="winner-label">Winner</span> ${esc(winnerText(entry, s))}</span>
        <span class="history-players">${esc(players)}</span>
      </button>
    </li>`;
  }).join('');

  return `
    <header class="topbar"><h1>History</h1><span class="count">${ctx.state.history.length} ${ctx.state.history.length === 1 ? 'game' : 'games'}</span></header>
    <main class="screen">
      <section class="section">
        ${rows ? `<ul class="list history-list">${rows}</ul>` : '<p class="note">No finished games yet. Games you finish are saved here automatically.</p>'}
      </section>
    </main>`;
}

export function renderHistoryEntry(ctx) {
  const entry = ctx.state.history.find((h) => h.id === ctx.state.ui.viewing);
  if (!entry || !replay(entry)) return renderHistory(ctx);
  return renderMatch(ctx, { readonly: true, match: entry, dateText: formatDate(entry.finishedAt) });
}

export const historyActions = {
  'open-entry': (ctx, el) => { ctx.setUi({ viewing: el.dataset.id }); window.scrollTo(0, 0); },
  'close-entry': (ctx) => ctx.setUi({ viewing: null }),
};
