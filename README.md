# Dart Scoreboard

A phone-first darts scoring app. Plain HTML/CSS/JavaScript, works offline, no accounts, no build step.
The plan, rules and progress live in `CLAUDE.md`.

**Playable now:** X01 (301 / 501 / 701 / custom, every In and Out rule, checkout hints, teams).
Cricket and the other games are on the way.

## Run it on this PC

```powershell
python serve.py
```

Then open http://localhost:8000 in Edge or Chrome. Stop the server with Ctrl+C.

## Run the tests

With the server running, open http://localhost:8000/tests/ — the top bar turns green when every test passes.
The "Offline copy" line at the bottom shows whether the app has saved itself for use without internet
(open the app's home page once first).

## Folders

- `index.html`, `js/main.js` — the app shell: holds what's on screen and redraws it
- `js/core/` — shared logic with no screen code: darts, game registry, turn order and undo, roster, setup rules, saving, theme
- `js/ui/` — the screens: setup (Home), Players, playing screen
- `games/` — one file per game, listed in `games/index.js`
- `css/theme.css` — every color, for Dark and Light; `css/app.css` — layout
- `tests/` — browser-based tests
- `reference/` — screenshots of another app, kept out of git
- `scratch/` — throwaway design comparisons, kept out of git
