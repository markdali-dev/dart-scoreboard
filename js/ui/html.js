// Small helpers for building screens as HTML text.

// Makes text safe to put inside HTML (so a name like "<b>" shows as typed).
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Simple line icons for the bottom navigation, drawn for this app.
const ICONS = {
  home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
  players: '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 14.5c3 0 6 1.8 6 5.5"/>',
  stats: '<path d="M5 20V12M10 20V6M15 20v-9M20 20V9"/>',
  history: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
  handle: '<path d="M5 8h14M5 12h14M5 16h14"/>',
};

export function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

export const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'players', label: 'Players' },
  { id: 'stats', label: 'Stats' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
];

export function tabBar(current) {
  return `<nav class="tabbar" aria-label="Main">
    ${TABS.map((t) => `<button data-act="tab" data-tab="${t.id}" ${t.id === current ? 'aria-current="page"' : ''}>${icon(t.id)}<span>${t.label}</span></button>`).join('')}
  </nav>`;
}

export function themeToggle(theme) {
  return `<div class="segmented" role="group" aria-label="Theme">
    <button data-act="theme" data-theme-choice="dark" aria-pressed="${theme === 'dark'}">Dark</button>
    <button data-act="theme" data-theme-choice="light" aria-pressed="${theme === 'light'}">Light</button>
  </div>`;
}

// The dart entry pad. Not wired to anything until build step 3.
export function keypad() {
  return `<nav class="keypad" aria-label="Dart entry">
    ${[...Array(20)].map((_, i) => `<button class="key">${i + 1}</button>`).join('')}
    <button class="key">25</button>
    <div class="bottom">
      <button class="key">0</button>
      <button class="key double">DOUBLE</button>
      <button class="key triple">TRIPLE</button>
      <button class="key undo">Undo</button>
    </div>
  </nav>`;
}
