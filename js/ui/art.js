// Small decorative graphics for the playing screen, drawn as inline SVG so
// they work offline and follow the theme.

// ---------- Gun-barrel (Assassin) ----------
// Modelled on Mark's mockup: a tuxedoed figure in a lunging firing stance inside
// a bright opening, grey rifling blades spiralling out with black edges
// (light from the right, dark on the left), and a blood-red wash with drips
// over the top third. Centre (100,100); opening radius 56; barrel radius 90.

const C = 100;          // centre
const OPEN = 56;        // radius of the bright opening
const EDGE = 90;        // radius of the visible barrel
const BLADES = 10;      // number of rifling grooves

// Point on a rifling spiral that starts at the opening edge at angle a0 and
// sweeps anticlockwise as it grows outward.
function spiral(a0, t) {
  const r = OPEN * Math.exp(0.62 * t);
  const a = a0 - t;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}
const fmt = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

function rifling() {
  const T = 1.45; // long enough to run past the barrel edge
  const steps = 14;
  const blades = [];
  const edges = [];
  for (let k = 0; k < BLADES; k++) {
    const a1 = (k / BLADES) * Math.PI * 2;
    const a2 = ((k + 1) / BLADES) * Math.PI * 2;
    const out = [...Array(steps + 1)].map((_, i) => spiral(a1, (i / steps) * T));
    const back = [...Array(steps + 1)].map((_, i) => spiral(a2, ((steps - i) / steps) * T));
    // Shade: lit from the right, so blades on the right are light grey, left ones near black.
    const mid = (a1 + a2) / 2 - T / 2;
    const light = (1 + Math.cos(mid - 0.35)) / 2;            // 0 (left) .. 1 (right)
    const g = Math.round(14 + light * light * 130);           // 14 .. 144
    const fill = `rgb(${g},${g},${g})`;
    blades.push(`<path d="M${out.map(fmt).join(' L')} L${back.map(fmt).join(' L')} Z" fill="${fill}"/>`);
    // A soft highlight just behind each groove's leading edge.
    const hi = [...Array(steps + 1)].map((_, i) => spiral(a1 + 0.07, (i / steps) * T));
    blades.push(`<path d="M${hi.map(fmt).join(' L')}" fill="none" stroke="rgb(${Math.min(255, g + 45)},${Math.min(255, g + 45)},${Math.min(255, g + 45)})" stroke-width="5" opacity="0.5"/>`);
    edges.push(`<path d="M${out.map(fmt).join(' L')}"/>`);
  }
  return { blades: blades.join(''), edges: edges.join('') };
}

// Tuxedo silhouette in a lunging firing stance, pistol raised to the face.
// Proportions traced from the mockup and scaled into the opening.
const FIGURE = `
  <g fill="#0d0d0d" stroke="#0d0d0d" stroke-width="0.5" stroke-linejoin="round">
    <!-- back leg: straight, angled down to the left, shoe pointing left -->
    <path d="M96.6 102.7 L72.6 139.2 L67.2 141.6 L67.2 145.2 L78 145.2 L77.6 142.6 L105.4 109.3 Z"/>
    <!-- front leg: thigh forward to a bent knee, shin straight down, shoe pointing right -->
    <path d="M102.8 107.9 L111.2 126.2 L111 141 L110.4 145.2 L121.8 145.2 L121.2 142.4 L117 140.6 L119 124.6 L113.4 104 Z"/>
    <!-- jacket: sloped shoulders, tapered waist, tail flaring out behind -->
    <path d="M98.4 72.6 Q106 70.2 113.2 73.2 Q114.6 77 114 82 L113.2 92 L112.8 98 L110.6 103.4 L102 104.6 L94 106.6 L87.4 109.6
             L90.8 100.2 L93.6 92 Q94.6 86 95 80 Q95.8 75 98.4 72.6 Z"/>
    <!-- head and neck -->
    <path d="M98.4 61.2 Q98.2 54.6 104 54.6 Q109.8 54.8 109.6 61.4 Q109.4 66.8 105.2 68.2 Q100.2 68.6 98.8 64.6 Z"/>
    <path d="M101.6 66.6 L106.8 67.4 L107 72.8 L102 72.8 Z"/>
    <!-- gun arm: upper arm down to the elbow, forearm back up, fist beside the face, pistol pointing up -->
    <path d="M98 74 Q93 78 88.4 84.6 L91.2 87.6 Q95.4 83 98.4 80.4 Z"/>
    <path d="M88.4 85.8 Q89 78 91.4 71.6 L95.8 72.4 Q94 80 92.2 87.2 Z"/>
    <rect x="90.6" y="65" width="6.2" height="7.8" rx="1.8"/>
    <path d="M92.4 65.4 L92.6 58.6 Q94.2 57.8 95.8 58.6 L96 65.4 Z"/>
    <!-- other arm stretched out to the right, fingers spread -->
    <path d="M112 74 L120 75.8 L127 77.8 L129.2 76.6 L131.6 74.8 L133.2 74.4 L135.6 73.8 L136 75
             L133.9 76.6 L135.4 77.4 L134.6 78.5 L131.4 79.3 L128 82.6 L120 82.8 L112.8 82.8 Z"/>
  </g>
  <!-- shirt front and bow tie -->
  <path d="M105 72.6 L108.6 72.8 L108.6 99 L106.2 100.4 Z" fill="#f4f1ea"/>
  <path d="M104.2 73.4 L106.8 74.5 L109.4 73.4 L109.4 76.2 L106.8 75.1 L104.2 76.2 Z" fill="#0d0d0d"/>`;

