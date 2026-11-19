// Small decorative graphics for the playing screen, drawn as inline SVG so
// they work offline and follow the theme. Original drawings made for this app.

// Gun-barrel view: dark barrel with red-tinted rifling swirling around a
// bright opening, with a figure in the middle aiming at the viewer.
export function barrelArt() {
  const grooves = [...Array(9)].map((_, k) => {
    const a = (k / 9) * Math.PI * 2;
    const p = (r, turn) => {
      const t = a + turn;
      return `${(100 + r * Math.cos(t)).toFixed(1)} ${(100 + r * Math.sin(t)).toFixed(1)}`;
    };
    // Each groove curls from the opening out past the edge.
    return `<path d="M${p(56, 0)} Q${p(76, 0.5)} ${p(104, 1.15)}" />`;
  }).join('');
  // Zoomed in: the opening fills most of the circle, with a ring of swirl around it.
  return `<svg class="art art-barrel" viewBox="26 26 148 148" role="img" aria-label="Gun barrel">
    <defs>
      <radialGradient id="barrelShade" cx="50%" cy="50%" r="55%">
        <stop offset="0.55" stop-color="#5a1a17"/>
        <stop offset="0.8" stop-color="#2a0d0c"/>
        <stop offset="1" stop-color="#0b0b0b"/>
      </radialGradient>
      <clipPath id="barrelClip"><circle cx="100" cy="100" r="74"/></clipPath>
    </defs>
    <g clip-path="url(#barrelClip)">
      <circle cx="100" cy="100" r="74" fill="url(#barrelShade)"/>
      <g fill="none" stroke="#d7322d" stroke-opacity="0.6" stroke-width="6" stroke-linecap="round">${grooves}</g>
      <g fill="none" stroke="#000" stroke-opacity="0.65" stroke-width="2">${grooves}</g>
    </g>
    <circle cx="100" cy="100" r="56" fill="#f3efe6"/>
    <g fill="#111">
      <!-- head -->
      <ellipse cx="97" cy="60" rx="8.5" ry="9.5"/>
      <!-- jacket -->
      <path d="M84 72 Q97 66 111 72 L113 92 L109 110 L88 110 L85 92 Z"/>
      <!-- gun arm raised to the face, pistol pointing at the viewer -->
      <path d="M86 74 L80 88 L84 90 L91 79 Z"/>
      <path d="M80 88 L76 72 L81 70 L85 86 Z"/>
      <rect x="73.5" y="58" width="7" height="15" rx="1.5"/>
      <!-- other arm out to the side -->
      <path d="M109 74 L127 84 L136 78 L138 81 L128 89 L107 81 Z"/>
      <!-- legs in a wide stance -->
      <path d="M89 108 L100 109 L86 136 L82 151 L72 151 L77 134 Z"/>
      <path d="M98 109 L109 107 L116 128 L127 149 L118 152 L105 131 Z"/>
    </g>
    <!-- shirt front and bow tie -->
    <path d="M94 71 L101 71 L97.5 92 Z" fill="#f3efe6"/>
    <path d="M94 72 L97.5 74 L101 72 L101 76 L97.5 74 L94 76 Z" fill="#111"/>
  </svg>`;
}

// Baseball diamond: green outfield fan with the infield, bases and home plate.
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
