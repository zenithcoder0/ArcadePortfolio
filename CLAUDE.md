# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Project Overview

**Arcade Portfolio** is a 2D, Pokémon-style (Game Boy / GBA era) portfolio website.
The visitor explores a top-down tile world as a trainer, talks to NPCs, reads signs,
collects **NOTES** (project write-ups) lying on the ground, fights roaming **BOTS**
in real-time Zelda-style combat (they chase and lunge; punch with A, block with B),
and finally turns the notes in at the **INBOX basket**, triggering a cutscene where
a huffing-and-puffing robot files them onto a comically large TODO pile. All
portfolio content (projects, skills, experience, education, contact) is delivered
through in-game dialogue.

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
- **E** — the "A button", the single interact function (`interact()` in `game.js`);
  Space and Enter are aliases. It is context-sensitive like Zelda: talks to NPCs,
  reads signs/door/water/basket, advances dialogue, skips the cutscene — and
  **punches** when facing a BOT or nothing at all
- **X** — the "B button": **hold to block**. Not a press action — it is polled
  every frame in `updatePlayer()`. Blocking locks position/facing and only
  guards the direction the player faces; a blocked BOT strike staggers the BOT

**Touch devices** get an on-screen Game Boy controller (`#touch-controls` in
`index.html`). In **portrait** the page lays out like a vertical Game Boy (screen
on top, D-pad + A/B below). In **landscape** the buttons float translucently over
the screen edges. The buttons dispatch *synthetic `KeyboardEvent`s* with the same
key codes, so all input — touch or keyboard — flows through the same handlers.
Never wire a touch button to game logic directly; give it a `data-key` attribute.

## File Structure

| File         | Purpose                                                          |
|--------------|------------------------------------------------------------------|
| `index.html` | Page shell: canvas, HUD, dialogue box, touch pad                 |
| `styles.css` | GBA aesthetic + responsive controller layouts (portrait/landscape) |
| `game.js`    | The entire game engine and all portfolio content                 |

## Architecture (`game.js`)

A global `mode` switches the engine between `'world'` and `'cutscene'`; the game
loop picks the matching update + render path. The file is organized top-to-bottom
in sections, each marked with a `// ----------` banner:

1. **Configuration** — `TILE` (48px), viewport (15×10 tiles = 720×480 canvas),
   `WALK_SPEED`, `TURN_DELAY`, `PLAYER_MAX_HP`, and the combat tunables
   (`BOT_MAX_HP`, `AGGRO_RANGE`, bot speeds, `BOT_RESPAWN_FRAMES`,
   `PUNCH_FRAMES`, `INVULN_FRAMES`).
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
   `data-key` replay synthetic KeyboardEvents). The A button fires `interact()`
   on keydown; the B button (KeyX) is *polled* as a held key for blocking.
6. **Dialogue system** — Pokémon-style typewriter box (DOM, not canvas). Pages of
   text; first interact press reveals the page, next advances, last closes.
   `onClose` callbacks chain flows (respawn on defeat, the cutscene trigger).
7. **Interact** — the single dispatcher: dialogue → cutscene skip → world.
   In the world it is context-sensitive: BOT in front → punch, NPC → talk,
   sign/door/water/basket → dialogue, otherwise → punch air. Water refills HP.
8. **Notes & basket** — `collectNoteAt()` (walk-over pickup) and
   `interactBasket()` (turn-in; requires all notes, then starts the cutscene).
9. **Enemies & combat** — real-time, Zelda-style. Each BOT in `BOTS` is a state
   machine: idle/wander near `home` → chase when the player is within
   `AGGRO_RANGE` (grid steps, longer axis first) → `windup` (rattling telegraph)
   when adjacent → strike. A strike is negated when the player is blocking and
   facing the attacker (the BOT is `stagger`ed with dizzy stars); otherwise it
   deals damage with i-frames (`INVULN_FRAMES`). `punch()` damages the faced BOT,
   flashes and knocks it back a tile; at 0 HP it poofs and reboots at `home`
   after `BOT_RESPAWN_FRAMES`. Player defeat respawns at `SPAWN` with full HP.
   BOTs freeze while dialogue is open. Hit feedback lives in `effects`
   (`hit`/`clank`/`poof`), drawn by `drawEffects()`.
10. **Movement** — grid-based: the player occupies a tile and tweens pixel
    position between tiles, with tap-to-turn. Punching and blocking hold the
    player in place. `onTileEntered()` collects notes.
11. **Rendering (world/cutscene)** — camera follows the player, clamped to map
    bounds. All art is procedural `fillRect` pixel-art (no image assets):
    `drawCharacter()` (player + NPCs from a palette; punch fist and block guard
    poses via `opts`), `drawNote()`, `drawBot()` (hover, hurt flash, windup
    telegraph, damage pips), `drawRobot()`, `drawTodoPile()`. The cutscene is a
    phase machine (`walkToBasket → pickup → walkToPile → drop`, ×5, then `done`)
    with a HUFF.../PUFF... bubble and letterbox bars.
12. **Game loop** — `requestAnimationFrame`; dispatches on `mode`.

## Conventions

- **No dependencies, no assets.** Everything is drawn in code; keep it that way.
  The only external resource is the optional "Press Start 2P" Google Font, which
  degrades to monospace offline.
- **Grid-first movement.** Positions are tile coordinates; pixel positions are
  derived. Never move the player by raw pixels outside the tween in `updatePlayer()`.
- **One interact function.** New features must hook into `interact()` (or a mode
  branch inside it), never add new key bindings. The lone exception is the held
  B-button block, polled from `keys` in `updatePlayer()`. Touch buttons must go
  through the synthetic-KeyboardEvent bridge.
- **Content lives in data, not logic.** New notes/NPCs/signs go in the section-3
  data structures; the engine picks them up automatically.
- **Dialogue is paged.** Keep each page short enough to fit the box (~2 lines at
  12px). Combat gives feedback through canvas effects, not dialogue — never open
  a dialogue from a per-hit event.
- Match the existing code style: plain ES6+, `const` data tables, section banner
  comments, no classes/frameworks.

## Customizing the Portfolio

1. Replace the entries in `NOTES` with real projects (position + `text`).
2. Update `DIALOGUES.skillsSign`, `pondSign`, and `labDoor` with real skills,
   education, and experience.
3. Put real contact info in FISHER FINN's dialogue in `NPCS`.
4. Tune difficulty via `PLAYER_MAX_HP`, `BOT_MAX_HP`, `AGGRO_RANGE`, the bot
   speeds, and the damage roll in `resolveBotStrike()`. Add or move enemies by
   editing the home positions in the `BOTS` array (must be walkable tiles).
