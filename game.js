// Game Configuration
const CONFIG = {
    gravity: 0.6,
    jumpForce: -12,
    moveSpeed: 5,
    friction: 0.8,
    tileSize: 40
};

// Game State
const gameState = {
    isRunning: false,
    isPaused: false,
    currentLevel: 0,
    projectsCollected: 0,
    totalProjects: 5,
    startTime: null,
    timeElapsed: 0
};

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 600;

// Player Object
const player = {
    x: 100,
    y: 400,
    width: 32,
    height: 48,
    velocityX: 0,
    velocityY: 0,
    isGrounded: false,
    direction: 1, // 1 = right, -1 = left
    animationFrame: 0,
    animationCounter: 0
};

// Input Handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    keys[e.code] = true;

    // Prevent space from scrolling
    if (e.code === 'Space') {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    keys[e.code] = false;
});

// Level Data
const levels = [
    {
        name: "Welcome to My World",
        platforms: [
            { x: 0, y: 560, width: 1200, height: 40, type: 'ground' },
            { x: 200, y: 460, width: 150, height: 20, type: 'platform' },
            { x: 400, y: 380, width: 150, height: 20, type: 'platform' },
            { x: 600, y: 300, width: 150, height: 20, type: 'platform' },
            { x: 800, y: 380, width: 150, height: 20, type: 'platform' },
            { x: 1000, y: 460, width: 150, height: 20, type: 'platform' }
        ],
        collectibles: [
            { x: 250, y: 420, type: 'star', collected: false, id: 'project1' },
            { x: 450, y: 340, type: 'star', collected: false, id: 'project2' },
            { x: 650, y: 260, type: 'star', collected: false, id: 'project3' }
        ],
        interactables: [
            { x: 850, y: 330, type: 'info', id: 'skills', label: 'Skills' },
            { x: 1050, y: 410, type: 'portal', id: 'portal1', label: 'Next Level' }
        ],
        spawn: { x: 50, y: 400 }
    },
    {
        name: "The Project Showcase",
        platforms: [
            { x: 0, y: 560, width: 300, height: 40, type: 'ground' },
            { x: 400, y: 560, width: 300, height: 40, type: 'ground' },
            { x: 800, y: 560, width: 400, height: 40, type: 'ground' },
            { x: 150, y: 400, width: 120, height: 20, type: 'platform' },
            { x: 320, y: 300, width: 120, height: 20, type: 'platform' },
            { x: 500, y: 200, width: 120, height: 20, type: 'platform' },
            { x: 680, y: 300, width: 120, height: 20, type: 'platform' },
            { x: 850, y: 400, width: 120, height: 20, type: 'platform' }
        ],
        collectibles: [
            { x: 190, y: 360, type: 'star', collected: false, id: 'project4' },
            { x: 540, y: 160, type: 'star', collected: false, id: 'project5' }
        ],
        interactables: [
            { x: 360, y: 250, type: 'info', id: 'experience', label: 'Experience' },
            { x: 720, y: 250, type: 'info', id: 'education', label: 'Education' },
            { x: 1050, y: 510, type: 'portal', id: 'portal2', label: 'Finish' }
        ],
        spawn: { x: 50, y: 400 }
    }
];

