// Smooth loading animation
document.addEventListener('DOMContentLoaded', () => {
    const loadingBar = document.querySelector('.loading-bar');
    const percentage = document.querySelector('.loading-percentage');
    const loadingText = document.querySelector('.loading-text');
    const texts = [
        "Loading game assets...",
        "Connecting to servers...",
        "Initializing controllers...",
        "Almost there...",
        "Ready to play!"
    ];

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;

        loadingBar.style.width = `${progress}%`;
        percentage.textContent = `${Math.floor(progress)}%`;

        // Change text at certain intervals
        if (progress < 25 && loadingText.textContent !== texts[0]) {
            loadingText.textContent = texts[0];
        } else if (progress >= 25 && progress < 50 && loadingText.textContent !== texts[1]) {
            loadingText.textContent = texts[1];
        } else if (progress >= 50 && progress < 75 && loadingText.textContent !== texts[2]) {
            loadingText.textContent = texts[2];
        } else if (progress >= 75 && progress < 95 && loadingText.textContent !== texts[3]) {
            loadingText.textContent = texts[3];
        } else if (progress >= 95 && loadingText.textContent !== texts[4]) {
            loadingText.textContent = texts[4];
        }

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('preloader').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('preloader').style.display = 'none';
                }, 500);
            }, 500);
        }
    }, 150);
});

function playGame(url) {
    const sound = document.getElementById("clickSound");
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => { });
    }
    setTimeout(() => {
        window.location.href = url;
    }, 500);
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target); // Optional: Reveal only once
        }
    });
}, {
    threshold: 0.15
});

document.querySelectorAll('.game-card').forEach(card => {
    observer.observe(card);
});

const MIN_TIME = 2500; // wait for animations to finish
const start = Date.now();

window.addEventListener("load", () => {
    const elapsed = Date.now() - start;
    const delay = Math.max(0, MIN_TIME - elapsed);

    setTimeout(() => {
        const preloader = document.getElementById("preloader");
        preloader.style.opacity = "0";
        setTimeout(() => {
            preloader.style.display = "none";
        }, 500);
    }, delay);
});

// Game configuration
const config = {
    gravity: 0.5,
    playerSpeed: 5,
    jumpForce: 12,
    wallJumpForce: 8,
    dashForce: 15,
    wallSlideSpeed: 2,
    trailLength: 10
};

// Game state
const state = {
    player: {
        x: 100,
        y: 300,
        width: 20,
        height: 40,
        velX: 0,
        velY: 0,
        isJumping: false,
        isWallSliding: false,
        facing: 1, // 1 for right, -1 for left
        dashCooldown: 0,
        trail: []
    },
    platforms: [
        { x: 0, y: 500, width: 800, height: 20 },
        { x: 200, y: 400, width: 100, height: 20 },
        { x: 400, y: 300, width: 100, height: 20 },
        { x: 600, y: 200, width: 100, height: 20 },
        { x: 300, y: 150, width: 100, height: 20 }
    ],
    walls: [
        { x: 0, y: 0, width: 20, height: 500 },
        { x: 780, y: 0, width: 20, height: 500 }
    ],
    keys: {},
    camera: { x: 0, y: 0 },
    score: 0,
    gameTime: 0
};

