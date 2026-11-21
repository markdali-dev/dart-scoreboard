---
name: Dart Scoreboard
description: Dartboard colours in a dim room, built to be read from the throw line.
colors:
  board-black: "#111111"
  board-black-deep: "#0b0b0b"
  wire-grey: "#262626"
  keypad-band: "#1e1e1e"
  key-grey: "#2e2e2e"
  key-grey-top: "#363636"
  hairline-grey: "#3a3a3a"
  sisal-cream: "#f3e7c9"
  sisal-cream-muted: "#c9bfa6"
  double-ring-green: "#1f8a4c"
  double-ring-green-top: "#27a35b"
  double-ring-green-shade: "#165834"
  double-ring-green-shade-top: "#1d6a40"
  out-green-text: "#8fe0ad"
  treble-ring-red: "#d7322d"
  white: "#ffffff"
  paper-cream: "#fffaec"
  ink-black: "#111111"
  ink-muted: "#3d3a33"
  hairline-cream: "#d8caa6"
  chip-cream: "#dcd5c4"
  out-green-pale: "#d4efdc"
  out-green-ink: "#145c33"
typography:
  display:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "3.8rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.01em"
    fontFeature: "tnum"
  headline:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "2.1rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.01em"
    fontFeature: "tnum"
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 600
    letterSpacing: "0.01em"
  key:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 500
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 700
    letterSpacing: "0.06em"
rounded:
  tag: "6px"
  chip: "8px"
  key: "10px"
  card: "14px"
  sheet: "20px"
  pill: "999px"
spacing:
  gap: "8px"
  gutter: "12px"
components:
  card:
    backgroundColor: "{colors.wire-grey}"
    textColor: "{colors.sisal-cream}"
    rounded: "{rounded.card}"
    padding: "8px 14px"
  card-thrower:
    backgroundColor: "{colors.double-ring-green}"
    textColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "12px 14px"
  key:
    backgroundColor: "{colors.key-grey}"
    textColor: "{colors.sisal-cream}"
    typography: "{typography.key}"
    rounded: "{rounded.key}"
    height: "58px"
  key-double:
    backgroundColor: "{colors.double-ring-green}"
    textColor: "{colors.white}"
    rounded: "{rounded.key}"
    height: "58px"
  key-triple:
    backgroundColor: "{colors.treble-ring-red}"
    textColor: "{colors.white}"
    rounded: "{rounded.key}"
    height: "58px"
  button-start:
    backgroundColor: "{colors.double-ring-green}"
    textColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "16px"
  button-secondary:
    backgroundColor: "{colors.wire-grey}"
    textColor: "{colors.sisal-cream}"
    rounded: "{rounded.key}"
    padding: "10px 14px"
  option-tile:
    backgroundColor: "{colors.double-ring-green-shade}"
    textColor: "{colors.sisal-cream}"
    rounded: "{rounded.card}"
    padding: "10px 6px 12px"
  dart-chip:
    backgroundColor: "{colors.hairline-grey}"
    textColor: "{colors.sisal-cream}"
    rounded: "{rounded.chip}"
  tag-next:
    backgroundColor: "{colors.sisal-cream}"
    textColor: "{colors.board-black}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
  badge-danger:
    backgroundColor: "{colors.treble-ring-red}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
---

# Design System: Dart Scoreboard

## Overview

**Creative North Star: "The Board After Dark"**

The app borrows its whole palette from the dartboard itself: board black, the cream of the sisal, the green and red of the double and treble rings. It is used in a dim room by people standing a few feet from the phone, so everything is built to be read at a glance from the throw line: big tabular numbers, strong contrast, and colour that always means something. Green means "you're up" or "go"; red means danger or a triple.

Density is high but calm. Up to five players or teams share one portrait screen with the keypad, so the system relies on size and position for hierarchy rather than ornament. The current thrower's card is the loudest thing on screen; everything else steps down in size, weight and saturation. Surfaces are raised, not flat: cards and keys sit on hard bottom shadows like physical buttons.

Two themes share one structure. Dark (board black page, wire-grey cards, cream text) is the default for the bar; Light (cream page, paper-cream cards, black text) is the same layout with only the colour variables swapped. The keypad stays dark in both.

**Key Characteristics:**
- Bold and legible: the score is always the biggest thing on screen.
- Dartboard palette only: black, neutral greys, cream, ring green, ring red. No blues.
- Colour carries meaning, never decoration.
- Raised cards and keys with hard bottom shadows.
- One screen: every player and the keypad visible together, no scrolling.