// Portfolio Data
const portfolioData = {
    project1: {
        title: "AI-Powered Task Manager",
        description: "A smart task management app using machine learning to predict task completion times and optimize schedules.",
        tech: ["React", "Python", "TensorFlow", "PostgreSQL"],
        link: "#"
    },
    project2: {
        title: "Real-time Collaboration Platform",
        description: "Built a WebRTC-based platform for real-time document collaboration with 10k+ concurrent users.",
        tech: ["Node.js", "WebRTC", "Socket.io", "Redis"],
        link: "#"
    },
    project3: {
        title: "E-commerce Analytics Dashboard",
        description: "Comprehensive analytics platform processing millions of transactions with real-time insights.",
        tech: ["Vue.js", "D3.js", "Express", "MongoDB"],
        link: "#"
    },
    project4: {
        title: "Mobile Fitness Tracker",
        description: "Cross-platform mobile app with AI-powered workout recommendations and nutrition tracking.",
        tech: ["React Native", "Firebase", "TensorFlow Lite"],
        link: "#"
    },
    project5: {
        title: "Blockchain Supply Chain",
        description: "Decentralized supply chain tracking system ensuring transparency and authenticity.",
        tech: ["Solidity", "Ethereum", "Web3.js", "IPFS"],
        link: "#"
    },
    skills: {
        title: "Technical Skills",
        description: "Languages: JavaScript, Python, Java, C++, Solidity\n\nFrameworks: React, Vue, Node.js, Django, Flask\n\nDatabases: PostgreSQL, MongoDB, Redis\n\nDevOps: Docker, Kubernetes, AWS, CI/CD\n\nOther: Machine Learning, Blockchain, WebRTC, GraphQL"
    },
    experience: {
        title: "Work Experience",
        description: "Senior Full-Stack Developer (2021-Present)\n• Led team of 5 developers building enterprise solutions\n• Reduced API response time by 60%\n• Implemented microservices architecture\n\nSoftware Engineer (2019-2021)\n• Built scalable web applications serving 100k+ users\n• Mentored junior developers\n• Improved code coverage to 95%"
    },
    education: {
        title: "Education & Certifications",
        description: "B.S. Computer Science - University of Technology (2019)\nGPA: 3.9/4.0\n\nCertifications:\n• AWS Solutions Architect\n• Google Cloud Professional\n• Certified Kubernetes Administrator"
    }
};

// Current Level
let currentLevelData = levels[0];

// UI Functions
function showModal(id) {
    const modal = document.getElementById('info-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    const data = portfolioData[id];
    if (!data) return;

    title.textContent = data.title;

    if (data.tech) {
        body.innerHTML = `
            <p>${data.description}</p>
            <h3>Technologies:</h3>
            <ul>
                ${data.tech.map(t => `<li>${t}</li>`).join('')}
            </ul>
            ${data.link !== '#' ? `<p><a href="${data.link}" target="_blank">View Project →</a></p>` : ''}
        `;
    } else {
        body.innerHTML = `<p style="white-space: pre-line;">${data.description}</p>`;
    }

    modal.classList.remove('hidden');
    gameState.isPaused = true;
}

function hideModal() {
    document.getElementById('info-modal').classList.add('hidden');
    gameState.isPaused = false;
}

function updateStats() {
    document.getElementById('current-level').textContent = gameState.currentLevel + 1;
    document.getElementById('projects-collected').textContent = gameState.projectsCollected;
    document.getElementById('total-projects').textContent = gameState.totalProjects;

    if (gameState.isRunning) {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('time-played').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function showEndScreen(victory) {
    const endScreen = document.getElementById('end-screen');
    const title = document.getElementById('end-title');
    const message = document.getElementById('end-message');
    const stats = document.getElementById('end-stats');

    title.textContent = victory ? 'Congratulations!' : 'Thanks for Playing!';
    message.textContent = victory
        ? 'You\'ve successfully wasted company time exploring my portfolio!'
        : 'You discovered my portfolio in the most fun way possible!';

    const timeWasted = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(timeWasted / 60);
    const seconds = timeWasted % 60;

    stats.innerHTML = `
        <div><strong>Time Productively Wasted:</strong> ${minutes}m ${seconds}s</div>
        <div><strong>Projects Discovered:</strong> ${gameState.projectsCollected}/${gameState.totalProjects}</div>
        <div><strong>Fun Level:</strong> MAXIMUM</div>
        <div><strong>Productivity Loss:</strong> Worth It!</div>
    `;

    endScreen.classList.remove('hidden');
    gameState.isRunning = false;
}

// Game Logic
function handleInput() {
    if (gameState.isPaused) return;

    // Horizontal movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.velocityX = -CONFIG.moveSpeed;
        player.direction = -1;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
        player.velocityX = CONFIG.moveSpeed;
        player.direction = 1;
    } else {
        player.velocityX *= CONFIG.friction;
    }

    // Jump
    if ((keys['ArrowUp'] || keys['KeyW'] || keys['Space']) && player.isGrounded) {
        player.velocityY = CONFIG.jumpForce;
        player.isGrounded = false;
    }

    // Interact
    if (keys['KeyE'] || keys['Enter']) {
        checkInteraction();
        keys['KeyE'] = false;
        keys['Enter'] = false;
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function updatePhysics() {
    if (gameState.isPaused) return;

    // Apply gravity
    player.velocityY += CONFIG.gravity;

    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Platform collision
    player.isGrounded = false;

    currentLevelData.platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            // Landing on top
            if (player.velocityY > 0 && player.y + player.height - player.velocityY <= platform.y + 10) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isGrounded = true;
            }
            // Hitting from below
            else if (player.velocityY < 0 && player.y - player.velocityY >= platform.y + platform.height - 10) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
            // Sides
            else if (player.velocityX > 0) {
                player.x = platform.x - player.width;
            } else if (player.velocityX < 0) {
                player.x = platform.x + platform.width;
            }
        }
    });

    // Screen boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Fall death
    if (player.y > canvas.height) {
        resetPlayerPosition();
    }

    // Collectibles
    currentLevelData.collectibles.forEach(item => {
        if (!item.collected && checkCollision(player, { x: item.x, y: item.y, width: 30, height: 30 })) {
            item.collected = true;
            gameState.projectsCollected++;
            showModal(item.id);
        }
    });

    // Animation
    if (Math.abs(player.velocityX) > 0.5) {
        player.animationCounter++;
        if (player.animationCounter > 5) {
            player.animationFrame = (player.animationFrame + 1) % 4;
            player.animationCounter = 0;
        }
    } else {
        player.animationFrame = 0;
    }
}

