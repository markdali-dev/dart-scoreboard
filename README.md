# Dart Scoreboard

A phone-first darts scoring app. Plain HTML/CSS/JavaScript, works offline, no accounts, no build step.
The plan and rules live in `CLAUDE.md`.

## Run it on this PC

```powershell
python serve.py
```

Then open http://localhost:8000 in Edge or Chrome. Stop the server with Ctrl+C.

## Run the engine tests

With the server running, open http://localhost:8000/tests/ — the top bar turns green when every test passes.

## Folders

- `index.html`, `js/main.js` — the app shell
- `js/core/` — shared engine: darts, game registry, turn order and undo, theme
- `games/` — one file per game, listed in `games/index.js`
- `css/theme.css` — every color, for Dark and Light
- `tests/` — browser-based engine tests
- `reference/` — screenshots of another app, kept out of git
