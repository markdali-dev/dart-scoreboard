# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Mark and his group of friends today: casual players scoring their own games at home or in a bar. One phone is held by the players (not mounted at the board) and passed around or kept by whoever is scoring, usually in dim light, often mid-conversation or with a drink in hand.

Later, the same kind of casual player from the public: the app is built so it could be offered or sold to others without rework. Serious league players are not the target.

## Product Purpose

A phone-first darts scorekeeper that covers many games in one place and gets out of the way: enter each dart, see everyone's standing at a glance, and let the app handle the rules (busts, checkouts, eliminations, turn order, teams). Success is a group playing a whole evening of mixed games without anyone needing to do maths or argue about the score.

## Positioning

- **Everyone on one screen.** All players or teams (up to 5) stay visible together with the dart entry pad, with no scrolling or swiping between players. The reference app this was inspired by fails at this from 4 players.
- **Many game types in one app.** Core games (Cricket, X01, Baseball, Assassin), plus Party and Practice games, not just X01 and Cricket. Includes Mark's own house rules (Assassin) played exactly as his group plays them.

## Operating Context

- Portrait phone, held in the hand, in low light. Scores must be read by players standing a few feet away.
- Each dart is entered individually, three per turn; undo is used often to fix mis-taps.
- A game in progress must survive the phone locking or the app being closed, and can be resumed.
- Works fully offline once loaded (installable web app); no accounts, no backend, no sign-in.
- Games are single games only (no legs or sets).

## Capabilities and Constraints

- Built so far (2026-11-18): Cricket (No score / Points / Cut-throat, standard or wild card numbers), X01 (301/501/701/custom, Open/Double/Triple/Master in and out, checkout hints), Baseball, Assassin (house rules, random or thrown numbers); teams of 2–3 where a game allows; saved roster of up to 15 players; resume of one unfinished game; History of finished games with the full dart log.
- Planned: Party games (Shanghai, Halve-It, Gotcha, Bermuda, Knockout, Hare and Hounds, Mickey Mouse, Follow the Leader), Practice games (Around the Clock, Bob's 27, Chase the Dragon, 51 by 5s), Stats (win/loss, average per turn, double %, triple %, Cricket marks per round), install test on a phone.
- Each game is a self-contained module behind one registry; the app shell knows nothing game-specific.
- Free and open-source pieces only; any library must allow commercial use. No sound.
- Terminology: a "side" is one player or one team; "Bull" key counts as 25, Double + Bull is the inner bull (50).
- Undecided: final app name (Dart Scoreboard is a working title); whether and how it is published or sold; hosting (GitHub Pages pending a public/private repo decision).

## Brand Commitments

- Working title "Dart Scoreboard"; not final.
- The design must stay original: do not copy the name, layout, icons or artwork of any existing darts app. The iOS app "Darts Scoreboard: Scorekeeper" is a flow reference only.
- No ads, no AI or sound buttons, no sets/legs.
- The Assassin gun-barrel graphic is inspired by the James Bond films; acceptable for personal use, but it must be replaced before any public release or sale.

## Evidence on Hand

- Screenshots of the reference app in `reference/` (git-ignored; flow reference only, never to be copied or shipped).
- No users beyond Mark's group, no testimonials, reviews, download numbers, pricing or press. Future work must not invent any.

## Product Principles

1. **The whole game at a glance.** Every player's standing and the entry pad share one screen; nothing important is ever off-screen.
2. **The app knows the rules.** Busts, checkouts, eliminations, turn order and teams are handled for the players; house rules are followed exactly as written.
3. **Fast, forgiving entry.** One tap per dart, undo always one tap away, mistakes cheap to fix.
4. **Never lose a game.** Every dart is saved as it's thrown; nothing depends on a connection or an account.
5. **One shell, many games.** New games plug in as modules without changing the app around them.

## Accessibility & Inclusion

- Readable at arm's length in low light: scores and names must be legible from a few feet away.
- Big, forgiving tap targets: keys must be easy to hit quickly mid-game.