// Blood wash across the top third, with drips running down.
function blood() {
  // Wavy lower edge around y=62 (the top third of the circle), with a few thin,
  // uneven drips: [x, length, half-width].
  const drips = [[171, 9, 1.4], [148, 17, 1.8], [127, 6, 1.2], [88, 13, 1.6], [57, 20, 1.9], [36, 7, 1.3]];
  const edgeY = (x) => 62 + 2.2 * Math.sin(x / 9) + 1.2 * Math.sin(x / 3.7);
  let d = 'M0 0 H200';
  let x = 200;
  for (const [dx, len, w] of drips) {
    for (; x > dx + w + 2; x -= 4) d += ` L${x} ${edgeY(x).toFixed(1)}`;
    const y = edgeY(dx);
    d += ` L${dx + w + 1.5} ${y.toFixed(1)} C${dx + w} ${(y + 1).toFixed(1)} ${dx + w} ${(y + len).toFixed(1)} ${dx} ${(y + len + w).toFixed(1)}`
       + ` C${dx - w} ${(y + len).toFixed(1)} ${dx - w} ${(y + 1).toFixed(1)} ${dx - w - 1.5} ${y.toFixed(1)}`;
    x = dx - w - 2;
  }
  for (; x > 0; x -= 4) d += ` L${x} ${edgeY(x).toFixed(1)}`;
  d += ` L0 ${edgeY(0).toFixed(1)} Z`;
  return `<path d="${d}" fill="url(#bloodShade)"/>`;
}

export function barrelArt() {
  const { blades, edges } = rifling();
  return `<svg class="art art-barrel" viewBox="${C - EDGE} ${C - EDGE} ${EDGE * 2} ${EDGE * 2}" role="img" aria-label="Gun barrel">
    <defs>
      <clipPath id="barrelClip"><circle cx="${C}" cy="${C}" r="${EDGE}"/></clipPath>
      <filter id="barrelBlur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter>
      <radialGradient id="barrelDepth" cx="50%" cy="50%" r="50%">
        <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
      </radialGradient>
      <radialGradient id="openingGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0.8" stop-color="#ffffff"/>
        <stop offset="1" stop-color="#e9e6df"/>
      </radialGradient>
      <linearGradient id="bloodShade" gradientUnits="userSpaceOnUse" x1="0" y1="${C - EDGE}" x2="0" y2="95">
        <stop offset="0" stop-color="#7a0000" stop-opacity="0.5"/>
        <stop offset="0.75" stop-color="#a50d0b" stop-opacity="0.26"/>
        <stop offset="1" stop-color="#b3120f" stop-opacity="0.34"/>
      </linearGradient>
    </defs>
    <g clip-path="url(#barrelClip)">
      <rect x="0" y="0" width="200" height="200" fill="#0b0b0b"/>
      <g filter="url(#barrelBlur)">${blades}</g>
      <g fill="none" stroke="#050505" stroke-width="1.7">${edges}</g>
      <circle cx="${C}" cy="${C}" r="${EDGE}" fill="url(#barrelDepth)"/>
      <circle cx="${C}" cy="${C}" r="${OPEN}" fill="url(#openingGlow)"/>
      ${FIGURE}
      ${blood()}
    </g>
  </svg>`;
}

// ---------- Baseball diamond ----------
// Green outfield fan with the infield, bases and home plate.
export function diamondArt() {
  return `<svg class="art art-diamond" viewBox="0 0 200 175" role="img" aria-label="Baseball diamond">
    <path d="M100 168 L12 80 A124 124 0 0 1 188 80 Z" fill="#1f8a4c"/>
    <path d="M100 150 L42 92 L100 34 L158 92 Z" fill="var(--page)"/>
    <g fill="#1f8a4c">
      <circle cx="100" cy="152" r="17"/>
      <circle cx="42" cy="92" r="10"/><circle cx="158" cy="92" r="10"/><circle cx="100" cy="34" r="10"/>
    </g>
    <g fill="var(--page)">
      <rect x="95" y="29" width="10" height="10" transform="rotate(45 100 34)"/>
      <rect x="37" y="87" width="10" height="10" transform="rotate(45 42 92)"/>
      <rect x="153" y="87" width="10" height="10" transform="rotate(45 158 92)"/>
      <path d="M95 148 h10 v5 l-5 5 l-5 -5 Z"/>
    </g>
  </svg>`;
}

export const ART = { barrel: barrelArt, diamond: diamondArt };
