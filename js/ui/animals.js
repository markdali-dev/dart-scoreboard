// Small animal silhouettes for Hare and Hounds, drawn for this app.
// Both face right. A thin dark outline keeps them visible on any card colour.

// Running hare / bunny: long ears back, round tail, legs stretched.
function bunnyShapes() {
  return `
    <ellipse cx="29" cy="25" rx="17" ry="10.5"/>
    <circle cx="46" cy="19" r="8"/>
    <ellipse cx="38" cy="8.5" rx="3.4" ry="9.5" transform="rotate(-38 38 8.5)"/>
    <ellipse cx="44.5" cy="7" rx="3.2" ry="9" transform="rotate(-18 44.5 7)"/>
    <circle cx="11" cy="21" r="4.6"/>
    <ellipse cx="15" cy="34" rx="10" ry="4" transform="rotate(24 15 34)"/>
    <ellipse cx="51" cy="31" rx="8" ry="2.8" transform="rotate(-14 51 31)"/>
    <ellipse cx="40" cy="33" rx="6.5" ry="2.6" transform="rotate(-30 40 33)"/>`;
}

// Running hound: long body, head up, ears down, tail up behind, legs stretched out.
function houndShapes() {
  return `
    <ellipse cx="29" cy="21" rx="18" ry="7.5"/>
    <path d="M40 17 L47 8 L54 11 L47 23 Z"/>
    <ellipse cx="51" cy="10" rx="6.6" ry="5"/>
    <path d="M53 9 L62 11.5 L61.5 15 L53 14 Z"/>
    <ellipse cx="48" cy="13.5" rx="2.6" ry="5" transform="rotate(18 48 13.5)"/>
    <path d="M13 17 Q6 10 5 3" fill="none" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M43 24 L59 30" fill="none" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M40 25 L51 35" fill="none" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M17 24 L5 31" fill="none" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M21 25 L12 37" fill="none" stroke-width="3.6" stroke-linecap="round"/>`;
}

export function animalSvg(kind, color, cls = 'animal') {
  const shapes = kind === 'hare' ? bunnyShapes() : houndShapes();
  // Draw an outline pass first (dark, slightly thicker), then the colour on top.
  return `<svg class="${cls}" viewBox="0 -4 64 46" aria-hidden="true">
    <g fill="#0b0b0b" stroke="#0b0b0b" stroke-width="2.4" stroke-linejoin="round">${shapes}</g>
    <g fill="${color}" stroke="${color}" stroke-width="0.6" stroke-linejoin="round">${shapes}</g>
  </svg>`;
}
