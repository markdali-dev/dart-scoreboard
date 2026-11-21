// Settings tab (Mark, 2026-11-21): Backup / restore, Clear History, About.
// The Dark/Light switch stays on the Home screen.

import { makeBackup, backupFileName, readBackup } from '../core/backup.js';
import { esc } from './html.js';

export const APP_VERSION = '1.0';

const plural = (n, word) => `${n} ${n === 1 ? word : word + 's'}`;

export function renderSettings(ctx) {
  const { state } = ctx;
  const ui = state.ui;
  const games = state.history.length;
  const restore = ui.restoreData;
  return `
    <header class="topbar"><h1>Settings</h1></header>
    <main class="screen">
      <section class="section">
        <h2>Backup</h2>
        <p class="note">Save your players and all ${plural(games, 'game')} in History to a file. Open it on another phone with Restore.</p>
        <div class="settings-buttons">
          <button class="btn primary" data-act="backup">Save backup</button>
          <label class="btn">Restore<input type="file" accept=".json,application/json" data-restore hidden></label>
        </div>
        ${ui.settingsMsg ? `<p class="settings-msg ${ui.settingsError ? 'bad' : ''}" role="status">${esc(ui.settingsMsg)}</p>` : ''}
      </section>

      <section class="section">
        <h2>History</h2>
        <p class="note">Delete every finished game. Players are kept. Stats start again from zero.</p>
        <button class="btn danger settings-wide" data-act="ask-clear-history" ${games ? '' : 'disabled'}>Clear History</button>
      </section>

      <section class="section">
        <h2>About</h2>
        <dl class="about">
          <div><dt>App</dt><dd>Dart Scoreboard ${APP_VERSION}</dd></div>
          <div><dt>Address</dt><dd>${esc(location.origin + location.pathname)}</dd></div>
          <div><dt>Your data</dt><dd>Players, games and stats are kept on this phone only. Nothing is sent anywhere, and it works with no internet.</dd></div>
        </dl>
      </section>
    </main>
    ${ui.confirmClear ? confirmSheet('Clear History?',
      `All ${plural(games, 'finished game')} will be deleted, and Stats start from zero. This cannot be undone, unless you saved a backup.`,
      'clear-history', 'Clear History', 'Delete every finished game') : ''}
    ${restore ? confirmSheet('Restore this backup?',
      `It has ${plural(restore.roster.length, 'player')} and ${plural(restore.history.length, 'game')}, saved ${new Date(restore.savedAt).toLocaleDateString()}. It replaces the players and History on this phone.`,
      'restore', 'Restore', 'Replace what is on this phone') : ''}`;
}

function confirmSheet(title, text, act, label, desc) {
  return `
    <div class="sheet-backdrop" data-act="settings-cancel"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-title">${esc(title)}</div>
      <p class="note">${esc(text)}</p>
      <div class="sheet-rows">
        <button class="sheet-row" data-act="settings-cancel"><span class="sheet-label">Cancel</span><span class="sheet-desc">Leave everything as it is</span></button>
        <button class="sheet-row danger" data-act="${act}"><span class="sheet-label">${esc(label)}</span><span class="sheet-desc">${esc(desc)}</span></button>
      </div>
    </div>`;
}

// Save the backup: the phone's share menu where there is one (Save to Files, Drive...),
// otherwise a normal download.
async function saveBackup(ctx) {
  const json = JSON.stringify(makeBackup(ctx.state));
  const name = backupFileName();
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Dart Scoreboard backup' });
      ctx.setUi({ settingsMsg: 'Backup saved.', settingsError: false });
      return;
    }
  } catch (err) {
    if (err?.name === 'AbortError') return; // closed the share menu without saving
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  ctx.setUi({ settingsMsg: `Backup saved as ${name}.`, settingsError: false });
}

// A file was picked for Restore: check it, then ask before replacing anything.
export async function onRestoreFile(ctx, input) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    const data = readBackup(await file.text());
    ctx.setUi({ restoreData: data, settingsMsg: null });
  } catch (err) {
    ctx.setUi({ settingsMsg: err.message, settingsError: true });
  }
}

export const settingsActions = {
  backup: (ctx) => { saveBackup(ctx); },
  'ask-clear-history': (ctx) => ctx.setUi({ confirmClear: true, settingsMsg: null }),
  'settings-cancel': (ctx) => ctx.setUi({ confirmClear: false, restoreData: null }),
  'clear-history': (ctx) => {
    ctx.clearHistory();
    ctx.setUi({ confirmClear: false, settingsMsg: 'History cleared.', settingsError: false });
  },
  restore: (ctx) => {
    const data = ctx.state.ui.restoreData;
    ctx.restoreBackup(data);
    ctx.setUi({ restoreData: null, settingsMsg: `Restored ${plural(data.roster.length, 'player')} and ${plural(data.history.length, 'game')}.`, settingsError: false });
  },
};
