// Playing screen: header, one card per player/team, hint bar, keypad.
// Works for any game through the module interface (getScoreboard, getHint).

import { getGame } from '../core/registry.js';
import { computeState, throwDart, undo, getOnDeck, createMatch, DARTS_PER_TURN } from '../core/engine.js';
import { makeDart, dartLabel } from '../core/dart.js';
import { optionLabel } from '../core/setup.js';
import { esc } from './html.js';

export function renderMatch(ctx) {
  const { match, ui } = ctx.state;
  const game = getGame(match.gameId);
  const state = computeState(match);
  const board = game.getScoreboard(state.game);
  const onDeck = getOnDeck(match, state);
  const current = state.over ? -1 : state.turn.side;
  const hint = state.over ? null : game.getHint?.(state.game, { side: current, dartsLeft: DARTS_PER_TURN - state.turn.darts.length });
  const mod = ui.mod ?? 1;
  const keys = game.getKeys?.(state.game) ?? [...[...Array(20)].map((_, i) => i + 1), 25];

  return `
    <div class="match n${match.sides.length}">
      <div class="match-top">
        <button class="btn small-btn" data-act="leave-match" aria-label="Back to setup">‹</button>
        <div class="game-header">
          <span>${esc(game.describe ? game.describe(match.options) : summary(game, match.options))}</span>
          <span>Round ${state.turn.round}</span>
        </div>
      </div>

      ${game.board === 'marks'
        ? marksBoard(game, match, state, board, current, onDeck)
        : `<section class="cards" aria-live="polite">
            ${match.sides.map((side, i) => card(side, i, board[i], state, current, onDeck)).join('')}
          </section>`}

      ${hint ? `<div class="hint">
        <span class="label">${esc(hint.label)}</span>
        ${hint.parts.length > 1
          ? [0, 1, 2].map((k) => `<span>${esc(hint.parts[k] ?? '')}</span>`).join('')
          : `<span class="hint-wide">${esc(hint.parts[0])}</span>`}
      </div>` : ''}

      <nav class="keypad" aria-label="Dart entry">
        ${keys.map((n) => `<button class="key" data-act="dart" data-n="${n}" ${n === 25 && mod === 3 ? 'disabled' : ''}>${n}</button>`).join('')}
        <div class="bottom">
          <button class="key" data-act="dart" data-n="0" aria-label="Miss">0</button>
          <button class="key double" data-act="mod" data-m="2" aria-pressed="${mod === 2}">DOUBLE</button>
          <button class="key triple" data-act="mod" data-m="3" aria-pressed="${mod === 3}">TRIPLE</button>
          <button class="key undo" data-act="undo" ${match.darts.length ? '' : 'disabled'}>Undo</button>
        </div>
      </nav>

      ${ui.toast ? `<div class="toast ${ui.toast.kind}" role="status">${esc(ui.toast.text)}</div>` : ''}
      ${state.over ? winSheet(match, state) : ''}
      ${ui.confirmLeave ? leaveSheet() : ''}
    </div>`;
}

// Who in a side throws now (current side) or next time (other sides).
function upNextFor(side, i, state, current) {
  return i === current ? state.turn.thrower : side.members[state.sideTurns[i] % side.members.length];
}

// Cricket-style board: numbers down the left, one column per player or team.
function marksBoard(game, match, state, board, current, onDeck) {
  const rows = game.getRows(state.game);
  const showPoints = board.some((b) => b.main !== null);
  const heads = match.sides.map((side, i) => {
    const team = side.members.length > 1;
    const up = upNextFor(side, i, state, current);
    const cls = i === current ? 'thrower' : i === onDeck ? 'next' : '';
    return `<div class="mhead ${cls}">
      ${i === onDeck ? '<span class="tag">Next</span>' : ''}
      <div class="mname">${esc(team ? side.name : side.members[0])}</div>
      ${team ? `<div class="mmembers">${side.members.map((m) => `<span class="${m === up ? 'up' : ''}">${esc(m)}</span>`).join(' ')}</div>` : ''}
      ${showPoints ? `<div class="mpoints">${board[i].main}</div>` : ''}
    </div>`;
  }).join('');
  const body = rows.map((row, r) => `
    <div class="mlabel ${row.dead ? 'dead' : ''}">${esc(row.label)}</div>
    ${match.sides.map((_, i) => `<div class="mcell ${i === current ? 'thrower' : ''} ${row.dead ? 'dead' : ''}">${markIcon(board[i].marks[r])}</div>`).join('')}
  `).join('');

  const thrower = current >= 0 ? match.sides[current] : null;
  const darts = state.turn.darts;
  const strip = thrower ? `
    <div class="turn-strip">
      <div class="strip-name">${esc(state.turn.thrower)}</div>
      <div class="slots">${[0, 1, 2].map((k) => darts[k]
        ? `<div class="slot">${esc(dartLabel(darts[k]))}</div>`
        : '<div class="slot empty">–</div>').join('')}</div>
      <div class="strip-stat">${esc(board[current].stats.join(' · '))}</div>
    </div>` : '';

  return `
    <section class="marks-board" style="--cols:${match.sides.length};--rows:${rows.length}" aria-live="polite">
      <div class="mcorner"></div>${heads}${body}
    </section>
    ${strip}`;
}

