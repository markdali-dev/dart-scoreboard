// Home tab: the setup screen.
// Game picker -> option tiles -> players (and teams) -> throw order -> Start.

import { boardArt } from './boardArt.js';
import { gamesByGroup, getGame, defaultOptions } from '../core/registry.js';
import { addPlayer, MAX_NAME } from '../core/roster.js';
import {
  nextOptionValue, isCustomValue, optionLabel, maxEntries, teamChoices, defaultTeam,
  validateSetup, buildSides, moveItem,
} from '../core/setup.js';
import { createMatch, computeState } from '../core/engine.js';
import { wouldReplace } from '../core/saved.js';
import { esc, icon, themeToggle } from './html.js';
import { describeMatch } from './matchScreen.js';

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
      ${state.current ? resumeBar(state.current) : ''}

      <section class="section game-section">
        ${boardArt}
        <h2>Select a Game</h2>
        <button class="game-pick" data-act="toggle-games" aria-expanded="${!!ui.gamesOpen}">
          <span>${esc(game.name)}</span><span class="pick-group">${esc(game.group)} ▾</span>
        </button>
        ${ui.gamesOpen ? gameList(setup.gameId) : `<p class="note rules">${esc(game.rules)}</p>`}
      </section>

      <section class="section">
        <div class="tiles">
          ${game.options.map((o) => `
            <button class="tile ${o.type === 'toggle' && !options[o.id] ? 'off' : ''}" data-act="${o.type === 'toggle' ? 'cycle' : 'open-option'}" data-opt="${o.id}" ${o.type === 'toggle' ? '' : 'aria-haspopup="dialog"'}>
              <span class="tile-label">${esc(o.label)}</span>
              <span class="tile-value">${esc(optionLabel(o, options[o.id]))}</span>
            </button>`).join('')}
        </div>
        ${game.options.filter((o) => isCustomValue(o, options[o.id])).map((o) => `
          <label class="custom-row">Custom ${esc(o.label.toLowerCase())}
            <input type="number" inputmode="numeric" min="${o.custom.min}" max="${o.custom.max}"
              value="${options[o.id] === 'custom' ? '' : options[o.id]}" placeholder="${o.custom.min}–${o.custom.max}" data-custom="${o.id}" ${options[o.id] === 'custom' ? 'data-autofocus' : ''}>
          </label>`).join('')}
      </section>

      <section class="section">
        <div class="row-between"><h2>Players</h2><span class="count">${entries.length} / ${limit}</span></div>
        <div class="switches">
          ${toggle('random', 'Random order', setup.random)}
          ${game.teams ? toggle('teams', 'Teams', teams) : ''}
        </div>
        ${teams ? '<p class="note small">Tap a team letter to change team. 2 or 3 players per team.</p>' : ''}
        ${entries.length ? `<ol class="picked" id="picked">
          ${entries.map((e, i) => `
            <li class="pick-row" data-index="${i}">
              <span class="handle" data-drag aria-label="Drag to reorder">${icon('handle')}</span>
              <span class="row-name">${esc(e.name)}</span>
              ${teams ? `<button class="team-badge" data-act="open-team" data-index="${i}" aria-haspopup="dialog" aria-label="Team ${e.team}, tap to change">${e.team}</button>` : ''}
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
    </main>
    ${ui.sheet ? renderSheet(ui.sheet, game, options, entries) : ''}
    ${ui.confirmReplace ? replaceSheet(state.current) : ''}`;
}

// "Resume game" bar: the unfinished game, who's in it and where it got to.
function resumeBar(match) {
  const s = computeState(match);
  const game = getGame(match.gameId);
  const names = match.sides.map((side) => (side.members.length > 1 ? side.name : side.members[0])).join(', ');
  const round = game.roundText ? game.roundText(s.game) : `${game.roundLabel ?? 'Round'} ${s.turn.round}`;
  // End Game (Mark, 2026-11-21): discards it on the spot, so picking a new game needs no pop-up.
  return `<section class="section resume-row">
    <button class="resume-bar" data-act="resume">
      <span class="resume-label">Resume game</span>
      <span class="resume-what">${esc(describeMatch(match))} · ${esc(round)}</span>
      <span class="resume-who">${esc(names)}</span>
    </button>
    <button class="resume-end" data-act="end-current" aria-label="End the unfinished game">End<br>Game</button>
  </section>`;
}

function replaceSheet(match) {
  return `
    <div class="sheet-backdrop" data-act="cancel-replace"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="Replace unfinished game">
      <div class="sheet-title">Replace the unfinished game?</div>
      <p class="note">${esc(describeMatch(match))} isn’t finished. Starting a new game discards it.</p>
      <div class="sheet-rows">
        <button class="sheet-row" data-act="cancel-replace"><span class="sheet-label">Keep it</span><span class="sheet-desc">Go back; you can still resume it</span></button>
        <button class="sheet-row danger" data-act="start" data-force="1"><span class="sheet-label">Start new game</span><span class="sheet-desc">The unfinished game is discarded</span></button>
      </div>
    </div>`;
}

// Pop-up menu that slides up from the bottom, with big rows for fingers.
function renderSheet(sheet, game, options, entries) {
  let title, help = '', rows;
  if (sheet.kind === 'option') {
    const o = game.options.find((x) => x.id === sheet.optId);
    const value = options[o.id];
    title = o.label;
    help = o.help ?? '';
    rows = o.choices.map((c) => sheetRow({
      act: 'set-option', data: `data-opt="${o.id}" data-value="${esc(JSON.stringify(c.value))}"`,
      label: c.label, description: c.description, selected: c.value === value,
    }));
    if (o.custom) {
      rows.push(sheetRow({
        act: 'set-option', data: `data-opt="${o.id}" data-value="&quot;custom&quot;"`,
        label: 'Custom…', description: o.customLabel, selected: isCustomValue(o, value),
      }));
    }
  } else {
    const entry = entries[sheet.index];
    title = `${entry.name}'s team`;
    rows = teamChoices(entries.length, game.maxPlayers, entry.team).map((letter) => {
      const members = entries.filter((e, j) => e.team === letter && j !== sheet.index).map((e) => e.name);
      return sheetRow({
        act: 'set-team', data: `data-index="${sheet.index}" data-team="${letter}"`,
        label: `Team ${letter}`, description: members.length ? `with ${members.join(', ')}` : 'nobody yet',
        selected: entry.team === letter,
      });
    });
  }
  return `
    <div class="sheet-backdrop" data-act="close-sheet"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-head">
        <div><div class="sheet-title">${esc(title)}</div>${help ? `<div class="note small">${esc(help)}</div>` : ''}</div>
        <button class="btn icon-btn" data-act="close-sheet" aria-label="Close">✕</button>
      </div>
      <div class="sheet-rows">${rows.join('')}</div>
    </div>`;
}

