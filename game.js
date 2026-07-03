// ============================================================
// ARCADE PORTFOLIO — a Pokemon-style top-down portfolio world
// Grid-based movement (WASD), single interact key (E),
// collectible NOTES on the ground, real-time Zelda-style
// combat vs roaming BOTS (A punches, hold B to block), and a
// note turn-in cutscene at the INBOX basket.
// ============================================================

// ---------- Configuration ----------
const TILE = 48;                 // rendered tile size in px
const VIEW_COLS = 15;            // viewport width in tiles  (720px)
const VIEW_ROWS = 10;            // viewport height in tiles (480px)
const WALK_SPEED = 4;            // px per frame (48/4 = 12 frames per tile)
const TURN_DELAY = 6;            // frames of "tap to turn" before walking
const PLAYER_MAX_HP = 20;

const BOT_MAX_HP = 3;            // punches needed to down a BOT
const AGGRO_RANGE = 5;           // manhattan tiles before a BOT gives chase
const BOT_CHASE_SPEED = 3;       // px per frame while chasing (48/3 = 16)
const BOT_WANDER_SPEED = 2;      // px per frame while idle   (48/2 = 24)
const BOT_KNOCK_SPEED = 6;       // px per frame when punched (48/6 = 8)
const BOT_RESPAWN_FRAMES = 900;  // ~15s until a downed BOT reboots
const PUNCH_FRAMES = 12;         // punch animation / cooldown
const INVULN_FRAMES = 55;        // player i-frames after taking a hit

// ---------- Canvas ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ---------- Tile map ----------
// Legend: T tree | G grass | t tall grass | P path | W water
//         F flower | S sign | R roof | H wall | D door | f fence
//         B the INBOX basket (note turn-in point)
const MAP = [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TGGGGGGGGGGGGGGGGGGGGGGGGGGT',
    'TGRRRRRGGGGGGGGGGGttttttGGGT',
    'TGRRRRRGGFFGGGGGGGttttttGGGT',
    'TGHHHHHGGFFGGGGGGGttttttGGGT',
    'TGHHDHHGSGGGGGGGGGttttttGGGT',
    'TGGGPGBGGGGGGGGGGGGGGPGGGGGT',
    'TGGGPPPPPPPPPPPPPPPPPPGGGGGT',
    'TGGGGGGGGGGGGPGGGGGGGGGGGGGT',
    'TGffffffGGGGGPGGGGGGGGSGGGGT',
    'TGGGGGGfGGGGGPGGGGGGWWWWGGGT',
    'TGFFGGGfGGGGGPGGGGGWWWWWWGGT',
    'TGFFGGGfGGGGGPGGGGGWWWWWWGGT',
    'TGGGGGGfGGGGGPGGGGGGWWWWGGGT',
    'TGGGGGGGGGGGGPGGGGGGGGGGGGGT',
    'TGGttttGGGGGGPGGSGGGGGGGGGGT',
    'TGGttttGGGGGGPPPPGGGGGGGGGGT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT'
];
const MAP_ROWS = MAP.length;
const MAP_COLS = MAP[0].length;

const SOLID_TILES = new Set(['T', 'W', 'S', 'R', 'H', 'D', 'f', 'B']);

function tileAt(col, row) {
    if (col < 0 || row < 0 || col >= MAP_COLS || row >= MAP_ROWS) return 'T';
    return MAP[row][col];
}

// ---------- Portfolio content ----------
// NOTES lie visibly on the ground; walking onto one picks it up.
const NOTES = [
    {
        col: 2, row: 6, collected: false, name: 'AI TASK MANAGER',
        text: 'AI TASK MANAGER — a smart task app that predicts completion times. React, Python, TensorFlow, PostgreSQL.'
    },
    {
        col: 25, row: 3, collected: false, name: 'COLLAB PLATFORM',
        text: 'COLLAB PLATFORM — real-time document collaboration over WebRTC, 10k+ concurrent users. Node.js, Socket.io, Redis.'
    },
    {
        col: 17, row: 13, collected: false, name: 'ANALYTICS DASH',
        text: 'ANALYTICS DASH — e-commerce dashboard crunching millions of transactions live. Vue.js, D3.js, Express, MongoDB.'
    },
    {
        col: 10, row: 14, collected: false, name: 'FITNESS TRACKER',
        text: 'FITNESS TRACKER — cross-platform mobile app with AI workout coaching. React Native, Firebase, TensorFlow Lite.'
    },
    {
        col: 8, row: 15, collected: false, name: 'SUPPLY CHAIN',
        text: 'SUPPLY CHAIN — decentralized supply-chain tracker for transparency. Solidity, Ethereum, Web3.js, IPFS.'
    }
];

const DIALOGUES = {
    welcomeSign: [
        'WELCOME TO PORTFOLIO TOWN!',
        'Five NOTES about my projects blew away and are scattered on the ground.',
        'Collect them all and drop them in the INBOX basket by the DEV LAB, up north.',
        'CAUTION: wild BOTS roam the fields and WILL come at you. PUNCH (A) or BLOCK (B)!'
    ],
    skillsSign: [
        'DEV LAB — TECHNICAL SKILLS',
        'LANGUAGES: JavaScript, TypeScript, Python, Java, C++.',
        'FRAMEWORKS: React, Vue, Node.js, Django, Flask.',
        'DATA: PostgreSQL, MongoDB, Redis. DEVOPS: Docker, Kubernetes, AWS.'
    ],
    pondSign: [
        'QUIET POND — EDUCATION & CERTS',
        'B.S. COMPUTER SCIENCE, University of Technology. GPA 3.9/4.0.',
        'BADGES EARNED: AWS Solutions Architect, GCP Professional, CKA.'
    ],
    labDoor: [
        'The DEV LAB. It smells like coffee and merge conflicts.',
        'WORK EXPERIENCE — SENIOR FULL-STACK DEV (2021-now): led a team of 5, cut API response times by 60%.',
        'SOFTWARE ENGINEER (2019-2021): shipped apps serving 100k+ users and mentored juniors.',
        '...the door is locked. The real experience is on the resume.'
    ],
    water: [
        'You splash cool pond water on your face.',
        'HP fully restored!'
    ],
    allNotes: [
        'That was the last NOTE!',
        'Take all 5 to the INBOX basket next to the DEV LAB.'
    ],
    basketDone: [
        'The robot is busy filing. The TODO pile teeters ominously overhead.',
        'Get in touch before it reaches the stratosphere — FISHER FINN has the contact info.'
    ],
    defeated: [
        'The BOTS debugged YOU for a change!',
        'You wake up back at the town square, fully patched and mildly embarrassed.'
    ]
};