// Cricket marks: / for 1, X for 2, circled X for 3 (closed).
function markIcon(n) {
  if (!n) return '';
  const lines = n >= 2 ? '<path d="M8 8l16 16M24 8L8 24"/>' : '<path d="M24 8L8 24"/>';
  const ring = n >= 3 ? '<circle cx="16" cy="16" r="13"/>' : '';
  return `<svg class="mark" viewBox="0 0 32 32" aria-label="${n} mark${n > 1 ? 's' : ''}">${lines}${ring}</svg>`;
}

function summary(game, options) {
  return [game.name, ...game.options.filter((o) => o.type !== 'toggle').map((o) =>
    (o.id === 'start' ? optionLabel(o, options[o.id]) : `${optionLabel(o, options[o.id])} ${o.label.toLowerCase()}`))].join(' · ');
}

function card(side, i, sb, state, current, onDeck) {
  const isThrower = i === current;
  const isNext = i === onDeck;
  const cls = isThrower ? 'thrower' : isNext ? 'next' : '';
  const team = side.members.length > 1;
  // Whose turn it is within a team: the current thrower, or who throws next for that team.
  const upNext = upNextFor(side, i, state, current);
  const members = team
    ? `<div class="members">${side.members.map((m) => `<span class="${m === upNext ? 'up' : ''}">${esc(m)}</span>`).join('')}</div>`
    : '';
  const darts = isThrower ? state.turn.darts : [];
  const slots = isThrower
    ? `<div class="slots">${[0, 1, 2].map((k) => darts[k]
        ? `<div class="slot">${esc(dartLabel(darts[k]))}</div>`
        : '<div class="slot empty">–</div>').join('')}</div>`
    : '';
  const stats = isThrower && darts.length ? [`<b>Turn ${sb.turnPoints}</b>`, ...sb.stats.map(esc)] : sb.stats.map(esc);
  return `
    <div class="card ${cls}">
      <div class="card-left">
        <div class="name">${esc(team ? side.name : side.members[0])}${isNext ? ' <span class="tag">Next</span>' : ''}</div>
        ${members}
        ${slots}
        <div class="stats">${stats.join(' · ')}</div>
      </div>
      <div class="score">${esc(sb.main)}</div>
    </div>`;
}

function winSheet(match, state) {
  const names = state.result.winners.map((w) => {
    const side = match.sides[w];
    return side.members.length > 1 ? `${side.name} (${side.members.join(', ')})` : side.members[0];
  });
  return `
    <div class="sheet-backdrop"></div>
    <div class="sheet win" role="dialog" aria-modal="true" aria-label="Game over">
      <div class="win-title">${esc(names.join(' & '))} ${names.length > 1 ? 'win' : 'wins'}!</div>
      <div class="sheet-rows">
        <button class="sheet-row" data-act="rematch"><span class="sheet-label">Play again</span><span class="sheet-desc">Same players and settings</span></button>
        <button class="sheet-row" data-act="to-setup"><span class="sheet-label">New game</span><span class="sheet-desc">Back to setup</span></button>
        <button class="sheet-row" data-act="undo"><span class="sheet-label">Undo last dart</span><span class="sheet-desc">Entered it wrong? Step back</span></button>
      </div>
    </div>`;
}

function leaveSheet() {
  return `
    <div class="sheet-backdrop" data-act="cancel-leave"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="Leave game">
      <div class="sheet-title">Leave this game?</div>
      <p class="note">Games can't be resumed yet (that comes in build step 6), so this game will be lost.</p>
      <div class="sheet-rows">
        <button class="sheet-row" data-act="cancel-leave"><span class="sheet-label">Keep playing</span></button>
        <button class="sheet-row danger" data-act="to-setup"><span class="sheet-label">Leave game</span></button>
      </div>
    </div>`;
}

// ---------- actions ----------

let toastTimer = null;
function showToast(ctx, toast) {
  clearTimeout(toastTimer);
  ctx.setUi({ toast });
  toastTimer = setTimeout(() => ctx.setUi({ toast: null }), 1400);
}

export const matchActions = {
  dart: (ctx, el) => {
    const match = ctx.state.match;
    if (computeState(match).over) return;
    const dart = makeDart(Number(el.dataset.n), ctx.state.ui.mod ?? 1);
    if (!dart) return; // e.g. triple 25
    const next = throwDart(match, dart);
    ctx.state.ui.mod = 1;
    ctx.setMatch(next);
    const event = computeState(next).game.event;
    if (event?.kind === 'bust' || event?.kind === 'big') showToast(ctx, event);
  },
  mod: (ctx, el) => {
    const m = Number(el.dataset.m);
    ctx.setUi({ mod: ctx.state.ui.mod === m ? 1 : m });
  },
  undo: (ctx) => {
    ctx.state.ui.mod = 1;
    ctx.state.ui.toast = null;
    ctx.setMatch(undo(ctx.state.match));
  },
  'leave-match': (ctx) => {
    if (!ctx.state.match.darts.length || computeState(ctx.state.match).over) ctx.leaveMatch();
    else ctx.setUi({ confirmLeave: true });
  },
  'cancel-leave': (ctx) => ctx.setUi({ confirmLeave: false }),
  'to-setup': (ctx) => ctx.leaveMatch(),
  rematch: (ctx) => {
    const { gameId, options, sides } = ctx.state.match;
    ctx.startMatch(createMatch({ gameId, options, sides }));
  },
};