## Colors

A dartboard in low light: near-black and neutral greys, warm cream for text, and the two ring colours reserved for meaning.

### Primary
- **Double-Ring Green** (`double-ring-green`, top stop `double-ring-green-top`): the "you're up / go" colour. The current thrower's card, the Game bar, the Start button, the Resume bar, the Double key, selected rows in pop-up menus, and the Baseball target tile. Always drawn as a top-to-bottom gradient from the top stop to the base. White text on it.
- **Shaded Ring Green** (`double-ring-green-shade`, top stop `double-ring-green-shade-top`): a darker, muted green for setup option tiles, so they read as part of the Game bar family without competing with it or with Start.
- **Out Green** (`out-green-text` on a 18% tint of the ring green in Dark; `out-green-ink` on `out-green-pale` in Light): the checkout / hint bar ("Out: T20 D16", "Inning 4: Hit 4s").

### Secondary
- **Treble-Ring Red** (`treble-ring-red`): the Triple key, Knockout's "score to beat" panel, the faded Halve-It bullseye (a target, by Mark's choice), the BUST and "is out!" pop-ups, error text, the ASSASSIN and OUT badges, and Assassin life dots when a player is at 3 lives or fewer. White text on it.

### Neutral
- **Board Black** (`board-black`, deep edge `board-black-deep`): Dark theme page.
- **Wire Grey** (`wire-grey`): Dark theme cards, list rows, secondary buttons, unselected menu rows.
- **Keypad Band** (`keypad-band`): the full-width keypad strip in Dark; pure black in Light.
- **Key Grey** (`key-grey`, top stop `key-grey-top`): every number key, in both themes, with cream text.
- **Hairline Grey** (`hairline-grey`): borders and the dart chips (last turn's darts) in Dark.
- **Sisal Cream** (`sisal-cream`, muted `sisal-cream-muted`): all text in Dark; the "Next" tag and outline in Dark; the Light theme page.
- **Paper Cream** (`paper-cream`): Light theme cards.
- **Ink Black** (`ink-black`, muted `ink-muted`): all text in Light; the "Next" tag and outline in Light.
- **Hairline Cream** (`hairline-cream`) and **Chip Cream** (`chip-cream`): Light theme borders and dart chips.

### Named Rules
**The Green Means You're Up Rule.** Bright ring green marks only the current thrower, the primary action (Game bar, Start, Resume) and the Double key. If something is green, a player should be able to say why.

**The Red Is Danger Rule.** Treble red is for the Triple key and for danger: busts, knock-outs, errors, at-risk lives, the Assassin badge. Never use red for the current thrower.

**The No Blue Rule.** Darks are true black and neutral greys. No navy, no blue-tinted greys, no per-player colours (one exception by Mark's request: the Hare and Hounds animals, a red bunny for the hare and a gold, orange, cream or lilac hound for each hound).

**The Variables Only Rule.** Every colour comes from a theme variable. Dark and Light differ only in variable values, never in layout or structure.

## Typography

**Display Font:** System UI (system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif)
**Body Font:** the same system stack
**Label/Mono Font:** none; no monospace anywhere

**Character:** One native sans-serif in medium-to-bold weights. Scores use tabular figures so columns of numbers don't jitter as they change.

### Hierarchy
- **Display** (700, 3.8rem, line-height 1): the current thrower's score. Drops to 3.2rem with 4 or 5 players.
- **Headline** (700, 2.1rem, line-height 1): everyone else's score; the on-deck player's score is a step larger (2.5rem). Drops to 1.8rem / 2.1rem with 4 or 5 players.
- **Title** (600, 1.35rem): player names, menu row labels, Cricket points. App title 1.55rem at 700; section headings 1.2rem at 700.
- **Key** (500, 1.7rem): number keys. Word keys (DOUBLE, TRIPLE, Undo, Bull) 1.15–1.25rem at 600.
- **Body** (400, 1.1rem, line-height 1.4): rules text, notes, explanations under menu rows.
- **Label** (700, 0.85rem, 0.06em, uppercase): the NEXT tag, ASSASSIN / OUT badges, group headings.

### Named Rules
**The Score Is the Headline Rule.** The current thrower's score is always the largest type on screen. Nothing else, including pop-ups' resting state, may outrank it.

**The Medium Weights Rule.** Names 600, scores 700, keys 500, header line 500. Heavier weights (800) looked bubbly and cramped and were rejected; the one exception is the Baseball Miss and target tiles, which are bold by request.

**The Full Contrast Header Rule.** Header text (game, options, round) is always full contrast, never faint or greyed.

## Layout

Portrait phone, one column, max width 520px, side gutter 12px, gaps 8px. The playing screen is a fixed-height stack (100dvh) with no page scroll: header line, player cards (or the Cricket marks grid), an optional game graphic, the hint bar, then the keypad band pinned to the bottom.

- Player cards are one per row in a fixed order; the green card moves down the list as turns pass. Scores line up in a single right-hand column.
- The current thrower's card is tallest (name, three dart slots, stats line); the on-deck card has an outline and a NEXT tag; the rest are compact single rows.
- With 4 or 5 players a compact mode shrinks scores, padding and gaps so everything fits on a 375×667 screen.
- The Cricket board is a grid: a 58px number column, then one equal column per player (50px number column with 5 players), rows 40–54px tall, and a Darts row underneath.
- The keypad band is a 7-column grid (1–20 and Bull), with a bottom row of 0, DOUBLE, TRIPLE and Undo. Games can shrink it (Cricket: only the numbers in play) or replace it (Baseball: Miss and target tiles).
- Decorative graphics fill leftover space and disappear when less than about 64px remains.

### Named Rules
**The One Screen Rule.** With 5 players on a 375×667 phone, every player, the hint bar and the whole keypad are visible without scrolling. Any new screen element must pass this test.

## Elevation & Depth

Lifted, not flat. Cards, keys and primary buttons sit on a hard 1–3px bottom shadow plus a soft ambient shadow, so they read like physical keys. The current thrower's card and the Start button use a deeper shadow and sit highest. The keypad band is the one flat surface: a full-width strip with a hairline top border. Pressing a key drops it 1px and removes its shadow.

### Shadow Vocabulary
- **Card** (Dark `0 2px 0 rgba(0,0,0,0.5), 0 6px 14px rgba(0,0,0,0.45)`; Light `0 1px 0 rgba(60,45,10,0.18), 0 4px 12px rgba(60,45,10,0.18)`): player cards, list rows, secondary buttons, option tiles.
- **Thrower** (Dark `0 3px 0 rgba(0,0,0,0.55), 0 12px 26px rgba(0,0,0,0.6)`; Light `0 2px 0 rgba(0,0,0,0.25), 0 10px 22px rgba(20,60,30,0.35)`): the current thrower's card, Start, Resume, the Game bar.
- **Key** (Dark `0 2px 0 rgba(0,0,0,0.6), 0 3px 6px rgba(0,0,0,0.35)`; Light `0 2px 0 rgba(0,0,0,0.7), 0 3px 6px rgba(0,0,0,0.4)`): every keypad key.

### Named Rules
**The Thrower Sits Highest Rule.** The current thrower's card always has the deepest shadow on the playing screen.

## Shapes

Gently rounded throughout, getting rounder as things get bigger: 6px tags and badges, 8px dart chips and slots, 10px keys and small buttons, 14px cards and tiles, 20px pop-up menus, fully round pills for the theme switch and toggles. Life dots and team letters are circles. The keypad band is the exception: a full-width strip with a straight top edge and no rounded corners. Cricket marks are drawn as a slash, an X, and a circled X.

## Components

### Buttons
- **Primary (Start, Resume, Game bar):** ring-green gradient, white text, 14px corners, thrower shadow. Start text 1.5rem at 700; disabled Start drops to wire grey with muted text and no shadow.
- **Secondary:** wire-grey background, cream text, 10px corners, card shadow, 1.05rem at 600 (10px 14px padding).
- **Danger:** treble-red background, white text; used for destructive confirmations (Remove, Start new game over an unfinished one).

### Keypad Keys
- **Number keys:** key-grey gradient, cream text, 58px tall, 10px corners, key shadow. Active state presses down 1px.
- **Double / Triple:** ring green / treble red with white text; a cream outline shows which modifier is armed. Bull is disabled while Triple is armed.
- **Baseball tiles:** Miss (key grey) and the inning's target (ring green) as two large equal tiles, bold text.

### Cards / Containers
- **Player card:** wire grey (Dark) or paper cream (Light), 14px corners, card shadow, 8px 14px padding; name on the left, score on the right.
- **Thrower card:** ring-green gradient, white text, thrower shadow, three dart slots under the name.
- **On-deck card:** 2px outline in cream (Dark) or black (Light) plus a NEXT tag.
- **Knocked out:** the whole card dimmed to 45% opacity with a red OUT badge.

### Chips
- **Dart chips:** small grey boxes (hairline grey in Dark, chip cream in Light) showing a turn's darts: last turn on other players' cards, this turn on green for the current thrower.
- **Option tiles (setup):** shaded ring green, label over value, tap to open a menu.

### Pop-up Menus
Centred on screen over a 55% black backdrop, 20px corners, thin hairline edge, scale-in over 0.16s. Rows are at least 60px tall with a 1.35rem label and an optional one-line explanation; the selected row is ring green.

### Navigation
A five-tab bar (Home, Players, Stats, History, Settings) pinned to the bottom on non-game screens, on the keypad band colour. Line icons; the current tab is ring green, the others cream at 70%.

### Signature Components
- **Hint bar:** a tinted green strip above the keypad: "Out:" then the suggested darts spaced evenly, or a one-line instruction.
- **Cricket marks grid:** number labels down the left, one column per player, marks as slash / X / circled X; a number everyone has closed is dimmed and struck through.
- **Life dots (Assassin, Knockout):** one circle per life beside the name, 16px with 8px gaps (14px / 6px with 4–5 players). When a player is down to the game's danger count (Assassin 3, Knockout 1), those dots turn red.
- **Target panel (Knockout):** a big red panel under the players: "SCORE TO BEAT", who set it and "Need N more" on the left, the target in large type on the right. It is only as tall as its three lines of text (no stretching to fill space), its number matches the current thrower's score size (3.8rem; 3.2rem with 4–5 players), and it collapses to one compact row with 5 players.
- **Bullseye target (Halve-It, Shanghai, Hare and Hounds):** a generic three-band bullseye (faded treble-red outer ring, dark gap, faded red bull; theme variables `--bull-ring`, `--bull-gap`, `--bull-centre`) filling the space under the players. TARGET in small capitals in the top of the outer ring; the target in large type centred on the bull, overlapping the outer ring a little (names of 4+ characters a step smaller, allowed to spread over the background); Round and Next below on the plain background. White text with a dark shadow in Dark, near-black in Light. When space is under about 190px, Round and Next move to either side and the bullseye uses the full height (TARGET kept while the bullseye is at least ~74px). On screens shorter than 720px the current player's card becomes one slim line and keys drop to 50px, to give the target room. Its proportions are deliberately not those of any brand logo.
- **Area pad (Crackshot):** instead of the number keypad, a vertical stack of 54–62px buttons, each showing the area and its points: Inner Single (+1, deep green); Bull (+2, green) and Double Bull (+3, ring green) side by side; Ring of Fire (−2, treble red); Miss (−1, dark red) beside Undo. Green means gain, red means penalty.
- **Win kicker:** a small red uppercase line above the winner on the win screen for special wins ("Shanghai!", "Three bulls!", "Sudden death").
- **Initial dots (Around the Clock):** the same board map with a light cream dot (dark outline, near-black bold initial) in place of each animal, 18% of the bullseye's width, spread about 21° apart when players share a number.
- **Animal silhouettes and board map (Hare and Hounds):** original flat silhouettes facing right, with a thin dark outline so they read on any card. One sits before each player's name; copies ride the bullseye's outer ring at the real board angle of each player's number (20 at the top, 18° per number clockwise), each centred on the ring's outer edge and all the same size (24% of the bullseye's width); players sharing a number spread about 11° apart along the ring; the current thrower's has a soft glow. This game has no Round/Next line: the bullseye is sized so it plus the animals' overhang fills the space, with bigger TARGET and number.
- **Feedback pop-ups:** short centred toasts for about 1.4s: red for BUST and knock-outs, green for 100+ scores and new Assassins.

## Do's and Don'ts

### Do:
- **Do** take every colour from the theme variables and keep Dark and Light structurally identical.
- **Do** keep the current thrower's score the largest text on screen and its card the highest.
- **Do** keep all players and the full keypad on one screen at 375×667 with 5 players; use the compact mode rather than scrolling.
- **Do** use ring green only for "you're up" and primary actions, and treble red only for Triple and danger.
- **Do** use tabular figures for every score so numbers don't shift as they change.
- **Do** centre pop-up menus on screen, with rows at least 60px tall.

### Don't:
- **Don't** use navy, blue-tinted darks or per-player colours.
- **Don't** use red for the current thrower.
- **Don't** use monospace, faint header text, or font weights above 700 (except the Baseball tiles).
- **Don't** let the page scroll during a game, or round the top edge of the keypad band.
- **Don't** copy the layout, icons or artwork of the reference darts app; it is a flow reference only.
- **Don't** ship the Bond-style gun-barrel graphic in a public release.
