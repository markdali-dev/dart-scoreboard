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

// Running hound (beagle-like), mid-stride: deep chest, tucked waist, head forward with a
// long muzzle and drop ear, tail up and curved, front legs reaching, hind legs pushing off.
function houndShapes() {
  return `
    <path d="M15 14.5
      C 21 12.6, 30 12.4, 37.5 13.2
      C 41 13.6, 43.5 11.8, 45.6 8.6
      C 47.2 6.1, 50.2 4.6, 53.4 5.0
      C 55.6 5.3, 57.0 6.4, 58.0 7.6
      L 62.2 9.6
      C 63.4 10.3, 63.2 12.2, 61.8 12.6
      L 56.6 13.4
      C 54.6 13.8, 53.4 15.0, 52.4 16.6
      C 51.2 18.6, 50.0 20.0, 49.6 21.4
      L 58.4 23.2
      C 60.4 23.6, 60.6 25.8, 58.6 26.0
      L 48.0 25.6
      C 47.0 26.4, 46.6 27.0, 47.0 27.8
      L 53.2 33.4
      C 54.4 34.6, 53.0 36.2, 51.6 35.2
      L 42.6 29.2
      C 37.4 27.0, 31.0 26.6, 26.4 27.8
      C 23.6 28.6, 21.6 29.6, 20.0 30.4
      L 12.2 36.6
      C 10.8 37.6, 9.2 36.2, 10.4 34.8
      L 16.4 27.6
      L 8.2 28.6
      C 6.4 28.8, 6.0 26.6, 7.8 26.2
      L 14.8 24.6
      C 13.0 21.6, 12.8 17.6, 15.0 14.5 Z"/>
    <path d="M51.2 6.6 C 48.8 8.2, 48.2 12.6, 49.8 15.2 C 51.4 13.4, 52.4 9.8, 51.2 6.6 Z"/>
    <path d="M15.4 15.2 C 11.6 13.2, 8.6 9.6, 7.2 4.6" fill="none" stroke-width="2.8" stroke-linecap="round"/>`;
}

export function animalSvg(kind, color, cls = 'animal') {
  const shapes = kind === 'hare' ? bunnyShapes() : houndShapes();
  // Draw an outline pass first (dark, slightly thicker), then the colour on top.
  return `<svg class="${cls}" viewBox="0 -4 64 46" aria-hidden="true">
    <g fill="#0b0b0b" stroke="#0b0b0b" stroke-width="2.4" stroke-linejoin="round">${shapes}</g>
    <g fill="${color}" stroke="${color}" stroke-width="0.6" stroke-linejoin="round">${shapes}</g>
  </svg>`;
}
