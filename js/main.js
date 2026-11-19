// App entry point: holds what's on screen, saves it, and redraws.
// Each screen lives in js/ui/ and only describes what to show and what
// its buttons do.

import '../games/index.js';
import { listGames } from './core/registry.js';
import { load, save } from './core/store.js';
import { getTheme, setTheme, applyTheme } from './core/theme.js';
import { tabBar } from './ui/html.js';
import { renderSetup, setupActions, setupForms, onCustomInput, enableDrag } from './ui/setupScreen.js';
import { renderPlayers, playersActions, playersForms } from './ui/playersScreen.js';
import { renderMatch, matchActions } from './ui/matchScreen.js';
import { renderDraw, drawActions } from './ui/drawScreen.js';

const app = document.getElementById('app');

const state = {
  tab: 'home',
  roster: load('roster', []),
  setup: {
    gameId: listGames()[0].id,
    options: {},
    entries: [],
    teams: false,
    random: false,
    ...load('setup', {}),
  },
  match: null, // the game being played (saved and resumable from step 6)
  draw: null,  // Number draw in progress before a game like Assassin
  ui: {},      // short-lived screen state: open panels, error messages
};
// A saved game that no longer exists falls back to the first game.
if (!listGames().some((g) => g.id === state.setup.gameId)) state.setup.gameId = listGames()[0].id;

const ctx = {
  state,
  get theme() { return getTheme(); },
  setUi(patch) { state.ui = { ...state.ui, ...patch }; render(); },
  setSetup(change) {
    state.setup = change(state.setup);
    save('setup', state.setup);
    render();
  },
  setRoster(roster) {
    state.roster = roster;
    save('roster', roster);
    // Anyone removed from the list is also taken out of the game being set up.
    const ids = new Set(roster.map((p) => p.id));
    state.setup = { ...state.setup, entries: state.setup.entries.filter((e) => ids.has(e.playerId)) };
    save('setup', state.setup);
    render();
  },
  startMatch(match) { state.match = match; state.ui = {}; render(); },
  setMatch(match) { state.match = match; render(); },
  setDraw(draw) { state.draw = draw; state.ui = {}; render(); window.scrollTo(0, 0); },
  leaveMatch() { state.match = null; state.ui = {}; render(); },
};
// Clean up on load too, in case the saved list and setup ever disagree.
ctx.setRoster(state.roster);

const actions = {
  ...setupActions,
  ...playersActions,
  ...matchActions,
  ...drawActions,
  tab: (c, el) => { state.tab = el.dataset.tab; state.ui = {}; render(); window.scrollTo(0, 0); },
  theme: (c, el) => { setTheme(el.dataset.themeChoice); render(); },
};
const forms = { ...setupForms, ...playersForms };

function comingSoon(title, step) {
  return `<header class="topbar"><h1>${title}</h1></header>
    <main class="screen"><section class="section"><p class="note">Coming in build step ${step}.</p></section></main>`;
}

function render() {
  if (state.match) {
    app.innerHTML = renderMatch(ctx);
    return;
  }
  if (state.draw) {
    app.innerHTML = renderDraw(ctx);
    return;
  }
  const screens = {
    home: () => renderSetup(ctx),
    players: () => renderPlayers(ctx),
    stats: () => comingSoon('Stats', 9),
    history: () => comingSoon('History', 6),
    settings: () => comingSoon('Settings', 10),
  };
  app.innerHTML = screens[state.tab]() + tabBar(state.tab);
  if (state.tab === 'home') enableDrag(ctx, app);
  app.querySelector('[data-autofocus]')?.focus();
}

// One listener for every button on every screen.
app.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  actions[el.dataset.act]?.(ctx, el);
});
app.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const typed = ev.target.name?.value ?? '';
  forms[ev.target.dataset.form]?.(ctx, ev.target);
  // The screen was redrawn: put the cursor back, and if there was a problem
  // (e.g. a duplicate name) keep what was typed so it can be fixed.
  const input = app.querySelector(`[data-form="${ev.target.dataset.form}"] input`);
  if (input) {
    if (state.ui.setupError || state.ui.playersError) input.value = typed;
    input.focus();
  }
});
app.addEventListener('change', (ev) => {
  if (ev.target.dataset.custom) onCustomInput(ctx, ev.target);
});

applyTheme(getTheme());
render();

// Offline support: saves a copy of the app on the phone so it opens with no internet.
// (Players never see this. Developers can check it on the tests page.)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('Service worker not registered:', err));
}
