// Engine tests. Open tests/ in the browser (with serve.py running) to run them.
// They use a tiny made-up game that only exists here, so the engine can be
// checked before any real game is built.

import { makeDart, dartLabel, dartScore, isValidDart } from '../js/core/dart.js';
import { registerGame, getGame, validateGame, defaultOptions, _clearRegistry } from '../js/core/registry.js';
import { createMatch, computeState, throwDart, undo, getOnDeck } from '../js/core/engine.js';
import { addPlayer, renamePlayer, removePlayer, MAX_ROSTER, MAX_NAME } from '../js/core/roster.js';
import { nextOptionValue, optionLabel, validateSetup, teamChoices, buildSides, moveItem } from '../js/core/setup.js';
import x01, { findCheckout } from '../games/x01.js';

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

// ---------- roster (saved player list) ----------
let seq = 0;
const fakeId = () => 'id' + (++seq);
test('add players, tidy spaces in names', () => {
  let r = addPlayer([], '  Mark  ', fakeId);
  r = addPlayer(r, 'Dean   Smith', fakeId);
  eq(r.map((p) => p.name), ['Mark', 'Dean Smith']);
});
test('duplicate names refused, ignoring capitals', () => {
  const r = addPlayer([], 'Mark', fakeId);
  throws(() => addPlayer(r, 'mark', fakeId), 'duplicate');
});
test('empty or too-long names refused', () => {
  throws(() => addPlayer([], '   ', fakeId), 'empty');
  throws(() => addPlayer([], 'x'.repeat(MAX_NAME + 1), fakeId), 'too long');
});
test('roster is capped at 15', () => {
  let r = [];
  for (let i = 0; i < MAX_ROSTER; i++) r = addPlayer(r, 'P' + i, fakeId);
  throws(() => addPlayer(r, 'One more', fakeId), '16th player');
});
test('rename keeps the id; renaming to own name is fine', () => {
  let r = addPlayer([], 'Mark', fakeId);
  const id = r[0].id;
  r = renamePlayer(r, id, 'Marky');
  eq(r[0], { id, name: 'Marky' });
  r = renamePlayer(r, id, 'MARKY');
  eq(r[0].name, 'MARKY');
});
test('remove a player', () => {
  let r = addPlayer(addPlayer([], 'A', fakeId), 'B', fakeId);
  r = removePlayer(r, r[0].id);
  eq(r.map((p) => p.name), ['B']);
});

// ---------- setup screen logic ----------
const x01Like = { name: 'X01', minPlayers: 1, maxPlayers: 5, teams: true, options: x01.options };
const pick = (...spec) => spec.map(([name, team], i) => ({ playerId: 'p' + i, name, team }));
const opts = { start: 501, in: 'open', out: 'double' };

