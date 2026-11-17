// The single list of games in the app.
// To add a game: create one file in games/ and add one line below.
//
// Each game module provides:
//   id, name, group ('Core' | 'Cricket' | 'Party' | 'Practice'), rules (short text)
//   options: [{ id, label, type: 'choice' | 'number' | 'toggle', choices?, default }]
//   minPlayers, maxPlayers (max 5), teams (true/false)
//   init(sides, options)               -> starting game state (plain data)
//   applyDart(state, dart, context)    -> { state, endTurn }   (endTurn: true on bust, win, etc.)
//       context = { side, thrower, round, dartIndex, dartsThisTurn, sideCount }
//   isOver(state)                      -> true / false
//   getResult(state)                   -> { winners: [sideIndex...], standings: [sideIndex...] }
//   getScoreboard(state)               -> what to show for each side
//   getHint(state, context)            -> optional, e.g. a checkout suggestion
//   isOut(state, side)                 -> optional, true if that side is eliminated
//
// The shell handles turn order, teams, the dart log and undo, so games don't.

import { registerGame } from '../js/core/registry.js';

// Games are added here from build step 3 onward, e.g.:
// import x01 from './x01.js';
// registerGame(x01);

export { registerGame };
