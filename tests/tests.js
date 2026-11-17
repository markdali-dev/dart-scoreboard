// Engine tests. Open tests/ in the browser (with serve.py running) to run them.
// They use a tiny made-up game that only exists here, so the engine can be
// checked before any real game is built.

import { makeDart, dartLabel, dartScore, isValidDart } from '../js/core/dart.js';
import { registerGame, getGame, validateGame, defaultOptions, _clearRegistry } from '../js/core/registry.js';
import { createMatch, computeState, throwDart, undo, getOnDeck } from '../js/core/engine.js';

// ---------- tiny test runner ----------
const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (err) { results.push({ name, ok: false, err }); }
}
function eq(actual, expected, what = 'value') {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${what}: expected ${e}, got ${a}`);
}
function throws(fn, what) {
  try { fn(); } catch { return; }
  throw new Error(`expected an error: ${what}`);
}

// ---------- test-only game: "Count Up To" ----------
// Each side adds what it scores. First to reach the target wins.
// A miss ends the turn early. Hitting triple 1 knocks that side out
// (silly, but it lets us test eliminations).
const countUp = {
  id: 'test-countup',
  name: 'Count Up (test)',
  group: 'Practice',
  rules: 'Test only.',
  options: [{ id: 'target', label: 'Target', type: 'number', default: 100 }],
  minPlayers: 1,
  maxPlayers: 5,
  teams: true,
  init(sides, options) {
    return { target: options.target, scores: sides.map(() => 0), out: sides.map(() => false) };
  },
  applyDart(state, dart, ctx) {
    if (dart.number === 1 && dart.multiplier === 3) {
      state.out[ctx.side] = true;
      return { state, endTurn: true };
    }
    state.scores[ctx.side] += dartScore(dart);
    return { state, endTurn: dart.number === 0 };
  },
  isOver(state) {
    return state.scores.some((s) => s >= state.target) || state.out.filter((o) => !o).length <= (state.scores.length > 1 ? 1 : 0);
  },
  getResult(state) {
    const alive = state.scores.map((_, i) => i).filter((i) => !state.out[i]);
    const best = Math.max(...alive.map((i) => state.scores[i]));
    return { winners: alive.filter((i) => state.scores[i] === best), standings: alive };
  },
  getScoreboard(state) {
    return state.scores.map((s, i) => ({ main: s, status: state.out[i] ? 'out' : '' }));
  },
  isOut(state, side) { return state.out[side]; },
};

_clearRegistry();
registerGame(countUp);

const D = (n, m = 1) => makeDart(n, m);
const players = (...names) => names.map((n) => ({ name: n, members: [n] }));
function play(match, darts) { return darts.reduce(throwDart, match); }
function newMatch(sides, target = 100) {
  return createMatch({ gameId: 'test-countup', options: { target }, sides });
}

// ---------- dart rules ----------
test('valid darts: 1-20 any ring, 25 single/double, miss', () => {
  eq(isValidDart({ number: 20, multiplier: 3 }), true);
  eq(isValidDart({ number: 25, multiplier: 2 }), true);
  eq(isValidDart({ number: 0, multiplier: 1 }), true);
});
test('invalid darts: triple 25, 21, multiplier 4', () => {
  eq(isValidDart({ number: 25, multiplier: 3 }), false);
  eq(isValidDart({ number: 21, multiplier: 1 }), false);
  eq(isValidDart({ number: 5, multiplier: 4 }), false);
  eq(makeDart(25, 3), null);
});
test('a miss pressed with Double stays a plain miss', () => {
  eq(makeDart(0, 2), { number: 0, multiplier: 1 });
});
test('scores and labels', () => {
  eq(dartScore(D(20, 3)), 60);
  eq(dartScore(D(25, 2)), 50);
  eq([D(20, 3), D(16, 2), D(7), D(25), D(25, 2), D(0)].map(dartLabel), ['T20', 'D16', '7', '25', 'BULL', 'Miss']);
});

// ---------- registry ----------
test('registry finds a game and its default options', () => {
  eq(getGame('test-countup').name, 'Count Up (test)');
  eq(defaultOptions(countUp), { target: 100 });
});
test('registry rejects an incomplete game module', () => {
  throws(() => validateGame({ id: 'broken', name: 'Broken', group: 'Core' }), 'missing functions');
});
test('registry rejects duplicate ids', () => {
  throws(() => registerGame(countUp), 'duplicate id');
});

// ---------- turns ----------
test('three darts per turn, then the next player', () => {
  let m = newMatch(players('Ann', 'Bob'));
  m = play(m, [D(5), D(5), D(5)]);
  const s = computeState(m);
  eq(s.turn.side, 1, 'side'); eq(s.turn.thrower, 'Bob', 'thrower'); eq(s.game.scores, [15, 0], 'scores');
});
test('round goes up after everyone has thrown', () => {
  let m = newMatch(players('Ann', 'Bob'));
  m = play(m, [D(1), D(1), D(1), D(1), D(1), D(1)]);
  eq(computeState(m).turn.round, 2);
});
test('a game can end a turn early (miss in the test game)', () => {
  let m = newMatch(players('Ann', 'Bob'));
  m = play(m, [D(5), D(0)]);
  const s = computeState(m);
  eq(s.turn.side, 1, 'side'); eq(s.turns[0].darts.length, 2, 'darts in closed turn');
});
test('on-deck player is the one after the thrower', () => {
  const m = newMatch(players('Ann', 'Bob', 'Cat'));
  eq(getOnDeck(m, computeState(m)), 1);
});

// ---------- teams ----------
test('teammates alternate throwing, turn by turn', () => {
  const sides = [{ name: 'Reds', members: ['Ann', 'Ade'] }, { name: 'Blues', members: ['Bob', 'Ben'] }];
  let m = newMatch(sides, 1000);
  const throwers = [];
  for (let i = 0; i < 4; i++) {
    throwers.push(computeState(m).turn.thrower);
    m = play(m, [D(1), D(1), D(1)]);
  }
  eq(throwers, ['Ann', 'Bob', 'Ade', 'Ben']);
  eq(computeState(m).game.scores, [6, 6], 'team scores are shared');
});
test('teams are refused in games that do not support them', () => {
  _clearRegistry();
  registerGame({ ...countUp, id: 'solo-only', teams: false });
  throws(() => createMatch({ gameId: 'solo-only', options: {}, sides: [{ name: 'T', members: ['a', 'b'] }] }), 'team in solo game');
  _clearRegistry();
  registerGame(countUp);
});
test('more than 5 sides is refused', () => {
  throws(() => newMatch(players('a', 'b', 'c', 'd', 'e', 'f')), '6 players');
});

// ---------- eliminations and game end ----------
test('an eliminated player is skipped', () => {
  let m = newMatch(players('Ann', 'Bob', 'Cat'));
  m = play(m, [D(5), D(5), D(5), D(1, 3)]); // Bob knocked out
  let s = computeState(m);
  eq(s.turn.side, 2, 'Cat is up');
  m = play(m, [D(1), D(1), D(1)]);
  s = computeState(m);
  eq(s.turn.side, 0, 'back to Ann, Bob skipped'); eq(s.turn.round, 2, 'round');
});
test('game ends when the target is reached; more darts are refused', () => {
  let m = newMatch(players('Ann', 'Bob'), 50);
  m = play(m, [D(20, 3)]);
  const s = computeState(m);
  eq(s.over, true, 'over'); eq(s.result.winners, [0], 'winner');
  throws(() => throwDart(m, D(1)), 'dart after game over');
});

// ---------- undo ----------
test('undo removes the last dart', () => {
  let m = newMatch(players('Ann', 'Bob'));
  m = play(m, [D(20), D(19)]);
  m = undo(m);
  const s = computeState(m);
  eq(s.game.scores, [20, 0]); eq(s.turn.darts.length, 1, 'darts this turn');
});
test('undo steps back across turns and players', () => {
  let m = newMatch(players('Ann', 'Bob'));
  m = play(m, [D(1), D(2), D(3), D(4)]); // Bob has thrown one
  m = undo(undo(m));                      // back into Ann's turn
  const s = computeState(m);
  eq(s.turn.side, 0, 'Ann is up again'); eq(s.turn.darts.length, 2, 'two darts in'); eq(s.game.scores, [3, 0]);
});
test('undo all the way to the start, and once more does nothing', () => {
  let m = newMatch(players('Ann', 'Bob'));
  m = play(m, [D(1), D(2), D(3), D(4), D(5)]);
  for (let i = 0; i < 7; i++) m = undo(m);
  eq(m.darts.length, 0);
  eq(JSON.stringify(computeState(m)), JSON.stringify(computeState(newMatch(players('Ann', 'Bob')))), 'same as a fresh game');
});
test('undo brings an eliminated player back', () => {
  let m = newMatch(players('Ann', 'Bob', 'Cat'));
  m = play(m, [D(1, 3)]);
  m = undo(m);
  const s = computeState(m);
  eq(s.game.out, [false, false, false]); eq(s.turn.side, 0);
});
test('undo after a win reopens the game', () => {
  let m = newMatch(players('Ann', 'Bob'), 50);
  m = undo(play(m, [D(20, 3)]));
  eq(computeState(m).over, false);
});
test('the old match is never changed (safe to keep for history)', () => {
  const m1 = newMatch(players('Ann', 'Bob'));
  const m2 = throwDart(m1, D(20));
  eq(m1.darts.length, 0); eq(m2.darts.length, 1);
});
test('a match survives a save/load round trip (plain JSON)', () => {
  let m = newMatch(players('Ann', 'Bob'));
  m = play(m, [D(20, 3), D(19, 2), D(0), D(25, 2)]);
  const loaded = JSON.parse(JSON.stringify(m));
  eq(computeState(loaded), computeState(m));
});

// ---------- report ----------
const failed = results.filter((r) => !r.ok);
const summary = document.getElementById('summary');
summary.textContent = failed.length
  ? `${failed.length} of ${results.length} tests failed`
  : `All ${results.length} tests passed`;
summary.className = failed.length ? 'fail' : 'pass';
document.getElementById('results').innerHTML = results.map((r) => r.ok
  ? `<li>✓ ${r.name}</li>`
  : `<li class="bad">✗ ${r.name}<pre>${String(r.err.message).replace(/</g, '&lt;')}</pre></li>`).join('');
// Offline copy: the app registers it when the home page is opened.
const offline = document.getElementById('offline');
if (!('serviceWorker' in navigator)) {
  offline.textContent = '✗ This browser does not support offline apps.';
} else {
  navigator.serviceWorker.getRegistration('../').then((reg) => {
    offline.textContent = reg?.active
      ? '✓ Saved. The app will open with no internet.'
      : '✗ Not saved yet. Open the home page once, then reload this page.';
  }).catch(() => { offline.textContent = '✗ This browser blocks offline apps (e.g. the in-app preview).'; });
}

window.__testResults ={ passed: results.length - failed.length, failed: failed.length };
