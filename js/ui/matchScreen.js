// Playing screen: header, one card per player/team, hint bar, keypad.
// Works for any game through the module interface (getScoreboard, getHint).

import { getGame } from '../core/registry.js';
import { computeState, throwDart, undo, getOnDeck, createMatch, DARTS_PER_TURN } from '../core/engine.js';
import { makeDart, dartLabel, zoneDart } from '../core/dart.js';
import { optionLabel } from '../core/setup.js';
import { esc } from './html.js';
import { ART } from './art.js';
import { animalSvg } from './animals.js';

// Header text for a game, e.g. "X01 · 501 · Open in · Double out".
export function describeMatch(match) {
  const game = getGame(match.gameId);
  return game.describe ? game.describe(match.options) : summary(game, match.options);
}

// "Mark" or "Team A (Mark, Dean)" for the winner(s) of a finished game.
export function winnerText(match, state) {
  return state.result.winners.map((w) => {
    const side = match.sides[w];
    return side.members.length > 1 ? `${side.name} (${side.members.join(', ')})` : side.members[0];
  }).join(' & ');
}

// opts.readonly + opts.match: show a finished game from History (no keypad, no sheets).
export function renderMatch(ctx, opts = {}) {
  const readonly = !!opts.readonly;
  const match = opts.match ?? ctx.state.match;
  const ui = readonly ? {} : ctx.state.ui;
  const game = getGame(match.gameId);
  const state = computeState(match);
  const onDeck = getOnDeck(match, state);
  const current = state.over ? -1 : state.turn.side;
  const board = game.getScoreboard(state.game, { current });
  const hint = state.over ? null : game.getHint?.(state.game, { side: current, dartsLeft: DARTS_PER_TURN - state.turn.darts.length });
  const mod = ui.mod ?? 1;
  const keys = game.getKeys?.(state.game) ?? [...[...Array(20)].map((_, i) => i + 1), 25];
  const art = game.art ? `<div class="match-art art-${game.art.name}">${ART[game.art.name]()}</div>` : '';
  // A hint is either the slim bar ("Out: T20 D16") or, with hint.panel, a big red
  // target panel that fills the space under the players (Knockout's score to beat).
  const hintHtml = !hint ? '' : hint.bullseye ? bullseyeTarget(hint) : hint.panel
    ? `<div class="beat-panel" role="status">
        <span class="bp-label">${esc(hint.title)}</span>
        <span class="bp-num">${esc(hint.value)}</span>
        <span class="bp-who">${esc(hint.from ?? '')}</span>
        <span class="bp-need">${esc(hint.need ?? '')}</span>
      </div>`
    : `<div class="hint">
        <span class="label">${esc(hint.label)}</span>
        ${hint.parts.length > 1
          ? [0, 1, 2].map((k) => `<span>${esc(hint.parts[k] ?? '')}</span>`).join('')
          : `<span class="hint-wide">${esc(hint.parts[0])}</span>`}
      </div>`;
  const modKeys = `
          <button class="key double" data-act="mod" data-m="2" aria-pressed="${mod === 2}">DOUBLE</button>
          <button class="key triple" data-act="mod" data-m="3" aria-pressed="${mod === 3}">TRIPLE</button>
          <button class="key undo" data-act="undo" ${match.darts.length ? '' : 'disabled'}>Undo</button>`;
  // The bull key always says "Bull" (it still counts as 25); games can relabel others.
  const keyLabel = (n) => game.keyLabels?.[n] ?? (n === 25 ? 'Bull' : n);

  // Keypad: the usual number grid; (pad: 'target') two big tiles, Miss and the target;
  // or (zonePad) a vertical stack of board-area buttons (Crackshot).
  const keypad = game.zonePad
    ? `<nav class="keypad zone-pad" aria-label="Where did the dart land?">
        ${game.zonePad.map((row) => `<div class="zone-row">${row.map((b) => b.undo
          ? `<button class="zkey z-undo" data-act="undo" ${match.darts.length ? '' : 'disabled'}><span class="zname">Undo</span></button>`
          : `<button class="zkey z-${b.tone}" data-act="zone" data-zone="${b.zone}"><span class="zname">${esc(b.label)}</span><span class="zpts">${esc(b.points)}</span></button>`).join('')}</div>`).join('')}
      </nav>`
    : game.pad === 'target'
    ? `<nav class="keypad target-pad" aria-label="Dart entry">
        <div class="target-row">
          <button class="key miss-tile" data-act="dart" data-n="0">Miss</button>
          ${keys.map((n) => `<button class="key target-tile" data-act="dart" data-n="${n}" ${n === 25 && mod === 3 ? 'disabled' : ''}>${esc(keyLabel(n))}</button>`).join('')}
        </div>
        <div class="bottom no-miss">${modKeys}</div>
      </nav>`
    : `<nav class="keypad ${keys.length === 1 ? 'one-key' : ''}" aria-label="Dart entry">
        ${keys.map((n) => {
          const label = keyLabel(n);
          return `<button class="key ${typeof label === 'string' ? 'word' : ''}" data-act="dart" data-n="${n}" ${n === 25 && mod === 3 ? 'disabled' : ''}>${esc(label)}</button>`;
        }).join('')}
        <div class="bottom">
          <button class="key" data-act="dart" data-n="0" aria-label="Miss">0</button>
          ${modKeys}
        </div>
      </nav>`;
  const artBeforeHint = game.art?.place === 'before-hint';

  if (readonly) {
    return `
      <div class="match past n${match.sides.length}">
        <div class="match-top">
          <button class="btn small-btn" data-act="close-entry" aria-label="Back to History">‹</button>
          <div class="game-header"><span>${esc(describeMatch(match))}</span><span>${esc(opts.dateText ?? '')}</span></div>
        </div>
        <div class="result-banner">${state.over ? `<span>Winner</span> ${esc(winnerText(match, state))}` : 'Unfinished'}</div>
        ${game.board === 'marks'
          ? marksBoard(game, match, state, board, current, onDeck)
          : `<section class="cards">${match.sides.map((side, i) => card(side, i, board[i], state, current, onDeck, game)).join('')}</section>`}
      </div>`;
  }

  return `
    <div class="match n${match.sides.length} ${art ? 'has-art' : ''} ${hint?.panel ? 'has-panel' : ''} ${hint?.bullseye ? 'has-target' : ''} ${game.zonePad ? 'has-zonepad' : ''} ${game.plainNext ? 'plain-next' : ''} ${game.slimThrower ? 'slim-thrower' : ''}">
      <div class="match-top">
        <button class="btn small-btn" data-act="leave-match" aria-label="Back to setup">‹</button>
        <div class="game-header">
          <span>${esc(describeMatch(match))}</span>
          <span>${esc(game.roundText ? game.roundText(state.game) : `${game.roundLabel ?? 'Round'} ${state.turn.round}`)}</span>
        </div>
      </div>

      ${game.board === 'marks'
        ? marksBoard(game, match, state, board, current, onDeck)
        : `<section class="cards" aria-live="polite">
            ${match.sides.map((side, i) => card(side, i, board[i], state, current, onDeck, game)).join('')}
          </section>`}

      ${artBeforeHint ? art : ''}
      ${hintHtml}
      ${artBeforeHint ? '' : art}
      ${keypad}

      ${ui.toast ? `<div class="toast ${ui.toast.kind} ${ui.toast.text.length > 8 ? 'long' : ''}" role="status">${esc(ui.toast.text)}</div>` : ''}
      ${state.over ? winSheet(match, state) : ''}
    </div>`;
}