const NPCS = [
    {
        name: 'PROF. CEDAR', col: 15, row: 8, facing: 'down',
        palette: { hat: '#7a5230', shirt: '#e8e8e8', pants: '#8b6f47' },
        pages: [
            'PROF. CEDAR: Hello there! Welcome to PORTFOLIO TOWN!',
            'A gust of wind scattered 5 project NOTES all over town. Look for paper on the ground!',
            'When you have them all, drop them in the INBOX basket by my DEV LAB. My robot will handle the rest... it always does.'
        ]
    },
    {
        name: 'RECRUITER ROY', col: 20, row: 6, facing: 'down',
        palette: { hat: '#2b50aa', shirt: '#2b50aa', pants: '#333344' },
        pages: [
            'RECRUITER ROY: Hey! You look like you can read a resume!',
            'Watch yourself out there — wild BOTS charge right at you these days. Rude little things.',
            'PUNCH them with A before they strike, or hold B and face them to BLOCK. Blocking a hit leaves them dizzy!'
        ]
    },
    {
        name: 'FISHER FINN', col: 18, row: 11, facing: 'right',
        palette: { hat: '#3a7d44', shirt: '#c9a227', pants: '#4a4a58' },
        pages: [
            'FISHER FINN: I have been fishing here for hours. All I catch are edge cases.',
            'Want to reach the developer? EMAIL: your.email@example.com',
            'Also on LINKEDIN and GITHUB. Old rod not required.'
        ]
    },
    {
        name: 'GRANDMA MAY', col: 3, row: 13, facing: 'down',
        palette: { hat: '#b8b8c8', shirt: '#a85ca8', pants: '#6a5a7a' },
        pages: [
            'GRANDMA MAY: These flowers? Grown with CSS and patience, dear.',
            'A BOT charged me once. I blocked it with my handbag and it sat down dizzy for a week.'
        ]
    }
];

// ---------- Game state ----------
// mode: 'world' | 'cutscene'
let mode = 'world';

const state = {
    running: false,
    frame: 0,
    notesFound: 0,
    turnedIn: false,
    hp: PLAYER_MAX_HP
};

const SPAWN = { col: 13, row: 14 };

const player = {
    col: SPAWN.col, row: SPAWN.row,          // grid position
    x: SPAWN.col * TILE, y: SPAWN.row * TILE, // pixel position
    facing: 'up',
    moving: false,
    moveDir: null,
    turnTimer: 0,
    punchTimer: 0,   // frames left in the punch animation (also the cooldown)
    blocking: false, // true while B (KeyX) is held
    invuln: 0,       // i-frames after taking a hit
    palette: { hat: '#d83030', shirt: '#3050c8', pants: '#404060' }
};

const DIRS = {
    up:    { dx: 0, dy: -1 },
    down:  { dx: 0, dy: 1 },
    left:  { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 }
};

const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

function vecToDir(dx, dy) {
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
    return dy >= 0 ? 'down' : 'up';
}

const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

const hudEl = document.getElementById('hud');

// DOM lookups are null-safe so a stale cached index.html (missing newer
// elements) can never crash the game into a blank screen.
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// The HUD belongs to the overworld; the cutscene draws its own UI
function setHudVisible(visible) {
    if (hudEl) hudEl.style.display = visible ? 'flex' : 'none';
}

function updateHud() {
    setText('notes-collected', state.notesFound);
    setText('total-notes', NOTES.length);
    setText('hp-current', state.hp);
    setText('hp-max', PLAYER_MAX_HP);
}

// ---------- Input ----------
const keys = {};
const KEY_TO_DIR = { KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
                     ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
    if (e.repeat) return;
    keys[e.code] = true;

    if (!state.running) {
        if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') startGame();
        return;
    }
    // The A button: single interact function, mapped to E (Space/Enter alias).
    // Context-sensitive like Zelda — talks/reads when facing something,
    // punches otherwise. The B button (KeyX) is the held block, polled
    // per-frame in updatePlayer rather than handled as a press.
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
        interact();
    }
});

window.addEventListener('keyup', (e) => { keys[e.code] = false; });

function heldDirection() {
    for (const code of Object.keys(KEY_TO_DIR)) {
        if (keys[code]) return KEY_TO_DIR[code];
    }
    return null;
}

// On-screen Game Boy controller: buttons replay the exact same key events,
// so touch input flows through the same handlers (A taps punch/talk, holding
// B blocks — pointerdown/up map to keydown/up).
document.querySelectorAll('#touch-controls [data-key]').forEach((btn) => {
    const code = btn.dataset.key;
    const press = (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        window.dispatchEvent(new KeyboardEvent('keydown', { code }));
    };
    const release = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        window.dispatchEvent(new KeyboardEvent('keyup', { code }));
    };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
});

// ---------- Dialogue system (Pokemon-style typewriter box) ----------
const dialogue = {
    open: false,
    pages: [],
    pageIndex: 0,
    charIndex: 0,
    typing: false,
    onClose: null
};
const dialogueBox = document.getElementById('dialogue-box');
const dialogueText = document.getElementById('dialogue-text');
const dialogueArrow = document.getElementById('dialogue-arrow');

function openDialogue(pages, onClose) {
    dialogue.open = true;
    dialogue.pages = pages;
    dialogue.pageIndex = 0;
    dialogue.charIndex = 0;
    dialogue.typing = true;
    dialogue.onClose = onClose || null;
    dialogueBox.classList.remove('hidden');
    dialogueArrow.classList.add('hidden');
    dialogueText.textContent = '';
}

function closeDialogue() {
    dialogue.open = false;
    dialogueBox.classList.add('hidden');
    if (dialogue.onClose) {
        const cb = dialogue.onClose;
        dialogue.onClose = null;
        cb();
    }
}

function updateDialogue() {
    if (!dialogue.open || !dialogue.typing) return;
    // Two characters per frame keeps the classic typewriter pace
    dialogue.charIndex = Math.min(dialogue.charIndex + 2, dialogue.pages[dialogue.pageIndex].length);
    dialogueText.textContent = dialogue.pages[dialogue.pageIndex].slice(0, dialogue.charIndex);
    if (dialogue.charIndex >= dialogue.pages[dialogue.pageIndex].length) {
        dialogue.typing = false;
        dialogueArrow.classList.remove('hidden');
    }
}

function advanceDialogue() {
    const page = dialogue.pages[dialogue.pageIndex];
    if (dialogue.typing) {
        // First press: reveal the whole page instantly
        dialogue.charIndex = page.length;
        dialogueText.textContent = page;
        dialogue.typing = false;
        dialogueArrow.classList.remove('hidden');
    } else if (dialogue.pageIndex < dialogue.pages.length - 1) {
        dialogue.pageIndex++;
        dialogue.charIndex = 0;
        dialogue.typing = true;
        dialogueText.textContent = '';
        dialogueArrow.classList.add('hidden');
    } else {
        closeDialogue();
    }
}

