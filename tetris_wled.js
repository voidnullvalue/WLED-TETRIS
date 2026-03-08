#!/usr/bin/env node
'use strict';

const dgram = require('dgram');
const readline = require('readline');

// ---------------------------
// Configuration
// ---------------------------
const LEFT_WLED_IP = '192.168.88.85';
const RIGHT_WLED_IP = '192.168.88.95';
const UDP_PORT = 21324;

const WIDTH = 32;
const HEIGHT = 16;
const LEFT_SLICE_WIDTH = 16;
const RIGHT_SLICE_WIDTH = 16;

const TARGET_FPS = 30;
const FRAME_MS = Math.floor(1000 / TARGET_FPS);
const BASE_GRAVITY_MS = 650;
const MIN_GRAVITY_MS = 110;

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 16;
const BOARD_OFFSET_X = Math.floor((WIDTH - BOARD_WIDTH) / 2);
const BOARD_OFFSET_Y = 0;

const COLORS = {
  empty: [0, 0, 0],
  I: [0, 220, 220],
  O: [250, 240, 0],
  T: [180, 40, 220],
  S: [0, 220, 0],
  Z: [240, 30, 30],
  J: [20, 80, 250],
  L: [255, 140, 20],
  ghost: [30, 30, 30],
  border: [20, 20, 20],
  paused: [250, 180, 0],
  gameOver: [255, 20, 20]
};

const SHAPES = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0]
    ]
  ],
  O: [
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  ],
  T: [
    [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ]
  ],
  S: [
    [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ]
  ],
  Z: [
    [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 1, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  ],
  J: [
    [
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0]
    ]
  ],
  L: [
    [
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ]
  ]
};

class TetrisGame {
  constructor() {
    this.board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
    this.bag = [];
    this.active = null;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.paused = false;
    this.gameOver = false;
    this.gravityTimer = 0;
    this.gravityMs = BASE_GRAVITY_MS;

    this.framebuffer = Buffer.alloc(WIDTH * HEIGHT * 3, 0);

    this.leftSocket = dgram.createSocket('udp4');
    this.rightSocket = dgram.createSocket('udp4');

    this.spawnPiece();
  }

  refillBag() {
    const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    this.bag.push(...pieces);
  }

  nextPieceType() {
    if (this.bag.length === 0) this.refillBag();
    return this.bag.pop();
  }

  spawnPiece() {
    const type = this.nextPieceType();
    const piece = {
      type,
      rot: 0,
      x: Math.floor(BOARD_WIDTH / 2) - 2,
      y: -1
    };

    if (this.collides(piece, piece.x, piece.y, piece.rot)) {
      this.gameOver = true;
      this.active = piece;
      return;
    }

    this.active = piece;
  }

  collides(piece, x, y, rot) {
    const shape = SHAPES[piece.type][rot];
    for (let sy = 0; sy < 4; sy++) {
      for (let sx = 0; sx < 4; sx++) {
        if (!shape[sy][sx]) continue;
        const bx = x + sx;
        const by = y + sy;

        if (bx < 0 || bx >= BOARD_WIDTH) return true;
        if (by >= BOARD_HEIGHT) return true;
        if (by >= 0 && this.board[by][bx]) return true;
      }
    }
    return false;
  }

  tryMove(dx, dy) {
    if (this.paused || this.gameOver) return false;
    const nx = this.active.x + dx;
    const ny = this.active.y + dy;
    if (this.collides(this.active, nx, ny, this.active.rot)) return false;
    this.active.x = nx;
    this.active.y = ny;
    return true;
  }

  tryRotate() {
    if (this.paused || this.gameOver) return;
    const nr = (this.active.rot + 1) % 4;
    const kicks = [0, -1, 1, -2, 2];
    for (const k of kicks) {
      const nx = this.active.x + k;
      if (!this.collides(this.active, nx, this.active.y, nr)) {
        this.active.x = nx;
        this.active.rot = nr;
        return;
      }
    }
  }

  hardDrop() {
    if (this.paused || this.gameOver) return;
    let distance = 0;
    while (this.tryMove(0, 1)) distance++;
    this.score += distance * 2;
    this.lockPiece();
  }

  lockPiece() {
    const shape = SHAPES[this.active.type][this.active.rot];
    for (let sy = 0; sy < 4; sy++) {
      for (let sx = 0; sx < 4; sx++) {
        if (!shape[sy][sx]) continue;
        const bx = this.active.x + sx;
        const by = this.active.y + sy;
        if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
          this.board[by][bx] = this.active.type;
        }
      }
    }

