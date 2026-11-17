// Home tab: the setup screen.
// Game picker -> option tiles -> players (and teams) -> throw order -> Start.

import { gamesByGroup, getGame, defaultOptions } from '../core/registry.js';
import { addPlayer, MAX_NAME } from '../core/roster.js';
import {
  nextOptionValue, isCustomValue, optionLabel, maxEntries, nextTeam, defaultTeam,
  validateSetup, buildSides, moveItem,
} from '../core/setup.js';
import { createMatch } from '../core/engine.js';
import { esc, icon, themeToggle } from './html.js';

// Picked players with their current names; drops anyone removed from the roster.
export function pickedEntries(state) {
  const byId = new Map(state.roster.map((p) => [p.id, p]));
  return state.setup.entries.filter((e) => byId.has(e.playerId)).map((e) => ({ ...e, name: byId.get(e.playerId).name }));
}

export function currentOptions(state, game) {
  return { ...defaultOptions(game), ...(state.setup.options[game.id] ?? {}) };
}

export function renderSetup(ctx) {
  const { state } = ctx;
  const { setup, ui, roster } = state;
  const game = getGame(setup.gameId);
  const options = currentOptions(state, game);
  const teams = setup.teams && game.teams;
  const entries = pickedEntries(state);
  const limit = maxEntries(game, teams);
  const problem = validateSetup(game, entries, { teams, options });
  const available = roster.filter((p) => !entries.some((e) => e.playerId === p.id));

  return `
    <header class="topbar"><h1>Dart Scoreboard</h1>${themeToggle(ctx.theme)}</header>
    <main class="screen">

      <section class="section">
        <h2>Game</h2>
        <button class="game-pick" data-act="toggle-games" aria-expanded="${!!ui.gamesOpen}">
          <span>${esc(game.name)}</span><span class="pick-group">${esc(game.group)} ▾</span>
        </button>
        ${ui.gamesOpen ? gameList(setup.gameId) : `<p class="note rules">${esc(game.rules)}</p>`}
      </section>

      <section class="section">
        <div class="tiles">
          ${game.options.map((o) => `
            <button class="tile ${o.type === 'toggle' && !options[o.id] ? 'off' : ''}" data-act="cycle" data-opt="${o.id}">
              <span class="tile-label">${esc(o.label)}</span>
              <span class="tile-value">${esc(optionLabel(o, options[o.id]))}</span>
            </button>`).join('')}
        </div>
        ${game.options.filter((o) => isCustomValue(o, options[o.id])).map((o) => `
          <label class="custom-row">Custom ${esc(o.label.toLowerCase())}
            <input type="number" inputmode="numeric" min="${o.custom.min}" max="${o.custom.max}"
              value="${options[o.id] === 'custom' ? '' : options[o.id]}" placeholder="${o.custom.min}–${o.custom.max}" data-custom="${o.id}">
          </label>`).join('')}
      </section>

      <section class="section">
        <div class="row-between"><h2>Players</h2><span class="count">${entries.length} / ${limit}</span></div>
        <div class="switches">
          ${toggle('random', 'Random order', setup.random)}
          ${game.teams ? toggle('teams', 'Teams', teams) : ''}
        </div>
        ${teams ? '<p class="note small">Tap a team badge to change team. 2 or 3 players per team.</p>' : ''}
        ${entries.length ? `<ol class="picked" id="picked">
          ${entries.map((e, i) => `
            <li class="pick-row" data-index="${i}">
              <span class="handle" data-drag aria-label="Drag to reorder">${icon('handle')}</span>
              <span class="row-name">${esc(e.name)}</span>
              ${teams ? `<button class="team-badge team-${e.team}" data-act="team" data-index="${i}" aria-label="Team ${e.team}, tap to change">${e.team}</button>` : ''}
              <button class="btn icon-btn" data-act="unpick" data-index="${i}" aria-label="Take ${esc(e.name)} out">✕</button>
            </li>`).join('')}
        </ol>` : '<p class="note">Add players to start.</p>'}

        ${ui.addOpen ? `
          <div class="add-panel">
            ${available.length ? `<div class="chips">
              ${available.map((p) => `<button class="chip" data-act="pick" data-id="${p.id}" ${entries.length >= limit ? 'disabled' : ''}>+ ${esc(p.name)}</button>`).join('')}
            </div>` : ''}
            <form class="add-row" data-form="quick-add">
              <input name="name" maxlength="${MAX_NAME}" placeholder="New player name" autocomplete="off">
              <button class="btn" ${entries.length >= limit ? 'disabled' : ''}>Add</button>
            </form>
            ${ui.setupError ? `<p class="error">${esc(ui.setupError)}</p>` : ''}
            <button class="btn wide" data-act="close-add">Done</button>
          </div>` : `
          <button class="btn wide" data-act="open-add" ${entries.length >= limit ? 'disabled' : ''}>+ Add players</button>`}
      </section>

      <section class="section start-wrap">
        ${problem ? `<p class="note center">${esc(problem)}</p>` : ''}
        <button class="start" data-act="start" ${problem ? 'disabled' : ''}>Start</button>
      </section>
    </main>`;
}