test('X01 module passes the registry checks', () => {
  validateGame(x01);
});
test('option tiles cycle and wrap; custom start comes after 701', () => {
  const start = x01.options.find((o) => o.id === 'start');
  eq(nextOptionValue(start, 301), 501);
  eq(nextOptionValue(start, 701), 'custom');
  eq(nextOptionValue(start, 'custom'), 301);
  eq(nextOptionValue(start, 401), 301, 'typed custom value moves on to 301');
  eq(optionLabel(start, 401), '401');
  const out = x01.options.find((o) => o.id === 'out');
  eq(nextOptionValue(out, 'master'), 'open');
  eq(nextOptionValue({ type: 'toggle' }, true), false, 'toggle flips');
});
test('X01 has no Out hints setting (hints are always on)', () => {
  eq(x01.options.map((o) => o.id), ['start', 'in', 'out']);
});
test('start is blocked until a custom number is typed', () => {
  eq(validateSetup(x01Like, pick(['Ann']), { teams: false, options: { ...opts, start: 'custom' } }), 'Enter a custom start');
  eq(validateSetup(x01Like, pick(['Ann']), { teams: false, options: { ...opts, start: 401 } }), null);
});
test('players: need at least one, at most five', () => {
  eq(validateSetup(x01Like, [], { teams: false, options: opts }), 'Add a player');
  eq(validateSetup(x01Like, pick(['a'], ['b'], ['c'], ['d'], ['e'], ['f']), { teams: false, options: opts }), 'X01 allows at most 5 players');
});
test('teams: 2 or 3 per team, uneven 2 + 3 allowed', () => {
  const ok = pick(['a', 'A'], ['b', 'B'], ['c', 'A'], ['d', 'B'], ['e', 'B']);
  eq(validateSetup(x01Like, ok, { teams: true, options: opts }), null);
  const lonely = pick(['a', 'A'], ['b', 'B'], ['c', 'A']);
  eq(validateSetup(x01Like, lonely, { teams: true, options: opts }), 'Team B needs at least 2 players');
  const big = pick(['a', 'A'], ['b', 'A'], ['c', 'A'], ['d', 'A'], ['e', 'B'], ['f', 'B']);
  eq(validateSetup(x01Like, big, { teams: true, options: opts }), 'Team A has more than 3 players');
});
test('team menu only offers teams the players can fill', () => {
  eq(teamChoices(3, 5, 'A'), ['A', 'B'], '3 players: 2 teams');
  eq(teamChoices(4, 5, 'A'), ['A', 'B'], '4 players: 2 teams');
  eq(teamChoices(6, 5, 'A'), ['A', 'B', 'C'], '6 players: 3 teams');
  eq(teamChoices(15, 5, 'A'), ['A', 'B', 'C', 'D', 'E'], '15 players: capped at 5');
  eq(teamChoices(4, 5, 'D'), ['A', 'B', 'D'], 'current letter kept');
});
test('sides follow list order; teammates throw in list order', () => {
  const entries = pick(['Ann', 'B'], ['Bob', 'A'], ['Cat', 'B'], ['Dan', 'A']);
  eq(buildSides(entries, { teams: true, random: false }), [
    { name: 'Team B', members: ['Ann', 'Cat'] },
    { name: 'Team A', members: ['Bob', 'Dan'] },
  ]);
  eq(buildSides(pick(['Ann'], ['Bob']), { teams: false, random: false }), [
    { name: 'Ann', members: ['Ann'] }, { name: 'Bob', members: ['Bob'] },
  ]);
});
test('random order shuffles but keeps everyone', () => {
  let n = 0;
  const rng = () => [0.1, 0.9, 0.5, 0.3][n++ % 4];
  const sides = buildSides(pick(['a'], ['b'], ['c'], ['d']), { teams: false, random: true }, rng);
  eq(sides.map((s) => s.name).sort(), ['a', 'b', 'c', 'd']);
});
test('drag to reorder moves one player', () => {
  eq(moveItem(['a', 'b', 'c', 'd'], 0, 2), ['b', 'c', 'a', 'd']);
  eq(moveItem(['a', 'b', 'c', 'd'], 3, 0), ['d', 'a', 'b', 'c']);
});

// ---------- X01 ----------
function x01Match(options = {}, sides = players('Ann', 'Bob')) {
  try { getGame('x01'); } catch { registerGame(x01); }
  return createMatch({ gameId: 'x01', options: { start: 501, in: 'open', out: 'double', ...options }, sides });
}
// Plays darts from short labels: 'T20', 'D16', '5', 'B' (inner bull), '25', '0' (miss).
function darts(match, labels) {
  return labels.split(' ').reduce((m, t) => {
    if (t === 'B') return throwDart(m, D(25, 2));
    const mult = t[0] === 'T' ? 3 : t[0] === 'D' ? 2 : 1;
    return throwDart(m, D(Number(mult > 1 ? t.slice(1) : t), mult));
  }, match);
}
const scores = (m) => computeState(m).game.scores;