// ---------- The single interact function ----------
// Every A-button press lands here, whatever the game mode. In the world it
// is context-sensitive: talk/read when facing something, punch otherwise.
function interact() {
    if (dialogue.open) {
        advanceDialogue();
        return;
    }
    if (mode === 'cutscene') {
        skipCutscene();
        return;
    }
    if (mode !== 'world' || player.moving || player.punchTimer > 0) return;

    const dir = DIRS[player.facing];
    const col = player.col + dir.dx;
    const row = player.row + dir.dy;

    // A BOT in front takes priority — swing first, read signs later
    if (botAt(col, row)) {
        punch();
        return;
    }

    // NPCs turn to face you when spoken to
    const npc = NPCS.find(n => n.col === col && n.row === row);
    if (npc) {
        npc.facing = OPPOSITE[player.facing];
        openDialogue(npc.pages);
        return;
    }

    const tile = tileAt(col, row);
    if (tile === 'S') {
        openDialogue(signDialogue(col, row));
    } else if (tile === 'D') {
        openDialogue(DIALOGUES.labDoor);
    } else if (tile === 'W') {
        openDialogue(DIALOGUES.water, () => { state.hp = PLAYER_MAX_HP; updateHud(); });
    } else if (tile === 'B') {
        interactBasket();
    } else {
        punch(); // nothing to talk to — the A button throws hands
    }
}

function signDialogue(col, row) {
    if (col === 8 && row === 5) return DIALOGUES.skillsSign;
    if (col === 22 && row === 9) return DIALOGUES.pondSign;
    return DIALOGUES.welcomeSign;
}

// ---------- Notes & the INBOX basket ----------
function collectNoteAt(col, row) {
    const note = NOTES.find(n => !n.collected && n.col === col && n.row === row);
    if (!note) return false;
    note.collected = true;
    state.notesFound++;
    updateHud();
    const pages = [
        'You picked a NOTE up off the ground!',
        `It reads: "${note.text}"`,
        `(${state.notesFound}/${NOTES.length} notes collected)`
    ];
    if (state.notesFound === NOTES.length) pages.push(...DIALOGUES.allNotes);
    openDialogue(pages);
    return true;
}

function interactBasket() {
    if (state.turnedIn) {
        openDialogue(DIALOGUES.basketDone);
    } else if (state.notesFound < NOTES.length) {
        openDialogue([
            `The INBOX basket. A label says: "NOTES GO HERE. ALL ${NOTES.length} OF THEM."`,
            `You have ${state.notesFound}/${NOTES.length}. Keep looking!`
        ]);
    } else {
        openDialogue([
            'You drop all 5 NOTES into the INBOX basket!',
            'Somewhere inside the DEV LAB, a motor whirs to life...',
            'A delivery ROBOT rolls out. It eyes the basket. It sighs in binary.'
        ], startCutscene);
    }
}

// ---------- Enemies: wild BOTS (Zelda-style real-time) ----------
// State machine per BOT: idle/wander -> chase (player in AGGRO_RANGE) ->
// windup (telegraphed lunge when adjacent) -> strike. Punches knock them
// back; a blocked strike leaves them staggered; at 0 HP they power down
// and reboot at home a while later.
function makeBot(home) {
    return {
        home,
        col: home.col, row: home.row,
        x: home.col * TILE, y: home.row * TILE,
        facing: 'down',
        moving: false, moveDir: 'down', speed: BOT_WANDER_SPEED,
        hp: BOT_MAX_HP,
        state: 'idle',       // idle | windup | stagger | dead
        timer: 0,
        cooldown: 0,         // frames until it may attack again
        wanderTimer: rand(40, 120),
        flash: 0,            // hurt flash frames
        respawnTimer: 0
    };
}

const BOTS = [
    { col: 20, row: 3 },   // NE tall grass
    { col: 21, row: 4 },   // NE tall grass
    { col: 9,  row: 10 },  // west fields
    { col: 4,  row: 15 },  // south tall grass
    { col: 24, row: 14 }   // east of the pond
].map(makeBot);

function botAt(col, row) {
    return BOTS.find(b => b.state !== 'dead' && b.col === col && b.row === row) || null;
}

function botTryStep(bot, dir, speed) {
    bot.facing = dir;
    const d = DIRS[dir];
    const c = bot.col + d.dx;
    const r = bot.row + d.dy;
    if (!isWalkable(c, r)) return false;
    if (c === player.col && r === player.row) return false;
    if (BOTS.some(o => o !== bot && o.state !== 'dead' && o.col === c && o.row === r)) return false;
    bot.col = c;
    bot.row = r;
    bot.moveDir = dir;
    bot.moving = true;
    bot.speed = speed;
    return true;
}

function updateBot(bot) {
    if (bot.flash > 0) bot.flash--;
    if (bot.cooldown > 0) bot.cooldown--;

    if (bot.state === 'dead') {
        if (--bot.respawnTimer <= 0 && isWalkable(bot.home.col, bot.home.row) &&
            !(bot.home.col === player.col && bot.home.row === player.row) &&
            !botAt(bot.home.col, bot.home.row)) {
            Object.assign(bot, makeBot(bot.home));
        }
        return;
    }

    if (bot.state === 'stagger') {
        if (--bot.timer <= 0) bot.state = 'idle';
        return;
    }

    if (bot.state === 'windup') {
        if (--bot.timer <= 0) {
            resolveBotStrike(bot);
            bot.cooldown = 70;
            if (bot.state === 'windup') bot.state = 'idle';
        }
        return;
    }

    // finish the current tween first
    if (bot.moving) {
        const d = DIRS[bot.moveDir];
        bot.x += d.dx * bot.speed;
        bot.y += d.dy * bot.speed;
        if (bot.x === bot.col * TILE && bot.y === bot.row * TILE) bot.moving = false;
        return;
    }

    const dx = player.col - bot.col;
    const dy = player.row - bot.row;
    const dist = Math.abs(dx) + Math.abs(dy);

    // adjacent: square up and telegraph a strike
    if (dist === 1) {
        bot.facing = vecToDir(dx, dy);
        if (bot.cooldown <= 0) {
            bot.state = 'windup';
            bot.timer = 24;
        }
        return;
    }

    // in range: chase, preferring the longer axis
    if (dist <= AGGRO_RANGE) {
        const horiz = dx > 0 ? 'right' : 'left';
        const vert = dy > 0 ? 'down' : 'up';
        const primary = Math.abs(dx) >= Math.abs(dy) ? horiz : vert;
        const secondary = Math.abs(dx) >= Math.abs(dy)
            ? (dy !== 0 ? vert : null)
            : (dx !== 0 ? horiz : null);
        if (!botTryStep(bot, primary, BOT_CHASE_SPEED) && secondary) {
            botTryStep(bot, secondary, BOT_CHASE_SPEED);
        }
        return;
    }

    // calm: wander, drifting back toward home
    if (--bot.wanderTimer <= 0) {
        bot.wanderTimer = rand(60, 150);
        const homeDx = bot.home.col - bot.col;
        const homeDy = bot.home.row - bot.row;
        if (Math.abs(homeDx) + Math.abs(homeDy) > 3) {
            botTryStep(bot, vecToDir(homeDx, homeDy), BOT_WANDER_SPEED);
            return;
        }
        const dir = ['up', 'down', 'left', 'right'][rand(0, 3)];
        const d = DIRS[dir];
        const nearHome = Math.abs(bot.col + d.dx - bot.home.col) + Math.abs(bot.row + d.dy - bot.home.row) <= 3;
        if (nearHome) botTryStep(bot, dir, BOT_WANDER_SPEED);
        else bot.facing = dir;
    }
}

