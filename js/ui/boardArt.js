// Setup screen background (Mark's pick of 3 mockups, 2026-11-21): a faded corner of a
// dartboard with three darts landed in it, drawn for this app. It sits behind the
// "Select a Game" row: the darts lie along that row with their tips in the board, and the
// board rises behind the header. One colour (cream in Dark, black in Light), very faint.

const BOARD = (() => {
  const spokes = Array.from({ length: 20 }, (_, i) => {
    const a = ((i * 18 + 9) * Math.PI) / 180;
    const p = (r) => `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`;
    return `M${p(16)} L${p(140)}`;
  }).join(' ');
  return `<g fill="none" stroke="currentColor">
      <circle r="150" stroke-width="2.6"/><circle r="140" stroke-width="1.8"/>
      <circle r="93" stroke-width="1.8"/><circle r="84" stroke-width="1.8"/>
      <circle r="16" stroke-width="1.8"/><circle r="6.5" fill="currentColor" stroke="none"/>
      <path d="${spokes}" stroke-width="1.3"/>
    </g>`;
})();

// One dart along the x axis: tip at 0, flights at the right.
const DART = `
  <path d="M0 0 L44 -2.6 L44 2.6 Z" fill="currentColor"/>
  <rect x="44" y="-7.5" width="80" height="15" rx="6" fill="none" stroke="currentColor" stroke-width="3"/>
  <path d="M56 -7.5v15M64 -7.5v15M72 -7.5v15M80 -7.5v15M88 -7.5v15M96 -7.5v15M104 -7.5v15M112 -7.5v15" stroke="currentColor" stroke-width="2.4"/>
  <path d="M124 -3.2 H204 V3.2 H124 Z" fill="currentColor"/>
  <g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round">
    <path d="M196 -2 L246 -36 L304 -32 L284 -2 Z M196 2 L246 36 L304 32 L284 2 Z"/>
    <path d="M208 -2 L264 -30 M208 2 L264 30" stroke-width="2"/>
  </g>`;

const dart = (x, y, angle) => `<g transform="translate(${x} ${y}) rotate(${angle}) scale(.5)">${DART}</g>`;

// viewBox y=150 is the top of the "Select a Game" row.
export const boardArt = `<div class="board-art" aria-hidden="true">
  <svg viewBox="0 0 375 340">
    <g transform="translate(320 138)" opacity=".7">${BOARD}</g>
    ${dart(330, 150, 188)}
    ${dart(310, 169, 181)}
    ${dart(342, 190, 174)}
  </svg>
</div>`;
