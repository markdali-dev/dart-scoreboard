// App entry point. For build step 1 this shows the shell: theme toggle,
// the (still empty) game list, and a static preview of the playing-screen
// look so both themes can be checked. Real screens arrive in steps 2 and 3.

import '../games/index.js';
import { gamesByGroup } from './core/registry.js';
import { getTheme, setTheme, applyTheme } from './core/theme.js';

const app = document.getElementById('app');
let offlineStatus = 'checking…';

function render() {
  const theme = getTheme();
  const groups = gamesByGroup();
  const gameCount = Object.values(groups).flat().length;

  app.innerHTML = `
    <header class="topbar">
      <h1>Dart Scoreboard</h1>
      <div class="segmented" role="group" aria-label="Theme">
        <button data-theme-choice="dark" aria-pressed="${theme === 'dark'}">Dark</button>
        <button data-theme-choice="light" aria-pressed="${theme === 'light'}">Light</button>
      </div>
    </header>

    <section class="section">
      <h2>Games</h2>
      ${gameCount
        ? Object.entries(groups).filter(([, list]) => list.length)
            .map(([group, list]) => `<p class="note"><b>${group}:</b> ${list.map((g) => g.name).join(', ')}</p>`).join('')
        : `<p class="note">No games yet. X01 arrives in build step 3.
             Engine checks: <a href="tests/">run the tests</a>.</p>`}
      <p class="note" id="offline-status">Offline mode: ${offlineStatus}</p>
    </section>

    <section class="section" aria-label="Look preview">
      <h2>Look preview <span class="note">(not playable yet)</span></h2>
      <div class="game-header"><span>X01 · 501 · Double out</span><span>Round 4</span></div>
      <div class="cards">
        <div class="card thrower">
          <div>
            <div class="name">Mark</div>
            <div class="slots">
              <div class="slot">T20</div><div class="slot empty">–</div><div class="slot empty">–</div>
            </div>
          </div>
          <div class="score">132</div>
        </div>
        <div class="card next">
          <div class="name">Dean <span class="tag">Next</span></div><div class="score">301</div>
        </div>
        <div class="card"><div class="name">Ludwig</div><div class="score">245</div></div>
        <div class="card"><div class="name">Adam</div><div class="score">188</div></div>
      </div>
      <div class="hint"><span class="label">Out:</span><span>T20</span><span>D16</span><span></span></div>
    </section>

    <nav class="keypad" aria-label="Dart entry (preview)">
      ${[...Array(20)].map((_, i) => `<button class="key">${i + 1}</button>`).join('')}
      <button class="key">25</button>
      <div class="bottom">
        <button class="key">0</button>
        <button class="key double" data-mod>DOUBLE</button>
        <button class="key triple" data-mod>TRIPLE</button>
        <button class="key undo">Undo</button>
      </div>
    </nav>
  `;

  app.querySelectorAll('[data-theme-choice]').forEach((btn) =>
    btn.addEventListener('click', () => { setTheme(btn.dataset.themeChoice); render(); }));

  // Preview only: show that the modifier keys toggle.
  app.querySelectorAll('[data-mod]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      app.querySelectorAll('[data-mod]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', String(on));
    }));
}

applyTheme(getTheme());
render();

// Offline support. Service workers only run on http://localhost or https.
// The line on the home screen shows whether it worked, so no developer tools are needed.
function showOfflineStatus(text) {
  offlineStatus = text;
  render();
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => navigator.serviceWorker.ready)
    .then(() => showOfflineStatus('ready ✓ (works without internet)'))
    .catch((err) => {
      console.warn('Service worker not registered:', err);
      showOfflineStatus('not available in this browser ✗');
    });
} else {
  showOfflineStatus('not supported in this browser ✗');
}