// Launch function
function launchGame(gameName) {
    if (gameName === 'vectorParkour') {
        const gameContainer = document.getElementById('vectorParkourGame');
        gameContainer.style.display = 'block';

        const canvas = document.getElementById('parkourCanvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');

        // Initialize game state
        resetGame();

        // Start game loop
        function gameLoop() {
            update();
            render(ctx);
            requestAnimationFrame(gameLoop);
        }
        gameLoop();

        // Event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }
}

function resetGame() {
    state.player = {
        x: 100,
        y: 300,
        width: 20,
        height: 40,
        velX: 0,
        velY: 0,
        isJumping: false,
        isWallSliding: false,
        facing: 1,
        dashCooldown: 0,
        trail: []
    };
    state.score = 0;
    state.gameTime = 0;
}

function handleKeyDown(e) {
    state.keys[e.key] = true;

    // Space to jump
    if (e.key === ' ' && !state.player.isJumping) {
        state.player.velY = -config.jumpForce;
        state.player.isJumping = true;
    }

    // Wall jump
    if (e.key === ' ' && state.player.isWallSliding) {
        state.player.velY = -config.jumpForce;
        state.player.velX = config.wallJumpForce * -state.player.facing;
        state.player.isWallSliding = false;
    }

    // Dash
    if (e.key === 'Shift' && state.player.dashCooldown <= 0) {
        state.player.velX = config.dashForce * state.player.facing;
        state.player.dashCooldown = 30;
    }
}

function handleKeyUp(e) {
    state.keys[e.key] = false;
}

function update() {
    const p = state.player;

    // Horizontal movement
    if (state.keys['ArrowLeft']) {
        p.velX = -config.playerSpeed;
        p.facing = -1;
    } else if (state.keys['ArrowRight']) {
        p.velX = config.playerSpeed;
        p.facing = 1;
    } else {
        p.velX *= 0.8; // Friction
    }

    // Apply gravity
    p.velY += config.gravity;

    // Update position
    p.x += p.velX;
    p.y += p.velY;

    // Wall sliding
    p.isWallSliding = false;
    for (const wall of state.walls) {
        if (checkCollision(p, wall)) {
            if (p.velY > 0 && (state.keys['ArrowLeft'] || state.keys['ArrowRight'])) {
                p.isWallSliding = true;
                p.velY = config.wallSlideSpeed;
            }
            p.x -= p.velX; // Undo movement
            p.velX = 0;
        }
    }

    // Platform collisions
    p.isJumping = true;
    for (const platform of state.platforms) {
        if (checkCollision(p, platform)) {
            if (p.velY > 0 && p.y + p.height / 2 < platform.y) {
                p.isJumping = false;
                p.y = platform.y - p.height;
                p.velY = 0;
            }
            p.y -= p.velY; // Undo movement
        }
    }

    // Trail effect
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > config.trailLength) {
        p.trail.shift();
    }

    // Dash cooldown
    if (p.dashCooldown > 0) {
        p.dashCooldown--;
    }

    // Camera follow
    state.camera.x = p.x - canvas.width / 2;
    state.camera.y = p.y - canvas.height / 2;

    // Score based on distance
    state.score = Math.floor(p.x / 10);
    state.gameTime++;
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y;
}

function render(ctx) {
    const canvas = ctx.canvas;

    // Clear screen
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw with camera offset
    ctx.save();
    ctx.translate(-state.camera.x, -state.camera.y);

    // Draw platforms
    ctx.fillStyle = '#333';
    for (const platform of state.platforms) {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }

    // Draw walls
    ctx.fillStyle = '#555';
    for (const wall of state.walls) {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    }

    // Draw player trail
    for (let i = 0; i < state.player.trail.length; i++) {
        const alpha = i / state.player.trail.length;
        ctx.fillStyle = `rgba(0, 200, 255, ${alpha})`;
        const pos = state.player.trail[i];
        ctx.fillRect(pos.x, pos.y, state.player.width, state.player.height);
    }

    // Draw player
    ctx.fillStyle = '#00f8ff';
    ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);

    // Draw face direction indicator
    ctx.fillStyle = '#ff00aa';
    ctx.fillRect(
        state.player.x + (state.player.facing > 0 ? state.player.width - 5 : 0),
        state.player.y + 10,
        5,
        5
    );

    ctx.restore();

    // Draw UI
    ctx.fillStyle = '#fff';
    ctx.font = '20px Orbitron';
    ctx.fillText(`Score: ${state.score}`, 20, 40);
    ctx.fillText(`Time: ${Math.floor(state.gameTime / 60)}`, 20, 70);

    // Draw controls help
    ctx.font = '16px Orbitron';
    ctx.fillText('Arrow Keys: Move', 20, canvas.height - 60);
    ctx.fillText('Space: Jump', 20, canvas.height - 40);
    ctx.fillText('Shift: Dash', 20, canvas.height - 20);
}
// Combined function to play sound and launch game
function launchVectorParkourWithSound() {
    // Play click sound
    const sound = document.getElementById("clickSound");
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => { });
    }

    // Launch game after short delay
    setTimeout(() => {
        launchVectorParkour();
    }, 300); // 300ms delay to let sound play
}

// Game launch function
function launchVectorParkour() {
    const gameContainer = document.getElementById('vectorParkourGame');
    gameContainer.style.display = 'block';

    const canvas = document.getElementById('parkourCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize game if not already running
    if (!window.vectorParkourInitialized) {
        initVectorParkour();
        window.vectorParkourInitialized = true;
    }
}

// Exit function
function exitVectorParkour() {
    document.getElementById('vectorParkourGame').style.display = 'none';
    // Play sound when exiting
    const sound = document.getElementById("clickSound");
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => { });
    }
}

// Your full game initialization code would go here
function initVectorParkour() {
    // [PASTE THE ENTIRE VECTOR PARKOUR GAME CODE HERE]
    // This includes all the game state, update(), render(), etc.
    // From the previous implementation I provided
}

// Vector Parkour Game Implementation
const parkourConfig = {
    gravity: 0.3,         // Reduced gravity
    playerSpeed: 3.5,     // Slower movement
    jumpForce: 10,        // Adjusted jump
    wallJumpForce: 6,
    dashForce: 12,
    wallSlideSpeed: 1.5,
    trailLength: 5
};