function toggle(key, label, on) {
  return `<button class="switch" role="switch" aria-checked="${!!on}" data-act="switch" data-key="${key}">
    <span class="switch-track"><span class="switch-knob"></span></span>${label}
  </button>`;
}

function gameList(currentId) {
  return `<div class="game-list">
    ${Object.entries(gamesByGroup()).map(([group, games]) => `
      <div class="game-group">
        <div class="group-name">${group}</div>
        ${games.length
          ? games.map((g) => `<button class="game-option" data-act="choose-game" data-id="${g.id}" aria-pressed="${g.id === currentId}">${esc(g.name)}</button>`).join('')
          : '<span class="note small">Coming soon</span>'}
      </div>`).join('')}
  </div>`;
}

// ---------- actions ----------

function setOption(ctx, id, value) {
  ctx.setSetup((s) => ({ ...s, options: { ...s.options, [s.gameId]: { ...(s.options[s.gameId] ?? {}), [id]: value } } }));
}

export const setupActions = {
  'toggle-games': (ctx) => ctx.setUi({ gamesOpen: !ctx.state.ui.gamesOpen }),
  'choose-game': (ctx, el) => {
    ctx.setSetup((s) => ({ ...s, gameId: el.dataset.id }));
    ctx.setUi({ gamesOpen: false });
  },
  cycle: (ctx, el) => {
    const game = getGame(ctx.state.setup.gameId);
    const option = game.options.find((o) => o.id === el.dataset.opt);
    setOption(ctx, option.id, nextOptionValue(option, currentOptions(ctx.state, game)[option.id]));
  },
  switch: (ctx, el) => {
    const key = el.dataset.key;
    ctx.setSetup((s) => {
      const next = { ...s, [key]: !s[key] };
      // Switching teams on: give everyone a starting team, alternating A, B.
      if (key === 'teams' && next.teams) next.entries = s.entries.map((e, i) => ({ ...e, team: e.team ?? defaultTeam(i) }));
      return next;
    });
  },
  team: (ctx, el) => {
    const i = Number(el.dataset.index);
    ctx.setSetup((s) => ({ ...s, entries: s.entries.map((e, j) => (j === i ? { ...e, team: nextTeam(e.team) } : e)) }));
  },
  unpick: (ctx, el) => {
    const i = Number(el.dataset.index);
    ctx.setSetup((s) => ({ ...s, entries: s.entries.filter((_, j) => j !== i) }));
  },
  'open-add': (ctx) => ctx.setUi({ addOpen: true, setupError: null }),
  'close-add': (ctx) => ctx.setUi({ addOpen: false, setupError: null }),
  pick: (ctx, el) => pickPlayer(ctx, el.dataset.id),
  start: (ctx) => {
    const { state } = ctx;
    const game = getGame(state.setup.gameId);
    const options = currentOptions(state, game);
    const teams = state.setup.teams && game.teams;
    const entries = pickedEntries(state);
    if (validateSetup(game, entries, { teams, options })) return;
    const sides = buildSides(entries, { teams, random: state.setup.random });
    ctx.startMatch(createMatch({ gameId: game.id, options, sides }));
  },
};

function pickPlayer(ctx, playerId) {
  ctx.setSetup((s) => ({ ...s, entries: [...s.entries, { playerId, team: defaultTeam(s.entries.length) }] }));
}

export const setupForms = {
  'quick-add': (ctx, form) => {
    try {
      const roster = addPlayer(ctx.state.roster, form.name.value);
      ctx.setRoster(roster);
      pickPlayer(ctx, roster[roster.length - 1].id);
      ctx.setUi({ setupError: null });
    } catch (err) {
      ctx.setUi({ setupError: err.message });
    }
  },
};

// Custom number typed into a tile's custom box.
export function onCustomInput(ctx, input) {
  const game = getGame(ctx.state.setup.gameId);
  const option = game.options.find((o) => o.id === input.dataset.custom);
  const n = Number(input.value);
  const ok = Number.isInteger(n) && n >= option.custom.min && n <= option.custom.max;
  setOption(ctx, option.id, ok ? n : 'custom');
}

// Drag a player's handle up or down to change the throw order.
export function enableDrag(ctx, root) {
  const list = root.querySelector('#picked');
  if (!list) return;
  list.addEventListener('pointerdown', (down) => {
    const handle = down.target.closest('[data-drag]');
    if (!handle) return;
    down.preventDefault();
    const row = handle.closest('li');
    const from = Number(row.dataset.index);
    row.classList.add('dragging');
    // Listen on the whole window: moving the row in the page would otherwise lose the pointer.

    const move = (ev) => {
      const rows = [...list.children];
      const target = rows.find((r) => r !== row && ev.clientY > r.getBoundingClientRect().top && ev.clientY < r.getBoundingClientRect().bottom);
      if (!target) return;
      const after = rows.indexOf(target) > rows.indexOf(row);
      list.insertBefore(row, after ? target.nextSibling : target);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      const to = [...list.children].indexOf(row);
      row.classList.remove('dragging');
      if (to !== from) ctx.setSetup((s) => ({ ...s, entries: moveItem(s.entries, from, to) }));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });
}