function resolveBotStrike(bot) {
    const dx = player.col - bot.col;
    const dy = player.row - bot.row;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return; // player slipped away — whiff

    const dirToBot = vecToDir(-dx, -dy); // from the player toward the bot
    const midX = (player.x + bot.x) / 2 + TILE / 2;
    const midY = (player.y + bot.y) / 2 + TILE / 2;

    if (player.blocking && player.facing === dirToBot) {
        // Blocked! The BOT bounces off, dizzy.
        addEffect('clank', midX, midY);
        bot.state = 'stagger';
        bot.timer = 55;
    } else {
        addEffect('hit', midX, midY);
        damagePlayer(rand(2, 3));
    }
}

// ---------- Combat: punch & damage ----------
function punch() {
    player.punchTimer = PUNCH_FRAMES;
    const dir = DIRS[player.facing];
    const col = player.col + dir.dx;
    const row = player.row + dir.dy;
    const bot = botAt(col, row);
    if (!bot) return; // swung at air — very cardio

    bot.hp--;
    bot.flash = 10;
    addEffect('hit', col * TILE + TILE / 2, row * TILE + TILE / 2);

    if (bot.hp <= 0) {
        bot.state = 'dead';
        bot.moving = false;
        bot.respawnTimer = BOT_RESPAWN_FRAMES;
        addEffect('poof', col * TILE + TILE / 2, row * TILE + TILE / 2);
        return;
    }

    // survivors get knocked back a tile (if there is room) and briefly reel
    bot.state = 'idle';
    bot.timer = 0;
    bot.cooldown = Math.max(bot.cooldown, 40);
    const kc = col + dir.dx;
    const kr = row + dir.dy;
    if (isWalkable(kc, kr) && !(kc === player.col && kr === player.row) && !botAt(kc, kr)) {
        bot.col = kc;
        bot.row = kr;
        bot.moveDir = player.facing;
        bot.moving = true;
        bot.speed = BOT_KNOCK_SPEED;
    }
    bot.facing = OPPOSITE[player.facing]; // it still glares at you
}

function damagePlayer(dmg) {
    if (player.invuln > 0 || mode !== 'world') return;
    state.hp = Math.max(0, state.hp - dmg);
    player.invuln = INVULN_FRAMES;
    updateHud();
    if (state.hp <= 0) {
        openDialogue(DIALOGUES.defeated, () => {
            state.hp = PLAYER_MAX_HP;
            player.col = SPAWN.col;
            player.row = SPAWN.row;
            player.x = SPAWN.col * TILE;
            player.y = SPAWN.row * TILE;
            player.moving = false;
            player.invuln = INVULN_FRAMES;
            updateHud();
        });
    }
}

// ---------- Hit effects (sparks, clanks, poofs) ----------
const effects = [];

function addEffect(type, x, y) {
    effects.push({ type, x, y, timer: type === 'poof' ? 24 : 14, max: type === 'poof' ? 24 : 14 });
}

function drawEffects(camX, camY) {
    for (let i = effects.length - 1; i >= 0; i--) {
        const fx = effects[i];
        const x = fx.x - camX;
        const y = fx.y - camY;
        const p = 1 - fx.timer / fx.max; // 0 -> 1 over the effect's life
        if (fx.type === 'hit') {
            const r = 4 + p * 14;
            ctx.fillStyle = '#f5d442';
            ctx.fillRect(x - r, y - 2, r * 2, 4);
            ctx.fillRect(x - 2, y - r, 4, r * 2);
            ctx.fillStyle = '#fff';
            ctx.fillRect(x - 4, y - 4, 8, 8);
        } else if (fx.type === 'clank') {
            const r = 6 + p * 12;
            ctx.strokeStyle = '#9ad0ff';
            ctx.lineWidth = 3;
            ctx.strokeRect(x - r, y - r, r * 2, r * 2);
            ctx.fillStyle = '#fff';
            ctx.fillRect(x - 3, y - 3, 6, 6);
        } else if (fx.type === 'poof') {
            const r = 4 + p * 10;
            ctx.fillStyle = `rgba(180, 180, 190, ${1 - p})`;
            ctx.fillRect(x - r - 8, y - r, r, r);
            ctx.fillRect(x + 8, y - r, r, r);
            ctx.fillRect(x - r / 2, y - r - 8, r, r);
            ctx.fillRect(x - r / 2, y + 6, r, r);
        }
        if (--fx.timer <= 0) effects.splice(i, 1);
    }
}

// ---------- Movement ----------
function isWalkable(col, row) {
    if (SOLID_TILES.has(tileAt(col, row))) return false;
    if (NPCS.some(n => n.col === col && n.row === row)) return false;
    return true;
}

function updatePlayer() {
    if (player.invuln > 0) player.invuln--;
    if (dialogue.open) { player.blocking = false; return; }

    if (player.moving) {
        const dir = DIRS[player.moveDir];
        player.x += dir.dx * WALK_SPEED;
        player.y += dir.dy * WALK_SPEED;
        const targetX = player.col * TILE;
        const targetY = player.row * TILE;
        if (player.x === targetX && player.y === targetY) {
            player.moving = false;
            onTileEntered();
        }
        return;
    }

    if (player.punchTimer > 0) { player.punchTimer--; return; }

    // Hold B to raise your guard: locks facing and position, Zelda-style
    player.blocking = !!keys['KeyX'];
    if (player.blocking) { player.turnTimer = 0; return; }

    const dir = heldDirection();
    if (!dir) { player.turnTimer = 0; return; }

    if (dir !== player.facing) {
        // Pokemon-style tap-to-turn: face the direction first
        player.facing = dir;
        player.turnTimer = TURN_DELAY;
        return;
    }
    if (player.turnTimer > 0) { player.turnTimer--; return; }

    const d = DIRS[dir];
    const nc = player.col + d.dx;
    const nr = player.row + d.dy;
    if (isWalkable(nc, nr) && !botAt(nc, nr)) {
        player.col = nc;
        player.row = nr;
        player.moveDir = dir;
        player.moving = true;
    }
}