let parkourState = {};
let animationFrameId = null;
let parkourCanvas, parkourCtx;
let playerImg = new Image();

// Load player sprite
playerImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48c3R5bGU+LnN0MHtmaWxsOiMwMEY4RkY7fS5zdDF7ZmlsbDojRkYwMEFBO30uc3Qye2ZpbGw6IzAwRkY4ODt9PC9zdHlsZT48cmVjdCB4PSI0MCIgeT0iNDAiIHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBjbGFzcz0ic3QwIiByeD0iMjAiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI3MCIgcj0iMjAiIGNsYXNzPSJzdDEiLz48cmVjdCB4PSI2MCIgeT0iMTAwIiB3aWR0aD0iODAiIGhlaWdodD0iNDAiIGNsYXNzPSJzdDIiIHJ4PSIxMCIvPjwvc3ZnPg==';

function launchVectorParkourWithSound() {
    const sound = document.getElementById("clickSound");
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => { });
    }
    launchVectorParkour();
}

function launchVectorParkour() {
    const gameContainer = document.getElementById('vectorParkourGame');
    gameContainer.style.display = 'block';
    document.getElementById('gameOverScreen').style.display = 'none';

    parkourCanvas = document.getElementById('parkourCanvas');
    parkourCanvas.width = window.innerWidth * 0.95;
    parkourCanvas.height = window.innerHeight * 0.95;
    parkourCtx = parkourCanvas.getContext('2d');

    resetVectorParkour();

    // Start game loop
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    gameLoop();

    // Event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

function resetVectorParkour() {
    parkourState = {
        player: {
            x: 100,
            y: 300,
            width: 40,
            height: 60,
            velX: 0,
            velY: 0,
            isJumping: true,
            isWallSliding: false,
            facing: 1,
            dashCooldown: 0,
            trail: []
        },
        platforms: generatePlatforms(),
        walls: [
            { x: 0, y: 0, width: 20, height: parkourCanvas.height },
            { x: parkourCanvas.width - 20, y: 0, width: 20, height: parkourCanvas.height }
        ],
        obstacles: generateObstacles(),
        keys: {},
        camera: { x: 0, y: 0 },
        score: 0,
        gameTime: 0,
        gameOver: false
    };
}

function generatePlatforms() {
    const platforms = [];
    const platformCount = 15;
    const minWidth = 80;
    const maxWidth = 200;

    for (let i = 0; i < platformCount; i++) {
        platforms.push({
            x: Math.random() * parkourCanvas.width * 3,
            y: 300 + (i * 120),
            width: minWidth + Math.random() * (maxWidth - minWidth),
            height: 20
        });
    }

    // Add starting platform
    platforms.unshift({
        x: 0,
        y: 400,
        width: 300,
        height: 20
    });

    return platforms;
}

function generateObstacles() {
    const obstacles = [];
    const obstacleCount = 20;

    for (let i = 0; i < obstacleCount; i++) {
        obstacles.push({
            x: 500 + (i * 300) + Math.random() * 200,
            y: 300 + (i * 100),
            width: 30,
            height: 30
        });
    }

    return obstacles;
}

function exitVectorParkour() {
    cancelAnimationFrame(animationFrameId);
    document.getElementById('vectorParkourGame').style.display = 'none';
    const sound = document.getElementById("clickSound");
    if (sound) sound.play().catch(() => { });
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
}

function gameLoop() {
    if (parkourState.gameOver) {
        document.getElementById('gameOverScreen').style.display = 'block';
        return;
    }

    updateParkourGame();
    renderParkourGame();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function updateParkourGame() {
    const p = parkourState.player;

    // Horizontal movement with slower acceleration
    if (parkourState.keys['ArrowLeft']) {
        p.velX = Math.max(p.velX - 0.2, -parkourConfig.playerSpeed);
        p.facing = -1;
    } else if (parkourState.keys['ArrowRight']) {
        p.velX = Math.min(p.velX + 0.2, parkourConfig.playerSpeed);
        p.facing = 1;
    } else {
        p.velX *= 0.9; // Smoother friction
    }

    // Apply gravity
    p.velY += parkourConfig.gravity;

    // Update position
    p.x += p.velX;
    p.y += p.velY;

    // Wall sliding
    p.isWallSliding = false;
    for (const wall of parkourState.walls) {
        if (checkCollision(p, wall)) {
            if (p.velY > 0 && (parkourState.keys['ArrowLeft'] || parkourState.keys['ArrowRight'])) {
                p.isWallSliding = true;
                p.velY = parkourConfig.wallSlideSpeed;
            }
            p.x -= p.velX;
            p.velX = 0;
        }
    }

    // Platform collisions
    p.isJumping = true;
    for (const platform of parkourState.platforms) {
        if (checkCollision(p, platform)) {
            if (p.velY > 0 && p.y + p.height / 2 < platform.y) {
                p.isJumping = false;
                p.y = platform.y - p.height;
                p.velY = 0;
            }
            p.y -= p.velY;
        }
    }

    // Obstacle collisions (game over)
    for (const obstacle of parkourState.obstacles) {
        if (checkCollision(p, obstacle)) {
            parkourState.gameOver = true;
        }
    }

    // Check if player fell off the bottom
    if (p.y > parkourCanvas.height) {
        parkourState.gameOver = true;
    }

    // Camera follow
    parkourState.camera.x = p.x - parkourCanvas.width / 3;
    parkourState.camera.y = Math.min(p.y - parkourCanvas.height / 2, 0);

    // Update score
    parkourState.score = Math.floor(p.x / 10);
    parkourState.gameTime++;
}

function renderParkourGame() {
    parkourCtx.fillStyle = '#111';
    parkourCtx.fillRect(0, 0, parkourCanvas.width, parkourCanvas.height);

    // Draw with camera offset
    parkourCtx.save();
    parkourCtx.translate(-parkourState.camera.x, -parkourState.camera.y);

    // Draw platforms
    parkourCtx.fillStyle = '#333';
    parkourState.platforms.forEach(plat => {
        parkourCtx.fillRect(plat.x, plat.y, plat.width, plat.height);
        // Platform edges
        parkourCtx.fillStyle = '#00ff88';
        parkourCtx.fillRect(plat.x, plat.y, 5, plat.height);
        parkourCtx.fillRect(plat.x + plat.width - 5, plat.y, 5, plat.height);
        parkourCtx.fillStyle = '#333';
    });

    // Draw walls
    parkourCtx.fillStyle = '#555';
    parkourState.walls.forEach(wall => {
        parkourCtx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });

    // Draw obstacles
    parkourCtx.fillStyle = '#ff0000';
    parkourState.obstacles.forEach(obs => {
        parkourCtx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    // Draw player
    parkourCtx.save();
    parkourCtx.translate(parkourState.player.x, parkourState.player.y);
    if (parkourState.player.facing < 0) {
        parkourCtx.scale(-1, 1);
        parkourCtx.translate(-parkourState.player.width, 0);
    }

    if (playerImg.complete) {
        parkourCtx.drawImage(playerImg, 0, 0, parkourState.player.width, parkourState.player.height);
    } else {
        parkourCtx.fillStyle = '#00f8ff';
        parkourCtx.fillRect(0, 0, parkourState.player.width, parkourState.player.height);
    }
    parkourCtx.restore();

    parkourCtx.restore();

    // Draw UI
    parkourCtx.fillStyle = '#fff';
    parkourCtx.font = '20px Orbitron';
    parkourCtx.fillText(`Score: ${parkourState.score}`, 20, 40);
    parkourCtx.fillText(`Distance: ${Math.floor(parkourState.player.x)}m`, 20, 70);

    // Draw controls help
    parkourCtx.font = '16px Orbitron';
    parkourCtx.fillText('Arrow Keys: Move', 20, parkourCanvas.height - 80);
    parkourCtx.fillText('Space: Jump', 20, parkourCanvas.height - 60);
    parkourCtx.fillText('Wall Slide: Hold against wall', 20, parkourCanvas.height - 40);
}

function handleKeyDown(e) {
    parkourState.keys[e.key] = true;

    // Jump when space is pressed
    if (e.key === ' ' && !parkourState.player.isJumping) {
        parkourState.player.velY = -parkourConfig.jumpForce;
        parkourState.player.isJumping = true;
        // Play jump sound if available
    }

    // Wall jump
    if (e.key === ' ' && parkourState.player.isWallSliding) {
        parkourState.player.velY = -parkourConfig.jumpForce;
        parkourState.player.velX = parkourConfig.wallJumpForce * -parkourState.player.facing;
        parkourState.player.isWallSliding = false;
    }
}

function handleKeyUp(e) {
    parkourState.keys[e.key] = false;
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y;
}

  function toggleMenu() {
      const navList = document.getElementById("navList");
      navList.classList.toggle("active");
    }


  function filterGames() {
    const query = document.getElementById("gameSearch").value.toLowerCase();
    const cards = document.querySelectorAll(".game-card");

    cards.forEach(card => {
      const title = card.querySelector("h4").innerText.toLowerCase();
      card.style.display = title.includes(query) ? "block" : "none";
    });
  }




  function toggleMenu() {
    document.getElementById("navList").classList.toggle("show");
  }