function sheetRow({ act, data, label, description, selected }) {
  return `<button class="sheet-row" data-act="${act}" ${data} aria-pressed="${selected}">
    <span class="sheet-label">${esc(label)}</span>
    ${description ? `<span class="sheet-desc">${esc(description)}</span>` : ''}
  </button>`;
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
  'open-option': (ctx, el) => ctx.setUi({ sheet: { kind: 'option', optId: el.dataset.opt } }),
  'open-team': (ctx, el) => ctx.setUi({ sheet: { kind: 'team', index: Number(el.dataset.index) } }),
  'close-sheet': (ctx) => ctx.setUi({ sheet: null }),
  'set-option': (ctx, el) => {
    const value = JSON.parse(el.dataset.value);
    // Picking "Custom…" again keeps a number already typed.
    const game = getGame(ctx.state.setup.gameId);
    const option = game.options.find((o) => o.id === el.dataset.opt);
    const current = currentOptions(ctx.state, game)[option.id];
    ctx.state.ui.sheet = null;
    setOption(ctx, option.id, value === 'custom' && isCustomValue(option, current) ? current : value);
  },
  'set-team': (ctx, el) => {
    const i = Number(el.dataset.index);
    ctx.state.ui.sheet = null;
    ctx.setSetup((s) => ({ ...s, entries: s.entries.map((e, j) => (j === i ? { ...e, team: el.dataset.team } : e)) }));
  },
  unpick: (ctx, el) => {
    const i = Number(el.dataset.index);
    ctx.setSetup((s) => ({ ...s, entries: s.entries.filter((_, j) => j !== i) }));
  },
  'open-add': (ctx) => ctx.setUi({ addOpen: true, setupError: null }),
  'close-add': (ctx) => ctx.setUi({ addOpen: false, setupError: null }),
  pick: (ctx, el) => pickPlayer(ctx, el.dataset.id),
  resume: (ctx) => ctx.resumeMatch(),
  'end-current': (ctx) => ctx.endCurrent(),
  'cancel-replace': (ctx) => ctx.setUi({ confirmReplace: false }),
  start: (ctx, el) => {
    const { state } = ctx;
    const game = getGame(state.setup.gameId);
    const options = currentOptions(state, game);
    const teams = state.setup.teams && game.teams;
    const entries = pickedEntries(state);
    if (validateSetup(game, entries, { teams, options })) return;
    // Only one unfinished game is kept: ask before replacing it.
    if (wouldReplace(state.current) && !el.dataset.force) { ctx.setUi({ confirmReplace: true }); return; }
    state.ui.confirmReplace = false;
    const sides = buildSides(entries, { teams, random: state.setup.random });
    if (game.needsNumberDraw?.(options)) ctx.setDraw({ gameId: game.id, options, sides, picks: [] });
    else ctx.startMatch(createMatch({ gameId: game.id, options, sides }));
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