// Big bullseye target (Halve-It): fills the space between the players and the keypad.
// "TARGET" sits in the outer ring, the target on the bull (longer names shrink a step
// and may spread over the background), Round and Next underneath on the background.
function bullseyeTarget(hint) {
  const len = String(hint.value).length;
  const size = hint.big && len <= 2 ? 'len-big' : len <= 3 ? '' : len <= 4 ? 'len-4' : 'len-long';
  return `<div class="target-space" role="status" aria-label="Target ${esc(hint.value)}. ${esc(hint.help ?? '')}. ${esc(hint.leftLabel ?? 'Round')} ${esc(hint.round)}, next ${esc(hint.next)}">
    <div class="bull-tile ${hint.noFoot ? 'no-foot' : ''}">
      <div class="disc">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="49.5" fill="var(--bull-ring)"/>
          <circle cx="50" cy="50" r="35" fill="var(--bull-gap)"/>
          <circle cx="50" cy="50" r="21" fill="var(--bull-centre)"/>
        </svg>
        <span class="disc-label">Target</span>
        <span class="disc-num ${size}">${esc(hint.value)}</span>
        ${hint.ring ? ringMarkers(hint.ring) : ''}
      </div>
      ${hint.noFoot ? '' : `<div class="bull-foot"><span>${esc(hint.leftLabel ?? 'Round')} <b>${esc(hint.round)}</b></span><span>Next: <b>${esc(hint.next)}</b></span></div>`}
    </div>
  </div>`;
}