function onTileEntered() {
    collectNoteAt(player.col, player.row);
}

// ---------- Cutscene: the robot and the comically large TODO pile ----------
const cutscene = {
    t: 0,
    phase: 'walkToBasket', // walkToBasket | pickup | walkToPile | drop | done
    timer: 0,
    delivered: 0,
    robotX: 0,
    carrying: false
};

const SCENE = {
    groundY: 400,
    basketX: 110,
    pileX: 545,
    robotStopBasket: 175,
    robotStopPile: 470
};

function startCutscene() {
    mode = 'cutscene';
    setHudVisible(false);
    cutscene.t = 0;
    cutscene.phase = 'walkToBasket';
    cutscene.timer = 0;
    cutscene.delivered = 0;
    cutscene.robotX = SCENE.robotStopPile;
    cutscene.carrying = false;
}

function skipCutscene() {
    if (cutscene.phase === 'done') return;
    cutscene.delivered = NOTES.length;
    cutscene.carrying = false;
    cutscene.robotX = SCENE.robotStopPile;
    cutscene.phase = 'done';
    cutscene.timer = 60;
}

function updateCutscene() {
    cutscene.t++;
    const c = cutscene;
    switch (c.phase) {
        case 'walkToBasket':
            c.robotX -= 2.5;
            if (c.robotX <= SCENE.robotStopBasket) { c.phase = 'pickup'; c.timer = 45; }
            break;
        case 'pickup':
            if (--c.timer <= 0) { c.carrying = true; c.phase = 'walkToPile'; }
            break;
        case 'walkToPile':
            c.robotX += 2.5;
            if (c.robotX >= SCENE.robotStopPile) {
                c.carrying = false;
                c.delivered++;
                c.phase = 'drop';
                c.timer = 40;
            }
            break;
        case 'drop':
            if (--c.timer <= 0) {
                if (c.delivered < NOTES.length) {
                    c.phase = 'walkToBasket';
                } else {
                    c.phase = 'done';
                    c.timer = 110;
                }
            }
            break;
        case 'done':
            if (--c.timer <= 0) {
                state.turnedIn = true;
                mode = 'world';
                setHudVisible(true);
                openDialogue([
                    'ROBOT: BEEP. 5 NOTES FILED UNDER "TODO: EVENTUALLY".',
                    'The TODO pile is now visible from space. The robot seems... proud?',
                    'Thanks for exploring my portfolio! Talk to FISHER FINN to get in touch.',
                    'THE END. (The pile, however, is never finished.)'
                ]);
            }
            break;
    }
}

// ---------- Rendering: world ----------
function camera() {
    let cx = player.x + TILE / 2 - (VIEW_COLS * TILE) / 2;
    let cy = player.y + TILE / 2 - (VIEW_ROWS * TILE) / 2;
    cx = Math.max(0, Math.min(cx, MAP_COLS * TILE - VIEW_COLS * TILE));
    cy = Math.max(0, Math.min(cy, MAP_ROWS * TILE - VIEW_ROWS * TILE));
    return { x: Math.round(cx), y: Math.round(cy) };
}

function drawTile(tile, x, y, col, row) {
    const t = state.frame;
    switch (tile) {
        case 'G': drawGrass(x, y, col, row); break;
        case 'P': drawPath(x, y, col, row); break;
        case 't': drawGrass(x, y, col, row); drawTallGrass(x, y, t); break;
        case 'F': drawGrass(x, y, col, row); drawFlower(x, y, col, row, t); break;
        case 'T': drawGrass(x, y, col, row); drawTree(x, y); break;
        case 'W': drawWater(x, y, col, row, t); break;
        case 'S': drawGrass(x, y, col, row); drawSign(x, y); break;
        case 'f': drawGrass(x, y, col, row); drawFence(x, y); break;
        case 'R': drawRoof(x, y, col, row); break;
        case 'H': drawWall(x, y); break;
        case 'D': drawWall(x, y); drawDoor(x, y); break;
        case 'B': drawGrass(x, y, col, row); drawBasket(x, y); break;
    }
}

function drawGrass(x, y, col, row) {
    ctx.fillStyle = (col + row) % 2 === 0 ? '#8cc63f' : '#83bd39';
    ctx.fillRect(x, y, TILE, TILE);
    // sparse mowed-grass ticks, stable per tile
    if ((col * 7 + row * 13) % 5 === 0) {
        ctx.fillStyle = '#79b132';
        ctx.fillRect(x + 12, y + 15, 6, 3);
        ctx.fillRect(x + 30, y + 33, 6, 3);
    }
}

function drawPath(x, y, col, row) {
    ctx.fillStyle = '#e0c48c';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = '#d4b578';
    if ((col * 5 + row * 11) % 3 === 0) {
        ctx.fillRect(x + 9, y + 12, 6, 6);
        ctx.fillRect(x + 30, y + 30, 6, 6);
    }
}

function drawTallGrass(x, y, t) {
    const sway = Math.floor(t / 30) % 2 === 0 ? 0 : 2;
    ctx.fillStyle = '#4e9a2e';
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
            const bx = x + 4 + i * 15 + (j % 2 ? sway : -sway);
            const by = y + 6 + j * 21;
            ctx.beginPath();
            ctx.moveTo(bx, by + 18);
            ctx.lineTo(bx + 6, by);
            ctx.lineTo(bx + 12, by + 18);
            ctx.closePath();
            ctx.fill();
        }
    }
}

function drawFlower(x, y, col, row, t) {
    const sway = Math.floor(t / 40) % 2 === 0 ? 0 : 1;
    const color = (col + row) % 2 === 0 ? '#e84545' : '#f5d442';
    ctx.fillStyle = '#3e7a24';
    ctx.fillRect(x + 21, y + 24, 4, 14);
    ctx.fillStyle = color;
    ctx.fillRect(x + 15 + sway, y + 14, 7, 7);
    ctx.fillRect(x + 25 + sway, y + 14, 7, 7);
    ctx.fillRect(x + 20 + sway, y + 9, 7, 7);
    ctx.fillRect(x + 20 + sway, y + 19, 7, 7);
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(x + 21 + sway, y + 15, 5, 5);
}

function drawTree(x, y) {
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(x + 18, y + 30, 12, 16);
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(x + 4, y + 12, 40, 22);
    ctx.fillRect(x + 10, y + 2, 28, 14);
    ctx.fillStyle = '#3c9440';
    ctx.fillRect(x + 8, y + 14, 14, 8);
    ctx.fillRect(x + 14, y + 5, 12, 6);
}

