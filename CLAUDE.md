# Dart Scoreboard — project spec

Working title: Dart Scoreboard. A phone-first darts scoring app covering many games, built so new games can be added later as self-contained modules.

Status: building. Spec written 2026-11-14, updated 2026-11-16. Build steps 1–3 done 2026-11-17, steps 4–5 (Cricket, Baseball, Assassin) and several polish rounds done 2026-11-18; step 6 (resume and History) done the same evening; next is step 7 (Party games, one at a time). Items under "Open decisions" are not settled — ask Mark before building them.

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

- `id`, `name`, `group` (Core, Party, Practice; Cricket is Core), short rules text
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

Game picker grouped by Core, Party, Practice → game options → players/teams → throw order → start. Single games only, no legs or sets.

## Games for version 1

### Core

**X01** — start score option: 301, 501, 701 (allow custom). Count down to exactly zero.
- "In" rule and "Out" rule are two separate options, each: Open (any), Double, Triple, Master (double or triple).
- Bust (below zero, or a remainder that can't be finished under the Out rule, or finishing on the wrong ring) resets the score to the start of that turn.
- Inner bull counts as a double.
- Checkout suggestions: always on, not a setup option (Mark, 2026-11-17). When the remaining score can be finished with the darts left in the turn under the chosen Out rule, show a suggested route (e.g. T20, T20, D20) on the current player's card. Update it after every dart. Built on `getHint`, so other games can offer hints later.

**Baseball** — standard rules. 9 innings; in inning N only number N scores. Single 1 run, double 2, triple 3. Highest total wins. Tie → extra innings (10, 11, …) until broken; only the players/teams tied for the lead play them (past inning 20 the target is the bull). Teams allowed (Mark, 2026-11-18). Keypad shows one big key for the inning's number.

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
- Built 2026-11-18: Throw mode shows a Number draw screen after Start (each player taps the number they hit off-hand; taken numbers greyed out with the owner's name; miss or bull = throw again; Undo). Play again repeats the draw in Throw mode and deals fresh numbers in Random mode. Cards show the player's number big on the right, life dots next to the name, an ASSASSIN badge at 6 lives; knocked-out players are dimmed and skipped. Pop-ups: "<name> is an Assassin!" and "<name> is out!".
- Scoreboard shows each player's number, lives, and Assassin status.

### Cricket

**Standard Cricket** — numbers 15–20 and bull. Three marks closes a number (single 1, double 2, triple 3 marks; outer bull 1, inner bull 2). Hits on a number you've closed that an opponent hasn't score points. Win: all closed and points equal or ahead.

Built as one Cricket game with two setup tiles (Mark, 2026-11-18):
- **Scoring:** No score (default; first to close everything wins), Points (the standard rule above; Mark's group plays with or without points), Cut-throat (extra hits add points to every opponent who hasn't closed that number; close everything with the lowest or equal-lowest score to win).
- **Numbers:** 15–20 + bull, or Wild card (6 different random numbers from 1–20, plus bull, drawn once at game start and kept for the whole game, including undo).
- Custom numbers dropped (Mark never plays it; Wild card covers variety).

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

1. [x] Project skeleton, PWA shell, game registry, module interface, dart log with replay-based undo. Done 2026-11-17: 23 engine tests pass (`tests/`); Dark/Light theme variables and a static look preview on the home page. Offline service worker still to be confirmed in a normal browser (the in-app preview browser blocks service workers); see Open decisions.
2. [x] Roster, player/team selection, throw order, setup screen. Done 2026-11-17: Players tab (add, rename, remove, max 15), setup screen with game picker, option tiles, Random order and Teams switches, drag to reorder, Start opens a placeholder playing screen showing throw order. Bottom navigation in place; Stats, History and Settings are placeholders. 38 tests pass.
3. [x] Entry pad and scoreboard layout, wired to X01 (all in/out options). Done 2026-11-17: X01 scoring for every In/Out rule, busts (score and any In opened that turn reset), win screen (Play again, New game, Undo last dart), checkout hints after every dart, "Bust" and 100+ score pop-ups, per-card average, darts thrown and last turn. All 5 players fit with the keypad on a 375×667 screen. 59 tests pass.
4. [x] Cricket and its variants. Done 2026-11-18: marks grid (numbers down the side, one column per player/team, / X Ⓧ, numbers everyone has closed greyed out), keypad shows only the numbers in play, green turn strip with the thrower's darts and marks per round (MPR). 5 players fit on a 375×667 screen. 71 tests pass.
5. [x] Baseball and Assassin. Done 2026-11-18: Baseball with teams, one big key for the inning's number, extra innings for tied leaders only. Assassin with Random or Throw numbers (Number draw screen before the game), life dots, Assassin badge, knocked-out players dimmed and skipped. 89 tests pass; 5 players fit on a 375×667 screen.
6. [x] Persistence: resume, history, dart log. Done 2026-11-18: the game in progress is saved after every dart; leaving or closing the app keeps it, and a green "Resume game" bar on Home brings it back exactly where it was. Only one unfinished game: starting a new one asks first, then discards it. Finished games go to History (newest first, up to 500) with players, game, options, result, date and the full dart log; tapping one shows its final board. Undo on the win screen takes a game back out of History. 97 tests pass.
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
- 2026-11-17: GitHub repo `dart-scoreboard` created by Mark and pushed. Pages not set up yet. Claude pushes after each commit.
- 2026-11-17 (step 3): Player cards stay in a fixed order; the green card moves down the list. The turn total sits in the small line under the dart slots ("Turn 57 · Avg … · … darts") so it never collides with the big score. Average = points scored per 3 darts, busted turns count as 0. Checkout route picks the fewest darts, then the easiest (T20/T19 to set up, D20/D16 preferred to finish). Leaving a game mid-way asks first, because resume comes in step 6.
- 2026-11-18 (step 4): Games can now fix random choices once at game start (`prepareOptions`), saved with the match so undo/resume replay the same game. Games can also show a marks grid instead of score cards (`board: 'marks'`) and limit the keypad to their numbers (`getKeys`). Cricket marks per round counts marks that close a number plus extra marks that score points.
- 2026-11-18 (after Mark tested Cricket): keypad numbers run low to high (15…20, then a "Bull" key that still counts as 25); shorter grid rows with bigger marks; the green turn strip is gone. Instead a "Darts" row under every column shows that player's darts: current thrower's this-turn darts on green, everyone else's last-turn darts in a grey box (theme-aware colors). Marks per round moved into each column header.
- 2026-11-18: Cricket rows made about 35% taller again (up to 54px, shrinking to no less than 40px on small screens) with marks growing to match (about 46px), so the grid uses the space without crowding the keypad.
- 2026-11-18 (after Mark tested step 5):
  - Cricket is a Core game, listed first (Cricket, X01, Baseball, Assassin). The Cricket group is gone; groups are now Core, Party, Practice.
  - Assassin badge is red (Mark's choice, overriding "red only for bust/error"). An original gun-barrel graphic (figure aiming at the viewer, red-tinted swirl, no 007 logo) sits between the cards and the hint bar. It is inspired by the James Bond films; fine for personal use, but replace it before selling the app (trademark risk).
  - Baseball entry: two big tiles above Double/Triple/Undo, "Miss" (left, counts as 0) and the inning's number (right, green); no 0 key in the bottom row. A faded baseball diamond graphic sits just above the tiles.
  - Graphics shrink to fit and hide when there's under ~64px of room (e.g. 5 players on a small phone).
- 2026-11-18 (Mark's second pass): Assassin graphic redrawn close to Mark's mockup: realistic tuxedo silhouette in a lunging firing stance (pistol raised beside the face, other arm out), shaded grey rifling blades with black edges lit from the right, and a blood-red wash with drips over the top third. Life dots bigger (16px) and spaced 8px apart for easy counting. Baseball: Miss/target tile text bigger and bold; every other player's card keeps their last 3 darts in grey chips until their next turn starts; the Inning bar sits under the diamond, just above the tiles.
- 2026-11-18 (round 3): Assassin: while a player has 3 lives or fewer, the first 3 life dots turn red (filled for lives they have, red outline for lives lost); at 4 or more all dots go back to the normal color. Mark is keeping the redrawn gun-barrel graphic for now but finds it weaker than hoped; a better image could replace it later. Setup: the Game bar uses the same green as Start; option tiles use a darker, muted green so they don't compete with the Game bar and Start (both themes). All pop-up menus (option and team menus, win screen, leave-game) open centred on the screen, not anchored to the bottom.
- 2026-11-18 (step 6, Mark's choices): Resume bar on Home (not auto-open); one unfinished game at a time; History list with tap-to-view final board; games left unfinished and then replaced are discarded, not kept. The old "Leave this game? It will be lost" question was removed: leaving now keeps the game for Resume.
- 2026-11-18: PRODUCT.md added (Impeccable init): users (Mark's group now, casual public players later), positioning (everyone on one screen; many game types), and access needs (readable at arm's length; big, forgiving tap targets). CLAUDE.md stays the build plan; PRODUCT.md holds product truth for design work.
- 2026-11-18: Phone testing over home Wi-Fi: `python serve.py --lan` prints an address to open on the phone. Gameplay works; offline mode and home-screen install need https, so they wait for GitHub Pages.
- 2026-11-17: App icon is a simple SVG dartboard for now; PNG icons for iPhone home-screen install come in step 10.

## Open decisions

- Rule details for each Party and Practice game. Mark confirms these one at a time as each is built.
- GitHub Pages hosting (to play on a phone). The repo exists and is pushed. Pages on a free account needs the repo to be public; Mark has not decided public vs private yet. Walk him through it step by step when he wants to play on his phone.
- Offline copy (service worker) not yet confirmed in a normal browser. Check: open the app once in Edge or Chrome, then the tests page, "Offline copy" line should say saved.
- Final app name, if it's ever sold.

## Where we left off (2026-11-18, late)

- Steps 1–6 done, committed and pushed. Playable: Cricket, X01, Baseball, Assassin; games resume after closing the app; finished games are in History.
- Mark has not yet tried step 6 himself.
- Next: step 7, Party games, one at a time (Shanghai, Halve-It, Gotcha, Bermuda, Knockout, Hare and Hounds, Mickey Mouse, Follow the Leader). The plan says to confirm each game's rules with Mark before building it. Ask which game he wants first.
- Stats (step 9) will read the dart logs saved in History; nothing extra needs storing.
- How to run: `python serve.py` (this PC) or `python serve.py --lan` (phone on the same Wi-Fi). Tests: http://localhost:8000/tests/ (97 passing).
- Still open: GitHub Pages (needs a public repo on the free plan); confirming the offline copy in a normal browser; a better Assassin graphic some day.
- Test data: the in-app preview browser has made-up players and games saved; Mark's own browser has his own.

## Future modules

- Mark's "triples" game: bull-centred positive scoring with penalties in and outside the triple ring. Rules to be defined.
- Any new game Mark learns. Add as a module in `games/` plus one registry line.