test('X01: three darts count down, then the next player', () => {
  const m = darts(x01Match(), 'T20 T20 T20');
  eq(scores(m), [321, 501]); eq(computeState(m).turn.side, 1, 'Bob is up');
});
test('X01: going below zero is a bust, score goes back, turn ends', () => {
  const m = darts(x01Match({ start: 50 }), 'T10 T10'); // 50 -> 20 -> -10
  const s = computeState(m);
  eq(s.game.scores, [50, 50]); eq(s.turn.side, 1, 'turn ended early'); eq(s.game.event.kind, 'bust');
});
test('X01 double out: D20 from 40 wins', () => {
  const s = computeState(darts(x01Match({ start: 40 }), 'D20'));
  eq(s.over, true); eq(s.result.winners, [0]);
});
test('X01 double out: reaching zero on a single is a bust', () => {
  const s = computeState(darts(x01Match({ start: 40 }), '20 20'));
  eq(s.game.scores[0], 40); eq(s.over, false);
});
test('X01 double out: leaving 1 is a bust', () => {
  eq(scores(darts(x01Match({ start: 41 }), 'D20'))[0], 41);
});
test('X01 double out: inner bull counts as a double', () => {
  eq(computeState(darts(x01Match({ start: 50 }), 'B')).over, true);
});
test('X01 open out: any dart can finish', () => {
  eq(computeState(darts(x01Match({ start: 7, out: 'open' }), '7')).over, true);
});
test('X01 triple out: leaving 2 is a bust; a triple finishes', () => {
  eq(scores(darts(x01Match({ start: 62, out: 'triple' }), 'T20'))[0], 62);
  eq(computeState(darts(x01Match({ start: 60, out: 'triple' }), 'T20')).over, true);
  eq(computeState(darts(x01Match({ start: 40, out: 'triple' }), 'D20')).over, false, 'double does not finish');
});
test('X01 master out: double or triple finishes', () => {
  eq(computeState(darts(x01Match({ start: 57, out: 'master' }), 'T19')).over, true);
  eq(computeState(darts(x01Match({ start: 32, out: 'master' }), 'D16')).over, true);
});
test('X01 double in: nothing counts until a double; the double counts', () => {
  const m = darts(x01Match({ in: 'double' }), 'T20 20 D10');
  eq(scores(m)[0], 481); eq(computeState(m).game.opened[0], true);
});
test('X01 triple in and master in', () => {
  eq(scores(darts(x01Match({ in: 'triple' }), 'D20 T5 20'))[0], 501 - 15 - 20);
  eq(scores(darts(x01Match({ in: 'master' }), '20 D5 20'))[0], 501 - 10 - 20);
});
test('X01: a bust in the opening turn undoes the double in too', () => {
  const m = darts(x01Match({ start: 30, in: 'double' }), 'D10 T20');
  const s = computeState(m);
  eq(s.game.scores[0], 30); eq(s.game.opened[0], false);
});
test('X01: average per 3 darts and last turn', () => {
  const sb = x01.getScoreboard(computeState(darts(x01Match(), 'T20 T20 T20')).game);
  eq(sb[0].stats, ['Last 180', 'Avg 180.0', '3 darts']);
});
test('X01: 100+ turn gives a big-score event', () => {
  eq(computeState(darts(x01Match(), 'T20 T20 20')).game.event, { kind: 'big', text: '140' });
});
test('X01: teammates share one score', () => {
  const m = darts(x01Match({}, [{ name: 'Team A', members: ['Ann', 'Ade'] }, { name: 'Team B', members: ['Bob', 'Ben'] }]), 'T20 T20 T20 0 0 0');
  const s = computeState(m);
  eq(s.game.scores, [321, 501]); eq(s.turn.thrower, 'Ade');
});
test('X01: undo steps back through a bust', () => {
  let m = darts(x01Match({ start: 50 }), 'T10 T10');
  m = undo(m);
  const s = computeState(m);
  eq(s.game.scores[0], 20); eq(s.turn.side, 0); eq(s.turn.darts.length, 1);
});

const route = (score, n, rule = 'double') => findCheckout(score, n, rule)?.map(dartLabel).join(' ') ?? null;
test('checkout: classic routes', () => {
  eq(route(170, 3), 'T20 T20 BULL');
  eq(route(100, 3), 'T20 D20');
  eq(route(141, 3), 'T20 T19 D12');
  eq(route(60, 3), '20 D20');
  eq(route(40, 3), 'D20');
  eq(route(32, 3), 'D16');
  eq(route(50, 1), 'BULL');
});
test('checkout: impossible scores and too few darts give no hint', () => {
  eq(route(169, 3), null);
  eq(route(159, 3), null);
  eq(route(170, 2), null);
  eq(route(1, 3), null);
});
test('checkout: other Out rules', () => {
  eq(route(60, 1, 'triple'), 'T20');
  eq(route(57, 1, 'master'), 'T19');
  eq(route(7, 1, 'open'), '7');
});
test('X01 hint: shows the In rule until the player has started', () => {
  const s = computeState(x01Match({ in: 'double' }));
  eq(x01.getHint(s.game, { side: 0, dartsLeft: 3 }), { label: 'In:', parts: ['Hit a double to start'] });
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