function drawWater(x, y, col, row, t) {
    ctx.fillStyle = '#4a90d9';
    ctx.fillRect(x, y, TILE, TILE);
    const phase = Math.floor(t / 25 + col + row) % 3;
    ctx.fillStyle = '#6fb0ec';
    if (phase === 0) {
        ctx.fillRect(x + 8, y + 12, 14, 3);
        ctx.fillRect(x + 26, y + 32, 14, 3);
    } else if (phase === 1) {
        ctx.fillRect(x + 26, y + 12, 14, 3);
        ctx.fillRect(x + 8, y + 32, 14, 3);
    }
}

function drawSign(x, y) {
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(x + 21, y + 26, 6, 16);
    ctx.fillStyle = '#a8763e';
    ctx.fillRect(x + 8, y + 8, 32, 20);
    ctx.strokeStyle = '#6b4423';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 9, y + 9, 30, 18);
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(x + 13, y + 14, 22, 2);
    ctx.fillRect(x + 13, y + 20, 22, 2);
}

function drawFence(x, y) {
    ctx.fillStyle = '#b98a52';
    ctx.fillRect(x + 6, y + 12, 8, 26);
    ctx.fillRect(x + 34, y + 12, 8, 26);
    ctx.fillRect(x, y + 18, TILE, 6);
    ctx.fillStyle = '#9a6f3e';
    ctx.fillRect(x + 6, y + 12, 8, 4);
    ctx.fillRect(x + 34, y + 12, 8, 4);
}

function drawRoof(x, y, col, row) {
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = '#a93226';
    ctx.fillRect(x, y + (row % 2 === 0 ? 20 : 44), TILE, 4);
    ctx.fillRect(x + (col % 2 === 0 ? 22 : 0), y, 4, TILE);
}

function drawWall(x, y) {
    ctx.fillStyle = '#efe3c1';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = '#d9c99a';
    ctx.fillRect(x, y + 22, TILE, 4);
    ctx.fillRect(x + 22, y, 4, 22);
}

function drawDoor(x, y) {
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(x + 8, y + 8, 32, 40);
    ctx.fillStyle = '#87582e';
    ctx.fillRect(x + 12, y + 12, 24, 36);
    ctx.fillStyle = '#f5d442';
    ctx.fillRect(x + 30, y + 28, 4, 4);
}

function drawBasket(x, y) {
    // wicker basket with papers poking out
    ctx.fillStyle = '#a8763e';
    ctx.fillRect(x + 8, y + 20, 32, 22);
    ctx.fillStyle = '#8a5c2e';
    ctx.fillRect(x + 8, y + 26, 32, 3);
    ctx.fillRect(x + 8, y + 34, 32, 3);
    ctx.fillRect(x + 8, y + 20, 3, 22);
    ctx.fillRect(x + 37, y + 20, 3, 22);
    ctx.fillStyle = '#f8f8f0';
    ctx.fillRect(x + 14, y + 12, 9, 10);
    ctx.fillRect(x + 26, y + 10, 9, 12);
    ctx.fillStyle = '#c8c8c0';
    ctx.fillRect(x + 16, y + 15, 5, 1);
    ctx.fillRect(x + 28, y + 14, 5, 1);
}

// A note lying on the ground, with a little sparkle so it reads as a pickup
function drawNote(x, y, t) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(x + 13, y + 30, 24, 4);
    ctx.save();
    ctx.translate(x + 24, y + 22);
    ctx.rotate(-0.12);
    ctx.fillStyle = '#f8f8f0';
    ctx.fillRect(-11, -8, 22, 16);
    ctx.fillStyle = '#d8d8d0';
    ctx.fillRect(7, -8, 4, 4); // folded corner
    ctx.fillStyle = '#8890a8';
    ctx.fillRect(-7, -4, 14, 2);
    ctx.fillRect(-7, 0, 11, 2);
    ctx.fillRect(-7, 4, 13, 2);
    ctx.restore();
    if (Math.floor(t / 25) % 4 === 0) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 36, y + 6, 3, 3);
        ctx.fillRect(x + 8, y + 14, 2, 2);
    }
}

// The roaming BOT enemy, pixel style, one tile big.
function drawBot(bot, sx, sy, t) {
    const s = 3;
    const hover = bot.state === 'dead' ? 0 : (Math.floor(t / 20 + bot.col * 3) % 2 === 0 ? 0 : 2);
    let jx = 0;
    let jy = 0;
    if (bot.state === 'windup') {
        // telegraph: rattle in place, then lean into the lunge
        const shake = bot.timer % 4 < 2 ? 1 : -1;
        const lunge = bot.timer < 8 ? 8 : 0;
        const d = DIRS[bot.facing];
        jx = shake + d.dx * lunge;
        jy = d.dy * lunge;
    }
    const white = bot.flash > 0 && bot.flash % 4 >= 2;
    const C = (c) => (white ? '#ffffff' : c);
    const r = (cx, cy, w, h, color) => {
        ctx.fillStyle = C(color);
        ctx.fillRect(sx + jx + cx * s, sy + jy + hover + cy * s, w * s, h * s);
    };

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(sx + 8, sy + TILE - 8, TILE - 16, 6);

    // antenna
    r(7, -2, 1, 2, '#707888');
    r(6, -3, 3, 1, bot.state === 'windup' ? '#ff2020' : (Math.floor(t / 15) % 2 === 0 ? '#e84545' : '#f5d442'));
    // head with a visor eye that looks where it walks
    r(4, 0, 8, 5, '#aab2c4');
    r(5, 1, 6, 3, '#38405a');
    const eyeCol = bot.state === 'windup' ? '#ff2020' : '#ff5050';
    if (bot.facing === 'left') r(5, 2, 2, 1, eyeCol);
    else if (bot.facing === 'right') r(9, 2, 2, 1, eyeCol);
    else if (bot.facing === 'up') r(7, 1, 2, 1, eyeCol);
    else { r(6, 2, 1, 1, eyeCol); r(9, 2, 1, 1, eyeCol); }
    // body
    r(3, 5, 10, 6, '#8a94aa');
    r(5, 6, 6, 3, '#38405a');
    r(6, 7, 4, 1, bot.state === 'stagger' ? '#f5d442' : '#5cf05c');
    // arms
    r(1, 6, 2, 4, '#707888');
    r(13, 6, 2, 4, '#707888');
    // treads
    r(4, 11, 8, 2, '#38405a');
    r(3, 13, 10, 1, '#20263a');

    // dizzy stars while staggered
    if (bot.state === 'stagger') {
        const a = t / 6;
        ctx.fillStyle = '#f5d442';
        ctx.fillRect(sx + 24 + Math.cos(a) * 14, sy - 8 + Math.sin(a) * 4, 4, 4);
        ctx.fillRect(sx + 24 - Math.cos(a) * 14, sy - 8 - Math.sin(a) * 4, 4, 4);
    }

    // damage pips once it has been hit
    if (bot.hp < BOT_MAX_HP) {
        for (let i = 0; i < BOT_MAX_HP; i++) {
            ctx.fillStyle = i < bot.hp ? '#5cb85c' : '#38405a';
            ctx.fillRect(sx + 12 + i * 9, sy - 14, 7, 4);
        }
    }
}

