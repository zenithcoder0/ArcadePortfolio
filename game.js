// ============================================================
// ARCADE PORTFOLIO — a Pokemon-style top-down portfolio world
// Grid-based movement (WASD), single interact key (E),
// tall-grass "wild PROJECT" encounters, signs and NPCs.
// ============================================================

// ---------- Configuration ----------
const TILE = 48;                 // rendered tile size in px
const VIEW_COLS = 15;            // viewport width in tiles  (720px)
const VIEW_ROWS = 10;            // viewport height in tiles (480px)
const WALK_SPEED = 4;            // px per frame (48/4 = 12 frames per tile)
const TURN_DELAY = 6;            // frames of "tap to turn" before walking
const ENCOUNTER_CHANCE = 0.3;    // wild PROJECT chance per tall-grass step

// ---------- Canvas ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ---------- Tile map ----------
// Legend: T tree | G grass | t tall grass | P path | W water
//         F flower | S sign | R roof | H wall | D door | f fence
const MAP = [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TGGGGGGGGGGGGGGGGGGGGGGGGGGT',
    'TGRRRRRGGGGGGGGGGGttttttGGGT',
    'TGRRRRRGGFFGGGGGGGttttttGGGT',
    'TGHHHHHGGFFGGGGGGGttttttGGGT',
    'TGHHDHHGSGGGGGGGGGttttttGGGT',
    'TGGGPGGGGGGGGGGGGGGGGPGGGGGT',
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

const SOLID_TILES = new Set(['T', 'W', 'S', 'R', 'H', 'D', 'f']);

function tileAt(col, row) {
    if (col < 0 || row < 0 || col >= MAP_COLS || row >= MAP_ROWS) return 'T';
    return MAP[row][col];
}

// ---------- Portfolio content ----------
// Every dialogue is an array of "pages", shown Pokemon-style.
const PROJECTS = [
    {
        name: 'AI TASK MANAGER',
        pages: [
            'A wild AI TASK MANAGER appeared!',
            'A smart task app that predicts completion times with machine learning.',
            'Its moveset: REACT, PYTHON, TENSORFLOW and POSTGRESQL.',
            'AI TASK MANAGER was added to your PROJECTS!'
        ]
    },
    {
        name: 'COLLAB PLATFORM',
        pages: [
            'A wild COLLAB PLATFORM appeared!',
            'A WebRTC platform for real-time document collaboration. 10k+ concurrent users!',
            'Its moveset: NODE.JS, WEBRTC, SOCKET.IO and REDIS.',
            'COLLAB PLATFORM was added to your PROJECTS!'
        ]
    },
    {
        name: 'ANALYTICS DASH',
        pages: [
            'A wild ANALYTICS DASH appeared!',
            'An e-commerce dashboard crunching millions of transactions in real time.',
            'Its moveset: VUE.JS, D3.JS, EXPRESS and MONGODB.',
            'ANALYTICS DASH was added to your PROJECTS!'
        ]
    },
    {
        name: 'FITNESS TRACKER',
        pages: [
            'A wild FITNESS TRACKER appeared!',
            'A cross-platform mobile app with AI workout and nutrition coaching.',
            'Its moveset: REACT NATIVE, FIREBASE and TENSORFLOW LITE.',
            'FITNESS TRACKER was added to your PROJECTS!'
        ]
    },
    {
        name: 'SUPPLY CHAIN',
        pages: [
            'A wild SUPPLY CHAIN appeared!',
            'A decentralized supply-chain tracker for transparency and authenticity.',
            'Its moveset: SOLIDITY, ETHEREUM, WEB3.JS and IPFS.',
            'SUPPLY CHAIN was added to your PROJECTS!'
        ]
    }
];

const DIALOGUES = {
    welcomeSign: [
        'WELCOME TO PORTFOLIO TOWN!',
        'NORTH: the DEV LAB. EAST: the POND. Tall grass: wild PROJECTS.',
        'Walk with WASD. Press E to talk, read and poke things.'
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
        'The water is calm. A DEPLOY on FRIDAY would disturb it.'
    ],
    tallGrass: [
        'The grass rustles. Wild PROJECTS live here — walk around in it!'
    ],
    grassDone: [
        'The tall grass is quiet now. Check back after the next hackathon.'
    ],
    allFound: [
        'You found all 5 wild PROJECTS!',
        'Go talk to FISHER FINN by the pond to get in touch.'
    ]
};

const NPCS = [
    {
        name: 'PROF. CEDAR', col: 15, row: 8, facing: 'down',
        palette: { hat: '#7a5230', shirt: '#e8e8e8', pants: '#8b6f47' },
        pages: [
            'PROF. CEDAR: Hello there! Welcome to PORTFOLIO TOWN!',
            'This world belongs to a full-stack developer who builds things for fun and for production.',
            'Wild PROJECTS hide in the tall grass. Go on — your very own portfolio legend is about to unfold!'
        ]
    },
    {
        name: 'RECRUITER ROY', col: 20, row: 6, facing: 'down',
        palette: { hat: '#2b50aa', shirt: '#2b50aa', pants: '#333344' },
        pages: [
            'RECRUITER ROY: Hey! You look like you can read a resume!',
            'Wait! Do not go into the tall grass unprepared... actually do. There are 5 wild PROJECTS in there.',
            'Catch them all and I will pretend this counts as a technical screen.'
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
            'When the developer is not coding, it is game jams, pixel art and too much coffee.'
        ]
    }
];

// ---------- Game state ----------
const state = {
    running: false,
    frame: 0,
    projectsFound: 0,
    remainingProjects: [...PROJECTS]
};

const player = {
    col: 13, row: 14,          // grid position
    x: 13 * TILE, y: 14 * TILE, // pixel position
    facing: 'up',
    moving: false,
    moveDir: null,
    turnTimer: 0,
    walkFrame: 0,
    palette: { hat: '#d83030', shirt: '#3050c8', pants: '#404060' }
};

const DIRS = {
    up:    { dx: 0, dy: -1 },
    down:  { dx: 0, dy: 1 },
    left:  { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 }
};

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
        if (e.code === 'Enter' || e.code === 'Space') startGame();
        return;
    }
    // Single interact function, mapped to E (plus Space/Enter as aliases)
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
function interact() {
    if (dialogue.open) {
        advanceDialogue();
        return;
    }
    if (player.moving) return;

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
        openDialogue(DIALOGUES.water);
    } else if (tile === 't') {
        openDialogue(state.remainingProjects.length ? DIALOGUES.tallGrass : DIALOGUES.grassDone);
    }
}

