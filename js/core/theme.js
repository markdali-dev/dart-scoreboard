// Dark / Light theme. The choice is remembered on this device.
// The two themes differ only in CSS variable values (see css/theme.css).

const KEY = 'dartscoreboard.theme';

export function getTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* storage blocked: fall back to dark */ }
  return 'dark';
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--page').trim();
}

export function setTheme(theme) {
  try { localStorage.setItem(KEY, theme); } catch { /* not saved, still applied */ }
  applyTheme(theme);
}