    const cleared = this.clearLines();
    if (cleared > 0) {
      const table = [0, 100, 300, 500, 800];
      this.score += table[cleared] * this.level;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
      this.gravityMs = Math.max(MIN_GRAVITY_MS, BASE_GRAVITY_MS - (this.level - 1) * 45);
    }

    this.spawnPiece();
  }

  clearLines() {
    let cleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (this.board[y].every((cell) => cell !== null)) {
        this.board.splice(y, 1);
        this.board.unshift(Array(BOARD_WIDTH).fill(null));
        cleared++;
        y++;
      }
    }
    return cleared;
  }

  update(deltaMs) {
    if (this.paused || this.gameOver) return;
    this.gravityTimer += deltaMs;
    while (this.gravityTimer >= this.gravityMs) {
      this.gravityTimer -= this.gravityMs;
      if (!this.tryMove(0, 1)) {
        this.lockPiece();
        break;
      }
    }
  }

  restart() {
    this.board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
    this.bag = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.paused = false;
    this.gameOver = false;
    this.gravityTimer = 0;
    this.gravityMs = BASE_GRAVITY_MS;
    this.spawnPiece();
  }

  ghostY() {
    let gy = this.active.y;
    while (!this.collides(this.active, this.active.x, gy + 1, this.active.rot)) {
      gy++;
    }
    return gy;
  }

  clearFramebuffer() {
    this.framebuffer.fill(0);
  }

  setPixel(x, y, rgb) {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
    const idx = (y * WIDTH + x) * 3;
    this.framebuffer[idx] = rgb[0];
    this.framebuffer[idx + 1] = rgb[1];
    this.framebuffer[idx + 2] = rgb[2];
  }

  drawBoard() {
    // Minimal side rails for legibility on tiny display.
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      this.setPixel(BOARD_OFFSET_X - 1, y, COLORS.border);
      this.setPixel(BOARD_OFFSET_X + BOARD_WIDTH, y, COLORS.border);
    }

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = this.board[y][x];
        if (cell) {
          this.setPixel(BOARD_OFFSET_X + x, BOARD_OFFSET_Y + y, COLORS[cell]);
        }
      }
    }

    if (!this.active) return;

    const ghostY = this.ghostY();
    const activeShape = SHAPES[this.active.type][this.active.rot];

    for (let sy = 0; sy < 4; sy++) {
      for (let sx = 0; sx < 4; sx++) {
        if (!activeShape[sy][sx]) continue;
        const gx = this.active.x + sx;
        const gy = ghostY + sy;
        if (gy >= 0) {
          const occupiedByPiece = this.active.y + sy === gy;
          if (!occupiedByPiece) {
            this.setPixel(BOARD_OFFSET_X + gx, BOARD_OFFSET_Y + gy, COLORS.ghost);
          }
        }
      }
    }

    for (let sy = 0; sy < 4; sy++) {
      for (let sx = 0; sx < 4; sx++) {
        if (!activeShape[sy][sx]) continue;
        const px = this.active.x + sx;
        const py = this.active.y + sy;
        if (py >= 0) {
          this.setPixel(BOARD_OFFSET_X + px, BOARD_OFFSET_Y + py, COLORS[this.active.type]);
        }
      }
    }

    this.drawStatusPixels();
  }

  drawStatusPixels() {
    // Tiny status indicator strip along the very top row.
    // Left 8 pixels represent level (capped visually), right 8 represent lines (modulo 8).
    const levelBars = Math.min(8, this.level);
    const lineBars = this.lines % 9;
    for (let i = 0; i < levelBars; i++) this.setPixel(i, 0, [0, 90, 255]);
    for (let i = 0; i < lineBars; i++) this.setPixel(WIDTH - 1 - i, 0, [0, 220, 0]);

    if (this.paused) {
      for (let x = 0; x < WIDTH; x += 2) this.setPixel(x, HEIGHT - 1, COLORS.paused);
    }

    if (this.gameOver) {
      for (let x = 0; x < WIDTH; x++) this.setPixel(x, HEIGHT - 1, COLORS.gameOver);
    }
  }

  render() {
    this.clearFramebuffer();
    this.drawBoard();
  }

  splitFramebuffer() {
    // One logical 32x16 framebuffer is split by X range at output time only:
    // - left slice consumes x 0..15
    // - right slice consumes x 16..31
    // Each output packet is tightly packed RGB triplets row-major for a 16x16 target.
    const leftBuffer = Buffer.alloc(LEFT_SLICE_WIDTH * HEIGHT * 3);
    const rightBuffer = Buffer.alloc(RIGHT_SLICE_WIDTH * HEIGHT * 3);

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const srcIdx = (y * WIDTH + x) * 3;
        if (x < LEFT_SLICE_WIDTH) {
          const dstIdx = (y * LEFT_SLICE_WIDTH + x) * 3;
          leftBuffer[dstIdx] = this.framebuffer[srcIdx];
          leftBuffer[dstIdx + 1] = this.framebuffer[srcIdx + 1];
          leftBuffer[dstIdx + 2] = this.framebuffer[srcIdx + 2];
        } else {
          const rx = x - LEFT_SLICE_WIDTH;
          const dstIdx = (y * RIGHT_SLICE_WIDTH + rx) * 3;
          rightBuffer[dstIdx] = this.framebuffer[srcIdx];
          rightBuffer[dstIdx + 1] = this.framebuffer[srcIdx + 1];
          rightBuffer[dstIdx + 2] = this.framebuffer[srcIdx + 2];
        }
      }
    }

    return { leftBuffer, rightBuffer };
  }

  sendFrame() {
    const { leftBuffer, rightBuffer } = this.splitFramebuffer();
    this.leftSocket.send(leftBuffer, UDP_PORT, LEFT_WLED_IP);
    this.rightSocket.send(rightBuffer, UDP_PORT, RIGHT_WLED_IP);
  }

  shutdown() {
    try {
      const black = Buffer.alloc(LEFT_SLICE_WIDTH * HEIGHT * 3, 0);
      this.leftSocket.send(black, UDP_PORT, LEFT_WLED_IP);
      this.rightSocket.send(black, UDP_PORT, RIGHT_WLED_IP);
    } catch (_) {
      // ignore
    }
    this.leftSocket.close();
    this.rightSocket.close();
  }
}

