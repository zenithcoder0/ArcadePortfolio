// ============================================================
// ARCADE PORTFOLIO — a Pokemon-style top-down portfolio world
// Grid-based movement (WASD), single interact key (E),
// collectible NOTES on the ground, wild BOT battles in the
// tall grass, and a note turn-in cutscene at the INBOX basket.
// ============================================================

// ---------- Configuration ----------
const TILE = 48;                 // rendered tile size in px
const VIEW_COLS = 15;            // viewport width in tiles  (720px)
const VIEW_ROWS = 10;            // viewport height in tiles (480px)
const WALK_SPEED = 4;            // px per frame (48/4 = 12 frames per tile)
const TURN_DELAY = 6;            // frames of "tap to turn" before walking
const ENCOUNTER_CHANCE = 0.22;   // wild BOT chance per tall-grass step
const PLAYER_MAX_HP = 20;

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
        'CAUTION: wild BOTS roam the tall grass. They bite (off more than they can chew).'
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
    tallGrass: [
        'The grass rustles with a faint whirring sound. Wild BOTS live here!'
    ],
    allNotes: [
        'That was the last NOTE!',
        'Take all 5 to the INBOX basket next to the DEV LAB.'
    ],
    basketDone: [
        'The robot is busy filing. The TODO pile teeters ominously overhead.',
        'Get in touch before it reaches the stratosphere — FISHER FINN has the contact info.'
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
            'Watch the tall grass — wild BOTS in there challenge everyone to battle. Rude little things.',
            'DEBUG them into submission, or RUN. I always run. It is called sourcing.'
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
            'A BOT once challenged me to battle. I gave it a cookie. Third-party, of course. It left.'
        ]
    }
];

// ---------- Game state ----------
// mode: 'world' | 'battle' | 'cutscene'
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
    palette: { hat: '#d83030', shirt: '#3050c8', pants: '#404060' }
};

const DIRS = {
    up:    { dx: 0, dy: -1 },
    down:  { dx: 0, dy: 1 },
    left:  { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 }
};

const hudEl = document.getElementById('hud');

// The HUD belongs to the overworld; battle and cutscene draw their own UI
function setHudVisible(visible) {
    hudEl.style.display = visible ? 'flex' : 'none';
}