function signDialogue(col, row) {
    if (col === 8 && row === 5) return DIALOGUES.skillsSign;
    if (col === 22 && row === 9) return DIALOGUES.pondSign;
    return DIALOGUES.welcomeSign;
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
    if (tileAt(player.col, player.row) !== 't') return;
    if (!state.remainingProjects.length) return;
    if (Math.random() > ENCOUNTER_CHANCE) return;

    const project = state.remainingProjects.shift();
    openDialogue(project.pages, () => {
        state.projectsFound++;
        document.getElementById('projects-collected').textContent = state.projectsFound;
        if (!state.remainingProjects.length) {
            openDialogue(DIALOGUES.allFound);
        }
    });
}

// ---------- Rendering ----------
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
    // trunk
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(x + 18, y + 30, 12, 16);
    // canopy, chunky pixel style
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

// Pixel-art character, drawn with rects. facing: up/down/left/right.
// walkFrame 0 = standing, 1/2 = alternating steps.
function drawCharacter(px, py, facing, walkFrame, palette) {
    const s = 3; // pixel scale (16x16 logical sprite in a 48px tile)
    const ox = px;                 // sprite left edge
    const oy = py - 4 * s;         // head pokes above the tile
    const r = (cx, cy, w, h, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(ox + cx * s, oy + cy * s, w * s, h * s);
    };
    const skin = '#f0c8a0';
    const bob = walkFrame > 0 ? 1 : 0;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(px + 6, py + TILE - 8, TILE - 12, 6);

    // legs
    ctx.fillStyle = palette.pants;
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

    // torso + arms
    r(3, 11 - bob, 10, 5, palette.shirt);
    r(2, 11 - bob, 1, 4, skin);
    r(13, 11 - bob, 1, 4, skin);

    // head
    r(3, 3 - bob, 10, 8, skin);
    // hat / hair
    r(2, 2 - bob, 12, 3, palette.hat);
    if (facing === 'down') {
        r(2, 4 - bob, 2, 2, palette.hat);
        r(12, 4 - bob, 2, 2, palette.hat);
        r(5, 6 - bob, 2, 2, '#222');   // eyes
        r(9, 6 - bob, 2, 2, '#222');
    } else if (facing === 'up') {
        r(2, 3 - bob, 12, 5, palette.hat); // back of head
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

// ---------- Game loop ----------
function gameLoop() {
    if (state.running) {
        state.frame++;
        updatePlayer();
        updateDialogue();
        render();
    }
    requestAnimationFrame(gameLoop);
}

function startGame() {
    if (state.running) return;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('total-projects').textContent = PROJECTS.length;
    state.running = true;
}

document.getElementById('start-btn').addEventListener('click', startGame);

gameLoop();