const game = new TetrisGame();

function printHelp() {
  process.stdout.write('\nWLED Tetris running on 32x16 logical display\n');
  process.stdout.write(`Left: ${LEFT_WLED_IP}  Right: ${RIGHT_WLED_IP}  UDP:${UDP_PORT}\n`);
  process.stdout.write('Controls: ←/→ move, ↓ soft drop, ↑ rotate, space hard drop, P pause, R restart, Q quit\n\n');
}

function setupInput() {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  process.stdin.on('keypress', (_str, key) => {
    if (!key) return;

    if (key.ctrl && key.name === 'c') {
      cleanupAndExit(0);
      return;
    }

    switch (key.name) {
      case 'left':
        game.tryMove(-1, 0);
        break;
      case 'right':
        game.tryMove(1, 0);
        break;
      case 'down':
        if (game.tryMove(0, 1)) game.score += 1;
        break;
      case 'up':
        game.tryRotate();
        break;
      case 'space':
        game.hardDrop();
        break;
      case 'p':
        if (!game.gameOver) game.paused = !game.paused;
        break;
      case 'r':
        if (game.gameOver) game.restart();
        break;
      case 'q':
        cleanupAndExit(0);
        break;
      default:
        break;
    }
  });
}

let gameLoopTimer = null;
let infoTimer = null;
let lastTick = Date.now();

function startLoops() {
  gameLoopTimer = setInterval(() => {
    const now = Date.now();
    const delta = now - lastTick;
    lastTick = now;

    game.update(delta);
    game.render();
    game.sendFrame();
  }, FRAME_MS);

  infoTimer = setInterval(() => {
    const state = game.gameOver ? 'GAME OVER (R to restart)' : game.paused ? 'PAUSED' : 'RUNNING';
    process.stdout.write(`\rState:${state} Score:${game.score} Lines:${game.lines} Level:${game.level}      `);
  }, 250);
}

function cleanupAndExit(code) {
  if (gameLoopTimer) clearInterval(gameLoopTimer);
  if (infoTimer) clearInterval(infoTimer);

  game.shutdown();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
  process.stdout.write('\nExiting WLED Tetris.\n');
  process.exit(code);
}

process.on('SIGINT', () => cleanupAndExit(0));
process.on('SIGTERM', () => cleanupAndExit(0));
process.on('uncaughtException', (err) => {
  console.error('\nFatal error:', err);
  cleanupAndExit(1);
});

printHelp();
setupInput();
startLoops();
