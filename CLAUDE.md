# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Project Overview

**Arcade Portfolio** is a 2D, Pokémon-style (Game Boy / GBA era) portfolio website.
The visitor explores a top-down tile world as a trainer, talks to NPCs, reads signs,
and finds "wild PROJECT" encounters in the tall grass. All portfolio content
(projects, skills, experience, education, contact) is delivered through in-game
dialogue.

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

- **W / A / S / D** — move up / left / down / right (arrow keys work as aliases)
- **E** — the single interact function (`interact()` in `game.js`); Space and
  Enter are aliases for the same function
- Interact talks to NPCs, reads signs, opens doors, and advances/closes dialogue

All input funnels into exactly one interact function — new features must hook into
`interact()` rather than adding new key bindings.

## File Structure

| File         | Purpose                                                        |
|--------------|----------------------------------------------------------------|
| `index.html` | Page shell: canvas, HUD, dialogue box DOM, start screen        |
| `styles.css` | Pokémon/GBA aesthetic: console shell, dialogue box, HUD, fonts |
| `game.js`    | The entire game engine and all portfolio content               |

## Architecture (`game.js`)

The file is organized top-to-bottom in sections, each marked with a `// ----------`
banner comment:

1. **Configuration** — `TILE` (48px), viewport size (15×10 tiles = 720×480 canvas),
   `WALK_SPEED`, `TURN_DELAY`, `ENCOUNTER_CHANCE`.
2. **Tile map** — `MAP` is an array of 28-char strings, one char per tile.
   Legend: `T` tree, `G` grass, `t` tall grass, `P` path, `W` water, `F` flower,
   `S` sign, `R` roof, `H` wall, `D` door, `f` fence. Solids live in `SOLID_TILES`.
   **Every row must be exactly the same length.**
3. **Portfolio content** — `PROJECTS` (tall-grass encounters, Pokémon battle-text
   style), `DIALOGUES` (signs, door, flavor text), `NPCS` (position, palette,
   dialogue pages). This is the section to edit when personalizing the portfolio.
4. **Game state** — `state` (running, frame counter, projects found) and `player`
   (grid position + pixel position + facing/animation state).
5. **Input** — key handling; movement keys map through `KEY_TO_DIR`, interact keys
   call `interact()`.
6. **Dialogue system** — Pokémon-style typewriter box (DOM, not canvas). Pages of
   text; first interact press reveals the page, next press advances, last closes.
   Supports an `onClose` callback (used to chain the "all projects found" message).
7. **Interact** — `interact()` checks the tile the player faces and dispatches to
   NPC/sign/door/water/tall-grass handlers.
8. **Movement** — grid-based like the original games: the player occupies a tile
   (`col`,`row`) and tweens pixel position between tiles. Tap-to-turn: pressing a
   new direction turns the player first (`TURN_DELAY` frames) before walking.
   `onTileEntered()` rolls wild PROJECT encounters on tall grass.
9. **Rendering** — camera follows the player, clamped to map bounds. All art is
   procedural pixel-art drawn with `fillRect` (no image assets). `drawCharacter()`
   renders player and NPCs from a palette (`hat`, `shirt`, `pants`). Tall grass is
   redrawn over the player's legs when standing in it.
10. **Game loop** — `requestAnimationFrame`; update + render only while
    `state.running`.

## Conventions

- **No dependencies, no assets.** Everything is drawn in code; keep it that way.
  The only external resource is the optional "Press Start 2P" Google Font, which
  degrades to monospace offline.
- **Grid-first movement.** Positions are tile coordinates; pixel positions are
  derived. Never move the player by raw pixels outside the tween in `updatePlayer()`.
- **Content lives in data, not logic.** New projects/NPCs/signs should be added to
  the data structures in section 3; the engine picks them up automatically
  (NPCs render, collide, and talk based purely on their entry in `NPCS`).
- **Dialogue is paged.** Keep each page short enough to fit the box (~2 lines at
  12px). Write encounter text in Pokémon battle style ("A wild X appeared!").
- Match the existing code style: plain ES6+, `const` data tables, section banner
  comments, no classes/frameworks.

## Customizing the Portfolio

1. Replace the entries in `PROJECTS` with real projects (name + dialogue pages).
2. Update `DIALOGUES.skillsSign`, `pondSign`, and `labDoor` with real skills,
   education, and experience.
3. Put real contact info in FISHER FINN's dialogue in `NPCS`.
4. Update `ENCOUNTER_CHANCE` or the map's `t` patches to tune encounter pacing.