// Pixel-art character, drawn with rects. facing: up/down/left/right.
// walkFrame 0 = standing, 1/2 = alternating steps.
// opts: { punch: frames-left, blocking: bool }
function drawCharacter(px, py, facing, walkFrame, palette, opts = {}) {
    const s = 3; // pixel scale (16x16 logical sprite in a 48px tile)
    const ox = px;
    const oy = py - 4 * s;
    const r = (cx, cy, w, h, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(ox + cx * s, oy + cy * s, w * s, h * s);
    };
    const skin = '#f0c8a0';
    const bob = walkFrame > 0 ? 1 : 0;

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(px + 6, py + TILE - 8, TILE - 12, 6);

    if (walkFrame === 1) {
        r(4, 16 - bob, 3, 4, palette.pants);
        r(9, 17 - bob, 3, 3, palette.pants);
    } else if (walkFrame === 2) {
        r(4, 17 - bob, 3, 3, palette.pants);
        r(9, 16 - bob, 3, 4, palette.pants);
    } else {
        r(4, 16, 3, 4, palette.pants);
        r(9, 16, 3, 4, palette.pants);
    }

    r(3, 11 - bob, 10, 5, palette.shirt);
    r(2, 11 - bob, 1, 4, skin);
    r(13, 11 - bob, 1, 4, skin);

    r(3, 3 - bob, 10, 8, skin);
    r(2, 2 - bob, 12, 3, palette.hat);
    if (facing === 'down') {
        r(2, 4 - bob, 2, 2, palette.hat);
        r(12, 4 - bob, 2, 2, palette.hat);
        r(5, 6 - bob, 2, 2, '#222');
        r(9, 6 - bob, 2, 2, '#222');
    } else if (facing === 'up') {
        r(2, 3 - bob, 12, 5, palette.hat);
    } else if (facing === 'left') {
        r(2, 4 - bob, 2, 3, palette.hat);
        r(4, 6 - bob, 2, 2, '#222');
    } else if (facing === 'right') {
        r(12, 4 - bob, 2, 3, palette.hat);
        r(10, 6 - bob, 2, 2, '#222');
    }

    // raised guard: a gray forearm shield on the facing side
    if (opts.blocking) {
        const guard = '#8a94aa';
        const edge = '#38405a';
        if (facing === 'down') { r(3, 14, 10, 3, guard); r(3, 16, 10, 1, edge); }
        else if (facing === 'up') { r(3, 0, 10, 3, guard); r(3, 0, 10, 1, edge); }
        else if (facing === 'left') { r(0, 5, 3, 10, guard); r(0, 5, 1, 10, edge); }
        else { r(13, 5, 3, 10, guard); r(15, 5, 1, 10, edge); }
    }

    // punch: a fist shoots out in the facing direction
    if (opts.punch > 0) {
        const ext = opts.punch > PUNCH_FRAMES / 2 ? 3 : 1; // out fast, back slow
        if (facing === 'down') r(6, 15 + ext, 3, 3, skin);
        else if (facing === 'up') r(7, 1 - ext, 3, 3, skin);
        else if (facing === 'left') r(1 - ext, 11, 3, 3, skin);
        else r(12 + ext, 11, 3, 3, skin);
    }
}

function render() {
    const cam = camera();
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const startCol = Math.floor(cam.x / TILE);
    const startRow = Math.floor(cam.y / TILE);

    for (let row = startRow; row <= startRow + VIEW_ROWS; row++) {
        for (let col = startCol; col <= startCol + VIEW_COLS; col++) {
            if (col >= MAP_COLS || row >= MAP_ROWS) continue;
            drawTile(tileAt(col, row), col * TILE - cam.x, row * TILE - cam.y, col, row);
        }
    }

    // Notes lying on the ground
    for (const note of NOTES) {
        if (!note.collected) {
            drawNote(note.col * TILE - cam.x, note.row * TILE - cam.y, state.frame);
        }
    }

    // NPCs (idle sway every couple seconds)
    for (const npc of NPCS) {
        const frame = Math.floor(state.frame / 60) % 4 === 0 ? 1 : 0;
        drawCharacter(npc.col * TILE - cam.x, npc.row * TILE - cam.y, npc.facing, frame, npc.palette);
    }

    // Roaming BOTS
    for (const bot of BOTS) {
        if (bot.state === 'dead') continue;
        drawBot(bot, bot.x - cam.x, bot.y - cam.y, state.frame);
        if (tileAt(bot.col, bot.row) === 't' && !bot.moving) {
            drawTallGrass(bot.col * TILE - cam.x, bot.row * TILE - cam.y, state.frame);
        }
    }

    // Player (blinks during i-frames)
    if (!(player.invuln > 0 && Math.floor(state.frame / 4) % 2 === 0)) {
        const walkFrame = player.moving ? (Math.floor(player.x / 12 + player.y / 12) % 2) + 1 : 0;
        drawCharacter(player.x - cam.x, player.y - cam.y, player.facing, walkFrame, player.palette, {
            punch: player.punchTimer,
            blocking: player.blocking
        });
    }

    // Tall grass hides the player's legs, like the real thing
    if (tileAt(player.col, player.row) === 't' && !player.moving) {
        drawTallGrass(player.col * TILE - cam.x, player.row * TILE - cam.y, state.frame);
    }

    drawEffects(cam.x, cam.y);
}

