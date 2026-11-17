# Dart Scoreboard — project spec

Working title: Dart Scoreboard. A phone-first darts scoring app covering many games, built so new games can be added later as self-contained modules.

Status: building. Spec written 2026-11-14, updated 2026-11-16. Build steps 1 and 2 done 2026-11-17; next is step 3. Items under "Open decisions" are not settled — ask Mark before building them.

## Ground rules

- Static HTML/CSS/JS, installable offline-capable PWA, no backend, no accounts. Same approach as the dice scorekeeper.
- Must work fully offline. No sound.
- Free and open-source pieces only. Any library must be MIT/BSD/Apache-style licensed so commercial use later is never blocked. Prefer no dependencies; ask before adding one.
- May be monetized later. Keep the design original: do not copy the name, layout, icons or artwork of any existing darts app. The reference app (see Design) is inspiration for flow only.
- Never put keys, tokens, IDs or login details in code or commits. This app should need none.
- Windows machine: use PowerShell-compatible commands.
- Work in small steps. Commit after each working step.

## Architecture

Core rule: the app shell knows nothing about any specific game. Each game is one module in `games/` registered in a single game registry. Adding a game later means adding one file and one registry line.

Each game module provides:

- `id`, `name`, `group` (Core, Cricket, Party, Practice), short rules text
- `options`: the settings shown on the setup screen (type, choices, default)
- `minPlayers` / `maxPlayers`, whether teams are supported
- `init(sides, options)` → starting game state (a side is one player or one team)
- `applyDart(state, dart, context)` → `{ state, endTurn }`. Handles busts and eliminations; sets `endTurn` to end the turn early (bust, etc.). `context` gives the current side, thrower, round and darts already thrown this turn.
- `isOver(state)` / `getResult(state)` → winner(s) and final standings
- `getScoreboard(state)` → what to show per player or team (main number, status, marks)
- optional `getHint(state, context)` → e.g. checkout suggestion, current target
- optional `isOut(state, side)` → true if that side is eliminated; the shell then skips its turns

The full interface is documented at the top of `games/index.js`.

Shared by all games (lives in the shell, not in modules):

- Dart entry pad, undo, turn order, player and team handling, persistence, history, stats

Undo is done by keeping the full dart log and replaying it minus the last dart, so every game gets undo for free and modules stay simple.

A dart is `{ number: 0–20 or 25, multiplier: 1|2|3 }`. Miss is number 0.

## Players and teams

- Roster of up to 15 saved player names, stored locally. Add, rename, remove.
- Pick players for a game from the roster.
- Teams of 2 or 3, offered only in games that support them: X01 and all Cricket variants. Assassin is always individual. Other games are individual unless Mark says otherwise. Teammates share one score and alternate throwing each round. When a team is up, highlight the name of the teammate whose turn it is.
- Throw order, chosen on the setup screen: random, or drag names into order.

## Dart entry

- Every dart is entered individually, three per turn.
- Number grid: 1–20, 25 (bull), and 0/Miss, with Double and Triple modifier buttons. No dartboard image.
- Triple is disabled for 25. Double 25 is the inner bull.
- Undo removes the last dart. Each further press steps back one more dart, across turns and players, back to the start of the game.
- Turn advances automatically after the third dart or when the turn ends early (bust, win).

## Screen layout

- Portrait. Phone is held by the players, not mounted at the board.
- The full player/team list with scores and status is visible at the same time as the entry pad.
- Maximum 5 players or teams in a game. All 5 must fit on screen with the entry pad, no scrolling.
- Current thrower clearly highlighted, with the largest score on screen. Show the darts thrown so far this turn.
- The player on deck is also marked (outline plus a "Next" tag), clearly less prominent than the current thrower, so they can tell at a glance they're up.
- Dark environment: dark theme, high contrast, large numbers.

## Setup screen

Game picker grouped by Core, Cricket, Party, Practice → game options → players/teams → throw order → start. Single games only, no legs or sets.

## Games for version 1

