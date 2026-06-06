# 🕹️ Replit → Game Distribution Pipeline
### Build in Replit · Package with Electron · Ship via itch.io or Steam

> **Save this file as `docs/GAME_PIPELINE.md` in the root of your Replit project.**  
> It renders automatically on GitHub and serves as your ongoing reference for the full build-to-ship pipeline.

---

## Table of Contents

1. [Pipeline Overview](#1-pipeline-overview)
2. [Project Setup in Replit](#2-project-setup-in-replit)
3. [Gamepad API — Full Controller Reference](#3-gamepad-api--full-controller-reference)
   - [How the API Works](#how-the-api-works)
   - [Detecting Controllers](#detecting-controllers)
   - [Standard Gamepad Layout](#standard-gamepad-layout-xbox--ps--switch-pro)
   - [Racing Wheel](#racing-wheel-logitech-g29--thrustmaster)
   - [Joystick / Flight Stick](#joystick--flight-stick)
   - [Deadzone Handling](#deadzone-handling)
   - [Force Feedback / Rumble](#force-feedback--rumble)
   - [The Game Loop Pattern](#the-game-loop-pattern)
4. [Electron — Desktop Packaging](#4-electron--desktop-packaging)
5. [GitHub Actions — Automated Builds](#5-github-actions--automated-builds)
6. [itch.io — Distribution](#6-itchio--distribution)
7. [Steam — When You're Ready](#7-steam--when-youre-ready)
8. [Replit-Specific Tips](#8-replit-specific-tips)
9. [Quick Reference Cheatsheet](#9-quick-reference-cheatsheet)

---

## 1. Pipeline Overview

Replit is your dev environment and code host — not a game distribution platform. The path from Replit to a playable downloadable game uses a chain of free tools:

```
┌─────────────┐     git push     ┌──────────────┐     Actions trigger    ┌──────────────────────┐
│   Replit    │ ──────────────▶  │    GitHub    │ ──────────────────────▶ │   GitHub Actions CI  │
│  (write &   │                  │  (version    │                         │  Builds on Windows,  │
│   iterate)  │                  │   control)   │                         │  macOS, and Linux    │
└─────────────┘                  └──────────────┘                         └──────────┬───────────┘
                                                                                     │
                                                                          .exe / .dmg / .AppImage
                                                                                     │
                                                                          ┌──────────▼───────────┐
                                                                          │  GitHub Release +    │
                                                                          │  itch.io / Steam     │
                                                                          └──────────────────────┘
```

### What each tool does

| Tool | Role | Cost |
|---|---|---|
| **Replit** | Write code, iterate, test in browser | Free / Replit Core |
| **GitHub** | Version control, triggers CI | Free |
| **GitHub Actions** | Cross-platform binary compilation | Free (2,000 min/mo) |
| **Electron** | Wraps web game into native .exe/.dmg/.AppImage | Free, open source |
| **itch.io** | Game distribution platform (web + download) | Free |
| **Steam** | Premium game store | $100 one-time fee |

---

## 2. Project Setup in Replit

### Recommended folder structure

```
my-driving-game/
├── src/                    ← React + game code
│   ├── main.jsx            ← App entry point
│   ├── game/
│   │   ├── GameLoop.js     ← requestAnimationFrame loop
│   │   ├── GamepadManager.js  ← Controller input (see Section 3)
│   │   ├── Physics.js      ← Cannon.js / Rapier physics
│   │   └── Renderer.js     ← Three.js scene
│   └── components/
├── electron/
│   ├── main.js             ← Electron entry point
│   └── preload.js          ← Optional: Node API bridge
├── public/
│   ├── icon.png            ← App icon (512x512 recommended)
│   ├── icon.ico            ← Windows icon
│   └── icon.icns           ← macOS icon
├── docs/
│   └── GAME_PIPELINE.md    ← This file
├── .github/
│   └── workflows/
│       └── build.yml       ← CI/CD pipeline
├── package.json
└── vite.config.js
```

### Connect Replit to GitHub

1. Open your Replit project
2. Click the **Git** tab in the left sidebar (branch icon)
3. Connect to your GitHub account and create a new repo
4. Every push from Replit's Shell tab syncs to GitHub and can trigger Actions

---

## 3. Gamepad API — Full Controller Reference

### How the API Works

The **Web Gamepad API** is built into every modern browser (Chrome, Firefox, Edge, Safari) and works identically inside Electron. **No npm packages required.**

Key behavior to understand:
- Browsers do **not** fire events continuously while a controller is held — you must **poll** it every frame
- `navigator.getGamepads()` returns a **snapshot** of the current state — call it inside `requestAnimationFrame`
- Controllers must be **interacted with** (press a button) before the browser exposes them — just plugging in isn't always enough
- When `gp.mapping === "standard"`, the browser has auto-remapped it to a known layout (works for Xbox/PS/Switch). Wheels and joysticks often return `""` and require manual mapping.

> ⚠️ **Replit iframe warning:** The Gamepad API may be blocked inside Replit's embedded preview pane. Always click **"Open in new tab"** when testing with a physical controller.

---

### Detecting Controllers

Create `src/game/GamepadManager.js`:

```javascript
// GamepadManager.js
// Drop-in controller manager. Works for gamepads, wheels, and joysticks.

class GamepadManager {
  constructor() {
    this.controllers = {};
    this._initListeners();
  }

  _initListeners() {
    window.addEventListener("gamepadconnected", (e) => {
      const gp = e.gamepad;
      console.log(`✅ Controller connected [${gp.index}]: ${gp.id}`);
      console.log(`   Buttons: ${gp.buttons.length} | Axes: ${gp.axes.length}`);
      console.log(`   Mapping: ${gp.mapping || "non-standard (wheel/joystick)"}`);
      this.controllers[gp.index] = gp;
    });

    window.addEventListener("gamepaddisconnected", (e) => {
      console.log(`❌ Controller disconnected: ${e.gamepad.id}`);
      delete this.controllers[e.gamepad.index];
    });
  }

  // Call this EVERY frame inside your requestAnimationFrame loop
  poll() {
    const gamepads = navigator.getGamepads(); // Always returns fresh snapshot
    for (const gp of gamepads) {
      if (gp) this.controllers[gp.index] = gp;
    }
    return this.controllers;
  }

  // Get the first connected controller
  getPrimary() {
    return Object.values(this.controllers)[0] || null;
  }

  isConnected() {
    return Object.keys(this.controllers).length > 0;
  }
}

export default new GamepadManager();
```

---

### Standard Gamepad Layout (Xbox / PS / Switch Pro)

When `gp.mapping === "standard"`, all buttons and axes follow the W3C standard layout:

```javascript
// src/game/input/readStandardGamepad.js

export function readStandardGamepad(gp) {
  return {
    // ── FACE BUTTONS ──────────────────────────────────────
    a:          gp.buttons[0].pressed,   // A / Cross
    b:          gp.buttons[1].pressed,   // B / Circle
    x:          gp.buttons[2].pressed,   // X / Square
    y:          gp.buttons[3].pressed,   // Y / Triangle

    // ── SHOULDER BUTTONS ──────────────────────────────────
    lb:         gp.buttons[4].pressed,   // Left Bumper (L1)
    rb:         gp.buttons[5].pressed,   // Right Bumper (R1)

    // Analog triggers — value is 0.0 (released) to 1.0 (fully pressed)
    lt:         gp.buttons[6].value,     // Left Trigger (L2)
    rt:         gp.buttons[7].value,     // Right Trigger (R2)

    // ── SYSTEM BUTTONS ────────────────────────────────────
    select:     gp.buttons[8].pressed,
    start:      gp.buttons[9].pressed,

    // ── D-PAD ─────────────────────────────────────────────
    dUp:        gp.buttons[12].pressed,
    dDown:      gp.buttons[13].pressed,
    dLeft:      gp.buttons[14].pressed,
    dRight:     gp.buttons[15].pressed,

    // ── ANALOG STICKS — range: -1.0 to +1.0 ──────────────
    // Left stick
    leftX:  gp.axes[0],  // -1 = left,    +1 = right
    leftY:  gp.axes[1],  // -1 = up,       +1 = down

    // Right stick
    rightX: gp.axes[2],  // -1 = left,    +1 = right
    rightY: gp.axes[3],  // -1 = up,       +1 = down
  };
}
```

---

### Racing Wheel (Logitech G29 / Thrustmaster)

Racing wheels expose more axes than standard gamepads. Axis layout varies by model and driver — **always run the detection utility first** to find your specific mapping.

#### Step 1 — Detection Utility (run once, log your mappings)

```javascript
// Paste this into your browser console while your wheel is connected
// Rotate the wheel and press each pedal to see which axis responds

function detectWheelAxes() {
  const loop = () => {
    const gp = navigator.getGamepads()[0];
    if (!gp) { console.log("No controller found"); return; }

    console.clear();
    console.log(`Controller: ${gp.id}`);
    console.log("--- AXES (move your wheel/pedals) ---");
    gp.axes.forEach((val, i) => {
      const bar = "█".repeat(Math.round((val + 1) * 10));
      console.log(`  Axis[${i}]: ${val.toFixed(3).padStart(7)} ${bar}`);
    });
    console.log("--- BUTTONS (press each button/paddle) ---");
    gp.buttons.forEach((btn, i) => {
      if (btn.pressed || btn.value > 0.05) {
        console.log(`  Button[${i}] PRESSED — value: ${btn.value.toFixed(3)}`);
      }
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

detectWheelAxes();
```

#### Step 2 — Read the wheel (typical Logitech G29 mapping)

```javascript
// src/game/input/readRacingWheel.js
import { applyDeadzone } from "./deadzone";

export function readRacingWheel(gp) {
  // NOTE: Pedal axes are typically inverted (-1 = fully pressed, +1 = released)
  // Remap so 0 = no input, 1 = full input
  const remapPedal = (axisVal) => 1 - (axisVal + 1) / 2;

  return {
    // Steering: -1 = full left, 0 = center, +1 = full right
    steering:       applyDeadzone(gp.axes[0], 0.03),

    // Pedals (remapped to 0–1)
    throttle:       remapPedal(gp.axes[1]),   // Gas
    brake:          remapPedal(gp.axes[2]),   // Brake
    clutch:         remapPedal(gp.axes[3]),   // Clutch (if present)

    // Paddle shifters (check your detection utility for correct indices)
    shiftUp:        gp.buttons[4].pressed,
    shiftDown:      gp.buttons[5].pressed,

    // Common face buttons on the wheel hub
    horn:           gp.buttons[23]?.pressed ?? false,

    // Raw steering value (before deadzone) — useful for FFB calculations
    steeringRaw:    gp.axes[0],
  };
}
```

> 💡 **Force Feedback on wheels:** Browser FFB support is limited. The `hapticActuators` API may trigger wheel resistance on supported Thrustmaster wheels in Chrome. Logitech wheels generally require their own driver software for full FFB — this is a hardware/driver limitation, not a code limitation.

---

### Joystick / Flight Stick

```javascript
// src/game/input/readJoystick.js
import { applyDeadzone } from "./deadzone";

export function readJoystick(gp) {
  return {
    // Primary stick axes
    roll:       applyDeadzone(gp.axes[0]),   // Left/right tilt
    pitch:      applyDeadzone(gp.axes[1]),   // Forward/back tilt
    yaw:        applyDeadzone(gp.axes[2]),   // Twist (if joystick supports it)
    throttle:   gp.axes[3],                  // Throttle slider — no deadzone (deliberate)

    // Primary buttons
    trigger:    gp.buttons[0].pressed,       // Main trigger
    thumb:      gp.buttons[1].pressed,       // Thumb button

    // POV hat (may appear as buttons OR as axes depending on driver)
    hatUp:      gp.buttons[12]?.pressed ?? false,
    hatDown:    gp.buttons[13]?.pressed ?? false,
    hatLeft:    gp.buttons[14]?.pressed ?? false,
    hatRight:   gp.buttons[15]?.pressed ?? false,
  };
}
```

---

### Deadzone Handling

**Always apply deadzone to analog axes.** Without it, even a centered stick/wheel reports small non-zero values causing unwanted drift.

```javascript
// src/game/input/deadzone.js

/**
 * Applies a deadzone to an analog axis value.
 * Values within the threshold return 0.
 * Values outside are rescaled back to the full -1..1 range.
 *
 * @param {number} value     Raw axis value (-1.0 to 1.0)
 * @param {number} threshold Deadzone size (0.05–0.15 typical)
 * @returns {number}         Clean axis value with deadzone applied
 */
export function applyDeadzone(value, threshold = 0.08) {
  if (Math.abs(value) < threshold) return 0;

  // Rescale remaining range back to -1..1
  const sign = value > 0 ? 1 : -1;
  return sign * (Math.abs(value) - threshold) / (1 - threshold);
}

// Recommended thresholds by device type:
// Standard gamepad sticks:  0.08–0.12
// Racing wheel steering:    0.02–0.05 (smaller — wheels are more precise)
// Joystick:                 0.08–0.15 (older sticks may need higher)
// Pedals:                   0.02 (almost none — any input should register)
```

---

### Force Feedback / Rumble

```javascript
// src/game/input/haptics.js

/**
 * Triggers controller rumble/vibration.
 * Works on most standard gamepads in Chrome.
 * Racing wheel FFB varies by model and driver.
 *
 * @param {Gamepad} gamepad
 * @param {number}  duration   Milliseconds
 * @param {number}  strong     Low-frequency motor (0.0–1.0) — "deep" rumble
 * @param {number}  weak       High-frequency motor (0.0–1.0) — "buzz"
 */
export async function rumble(gamepad, duration = 200, strong = 0.8, weak = 0.4) {
  if (!gamepad?.vibrationActuator) return; // Not supported — fail silently

  try {
    await gamepad.vibrationActuator.playEffect("dual-rumble", {
      startDelay: 0,
      duration,
      weakMagnitude: weak,
      strongMagnitude: strong,
    });
  } catch (e) {
    // Silently ignore — haptics unavailable on this platform/controller
  }
}

// Usage examples:
// rumble(gp, 150, 1.0, 0.3);  // Heavy thud (collision)
// rumble(gp, 80,  0.3, 0.8);  // Quick buzz (rumble strip)
// rumble(gp, 500, 0.5, 0.5);  // Sustained shake (off-road)
```

---

### The Game Loop Pattern

```javascript
// src/game/GameLoop.js
// Integrates GamepadManager into your requestAnimationFrame loop

import { useEffect, useRef, useCallback } from "react";
import GamepadManager from "./GamepadManager";
import { readStandardGamepad } from "./input/readStandardGamepad";
import { readRacingWheel } from "./input/readRacingWheel";
import { readJoystick } from "./input/readJoystick";

function getInputReader(gp) {
  if (!gp) return null;
  const id = gp.id.toLowerCase();

  if (gp.mapping === "standard") return readStandardGamepad;
  if (id.includes("wheel") || id.includes("g29") || id.includes("thrustmaster")) return readRacingWheel;
  if (id.includes("joystick") || id.includes("hotas") || id.includes("stick")) return readJoystick;

  // Unknown controller — default to standard layout and log for debugging
  console.warn("Unknown controller type, defaulting to standard layout:", gp.id);
  return readStandardGamepad;
}

export function useGameLoop(onFrame) {
  const rafRef = useRef();

  const loop = useCallback((timestamp) => {
    // 1. Get fresh controller state
    const controllers = GamepadManager.poll();
    const gp = GamepadManager.getPrimary();

    // 2. Parse input based on controller type
    const readInput = getInputReader(gp);
    const input = gp && readInput ? readInput(gp) : null;

    // 3. Run your game update with the current input + timestamp
    onFrame({ input, gp, timestamp, hasController: !!gp });

    rafRef.current = requestAnimationFrame(loop);
  }, [onFrame]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);
}

// Usage in your driving game component:
//
// function DrivingGame() {
//   useGameLoop(({ input, timestamp }) => {
//     if (input) {
//       updateCarPhysics({
//         steering: input.steering,
//         throttle: input.throttle,
//         brake:    input.brake,
//       });
//     }
//     renderFrame(timestamp);
//   });
//
//   return <canvas id="game" width={1280} height={720} />;
// }
```

---

## 4. Electron — Desktop Packaging

Electron bundles your web game with a copy of Chromium into a native installable application. The Gamepad API works inside Electron **identically** to the browser — zero changes to your controller code.

### Install dependencies

```bash
npm install --save-dev electron electron-builder concurrently wait-on
```

### electron/main.js

```javascript
const { app, BrowserWindow } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: "My Driving Game",
    icon: path.join(__dirname, "../public/icon.png"),
    // Remove default menu bar for a cleaner game window
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,  // Keep false for security
      contextIsolation: true,
    },
  });

  if (isDev) {
    // Dev: load from Vite dev server
    win.loadURL("http://localhost:5173");
  } else {
    // Production: load from built static files
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

### package.json — build configuration

```json
{
  "name": "my-driving-game",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "vite build && electron-builder"
  },
  "build": {
    "appId": "com.yourstudio.my-driving-game",
    "productName": "My Driving Game",
    "directories": { "output": "release" },
    "files": ["dist/**/*", "electron/**/*"],
    "win": {
      "target": "nsis",
      "icon": "public/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "public/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "public/icon.png",
      "category": "Game"
    }
  }
}
```

### Local development with Electron

```bash
# Run in Replit's Shell tab:
npm run electron:dev

# This starts Vite dev server AND Electron simultaneously.
# Hot reload works — changes in src/ refresh the game window instantly.
```

---

## 5. GitHub Actions — Automated Builds

This workflow triggers on every version tag push, builds all three platforms in parallel, and attaches the binaries to a GitHub Release automatically.

### .github/workflows/build.yml

```yaml
name: Build & Release Game

on:
  push:
    tags:
      - "v*"   # Triggers on tags like v1.0.0, v1.2.3-beta

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build web assets (Vite)
        run: npm run build

      - name: Package Electron app
        run: npx electron-builder --publish never
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload to GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            release/*.exe
            release/*.dmg
            release/*.AppImage
            release/*.zip
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### How to trigger a release from Replit

```bash
# In Replit's Shell tab:

# 1. Stage and commit your changes
git add .
git commit -m "feat: ready for v1.0.0 release"

# 2. Create a version tag
git tag v1.0.0

# 3. Push both commit and tag to GitHub
git push origin main --tags

# GitHub Actions will now:
#   → Spin up Windows, macOS, and Linux build runners
#   → Install deps, build Vite assets, run electron-builder
#   → Create a GitHub Release named "v1.0.0"
#   → Attach .exe, .dmg, .AppImage files as downloadable assets
#
# Build time: ~8–12 minutes
# Find the binaries at: github.com/[you]/[repo]/releases
```

> 💡 `GITHUB_TOKEN` is automatically injected by GitHub Actions — you don't need to create it. Your release binaries will be publicly downloadable from your repo's **Releases** tab.

---

## 6. itch.io — Distribution

itch.io is the best first launch platform for indie games. Free to list, accepts both web (HTML5) and downloadable builds, and has a passionate indie community.

### Option A — Web Game (No Install)

Upload your `dist/` folder as a ZIP. Players click Play directly in the browser — no download required.

```bash
# Build the web version
npm run build

# Zip the output (Mac/Linux)
cd dist && zip -r ../game-web.zip . && cd ..

# Zip the output (Windows PowerShell)
Compress-Archive -Path dist\* -DestinationPath game-web.zip
```

On itch.io:
- Upload `game-web.zip`
- Set **Kind of project** → `HTML`
- Check **"This file will be played in the browser"`
- Set viewport size to `1280 x 720`

> ⚠️ Gamepad API works in most itch.io browser embeds, but racing wheels sometimes need the full-page view. Add a note in your game description: *"For best results with a steering wheel, click 'Open game in new tab'."*

### Option B — Downloadable via butler CLI

**butler** is itch.io's official deployment CLI. It enables one-command deploys and version tracking.

```bash
# Install butler from: https://itch.io/docs/butler/installing.html

# Authenticate once
butler login

# Push each platform build
butler push release/MyDrivingGame-Setup.exe  yourusername/my-driving-game:windows
butler push release/MyDrivingGame.dmg        yourusername/my-driving-game:mac
butler push release/MyDrivingGame.AppImage   yourusername/my-driving-game:linux
```

### Option C — Fully Automated (GitHub Actions + butler)

Add this step to your `build.yml` after the electron-builder step:

```yaml
      - name: Deploy to itch.io via butler
        uses: josephbmanley/butler-publish-itchio-action@master
        env:
          BUTLER_CREDENTIALS: ${{ secrets.BUTLER_API_KEY }}
          ITCH_GAME: my-driving-game
          ITCH_USER: yourusername
          CHANNEL: ${{ matrix.os == 'windows-latest' && 'windows' || matrix.os == 'macos-latest' && 'mac' || 'linux' }}
          PACKAGE: release/
```

Get your `BUTLER_API_KEY` from: **itch.io → Account Settings → API Keys**  
Add it to GitHub: **Repo → Settings → Secrets and Variables → Actions → New Secret**

---

## 7. Steam — When You're Ready

Steam is a later-stage move once the game is polished and you want that storefront. The main hurdles are business requirements, not technical ones.

### Requirements checklist

| Item | Details | Cost |
|---|---|---|
| Steamworks Partner account | steamworks.steampowered.com | $100 one-time |
| App ID | Assigned after approval | Included |
| Store page assets | Capsule images, screenshots, trailer | Your time |
| Steamworks SDK | For achievements, leaderboards, cloud saves | Free |
| greenworks (npm) | Bridges Steamworks C++ SDK to Electron/Node | Free |
| SteamPipe | CLI tool for uploading builds | Free |
| Review period | 30 days from first upload before going live | Time only |

### Adding Steamworks to Electron (greenworks)

```bash
npm install greenworks
```

```javascript
// electron/main.js — add before createWindow()

let steam = null;

try {
  const greenworks = require("greenworks");
  if (greenworks.init()) {
    steam = greenworks;
    console.log("Steam initialized ✅");
  }
} catch (e) {
  console.warn("Steam not available — running in standalone mode");
  // Game works fine without Steam. Good for itch.io builds.
}

// Expose to renderer via preload.js if needed for achievements etc.
```

```javascript
// Unlock an achievement (call from your game logic)
function unlockAchievement(achievementId) {
  if (!steam) return;
  steam.activateAchievement(achievementId, () => {
    console.log("Achievement unlocked:", achievementId);
  });
}
```

### Uploading a build via SteamPipe

```bash
# 1. Download Steamworks SDK from partner.steamgames.com
# 2. Create app_build_APPID.vdf with your depot and build path config
# 3. Upload:

steamcmd +login your_steam_username \
  +run_app_build ~/steamworks/scripts/app_build_YOURAPPID.vdf \
  +quit
```

> 💡 The Gamepad API continues to work inside Electron + Steam builds with zero changes. Steamworks adds the store layer (achievements, leaderboards, cloud saves) on top of your existing game code.

---

## 8. Replit-Specific Tips

| Situation | Solution |
|---|---|
| Controller not detected in Replit preview | Click **"Open in new tab"** — iframe blocks Gamepad API |
| `electron-builder` runs out of memory on Replit | Build binaries via GitHub Actions only — don't run it in Replit |
| Pushing to GitHub from Replit | Use the Git tab or `git push origin main` in Shell |
| Testing Electron locally | Run `npm run electron:dev` in Replit Shell (requires desktop, not browser) |
| Hot reload during dev | Vite HMR works inside the Electron dev window |
| Icon generation | Use [realfavicongenerator.net](https://realfavicongenerator.net) to generate .ico and .icns from a single PNG |

---

## 9. Quick Reference Cheatsheet

```bash
# ── DAILY DEVELOPMENT ─────────────────────────────────────
npm run dev                    # Start Vite dev server (browser)
npm run electron:dev           # Start game in Electron window

# ── RELEASE A NEW VERSION ─────────────────────────────────
git add .
git commit -m "feat: v1.0.0"
git tag v1.0.0
git push origin main --tags    # Triggers GitHub Actions build

# ── MANUAL ITCH.IO DEPLOY ─────────────────────────────────
butler push release/*.exe yourusername/game-slug:windows
butler push release/*.dmg yourusername/game-slug:mac
butler push release/*.AppImage yourusername/game-slug:linux

# ── GAMEPAD API QUICK CHECKS ──────────────────────────────
navigator.getGamepads()                    # Get all connected controllers
gp.id                                      # Controller name/ID string
gp.mapping                                 # "standard" or "" (non-standard)
gp.buttons[0].pressed                      # Button press (boolean)
gp.buttons[6].value                        # Analog trigger (0.0–1.0)
gp.axes[0]                                 # Axis value (-1.0 to +1.0)
gp.vibrationActuator.playEffect(...)       # Haptic rumble
```

### Controller type quick-ID

| `gp.mapping` | `gp.id` contains | Use reader |
|---|---|---|
| `"standard"` | anything | `readStandardGamepad` |
| `""` | "wheel", "G29", "Thrustmaster" | `readRacingWheel` |
| `""` | "joystick", "HOTAS", "stick" | `readJoystick` |
| `""` | unknown | Run detection utility, then map manually |

---

*Generated for TechA11y / RLM game pipeline — Brian Bosak*  
*Stack: Replit · Vite · React · Three.js · Cannon.js · Electron · GitHub Actions · itch.io*