// Board map (Hare and Hounds, Around the Clock): each player's marker on the outer edge of
// the outer ring, at the angle of the number they're on. A marker is an animal, or (kind
// 'dot') a light dot with the player's initial.
function ringMarkers(ring) {
  // Every animal is the same size and centred exactly on the outer edge of the outer ring
  // (49.5% of the bullseye's width from the centre). Players sharing a number sit side by
  // side along the edge, spread a few degrees either side of that number.
  const count = {};
  ring.forEach((r) => { count[r.number] = (count[r.number] ?? 0) + 1; });
  const seen = {};
  return ring.map((r) => {
    const k = seen[r.number] = (seen[r.number] ?? -1) + 1;
    const spread = (k - (count[r.number] - 1) / 2) * (r.kind === 'dot' ? 21 : 11); // degrees; dots side by side
    const distance = 49.5;
    const rad = ((r.angle + spread) * Math.PI) / 180;
    const x = 50 + distance * Math.cos(rad);
    const y = 50 + distance * Math.sin(rad);
    return `<span class="ring-marker ${r.current ? 'now' : ''}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%">${r.kind === 'dot' ? initialDot(r.initial) : animalSvg(r.kind, r.color, 'animal')}</span>`;
  }).join('');
}

// A light dot with a player's initial, drawn as SVG so the letter scales with the dot.
function initialDot(initial) {
  return `<svg class="animal dot" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="18.5" fill="#f3e7c9" stroke="#0b0b0b" stroke-width="2"/>
    <text x="20" y="21" text-anchor="middle" dominant-baseline="central" font-size="23" font-weight="800" fill="#141414">${esc(initial)}</text>
  </svg>`;
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
      <div class="mstat">${esc(board[i].stats.join(' · '))}</div>
    </div>`;
  }).join('');
  const body = rows.map((row, r) => `
    <div class="mlabel ${row.dead ? 'dead' : ''}">${esc(row.label)}</div>
    ${match.sides.map((_, i) => `<div class="mcell ${i === current ? 'thrower' : ''} ${row.dead ? 'dead' : ''}">${markIcon(board[i].marks[r])}</div>`).join('')}
  `).join('');

  // Under each column: the current player's darts this turn (green),
  // everyone else's darts from their last turn (grey).
  const throws = match.sides.map((_, i) => {
    const isNow = i === current;
    const darts = isNow ? state.turn.darts : lastTurnDarts(state, i);
    return `<div class="mthrows ${isNow ? 'now' : ''}" aria-label="${isNow ? 'This turn' : 'Last turn'}">
      ${[0, 1, 2].map((k) => `<span>${darts[k] ? esc(shortLabel(darts[k])) : '–'}</span>`).join('')}
    </div>`;
  }).join('');

  return `
    <section class="marks-board" style="--cols:${match.sides.length};--rows:${rows.length}" aria-live="polite">
      <div class="mcorner"></div>${heads}${body}
      <div class="mlabel throws-label">Darts</div>${throws}
    </section>`;
}

// Darts from a side's most recent finished turn (empty before their first turn).
function lastTurnDarts(state, side) {
  for (let t = state.turns.length - 1; t >= 0; t--) if (state.turns[t].side === side) return state.turns[t].darts;
  return [];
}

// Compact labels for the narrow throws row: a miss shows as 0, outer bull 25, inner bull DB
// (Crackshot area darts show In, Bull, DB, Fire, Miss).
function shortLabel(dart) {
  if (dart.zone) return dartLabel(dart); // board-area darts: In, 25, DB, Fire, Miss
  if (dart.number === 0) return '0';
  if (dart.number === 25) return dart.multiplier === 2 ? 'DB' : '25';
  return dartLabel(dart);
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

function card(side, i, sb, state, current, onDeck, game) {
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
  const turnStat = isThrower && darts.length && sb.turnPoints !== undefined ? [`<b>Turn ${sb.turnPoints}</b>`] : [];
  const stats = [...turnStat, ...sb.stats.map(esc)];
  // A game can mark the last few lives as "at risk" (lives.risk): when a player is down
  // to that many, those first dots turn red. Assassin uses 3, Knockout uses 1.
  const risk = sb.lives?.risk ?? 0;
  const atRisk = sb.lives && sb.lives.have <= risk && sb.lives.have > 0;
  const lives = sb.lives
    ? `<div class="lives ${atRisk ? 'at-risk' : ''}" aria-label="${sb.lives.have} of ${sb.lives.max} lives">${[...Array(sb.lives.max)].map((_, k) =>
        `<span class="pip ${k < sb.lives.have ? 'on' : ''} ${atRisk && k < risk ? 'risk' : ''}"></span>`).join('')}</div>`
    : '';
  const badge = sb.badge ? `<span class="badge ${sb.badge === 'Out' ? 'badge-out' : ''}">${esc(sb.badge)}</span>` : '';
  // Games can put the life dots beside the score (keeps each card to one line);
  // the thrower's card always keeps them by the name.
  const livesBySide = game.livesBesideScore && !isThrower;
  // Games like Baseball keep each player's last 3 darts on their card until their next turn.
  const last = game.showLastDarts && !isThrower ? lastTurnDarts(state, i) : [];
  const lastDarts = last.length
    ? `<span class="mini-darts" aria-label="Last turn">${[0, 1, 2].map((k) => `<span>${last[k] ? esc(shortLabel(last[k])) : '–'}</span>`).join('')}</span>`
    : '';
  return `
    <div class="card ${cls} ${sb.out ? 'is-out' : ''}">
      <div class="card-left">
        <div class="name">${sb.animal ? `<span class="name-animal" title="${sb.animal.kind === 'hare' ? 'Hare' : 'Hound'}">${animalSvg(sb.animal.kind, sb.animal.color, 'animal')}</span>` : ''}${esc(team ? side.name : side.members[0])}${livesBySide ? '' : lives}${isNext ? ' <span class="tag">Next</span>' : ''}${badge}${lastDarts}</div>
        ${members}
        ${slots}
        ${stats.length ? `<div class="stats">${stats.join(' · ')}</div>` : ''}
      </div>
      <div class="score-side">${livesBySide ? lives : ''}<div class="score">${sb.mainLabel ? `<span class="main-label">${esc(sb.mainLabel)}</span>` : ''}${esc(sb.main)}</div></div>
    </div>`;
}

function winSheet(match, state) {
  const many = state.result.winners.length > 1;
  return `
    <div class="sheet-backdrop"></div>
    <div class="sheet win" role="dialog" aria-modal="true" aria-label="Game over">
      ${state.result.kicker ? `<div class="win-kicker">${esc(state.result.kicker)}</div>` : ''}
      <div class="win-title">${esc(winnerText(match, state))} ${many ? 'win' : 'wins'}!</div>
      <p class="note center small">Saved to History.</p>
      <div class="sheet-rows">
        <button class="sheet-row" data-act="rematch"><span class="sheet-label">Play again</span><span class="sheet-desc">Same players and settings</span></button>
        <button class="sheet-row" data-act="to-setup"><span class="sheet-label">New game</span><span class="sheet-desc">Back to setup</span></button>
        <button class="sheet-row" data-act="undo"><span class="sheet-label">Undo last dart</span><span class="sheet-desc">Entered it wrong? Step back</span></button>
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
    if (event && event.kind !== 'win' && event.text) showToast(ctx, event);
  },
  // Board-area buttons (Crackshot): record where the dart landed.
  zone: (ctx, el) => {
    const match = ctx.state.match;
    if (computeState(match).over) return;
    const dart = zoneDart(el.dataset.zone);
    if (!dart) return;
    const next = throwDart(match, dart);
    ctx.setMatch(next);
    const event = computeState(next).game.event;
    if (event && event.kind !== 'win' && event.text) showToast(ctx, event);
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
  // Back to Home. An unfinished game stays saved and shows as "Resume game".
  'leave-match': (ctx) => ctx.leaveMatch(),
  'to-setup': (ctx) => ctx.leaveMatch(),
  rematch: (ctx) => {
    const { gameId, options, sides } = ctx.state.match;
    const game = getGame(gameId);
    if (game.needsNumberDraw?.(options)) {
      ctx.state.match = null;
      ctx.setDraw({ gameId, options, sides, picks: [] }); // throw for numbers again
    } else {
      ctx.startMatch(createMatch({ gameId, options, sides }));
    }
  },
};
