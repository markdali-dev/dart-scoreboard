// The single list of games in the app.
// To add a game: create one file in games/ and add one line below.
//
// Each game module provides:
//   id, name, group ('Core' | 'Party' | 'Practice'), rules (short text)
//   art: { name: 'barrel' | 'diamond', place: 'before-hint' | 'before-pad' } -> optional graphic
//   pad: 'target'                      -> optional, two big tiles (Miss + target) instead of the grid
//   zonePad: [[{ zone, label, points, tone } | { undo: true }], ...] -> optional, rows of
//                                         board-area buttons (darts carry a `zone`)
//   options: settings shown as tiles on the setup screen. Each is one of:
//     { id, label, type: 'choice', choices: [{ value, label }], default, custom?: { min, max } }
//     { id, label, type: 'toggle', default: true | false }
//     (custom lets the player type their own number, e.g. a 401 start)
//   minPlayers, maxPlayers (max 5 players or teams), teams (true/false)
//   init(sides, options)               -> starting game state (plain data)
//   applyDart(state, dart, context)    -> { state, endTurn }   (endTurn: true on bust, win, etc.)
//       context = { side, thrower, round, dartIndex, dartsThisTurn, sideCount }
//   isOver(state)                      -> true / false
//   getResult(state)                   -> { winners: [sideIndex...], standings: [sideIndex...] }
//   getScoreboard(state)               -> what to show for each side
//   getHint(state, context)            -> optional, e.g. a checkout suggestion
//   isOut(state, side)                 -> optional, true if that side is eliminated
//   prepareOptions(options, rng)       -> optional, run once at game creation to fix random
//                                         choices (e.g. wild card numbers) into the saved options
//   describe(options)                  -> optional, header text like "Cricket · Points"
//   board: 'marks'                     -> optional, show a marks grid instead of score cards;
//                                         then also getRows(state) -> [{ label, dead }] and
//                                         getScoreboard(...)[i].marks -> marks per row
//   getKeys(state)                     -> optional, the numbers that get keys on the pad
//   keyLabels: { 25: 'Bull' }          -> optional, words shown on keys instead of numbers
//   roundLabel: 'Inning'               -> optional, header says "Inning 4" instead of "Round 4"
//   roundText(state)                   -> optional, the whole header text instead ("Target 64")
//   needsNumberDraw(options)           -> optional, true to show the Number draw screen
//                                         before the game (fills options.numbers)
//   Scoreboard extras for score cards: mainLabel (small text before the big number),
//   lives: { have, max, risk? } (shown as dots; at `risk` lives or fewer those dots turn red),
//   badge ('Assassin', 'Out'), out (card dimmed)
//
// The shell handles turn order, teams, the dart log and undo, so games don't.

import { registerGame } from '../js/core/registry.js';
import x01 from './x01.js';
import cricket from './cricket.js';
import baseball from './baseball.js';
import assassin from './assassin.js';
import knockout from './knockout.js';
import halveit from './halveit.js';
import shanghai from './shanghai.js';
import crackshot from './crackshot.js';
import hareandhounds from './hareandhounds.js';
import aroundtheclock from './aroundtheclock.js';
import checkout121 from './checkout121.js';
import catch40 from './catch40.js';

// The order here is the order on the setup screen's game list.
registerGame(cricket);
registerGame(x01);
registerGame(baseball);
registerGame(assassin);
// Party
registerGame(knockout);
registerGame(halveit);
registerGame(shanghai);
registerGame(crackshot);
registerGame(hareandhounds);
// Practice
registerGame(aroundtheclock);
registerGame(checkout121);
registerGame(catch40);
