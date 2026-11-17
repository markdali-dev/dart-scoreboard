// Playing screen. For build step 2 it only shows who throws in what order
// (and which teammate is up). Scoring and the working keypad come in step 3.

import { getGame } from '../core/registry.js';
import { optionLabel } from '../core/setup.js';
import { esc, keypad } from './html.js';

export function renderMatch(ctx) {
  const match = ctx.state.match;
  const game = getGame(match.gameId);
  const summary = [game.name, ...game.options
    .filter((o) => o.type !== 'toggle')
    .map((o) => (o.id === 'start' ? optionLabel(o, match.options[o.id]) : `${optionLabel(o, match.options[o.id])} ${o.label.toLowerCase()}`))];
  const startScore = match.options.start ?? '';

  return `
    <div class="match">
      <div class="match-top">
        <button class="btn" data-act="leave-match">‹ Setup</button>
        <span class="note small">Scoring arrives in build step 3</span>
      </div>
      <section class="section">
        <div class="game-header"><span>${esc(summary.join(' · '))}</span><span>Round 1</span></div>
        <div class="cards">
          ${match.sides.map((side, i) => {
            const cls = i === 0 ? 'thrower' : i === 1 ? 'next' : '';
            const members = side.members.length > 1
              ? `<div class="members">${side.members.map((m, j) => `<span class="${j === 0 ? 'up' : ''}">${esc(m)}</span>`).join('')}</div>`
              : '';
            const title = side.members.length > 1 ? side.name : side.members[0];
            return `
              <div class="card ${cls}">
                <div>
                  <div class="name">${esc(title)}${i === 1 ? ' <span class="tag">Next</span>' : ''}</div>
                  ${members}
                  ${i === 0 ? '<div class="slots"><div class="slot empty">–</div><div class="slot empty">–</div><div class="slot empty">–</div></div>' : ''}
                </div>
                <div class="score">${esc(startScore)}</div>
              </div>`;
          }).join('')}
        </div>
      </section>
      ${keypad()}
    </div>`;
}

export const matchActions = {
  'leave-match': (ctx) => ctx.leaveMatch(),
};
