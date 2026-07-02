# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Project Overview

**Arcade Portfolio** is a 2D, Pokémon-style (Game Boy / GBA era) portfolio website.
The visitor explores a top-down tile world as a trainer, talks to NPCs, reads signs,
collects **NOTES** (project write-ups) lying on the ground, battles wild **BOTS**
in the tall grass in a turn-based RPG combat screen, and finally turns the notes in
at the **INBOX basket**, triggering a cutscene where a huffing-and-puffing robot
files them onto a comically large TODO pile. All portfolio content (projects,
skills, experience, education, contact) is delivered through in-game dialogue.

It is a zero-dependency static site: plain HTML, CSS, and vanilla JavaScript on a
single `<canvas>`. There is no build step, bundler, package manager, or test framework.

## Running the Project

```bash
# Option 1: just open it
open index.html

# Option 2: serve it (recommended, avoids any file:// quirks)
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Controls (do not change without updating all hint text)

The control scheme is deliberately minimal, mimicking a Game Boy controller:

- **W / A / S / D** — move up / left / down / right (arrow keys work as aliases);
  in the battle menu these move the cursor instead
- **E** — the single interact function (`interact()` in `game.js`); Space and
  Enter are aliases. It talks, reads, picks battle options, advances dialogue,
  and skips the cutscene — every A-button press lands in `interact()`
- **X** — the "B button": jumps to RUN in battle, otherwise acts like E

**Touch devices** get an on-screen Game Boy controller (`#touch-controls` in
`index.html`). In **portrait** the page lays out like a vertical Game Boy (screen
on top, D-pad + A/B below). In **landscape** the buttons float translucently over
the screen edges. The buttons dispatch *synthetic `KeyboardEvent`s* with the same
key codes, so all input — touch or keyboard — flows through the same handlers.
Never wire a touch button to game logic directly; give it a `data-key` attribute.

## File Structure

| File         | Purpose                                                          |
|--------------|------------------------------------------------------------------|
| `index.html` | Page shell: canvas, HUD, dialogue box, battle menu, touch pad    |
| `styles.css` | GBA aesthetic + responsive controller layouts (portrait/landscape) |
| `game.js`    | The entire game engine and all portfolio content                 |

## Architecture (`game.js`)

A global `mode` switches the engine between `'world'`, `'battle'`, and
`'cutscene'`; the game loop picks the matching update + render path. The file is
organized top-to-bottom in sections, each marked with a `// ----------` banner:

1. **Configuration** — `TILE` (48px), viewport (15×10 tiles = 720×480 canvas),
   `WALK_SPEED`, `TURN_DELAY`, `ENCOUNTER_CHANCE`, `PLAYER_MAX_HP`.
2. **Tile map** — `MAP` is an array of 28-char strings, one char per tile.
   Legend: `T` tree, `G` grass, `t` tall grass, `P` path, `W` water, `F` flower,
   `S` sign, `R` roof, `H` wall, `D` door, `f` fence, `B` INBOX basket.
   Solids live in `SOLID_TILES`. **Every row must be exactly the same length.**
3. **Portfolio content** — `NOTES` (ground pickups with position + project text),
   `DIALOGUES` (signs, door, flavor), `NPCS` (position, palette, dialogue pages).
   This is the section to edit when personalizing the portfolio.
4. **Game state** — `mode`, `state` (running, notes found, HP, turnedIn),
   `player` (grid + pixel position, facing/animation), `SPAWN`.
5. **Input** — keyboard handling plus the touch-controller bridge (buttons with
   `data-key` replay synthetic KeyboardEvents). Battle-menu cursor movement is
   intercepted here before world movement sees the keys.
6. **Dialogue system** — Pokémon-style typewriter box (DOM, not canvas). Pages of
   text; first interact press reveals the page, next advances, last closes.
   `onClose` callbacks chain flows (battle turns, the cutscene trigger).
7. **Interact** — the single dispatcher: battle menu → dialogue → cutscene skip →
   world (NPC/sign/door/water/tall grass/basket). Water refills HP.
8. **Notes & basket** — `collectNoteAt()` (walk-over pickup) and
   `interactBasket()` (turn-in; requires all notes, then starts the cutscene).
9. **Battle system** — turn-based RPG vs a wild BOT. Player moves: DEBUG
   (reliable), REFACTOR (risky crit-or-miss), COFFEE (heal, 3 per battle), RUN
   (60%). Enemy attacks are flavor-named (`BOT_ATTACKS`). Losing respawns the
   player at `SPAWN` with full HP. All flow is dialogue-`onClose`-driven.
10. **Movement** — grid-based: the player occupies a tile and tweens pixel
    position between tiles, with tap-to-turn. `onTileEntered()` collects notes
    first, then rolls wild BOT encounters on tall grass.
11. **Rendering (world/battle/cutscene)** — camera follows the player, clamped to
    map bounds. All art is procedural `fillRect` pixel-art (no image assets):
    `drawCharacter()` (player + NPCs from a palette), `drawNote()`, `drawBot()`,
    `drawRobot()`, `drawTodoPile()`. The battle screen has HP boxes and shake;
    the cutscene is a phase machine (`walkToBasket → pickup → walkToPile → drop`,
    ×5, then `done`) with a HUFF.../PUFF... bubble and letterbox bars.
12. **Game loop** — `requestAnimationFrame`; dispatches on `mode`.

## Conventions

- **No dependencies, no assets.** Everything is drawn in code; keep it that way.
  The only external resource is the optional "Press Start 2P" Google Font, which
  degrades to monospace offline.
- **Grid-first movement.** Positions are tile coordinates; pixel positions are
  derived. Never move the player by raw pixels outside the tween in `updatePlayer()`.
- **One interact function.** New features must hook into `interact()` (or a mode
  branch inside it), never add new key bindings. Touch buttons must go through
  the synthetic-KeyboardEvent bridge.
- **Content lives in data, not logic.** New notes/NPCs/signs go in the section-3
  data structures; the engine picks them up automatically.
- **Dialogue is paged.** Keep each page short enough to fit the box (~2 lines at
  12px). Battle text stays in Pokémon battle style ("A wild BOT appeared!").
- Match the existing code style: plain ES6+, `const` data tables, section banner
  comments, no classes/frameworks.

## Customizing the Portfolio

1. Replace the entries in `NOTES` with real projects (position + `text`).
2. Update `DIALOGUES.skillsSign`, `pondSign`, and `labDoor` with real skills,
   education, and experience.
3. Put real contact info in FISHER FINN's dialogue in `NPCS`.
4. Tune difficulty via `ENCOUNTER_CHANCE`, `PLAYER_MAX_HP`, `battle.enemyMax`,
   and the damage ranges in `chooseBattleOption()` / `enemyTurn()`.
