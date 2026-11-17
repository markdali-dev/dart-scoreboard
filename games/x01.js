// X01: count down to exactly zero.
// Build step 2 adds only the name and settings so the setup screen can show them.
// Scoring, busts and checkout hints arrive in build step 3.

const RING_CHOICES = [
  { value: 'open', label: 'Open', description: 'Any dart counts' },
  { value: 'double', label: 'Double', description: 'Must be a double (bull counts)' },
  { value: 'triple', label: 'Triple', description: 'Must be a triple' },
  { value: 'master', label: 'Master', description: 'A double or a triple (bull counts)' },
];

function notBuiltYet() {
  throw new Error('X01 scoring arrives in build step 3');
}

export default {
  id: 'x01',
  name: 'X01',
  group: 'Core',
  rules: 'Count down from the start score to exactly zero. Go below zero, or leave a score you can’t finish, and the turn is a bust.',
  options: [
    {
      id: 'start',
      label: 'Start',
      help: 'The score everyone counts down from',
      type: 'choice',
      choices: [
        { value: 301, label: '301' },
        { value: 501, label: '501' },
        { value: 701, label: '701' },
      ],
      customLabel: 'Type your own start score',
      custom: { min: 2, max: 9999 },
      default: 501,
    },
    { id: 'in', label: 'In', help: 'The dart that starts your scoring', type: 'choice', choices: RING_CHOICES, default: 'open' },
    { id: 'out', label: 'Out', help: 'The dart that finishes the game', type: 'choice', choices: RING_CHOICES, default: 'double' },
  ],
  // Checkout hints ("Out: T20 D16") are always shown; not a setting.
  minPlayers: 1,
  maxPlayers: 5,
  teams: true,
  init: notBuiltYet,
  applyDart: notBuiltYet,
  isOver: notBuiltYet,
  getResult: notBuiltYet,
  getScoreboard: notBuiltYet,
};