function checkInteraction() {
    currentLevelData.interactables.forEach(item => {
        const distance = Math.sqrt(
            Math.pow(player.x + player.width / 2 - item.x, 2) +
            Math.pow(player.y + player.height / 2 - item.y, 2)
        );

        if (distance < 60) {
            if (item.type === 'info') {
                showModal(item.id);
            } else if (item.type === 'portal') {
                nextLevel();
            }
        }
    });
}

function nextLevel() {
    gameState.currentLevel++;
    if (gameState.currentLevel >= levels.length) {
        showEndScreen(true);
    } else {
        currentLevelData = levels[gameState.currentLevel];
        resetPlayerPosition();
    }
}

function resetPlayerPosition() {
    player.x = currentLevelData.spawn.x;
    player.y = currentLevelData.spawn.y;
    player.velocityX = 0;
    player.velocityY = 0;
}

// Rendering
function drawPlayer() {
    ctx.save();

    // Flip player sprite based on direction
    if (player.direction === -1) {
        ctx.scale(-1, 1);
        ctx.translate(-player.x * 2 - player.width, 0);
    }

    // Player body (simple character)
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(player.x + 8, player.y, 16, 20); // Head

    ctx.fillStyle = '#4169E1';
    ctx.fillRect(player.x + 4, player.y + 20, 24, 20); // Body

    // Arms (animated)
    const armOffset = Math.sin(player.animationFrame) * 3;
    ctx.fillRect(player.x, player.y + 22 + armOffset, 6, 12); // Left arm
    ctx.fillRect(player.x + 26, player.y + 22 - armOffset, 6, 12); // Right arm

    // Legs (animated)
    const legOffset = player.animationFrame % 2 === 0 ? 0 : 4;
    ctx.fillRect(player.x + 8, player.y + 40, 8, 8 + legOffset); // Left leg
    ctx.fillRect(player.x + 16, player.y + 40, 8, 8 + (4 - legOffset)); // Right leg

    ctx.restore();
}

