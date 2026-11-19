// Number draw: before a game like Assassin, each player throws off-hand and
// taps the number they hit. Taken numbers are greyed out. A miss or the bull
// means throw again (nothing to tap). These throws are not part of the game.

import { getGame } from '../core/registry.js';
import { createMatch } from '../core/engine.js';
import { esc } from './html.js';

export function renderDraw(ctx) {
  const { draw } = ctx.state;
  const game = getGame(draw.gameId);
  const done = draw.picks.length === draw.sides.length;
  const who = done ? null : draw.sides[draw.picks.length].members[0];
  const owner = new Map(draw.picks.map((n, i) => [n, draw.sides[i].members[0]]));

  return `
    <div class="match draw">
      <div class="match-top">
        <button class="btn small-btn" data-act="cancel-draw" aria-label="Back to setup">‹</button>
        <div class="game-header"><span>${esc(game.name)} · Number draw</span><span>${draw.picks.length} / ${draw.sides.length}</span></div>
      </div>
      <section class="section">
        ${done
          ? '<div class="draw-prompt"><div class="draw-who">Everyone has a number</div><div class="note">Check the list, then start the game.</div></div>'
          : `<div class="draw-prompt">
              <div class="draw-who">${esc(who)}, throw with your off hand</div>
              <div class="note">Tap the number you hit. Missed, or hit the bull? Throw again.</div>
            </div>`}
        <div class="draw-grid">
          ${[...Array(20)].map((_, i) => {
            const n = i + 1;
            const taken = owner.get(n);
            return `<button class="key draw-key ${taken ? 'taken' : ''}" data-act="draw-pick" data-n="${n}" ${taken || done ? 'disabled' : ''}>
              ${n}${taken ? `<span class="draw-owner">${esc(taken)}</span>` : ''}
            </button>`;
          }).join('')}
        </div>
        ${draw.picks.length ? `<ul class="draw-list">
          ${draw.picks.map((n, i) => `<li><span>${esc(draw.sides[i].members[0])}</span><b>${n}</b></li>`).join('')}
        </ul>` : ''}
        <div class="draw-actions">
          <button class="btn" data-act="draw-undo" ${draw.picks.length ? '' : 'disabled'}>Undo</button>
          ${done ? '<button class="start" data-act="draw-start">Start game</button>' : ''}
        </div>
      </section>
    </div>`;
}

export const drawActions = {
  'draw-pick': (ctx, el) => {
    const n = Number(el.dataset.n);
    const { draw } = ctx.state;
    if (draw.picks.includes(n) || draw.picks.length >= draw.sides.length) return;
    ctx.setDraw({ ...draw, picks: [...draw.picks, n] });
  },
  'draw-undo': (ctx) => ctx.setDraw({ ...ctx.state.draw, picks: ctx.state.draw.picks.slice(0, -1) }),
  'cancel-draw': (ctx) => ctx.setDraw(null),
  'draw-start': (ctx) => {
    const { gameId, options, sides, picks } = ctx.state.draw;
    ctx.setDraw(null);
    ctx.startMatch(createMatch({ gameId, options: { ...options, numbers: picks }, sides }));
  },
};