function updateHud() {
    document.getElementById('notes-collected').textContent = state.notesFound;
    document.getElementById('total-notes').textContent = NOTES.length;
    document.getElementById('hp-current').textContent = state.hp;
    document.getElementById('hp-max').textContent = PLAYER_MAX_HP;
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
    // In the battle menu, direction keys move the cursor instead of the player
    if (battle.menuVisible && KEY_TO_DIR[e.code]) {
        moveBattleCursor(KEY_TO_DIR[e.code]);
        return;
    }
    // Single interact function, mapped to E (plus Space/Enter as aliases).
    // B (KeyX) is the Game Boy B button: RUN shortcut in battle, interact otherwise.
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
        interact();
    } else if (e.code === 'KeyX') {
        if (battle.menuVisible) {
            battle.menuIndex = 3; // RUN
            renderBattleMenu();
            interact();
        } else {
            interact();
        }
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
// so touch input flows through the same single interact() path.
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
// Every A-button press lands here, whatever the game mode.
function interact() {
    if (battle.menuVisible) {
        chooseBattleOption();
        return;
    }
    if (dialogue.open) {
        advanceDialogue();
        return;
    }
    if (mode === 'cutscene') {
        skipCutscene();
        return;
    }
    if (mode !== 'world' || player.moving) return;

    const dir = DIRS[player.facing];
    const col = player.col + dir.dx;
    const row = player.row + dir.dy;

    // NPCs turn to face you when spoken to
    const npc = NPCS.find(n => n.col === col && n.row === row);
    if (npc) {
        npc.facing = { up: 'down', down: 'up', left: 'right', right: 'left' }[player.facing];
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
    } else if (tile === 't') {
        openDialogue(DIALOGUES.tallGrass);
    } else if (tile === 'B') {
        interactBasket();
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

// ---------- Battle system (turn-based RPG vs wild BOT) ----------
const battle = {
    menuVisible: false,
    menuIndex: 0,
    enemyHP: 0,
    enemyMax: 14,
    coffees: 0,
    shake: 0
};

const BOT_ATTACKS = ['NULL POINTER', 'MERGE CONFLICT', 'INFINITE LOOP', 'SPAM PING'];

const battleMenuEl = document.getElementById('battle-menu');

function startBattle() {
    mode = 'battle';
    setHudVisible(false);
    battle.enemyHP = battle.enemyMax;
    battle.coffees = 3;
    battle.menuIndex = 0;
    battle.shake = 0;
    openDialogue(['A wild BOT appeared!', 'It beeps menacingly.'], showBattleMenu);
}

function showBattleMenu() {
    battle.menuVisible = true;
    battle.menuIndex = 0;
    battleMenuEl.classList.remove('hidden');
    renderBattleMenu();
    // Static prompt in the dialogue box while the menu is up
    dialogueBox.classList.remove('hidden');
    dialogueArrow.classList.add('hidden');
    dialogueText.textContent = 'What will DEV do?';
}

function hideBattleMenu() {
    battle.menuVisible = false;
    battleMenuEl.classList.add('hidden');
    dialogueBox.classList.add('hidden');
}

function renderBattleMenu() {
    for (let i = 0; i < 4; i++) {
        document.getElementById('bm-' + i).classList.toggle('selected', i === battle.menuIndex);
    }
}

function moveBattleCursor(dir) {
    // 2x2 grid: 0 DEBUG, 1 REFACTOR, 2 COFFEE, 3 RUN
    if (dir === 'left' || dir === 'right') battle.menuIndex ^= 1;
    if (dir === 'up' || dir === 'down') battle.menuIndex ^= 2;
    renderBattleMenu();
}

const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

function chooseBattleOption() {
    const choice = battle.menuIndex;
    hideBattleMenu();
    const msgs = [];

    if (choice === 0) { // DEBUG — reliable damage
        const dmg = rand(3, 6);
        battle.enemyHP = Math.max(0, battle.enemyHP - dmg);
        battle.shake = 12;
        msgs.push('DEV used DEBUG!', `The BOT took ${dmg} damage!`);
    } else if (choice === 1) { // REFACTOR — risky, big damage or nothing
        if (Math.random() < 0.5) {
            const dmg = rand(7, 10);
            battle.enemyHP = Math.max(0, battle.enemyHP - dmg);
            battle.shake = 18;
            msgs.push('DEV used REFACTOR!', `Clean code! Critical hit! ${dmg} damage!`);
        } else {
            msgs.push('DEV used REFACTOR!', 'The build broke! It failed!');
        }
    } else if (choice === 2) { // COFFEE — heal, limited uses
        if (battle.coffees > 0) {
            battle.coffees--;
            const heal = Math.min(rand(6, 9), PLAYER_MAX_HP - state.hp);
            state.hp += heal;
            updateHud();
            msgs.push('DEV drank COFFEE!', heal > 0 ? `Restored ${heal} HP! (${battle.coffees} left)` : 'HP is already full. The jitters set in.');
        } else {
            msgs.push('Out of COFFEE!', 'The horror. The horror.');
        }
    } else { // RUN
        if (Math.random() < 0.6) {
            openDialogue(['Got away safely!'], () => endBattle(null));
            return;
        }
        msgs.push('You tried to RUN!', 'The BOT blocks the way, citing a mandatory sync.');
    }

    if (battle.enemyHP <= 0) {
        msgs.push('The wild BOT powered down!', 'You gained 64 EXP. (EXP does nothing.)');
        openDialogue(msgs, () => endBattle('win'));
    } else {
        openDialogue(msgs, enemyTurn);
    }
}

function enemyTurn() {
    const attack = BOT_ATTACKS[rand(0, BOT_ATTACKS.length - 1)];
    const dmg = rand(2, 4);
    state.hp = Math.max(0, state.hp - dmg);
    updateHud();
    const msgs = [`The wild BOT used ${attack}!`, `You took ${dmg} damage!`];
    if (state.hp <= 0) {
        msgs.push('You ran out of energy!', 'You wake up back in town. The BOT filed a bug report about you.');
        openDialogue(msgs, () => endBattle('loss'));
    } else {
        openDialogue(msgs, showBattleMenu);
    }
}

function endBattle(result) {
    hideBattleMenu();
    mode = 'world';
    setHudVisible(true);
    if (result === 'loss') {
        state.hp = PLAYER_MAX_HP;
        player.col = SPAWN.col;
        player.row = SPAWN.row;
        player.x = SPAWN.col * TILE;
        player.y = SPAWN.row * TILE;
        player.moving = false;
        updateHud();
    }
}

// ---------- Movement ----------
function isWalkable(col, row) {
    if (SOLID_TILES.has(tileAt(col, row))) return false;
    if (NPCS.some(n => n.col === col && n.row === row)) return false;
    return true;
}

function updatePlayer() {
    if (dialogue.open) return;

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
    if (isWalkable(player.col + d.dx, player.row + d.dy)) {
        player.col += d.dx;
        player.row += d.dy;
        player.moveDir = dir;
        player.moving = true;
    }
}

function onTileEntered() {
    // Notes on the ground take priority over anything else
    if (collectNoteAt(player.col, player.row)) return;

    // Wild BOT encounters in the tall grass
    if (tileAt(player.col, player.row) !== 't') return;
    if (Math.random() > ENCOUNTER_CHANCE) return;
    startBattle();
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

// Pixel-art character, drawn with rects. facing: up/down/left/right.
// walkFrame 0 = standing, 1/2 = alternating steps.
function drawCharacter(px, py, facing, walkFrame, palette) {
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

    // Player
    const walkFrame = player.moving ? (Math.floor(player.x / 12 + player.y / 12) % 2) + 1 : 0;
    drawCharacter(player.x - cam.x, player.y - cam.y, player.facing, walkFrame, player.palette);

    // Tall grass hides the player's legs, like the real thing
    if (tileAt(player.col, player.row) === 't' && !player.moving) {
        drawTallGrass(player.col * TILE - cam.x, player.row * TILE - cam.y, state.frame);
    }
}

// ---------- Rendering: battle ----------
// The wild BOT itself, pixel style. scale ~4px per pixel.
function drawBot(x, y, t, shake) {
    const s = 4;
    const hover = Math.floor(t / 20) % 2 === 0 ? 0 : s;
    const jitter = shake > 0 ? (shake % 2 === 0 ? -s : s) : 0;
    const r = (cx, cy, w, h, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x + jitter + cx * s, y + hover + cy * s, w * s, h * s);
    };
    // antenna
    r(7, 0, 1, 2, '#707888');
    r(6, -1, 3, 1, Math.floor(t / 15) % 2 === 0 ? '#e84545' : '#f5d442');
    // head
    r(4, 2, 8, 5, '#aab2c4');
    r(5, 3, 6, 3, '#38405a');
    r(6, 4, 1, 1, '#ff5050');   // left eye
    r(9, 4, 1, 1, '#ff5050');   // right eye
    // body
    r(3, 7, 10, 6, '#8a94aa');
    r(5, 8, 6, 3, '#38405a');
    r(6, 9, 4, 1, Math.floor(t / 30) % 2 === 0 ? '#5cf05c' : '#2a8a2a'); // status light
    // arms
    r(1, 8, 2, 4, '#707888');
    r(13, 8, 2, 4, '#707888');
    // treads
    r(4, 13, 8, 2, '#38405a');
    r(3, 14, 10, 1, '#20263a');
}

// Rear view of the player, Pokemon battle style
function drawPlayerBack(x, y, palette) {
    const s = 5;
    const r = (cx, cy, w, h, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x + cx * s, y + cy * s, w * s, h * s);
    };
    r(3, 0, 10, 3, palette.hat);
    r(2, 2, 12, 4, palette.hat);
    r(4, 6, 8, 2, '#f0c8a0');
    r(2, 8, 12, 7, palette.shirt);
    r(1, 9, 1, 4, '#f0c8a0');
    r(14, 9, 1, 4, '#f0c8a0');
    r(3, 15, 4, 3, palette.pants);
    r(9, 15, 4, 3, palette.pants);
}

function drawHPBox(x, y, name, hp, maxHP, showNumbers) {
    ctx.fillStyle = '#f8f8f0';
    ctx.fillRect(x, y, 240, showNumbers ? 78 : 62);
    ctx.strokeStyle = '#384060';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, 240, showNumbers ? 78 : 62);
    ctx.fillStyle = '#202030';
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(name, x + 14, y + 26);
    // HP bar
    ctx.fillStyle = '#384060';
    ctx.fillRect(x + 14, y + 36, 212, 14);
    const pct = Math.max(0, hp / maxHP);
    ctx.fillStyle = pct > 0.5 ? '#5cb85c' : pct > 0.2 ? '#f0ad4e' : '#d9534f';
    ctx.fillRect(x + 17, y + 39, 206 * pct, 8);
    if (showNumbers) {
        ctx.fillStyle = '#202030';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${hp}/${maxHP}`, x + 226, y + 68);
    }
}

function renderBattle() {
    const t = state.frame;
    // backdrop
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#d8ecc0');
    grad.addColorStop(1, '#f0f8e0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // platforms
    ctx.fillStyle = '#a8cc78';
    ctx.beginPath();
    ctx.ellipse(520, 240, 150, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(180, 420, 170, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // combatants
    if (battle.shake > 0) battle.shake--;
    drawBot(490, 160, t, battle.shake);
    drawPlayerBack(140, 320, player.palette);

    // HP boxes: enemy top-left, player mid-right
    drawHPBox(30, 30, 'WILD BOT', battle.enemyHP, battle.enemyMax, false);
    drawHPBox(450, 300, 'DEV', state.hp, PLAYER_MAX_HP, true);
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
function gameLoop() {
    if (state.running) {
        state.frame++;
        if (mode === 'world') updatePlayer();
        if (mode === 'cutscene') updateCutscene();
        updateDialogue();
        if (mode === 'battle') renderBattle();
        else if (mode === 'cutscene') renderCutscene();
        else render();
    }
    requestAnimationFrame(gameLoop);
}

function startGame() {
    if (state.running) return;
    document.getElementById('start-screen').style.display = 'none';
    updateHud();
    state.running = true;
}

document.getElementById('start-btn').addEventListener('click', startGame);

gameLoop();