// ---------- Rendering: cutscene ----------
function drawRobot(x, y, t, walking, carrying, facingRight) {
    const s = 4;
    const step = walking ? Math.floor(t / 8) % 2 : 0;
    const bob = walking ? (step === 0 ? 0 : 2) : 0;
    const r = (cx, cy, w, h, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x + cx * s, y + bob + cy * s, w * s, h * s);
    };
    // antenna
    r(7, -3, 1, 2, '#707888');
    r(6, -4, 3, 1, Math.floor(t / 12) % 2 === 0 ? '#e84545' : '#f5d442');
    // head + eye looking in walk direction
    r(4, -1, 8, 5, '#aab2c4');
    r(5, 0, 6, 3, '#38405a');
    r(facingRight ? 9 : 6, 1, 1, 1, '#ff5050');
    // body
    r(3, 4, 10, 7, '#8a94aa');
    r(5, 6, 6, 2, '#38405a');
    // arms: forward when carrying
    if (carrying) {
        const ax = facingRight ? 13 : 0;
        r(ax, 5, 3, 2, '#707888');
        // the paper it carries
        ctx.fillStyle = '#f8f8f0';
        ctx.fillRect(x + (facingRight ? 16 * s : -6 * s), y + bob + 3 * s, 6 * s, 5 * s);
        ctx.fillStyle = '#8890a8';
        ctx.fillRect(x + (facingRight ? 17 * s : -5 * s), y + bob + 4 * s, 4 * s, 1);
        ctx.fillRect(x + (facingRight ? 17 * s : -5 * s), y + bob + 5 * s, 3 * s, 1);
    } else {
        r(1, 6, 2, 4, '#707888');
        r(13, 6, 2, 4, '#707888');
    }
    // legs, alternating
    if (step === 0) {
        r(4, 11, 3, 4, '#38405a');
        r(9, 12, 3, 3, '#38405a');
    } else {
        r(4, 12, 3, 3, '#38405a');
        r(9, 11, 3, 4, '#38405a');
    }
    // sweat drops — it is huffing and puffing, after all
    if (Math.floor(t / 16) % 2 === 0) {
        ctx.fillStyle = '#6fb0ec';
        ctx.fillRect(x + 15 * s, y - 2 * s, s, s * 2);
        ctx.fillRect(x - s, y + s, s, s);
    }
}

function drawTodoPile(x, groundY, delivered, t) {
    // A comically large, teetering stack of paper
    const layers = 4 + delivered * 7;
    const wobble = delivered >= NOTES.length ? Math.sin(t / 12) * 6 : 0;
    for (let i = 0; i < layers; i++) {
        const w = 120 - Math.min(40, i * 1.2) + ((i * 37) % 11) - 5;
        const off = Math.sin(i * 1.7) * (4 + i * 0.6) + wobble * (i / layers);
        const py = groundY - 10 - i * 9;
        ctx.fillStyle = i % 3 === 2 ? '#e8e8d8' : '#f8f8f0';
        ctx.fillRect(x - w / 2 + off, py, w, 8);
        ctx.fillStyle = '#c8c8b8';
        ctx.fillRect(x - w / 2 + off, py + 6, w, 2);
    }
    // TODO sign stuck on the pile
    const signY = groundY - 40 - layers * 9 * 0.45;
    ctx.save();
    ctx.translate(x + 70, Math.max(60, signY));
    ctx.rotate(0.08 + wobble * 0.01);
    ctx.fillStyle = '#a8763e';
    ctx.fillRect(-6, 0, 8, 60);
    ctx.fillStyle = '#f5d442';
    ctx.fillRect(-52, -34, 100, 40);
    ctx.strokeStyle = '#384060';
    ctx.lineWidth = 4;
    ctx.strokeRect(-52, -34, 100, 40);
    ctx.fillStyle = '#202030';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TODO', -2, -7);
    ctx.restore();
}

function renderCutscene() {
    const t = cutscene.t;
    const g = SCENE.groundY;

    // interior of the DEV LAB: wall, floor
    ctx.fillStyle = '#efe3c1';
    ctx.fillRect(0, 0, canvas.width, g);
    ctx.fillStyle = '#d9c99a';
    for (let i = 0; i < 5; i++) ctx.fillRect(0, 60 + i * 70, canvas.width, 4);
    ctx.fillStyle = '#b98a52';
    ctx.fillRect(0, g, canvas.width, canvas.height - g);
    ctx.fillStyle = '#a8763e';
    for (let i = 0; i < 12; i++) ctx.fillRect(i * 64, g, 3, canvas.height - g);

    // the INBOX basket with remaining notes
    const remaining = NOTES.length - cutscene.delivered - (cutscene.carrying ? 1 : 0);
    ctx.fillStyle = '#a8763e';
    ctx.fillRect(SCENE.basketX - 40, g - 44, 80, 44);
    ctx.fillStyle = '#8a5c2e';
    ctx.fillRect(SCENE.basketX - 40, g - 32, 80, 5);
    ctx.fillRect(SCENE.basketX - 40, g - 16, 80, 5);
    for (let i = 0; i < remaining; i++) {
        ctx.fillStyle = '#f8f8f0';
        ctx.fillRect(SCENE.basketX - 30 + i * 13, g - 58 - (i % 2) * 5, 11, 16);
    }
    ctx.fillStyle = '#202030';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('INBOX', SCENE.basketX, g + 24);

    // the comically large TODO pile
    drawTodoPile(SCENE.pileX + 60, g, cutscene.delivered, t);

    // the robot
    const walking = cutscene.phase === 'walkToBasket' || cutscene.phase === 'walkToPile';
    const facingRight = cutscene.phase !== 'walkToBasket';
    drawRobot(cutscene.robotX, g - 64, t, walking, cutscene.carrying, facingRight);

    // huff/puff speech bubble while it works
    if (cutscene.phase !== 'done') {
        const word = Math.floor(t / 40) % 2 === 0 ? 'HUFF...' : 'PUFF...';
        const bx = cutscene.robotX + 30;
        const by = g - 120;
        ctx.fillStyle = '#f8f8f0';
        ctx.fillRect(bx - 8, by - 22, 110, 30);
        ctx.strokeStyle = '#384060';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx - 8, by - 22, 110, 30);
        ctx.fillStyle = '#202030';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(word, bx, by);
    } else {
        ctx.fillStyle = '#202030';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FILING COMPLETE. PILE STATUS: COMICAL.', canvas.width / 2, 40);
    }

    // letterbox bars for that cutscene feel
    ctx.fillStyle = '#10141f';
    ctx.fillRect(0, 0, canvas.width, 16);
    ctx.fillRect(0, canvas.height - 16, canvas.width, 16);
}

// ---------- Game loop ----------
// The world renders even before PRESS START (behind the start screen), and a
// per-frame exception is logged without killing the loop — the canvas must
// never be left as a blank green rectangle.
let loopErrorLogged = false;

function gameLoop() {
    try {
        state.frame++;
        if (state.running) {
            if (mode === 'world') {
                updatePlayer();
                if (!dialogue.open) BOTS.forEach(updateBot);
            }
            if (mode === 'cutscene') updateCutscene();
            updateDialogue();
        }
        if (mode === 'cutscene') renderCutscene();
        else render();
    } catch (err) {
        if (!loopErrorLogged) {
            loopErrorLogged = true;
            console.error('Arcade Portfolio game loop error:', err);
        }
    }
    requestAnimationFrame(gameLoop);
}

function startGame() {
    if (state.running) return;
    state.running = true;
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'none';
    updateHud();
}

const startBtn = document.getElementById('start-btn');
if (startBtn) startBtn.addEventListener('click', startGame);

gameLoop();