### Core

**X01** — start score option: 301, 501, 701 (allow custom). Count down to exactly zero.
- "In" rule and "Out" rule are two separate options, each: Open (any), Double, Triple, Master (double or triple).
- Bust (below zero, or a remainder that can't be finished under the Out rule, or finishing on the wrong ring) resets the score to the start of that turn.
- Inner bull counts as a double.
- Checkout suggestions: always on, not a setup option (Mark, 2026-11-17). When the remaining score can be finished with the darts left in the turn under the chosen Out rule, show a suggested route (e.g. T20, T20, D20) on the current player's card. Update it after every dart. Built on `getHint`, so other games can offer hints later.

**Baseball** — standard rules. 9 innings; in inning N only number N scores. Single 1 run, double 2, triple 3. Highest total wins. Tie → extra innings (10, 11, …) until broken.

**Assassin** — Mark's house rules. This is not standard Killer; follow these exactly.
- Each player has a unique number 1–20. Bull is never a player's number.
- Number assignment, option on setup: (a) Throw — each player throws off-hand and the hit number is entered manually, duplicates rejected; (b) Random — the app assigns.
- Everyone starts with 3 lives. Cap is 6 lives.
- Hitting your own number adds lives: single +1, double +2, triple +3, never above 6.
- A player with 6 lives is an Assassin.
- Only Assassins can do damage. An Assassin can attack any other player, Assassin or not. When an Assassin hits another player's number, that player loses lives: single 1, double 2, triple 3.
- A non-Assassin hitting someone else's number does nothing.
- An Assassin who drops below 6 lives loses Assassin status until they hit their own number back up to 6.
- A player at 0 lives is out. Last player standing wins.
- No teams in Assassin. Every player has their own number and lives.
- Scoreboard shows each player's number, lives, and Assassin status.

### Cricket

**Standard Cricket** — numbers 15–20 and bull. Three marks closes a number (single 1, double 2, triple 3 marks; outer bull 1, inner bull 2). Hits on a number you've closed that an opponent hasn't score points. Win: all closed and points equal or ahead.

Variants, each its own entry or an option on the Cricket module:
- **Cut-throat** — points go to opponents who haven't closed the number; lowest score wins.
- **No-score** — first to close everything wins, no points.
- **Wild card** — the numbers in play are chosen at random at game start.
- **Custom numbers** — players pick which numbers are in play (e.g. extended down to 10).

### Party

Standard published rules. Confirm details with Mark before building each.

- **Shanghai** — rounds 1–7 (option: 1–20). Only the round's number scores. Single, double and triple of that number in one turn is a Shanghai and wins instantly. Otherwise highest total.
- **Halve-It** — fixed list of targets, one per round (default 20, 16, D7, 14, T10, 17, bull; editable). Score what you hit on the target; miss with all three and your total is halved.
- **Gotcha** — count up to exactly 301. Going over busts the turn. Landing exactly on an opponent's score sends them back to 0.
- **Bermuda** — 13 rounds: 12, 13, 14, any double, 15, 16, 17, any triple, 18, 19, 20, bull, inner bull. Miss the target with all three and your total is halved. Highest total wins.
- **Knockout** — each player must beat the previous player's three-dart total or lose a life. 3 lives. Last standing wins.
- **Hare and Hounds** — hare starts on 20 and travels clockwise around the board back to 20. Hound starts behind and chases. Hound wins by catching the hare; hare wins by finishing.
- **Mickey Mouse** — Cricket-style on 20 down to 12, plus doubles, triples and bull as categories.
- **Follow the Leader** — a player sets a target segment; the next must hit it within three darts or lose a life, then sets the next target. 3 lives.

### Practice

Standard published rules. Solo play supported. Confirm details with Mark before building each.

- **Around the Clock** — hit 1–20 in order. Options: finish on bull; singles, doubles or triples only.
- **Bob's 27** — start at 27. Rounds D1 to D20 then bull. Each hit adds that double's value; missing with all three subtracts it. Out if the score drops below 1.
- **Chase the Dragon** — triples 10 through 20 in order, then outer bull, then inner bull.
- **51 by 5s** — a turn only scores if its total is divisible by 5; score total ÷ 5. First to exactly 51.

## Persistence, history and stats

- Everything stored locally on the device.
- A game in progress survives closing the app and can be resumed.
- Finished games are saved to history with players, game, options, result and date.
- Store the full dart-by-dart log for every game. The specific stats are not decided yet; keeping every dart means any stat can be computed later without changing storage.
- Stats for version 1: win/loss record, average per turn, double %, triple %, and for Cricket marks per round (average, best, worst). One scrolling stats screen with a table per group, like the reference.
- No export or reset needed for now.

## Design

- Goal: clean and easy to read in low light, but more polished than the dice scorekeeper. Not a calculator look.
- Polish comes from type, spacing, a consistent color per player, and small feedback moments (bust, big score, win), not from decoration.
- Flow reference: "Darts Scoreboard: Scorekeeper" on iOS by Yosyp Hameliak. Screenshots are in `reference/` (git-ignored, never pushed): `Setupscreen.PNG`, `X01 playing screen.PNG`, `Cricket Playing Screen.PNG`, `Stats screen.PNG`. Use them for flow and layout ideas only; do not copy colors, icons or styling.
- What to keep from the reference:
  - Setup on one screen: game picker, option tiles you tap to cycle, player list with drag handles, a random-order toggle, one Start button.
  - X01: one card per player with a large remaining score, three slots showing this turn's darts, the turn total, darts thrown and average. Current player marked with a color bar.
  - Entry pad: 7-column grid of 1–20 and 25, then a bottom row of 0, Double, Triple, Undo.
  - Cricket: numbers down the side, one column per player, marks shown as / then X then circled X. Pad shrinks to only the numbers in play.
  - Bottom navigation: Home, Players, Statistics, History, Settings.
- What to do differently:
  - Dark theme. The reference is light with a green header.
  - No ads, no sets/legs, no sound or AI buttons.
  - Every player must stay on screen. The reference's Cricket columns scroll sideways at 4 players and its X01 cards fill the screen at 4. Use compact rows or a tighter grid when there are many players.
  - On teams, show which teammate is throwing.
- Visual direction, chosen by Mark from mockups (2026-11-16): dartboard colors — black, greys, red, green, cream — in a dark and a light theme.
  - Theme toggle (Dark / Light) on the setup screen. Remember the choice. All colors are CSS variables; the two themes differ only in variable values.
  - Rounded cards and keys, sans-serif. Medium weights (chosen by Mark 2026-11-17, heavy looked bubbly and cramped): names 600, scores 700, number keys 500, Double/Triple/Undo 600, header line 500, slight extra letter spacing. Text sizes enlarged the same day for readability. No monospace. No navy or blue-tinted darks: true black and neutral greys only.
  - Depth, not flat: cards and keys are raised with shadows; the thrower card sits highest.
  - Header text (game, options, round) at full contrast, never faint.
  - No per-player colors.
- Color roles (same in both themes unless noted):
  - Green (about #1F8A4C, lighter #27A35B at the top of the card): current thrower's card with white text, and the Double key.
  - Red (about #D7322D): the Triple key. Also reserved for bust and error feedback. Never use red for the thrower.
  - Cream (about #F3E7C9): text and the "Next" tag on dark; page background on light.
  - Dark theme: page near-black (#0B0B0B to #181818), player cards #262626, cream text.
  - Light theme: cream page, off-white cards (#FFFAEC), black text, black "Next" outline and tag.
  - Number keys: dark grey (#282828 to #363636) with cream text in both themes.
- Playing screen layout, top to bottom:
  - Header line: game and options on the left, round on the right.
  - Player cards, one per row. Thrower card is tallest, with a score about twice the size of the others and three dart slots. On-deck card has an outline and a "Next" tag and a slightly larger score than the rest.
  - Out bar (checkout hint): a green-tinted bar. "Out:" at the left, the three suggested darts spaced evenly across the rest. Light green text on a translucent green tint in dark; dark green text on pale green in light.
  - Keypad: the bottom third of the screen as a full-width band with a straight top edge and no rounded corners. It is part of the screen, not a floating pad. Band is #1E1E1E with a hairline top border in dark, black in light.

## Build order

1. [x] Project skeleton, PWA shell, game registry, module interface, dart log with replay-based undo. Done 2026-11-17: 23 engine tests pass (`tests/`); Dark/Light theme variables and a static look preview on the home page. Offline service worker still to be confirmed in a normal browser (the in-app preview browser blocks service workers).
2. [x] Roster, player/team selection, throw order, setup screen. Done 2026-11-17: Players tab (add, rename, remove, max 15), setup screen with game picker, option tiles, Random order and Teams switches, drag to reorder, Start opens a placeholder playing screen showing throw order. Bottom navigation in place; Stats, History and Settings are placeholders. 38 tests pass.
3. Entry pad and scoreboard layout, wired to X01 (all in/out options).
4. Cricket and its variants.
5. Baseball and Assassin.
6. Persistence: resume, history, dart log.
7. Party games, one at a time.
8. Practice games, one at a time.
9. Stats screens (after Mark defines the stats).
10. Visual polish pass, offline check, install test on phone.

The visual direction is chosen (see Design). Build the theme variables for both Dark and Light in step 1 so every later screen uses them from the start.

## Decisions log

- 2026-11-17: Plain HTML/CSS/JS split into ES modules, no build tools and no dependencies. Run locally with `python serve.py` (Python's built-in server; pages using modules and service workers can't be opened by double-clicking).
- 2026-11-17: Engine tests run in the browser at `tests/` (no Node or test library needed).
- 2026-11-17: Local git repo created, commits use the GitHub noreply address. Not on GitHub yet.
- 2026-11-17: Reference screenshots moved to `reference/` and git-ignored, so another app's artwork is never pushed.
- 2026-11-17: Thrower card keeps its score on the right, in one vertical line with every other score; name and dart slots sit on the left.
- 2026-11-17: Offline status is not shown to players (the app never needs internet after the first load). Developer check lives on the tests page.
- 2026-11-17: X01's settings list (start 301/501/701/custom, In, Out, Out hints) added in step 2 so the setup screen can be tried; scoring stays in step 3. Defaults: 501, Open in, Double out, hints on.
- 2026-11-17: Teams are formed by tapping a team badge (A–E) next to each player, so uneven teams like 2 + 3 work. Badges are letters only, no team colors. Teams throw in the order they first appear in the list; teammates in list order. Random order shuffles teams and teammates at Start.
- 2026-11-17: The last setup (game, options, players, switches) is remembered on the device.
- 2026-11-17 (after Mark tested step 2): Out hints setting removed, hints always on. Option tiles (Start, In, Out) open a pop-up menu from the bottom with big rows and a one-line explanation each (e.g. Master = a double or a triple), instead of cycling. Team letters also open a pop-up, offering only as many teams as the players can fill (2 per team, max 5) and showing who is already on each team.
- 2026-11-17: GitHub repo `dart-scoreboard` created by Mark and pushed. Pages not set up yet.
- 2026-11-17: App icon is a simple SVG dartboard for now; PNG icons for iPhone home-screen install come in step 10.

## Open decisions

- Rule details for each Party and Practice game. Mark confirms these one at a time as each is built.
- GitHub repo and GitHub Pages hosting. Not set up yet. After build step 1 works locally, walk Mark through creating the repo and pushing, one step at a time (he is new to GitHub). Set up Pages when there is something worth opening on a phone.
- Final app name, if it's ever sold.

## Future modules

- Mark's "triples" game: bull-centred positive scoring with penalties in and outside the triple ring. Rules to be defined.
- Any new game Mark learns. Add as a module in `games/` plus one registry line.