function drawPlatforms() {
    currentLevelData.platforms.forEach(platform => {
        if (platform.type === 'ground') {
            // Ground - grass on top, dirt below
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            ctx.fillStyle = '#228B22';
            ctx.fillRect(platform.x, platform.y, platform.width, 8);
        } else {
            // Platform
            ctx.fillStyle = '#654321';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            ctx.strokeStyle = '#3d2817';
            ctx.lineWidth = 2;
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        }
    });
}

function drawCollectibles() {
    currentLevelData.collectibles.forEach(item => {
        if (!item.collected) {
            // Animated star
            const time = Date.now() / 200;
            const bounce = Math.sin(time) * 5;

            ctx.save();
            ctx.translate(item.x + 15, item.y + 15 + bounce);
            ctx.rotate(time / 2);

            // Draw star
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const x = Math.cos(angle) * 15;
                const y = Math.sin(angle) * 15;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }
    });
}

function drawInteractables() {
    currentLevelData.interactables.forEach(item => {
        const distance = Math.sqrt(
            Math.pow(player.x + player.width / 2 - item.x, 2) +
            Math.pow(player.y + player.height / 2 - item.y, 2)
        );

        if (item.type === 'info') {
            // Info sign
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(item.x, item.y, 40, 50);
            ctx.fillStyle = '#F5DEB3';
            ctx.fillRect(item.x + 5, item.y + 5, 30, 25);

            ctx.fillStyle = '#000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('i', item.x + 20, item.y + 23);

            if (distance < 60) {
                ctx.fillStyle = '#FFF';
                ctx.font = '12px Courier New';
                ctx.fillText('[E] ' + item.label, item.x + 20, item.y - 10);
            }
        } else if (item.type === 'portal') {
            // Portal
            const time = Date.now() / 100;
            ctx.fillStyle = `hsl(${(time * 10) % 360}, 80%, 60%)`;
            ctx.beginPath();
            ctx.ellipse(item.x + 20, item.y + 30, 30, 40, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.stroke();

            if (distance < 60) {
                ctx.fillStyle = '#FFF';
                ctx.font = '12px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('[E] ' + item.label, item.x + 20, item.y - 10);
            }
        }
    });
}

function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    const cloudOffset = (Date.now() / 50) % (canvas.width + 200);

    drawCloud(cloudOffset - 200, 80);
    drawCloud(cloudOffset + 200, 120);
    drawCloud(cloudOffset + 600, 60);
}

function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 30, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
    ctx.fill();
}

function render() {
    drawBackground();
    drawPlatforms();
    drawCollectibles();
    drawInteractables();
    drawPlayer();

    // Level title
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(currentLevelData.name, canvas.width / 2, 40);
}

// Game Loop
function gameLoop() {
    if (gameState.isRunning) {
        handleInput();
        updatePhysics();
        updateStats();
        render();
    }
    requestAnimationFrame(gameLoop);
}

// Initialize Game
function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    gameState.isRunning = true;
    gameState.startTime = Date.now();
    gameState.currentLevel = 0;
    gameState.projectsCollected = 0;
    currentLevelData = levels[0];
    resetPlayerPosition();
}

function restartGame() {
    document.getElementById('end-screen').classList.add('hidden');

    // Reset all collectibles
    levels.forEach(level => {
        level.collectibles.forEach(item => item.collected = false);
    });

    startGame();
}

// Event Listeners
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', restartGame);
document.getElementById('contact-btn').addEventListener('click', () => {
    alert('Contact me at: your.email@example.com\n\nOr connect on LinkedIn!');
});

document.querySelector('.close-btn').addEventListener('click', hideModal);

document.getElementById('info-modal').addEventListener('click', (e) => {
    if (e.target.id === 'info-modal') {
        hideModal();
    }
});

// Start game loop
gameLoop();
