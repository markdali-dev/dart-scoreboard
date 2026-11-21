# Dart Scoreboard

A phone-first darts scoring app. Plain HTML/CSS/JavaScript, works offline, no accounts, no build step.
The plan, rules and progress live in `CLAUDE.md`.

**Playable now:**
- X01 (301 / 501 / 701 / custom, every In and Out rule, checkout hints, teams)
- Cricket (No score / Points / Cut-throat, standard or wild card numbers, teams)
- Baseball (9 innings, extra innings on a tie, teams)
- Assassin (house rules; random numbers or an off-hand Number draw)
- Knockout (Party: beat the previous total or lose a life; 3 or 5 lives)
- Halve-It (Party: one target per round, miss and your total is halved; three target lists)
- Shanghai (Party: rounds 1–7 or 1–20; single, double and triple in one turn wins instantly)

Games are saved as you play: close the app mid-game and a "Resume game" bar brings it back. Finished games are kept in History.

The other games are on the way.

## Run it on this PC

```powershell
python serve.py
```

Then open http://localhost:8000 in Edge or Chrome. Stop the server with Ctrl+C.

## Try it on a phone (same Wi-Fi)

```powershell
python serve.py --lan
```

It prints an address like `http://192.168.1.23:8000`. Type that into the phone's browser.
If Windows asks about the firewall, allow Python on **Private networks** only.
Offline mode and "Add to Home Screen" need https, so those only work once the app is on GitHub Pages.

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
