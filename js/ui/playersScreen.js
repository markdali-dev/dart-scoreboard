// Players tab: the saved list of names. Add, rename, remove.

import { addPlayer, renamePlayer, removePlayer, MAX_ROSTER, MAX_NAME } from '../core/roster.js';
import { esc } from './html.js';

export function renderPlayers(ctx) {
  const { roster, ui } = ctx.state;
  const full = roster.length >= MAX_ROSTER;
  return `
    <header class="topbar"><h1>Players</h1><span class="count">${roster.length} / ${MAX_ROSTER}</span></header>
    <main class="screen">
      <section class="section">
        <form class="add-row" data-form="roster-add">
          <input name="name" maxlength="${MAX_NAME}" placeholder="${full ? 'List is full' : 'New player name'}" autocomplete="off" ${full ? 'disabled' : ''}>
          <button class="btn primary" ${full ? 'disabled' : ''}>Add</button>
        </form>
        ${ui.playersError ? `<p class="error">${esc(ui.playersError)}</p>` : ''}
      </section>
      <section class="section">
        ${roster.length ? `<ul class="list">
          ${roster.map((p) => ui.editing === p.id ? `
            <li class="list-row">
              <form class="add-row" data-form="roster-rename" data-id="${p.id}">
                <input name="name" maxlength="${MAX_NAME}" value="${esc(p.name)}" autocomplete="off" data-autofocus>
                <button class="btn primary">Save</button>
                <button class="btn" type="button" data-act="cancel-edit">Cancel</button>
              </form>
            </li>` : `
            <li class="list-row">
              <span class="row-name">${esc(p.name)}</span>
              ${ui.confirmRemove === p.id ? `
                <button class="btn danger" data-act="remove-player" data-id="${p.id}">Remove</button>
                <button class="btn" data-act="cancel-remove">Keep</button>` : `
                <button class="btn" data-act="edit-player" data-id="${p.id}">Rename</button>
                <button class="btn icon-btn" data-act="ask-remove" data-id="${p.id}" aria-label="Remove ${esc(p.name)}">✕</button>`}
            </li>`).join('')}
        </ul>` : '<p class="note">No players yet. Add the people you play with.</p>'}
      </section>
    </main>`;
}

export const playersActions = {
  'edit-player': (ctx, el) => ctx.setUi({ editing: el.dataset.id, confirmRemove: null, playersError: null }),
  'cancel-edit': (ctx) => ctx.setUi({ editing: null, playersError: null }),
  'ask-remove': (ctx, el) => ctx.setUi({ confirmRemove: el.dataset.id, editing: null }),
  'cancel-remove': (ctx) => ctx.setUi({ confirmRemove: null }),
  'remove-player': (ctx, el) => {
    ctx.setRoster(removePlayer(ctx.state.roster, el.dataset.id));
    ctx.setUi({ confirmRemove: null });
  },
};

export const playersForms = {
  'roster-add': (ctx, form) => tryRoster(ctx, () => addPlayer(ctx.state.roster, form.name.value)),
  'roster-rename': (ctx, form) => {
    if (tryRoster(ctx, () => renamePlayer(ctx.state.roster, form.dataset.id, form.name.value))) ctx.setUi({ editing: null });
  },
};

function tryRoster(ctx, change) {
  try {
    ctx.setRoster(change());
    ctx.setUi({ playersError: null });
    return true;
  } catch (err) {
    ctx.setUi({ playersError: err.message });
    return false;
  }
}
