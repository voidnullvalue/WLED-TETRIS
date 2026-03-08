# WLED Dual-Matrix Tetris (32x16 logical display)

A complete terminal-based Tetris clone in **Node.js** that renders to one logical **32x16 framebuffer**, then splits frames and streams them via WLED realtime UDP to two physical devices.

## Why Node.js
- **No heavy dependencies** (uses only Node built-ins: `dgram`, `readline`).
- **Easy to run on Linux** with a standard terminal.
- Good fit for **non-blocking keyboard input** and stable timed loops.

## Display / Mapping Model
Physical setup:
- Two WLED devices, each driving one 8x32 matrix.
- Matrices arranged side-by-side and treated as one logical screen.

Logical screen:
- `WIDTH = 32`, `HEIGHT = 16`
- One global framebuffer is rendered for the full game scene.

Output split (at transmit time only):
- Left slice (`16x16`): source pixels `x = 0..15` -> `192.168.88.85`
- Right slice (`16x16`): source pixels `x = 16..31` -> `192.168.88.95`

The game is a **single game instance** with one state and one framebuffer.

## Board design (small display friendly)
- Tetris board is **10x16**, horizontally centered inside the 32x16 framebuffer.
- This keeps gameplay readable on tiny LEDs while still feeling like standard Tetris.
- Side rails and tiny status pixels are minimal so playfield remains clear.

## Requirements
- Linux terminal
- Node.js 18+ (Node 16 may also work)
- Network reachability to both WLED devices

## Install
```bash
cd /workspace/WLED-TETRIS
npm install
```

(There are no external npm dependencies; `npm install` just prepares package metadata.)

## Run
```bash
npm start
```

or

```bash
node tetris_wled.js
```

## Controls
- `Left Arrow` - move left
- `Right Arrow` - move right
- `Down Arrow` - soft drop
- `Up Arrow` - rotate
- `Space` - hard drop
- `P` - pause / unpause
- `R` - restart (after game over)
- `Q` - quit
- `Ctrl+C` - quit

## Config section (top of source)
In `tetris_wled.js`:
- `LEFT_WLED_IP = "192.168.88.85"`
- `RIGHT_WLED_IP = "192.168.88.95"`
- `UDP_PORT = 21324`
- `WIDTH = 32`
- `HEIGHT = 16`
- `LEFT_SLICE_WIDTH = 16`
- `RIGHT_SLICE_WIDTH = 16`

## WLED UDP details
- Sends one UDP packet per target each frame.
- Packet payload is tightly packed **RGB byte triplets** in row-major order for each 16x16 slice.
- Frame rate target is 30 FPS.
- Gameplay gravity timing is separate from render/send loop timing.

## Notes
- Ensure each WLED instance is configured to receive realtime UDP data.
- On exit, the app restores terminal state and sends a black frame to both devices.
