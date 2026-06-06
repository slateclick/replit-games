# 🕹️ Replit → Game Distribution Pipeline

**A complete, copy-paste reference for building browser-based games in Replit and shipping them as downloadable desktop apps on itch.io or Steam.**

Covers the full stack: Web Gamepad API (gamepads, racing wheels, joysticks) · Electron packaging · GitHub Actions CI · itch.io deployment · Steam / Steamworks integration.

---

> **Who this is for:** Indie devs building games in Replit with a React / Vite / Node.js stack who want to ship a real downloadable product — not just a browser URL.

---

## Contents

1. [How the Pipeline Works](#1-how-the-pipeline-works)
2. [Project Structure](#2-project-structure)
3. [Gamepad API — Controller Input](#3-gamepad-api--controller-input)
   - [How It Works](#how-it-works)
   - [GamepadManager (drop-in class)](#gamepadmanager-drop-in-class)
   - [Standard Gamepad (Xbox / PS / Switch Pro)](#standard-gamepad-xbox--ps--switch-pro)
   - [Racing Wheel (Logitech G29 / Thrustmaster)](#racing-wheel-logitech-g29--thrustmaster)
   - [Joystick / Flight Stick](#joystick--flight-stick)
   - [Deadzone Handling](#deadzone-handling)
   - [Force Feedback / Rumble](#force-feedback--rumble)
   - [Game Loop Integration](#game-loop-integration)
4. [Electron — Desktop Packaging](#4-electron--desktop-packaging)
5. [GitHub Actions — Automated Builds](#5-github-actions--automated-builds)
6. [itch.io — Distribution](#6-itchio--distribution)
7. [Steam — When You're Ready](#7-steam--when-youre-ready)
8. [Replit Tips & Gotchas](#8-replit-tips--gotchas)
9. [Quick Reference Cheatsheet](#9-quick-reference-cheatsheet)
10. [Contributing](#10-contributing)
11. [License](#11-license)

---

## 1. How the Pipeline Works

Replit is your dev environment — not a distribution platform. This repo documents the chain of free tools that takes you from "game running in a browser tab" to "installer players can download."

```
┌─────────────┐    git push     ┌──────────────┐   tag trigger    ┌───────────────────────┐
│   Replit    │ ──────────────▶ │    GitHub    │ ───────────────▶ │  GitHub Actions CI    │
│  (write &   │                 │  (version    │                  │  Builds on Windows,   │
│   iterate)  │                 │   control)   │                  │  macOS, and Linux     │
└─────────────┘                 └──────────────┘                  └──────────┬────────────┘
                                                                             │
                                                                  .exe / .dmg / .AppImage
                                                                             │
                                                                  ┌──────────▼────────────┐
                                                                  │   GitHub Release  +   │
                                                                  │   itch.io / Steam     │
                                                                  └───────────────────────┘
```

| Tool | Role | Cost |
|---|---|---|
| **Replit** | Write code, iterate, test in browser | Free / Replit Core |
| **GitHub** | Version control, triggers CI/CD | Free |
| **GitHub Actions** | Cross-platform binary compilation | Free (2,000 min/month) |
| **Electron** | Wraps web game into .exe / .dmg / .AppImage | Free, open source |
| **itch.io** | Game distribution — web embed and downloadable | Free |
| **Steam** | Premium game storefront | $100 one-time |

---

## 2. Project Structure

```
my-game/
├── src/
│   ├── main.jsx                     ← React entry point
│   └── game/
│       ├── GameLoop.js              ← requestAnimationFrame loop
│       ├── GamepadManager.js        ← Controller input (Section 3)
│       ├── Physics.js               ← Cannon.js / Rapier
│       ├── Renderer.js              ← Three.js scene
│       └── input/
│           ├── readStandardGamepad.js
│           ├── readRacingWheel.js
│           ├── readJoystick.js
│           ├── deadzone.js
│           └── haptics.js
├── electron/
│   ├── main.js                      ← Electron entry point
│   └── preload.js                   ← Optional Node API bridge
├── public/
│   ├── icon.png                     ← 512×512 source icon
│   ├── icon.ico                     ← Windows
│   └── icon.icns                    ← macOS
├── .github/
│   └── workflows/
│       └── build.yml                ← CI/CD pipeline (Section 5)
├── package.json
├── vite.config.js
└── README.md                        ← This file
```

### Connect Replit to GitHub

1. Open your Replit project and click the **Git** tab (left sidebar)
2. Sign in with GitHub and create a new repo
3. Use `git push origin main` from the Replit Shell — Actions triggers automatically

---

## 3. Gamepad API — Controller Input

### How It Works

The **Web Gamepad API** is built into every modern browser (Chrome, Firefox, Edge, Safari) and works **identically inside Electron** — no npm packages required.

Key rules:

- The browser does **not** emit continuous events while a button is held — you must **poll every frame**
- `navigator.getGamepads()` returns a **snapshot** — call it inside `requestAnimationFrame`
- A controller must be **interacted with** (press any button) before the browser exposes it — plugging in alone isn't enough
- `gp.mapping === "standard"` means the browser has auto-mapped it to the W3C standard layout (Xbox, PS, Switch Pro). Racing wheels and joysticks typically return `""` and need manual mapping

> ⚠️ **Replit preview pane:** The Gamepad API is blocked inside Replit's embedded iframe. Always click **"Open in new tab"** when testing with a physical controller.

---

### GamepadManager (drop-in class)

Create `src/game/GamepadManager.js`:

```javascript
class GamepadManager {
  constructor() {
    this.controllers = {};
    this._initListeners();
  }

  _initListeners() {
    window.addEventListener("gamepadconnected", (e) => {
      const gp = e.gamepad;
      console.log(`✅ Connected [${gp.index}]: ${gp.id}`);
      console.log(`   Buttons: ${gp.buttons.length} | Axes: ${gp.axes.length}`);
      console.log(`   Mapping: ${gp.mapping || "non-standard (wheel/joystick)"}`);
      this.controllers[gp.index] = gp;
    });

    window.addEventListener("gamepaddisconnected", (e) => {
      console.log(`❌ Disconnected: ${e.gamepad.id}`);
      delete this.controllers[e.gamepad.index];
    });
  }

  // Call every frame — navigator.getGamepads() always returns a fresh snapshot
  poll() {
    for (const gp of navigator.getGamepads()) {
      if (gp) this.controllers[gp.index] = gp;
    }
    return this.controllers;
  }

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

### Standard Gamepad (Xbox / PS / Switch Pro)

```javascript
// src/game/input/readStandardGamepad.js

export function readStandardGamepad(gp) {
  return {
    // Face buttons
    a:        gp.buttons[0].pressed,   // A / Cross
    b:        gp.buttons[1].pressed,   // B / Circle
    x:        gp.buttons[2].pressed,   // X / Square
    y:        gp.buttons[3].pressed,   // Y / Triangle

    // Shoulder buttons
    lb:       gp.buttons[4].pressed,   // Left Bumper  (L1)
    rb:       gp.buttons[5].pressed,   // Right Bumper (R1)

    // Analog triggers — 0.0 (released) to 1.0 (fully pressed)
    lt:       gp.buttons[6].value,     // Left Trigger  (L2)
    rt:       gp.buttons[7].value,     // Right Trigger (R2)

    // System
    select:   gp.buttons[8].pressed,
    start:    gp.buttons[9].pressed,

    // D-Pad
    dUp:      gp.buttons[12].pressed,
    dDown:    gp.buttons[13].pressed,
    dLeft:    gp.buttons[14].pressed,
    dRight:   gp.buttons[15].pressed,

    // Analog sticks — -1.0 to +1.0
    leftX:    gp.axes[0],   // -1 = left,  +1 = right
    leftY:    gp.axes[1],   // -1 = up,    +1 = down
    rightX:   gp.axes[2],
    rightY:   gp.axes[3],
  };
}
```

---

### Racing Wheel (Logitech G29 / Thrustmaster)

Axis layout varies by model and driver. **Run the detection utility first** to find your specific mapping.

#### Detection Utility — run once in browser console

```javascript
// Paste into DevTools console with your wheel connected.
// Rotate the wheel and press each pedal — watch which axis responds.

function detectWheelAxes() {
  const loop = () => {
    const gp = navigator.getGamepads()[0];
    if (!gp) { console.log("No controller found"); return; }

    console.clear();
    console.log(`Controller: ${gp.id}`);
    console.log("--- AXES ---");
    gp.axes.forEach((val, i) => {
      const bar = "█".repeat(Math.round((val + 1) * 10));
      console.log(`  Axis[${i}]: ${val.toFixed(3).padStart(7)}  ${bar}`);
    });
    console.log("--- BUTTONS (press each one) ---");
    gp.buttons.forEach((btn, i) => {
      if (btn.pressed || btn.value > 0.05)
        console.log(`  Button[${i}] pressed — value: ${btn.value.toFixed(3)}`);
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
detectWheelAxes();
```

#### Reading the wheel

```javascript
// src/game/input/readRacingWheel.js
// Typical mapping for Logitech G29 — verify with detection utility above

import { applyDeadzone } from "./deadzone";

export function readRacingWheel(gp) {
  // Pedal axes are usually inverted: -1 = fully pressed, +1 = released
  // Remap to: 0 = no input, 1 = full input
  const remapPedal = (v) => 1 - (v + 1) / 2;

  return {
    steering:    applyDeadzone(gp.axes[0], 0.03),  // -1 (left) to +1 (right)
    throttle:    remapPedal(gp.axes[1]),
    brake:       remapPedal(gp.axes[2]),
    clutch:      remapPedal(gp.axes[3]),            // omit if no clutch pedal

    shiftUp:     gp.buttons[4].pressed,             // Right paddle
    shiftDown:   gp.buttons[5].pressed,             // Left paddle
    horn:        gp.buttons[23]?.pressed ?? false,

    steeringRaw: gp.axes[0],                        // Pre-deadzone, useful for FFB
  };
}
```

> **Force feedback note:** Browser FFB support via `hapticActuators` is limited. Logitech wheels require their own Logitech G HUB drivers for full FFB — that's a hardware/driver constraint, not a code one.

---

### Joystick / Flight Stick

```javascript
// src/game/input/readJoystick.js

import { applyDeadzone } from "./deadzone";

export function readJoystick(gp) {
  return {
    roll:      applyDeadzone(gp.axes[0]),   // Left/right tilt
    pitch:     applyDeadzone(gp.axes[1]),   // Forward/back tilt
    yaw:       applyDeadzone(gp.axes[2]),   // Twist (if supported)
    throttle:  gp.axes[3],                  // Throttle slider — no deadzone intentional

    trigger:   gp.buttons[0].pressed,
    thumb:     gp.buttons[1].pressed,

    // POV hat — may appear as buttons or axes depending on the driver
    hatUp:     gp.buttons[12]?.pressed ?? false,
    hatDown:   gp.buttons[13]?.pressed ?? false,
    hatLeft:   gp.buttons[14]?.pressed ?? false,
    hatRight:  gp.buttons[15]?.pressed ?? false,
  };
}
```

---

### Deadzone Handling

Always apply deadzone to analog axes. Without it, a centered stick or wheel still reports small non-zero values that cause drift.

```javascript
// src/game/input/deadzone.js

/**
 * Applies deadzone to an analog axis value, then rescales to the full -1..1 range.
 *
 * @param {number} value      Raw axis value (-1.0 to 1.0)
 * @param {number} threshold  Deadzone size
 * @returns {number}
 */
export function applyDeadzone(value, threshold = 0.08) {
  if (Math.abs(value) < threshold) return 0;
  const sign = value > 0 ? 1 : -1;
  return sign * (Math.abs(value) - threshold) / (1 - threshold);
}

// Recommended thresholds:
//   Standard gamepad sticks : 0.08 – 0.12
//   Racing wheel steering   : 0.02 – 0.05  (wheels are more precise)
//   Joystick                : 0.08 – 0.15  (older sticks need more)
//   Pedals                  : 0.02          (almost none — register any input)
```

---

### Force Feedback / Rumble

```javascript
// src/game/input/haptics.js

/**
 * Triggers dual-motor rumble. Works on most gamepads in Chrome.
 * Racing wheel FFB varies by model/driver.
 *
 * @param {Gamepad} gamepad
 * @param {number}  duration  Milliseconds
 * @param {number}  strong    Low-frequency motor 0.0–1.0 ("deep" rumble)
 * @param {number}  weak      High-frequency motor 0.0–1.0 ("buzz")
 */
export async function rumble(gamepad, duration = 200, strong = 0.8, weak = 0.4) {
  if (!gamepad?.vibrationActuator) return;
  try {
    await gamepad.vibrationActuator.playEffect("dual-rumble", {
      startDelay: 0,
      duration,
      weakMagnitude: weak,
      strongMagnitude: strong,
    });
  } catch (_) {
    // Silently ignore — haptics unavailable on this platform or controller
  }
}

// Examples:
// rumble(gp, 150, 1.0, 0.3)  → heavy thud (collision)
// rumble(gp, 80,  0.3, 0.8)  → quick buzz (rumble strip)
// rumble(gp, 500, 0.5, 0.5)  → sustained shake (off-road)
```

---

### Game Loop Integration

```javascript
// src/game/GameLoop.js

import { useEffect, useRef, useCallback } from "react";
import GamepadManager from "./GamepadManager";
import { readStandardGamepad } from "./input/readStandardGamepad";
import { readRacingWheel }     from "./input/readRacingWheel";
import { readJoystick }        from "./input/readJoystick";

function getInputReader(gp) {
  if (!gp) return null;
  const id = gp.id.toLowerCase();
  if (gp.mapping === "standard") return readStandardGamepad;
  if (id.includes("wheel") || id.includes("g29") || id.includes("thrustmaster")) return readRacingWheel;
  if (id.includes("joystick") || id.includes("hotas") || id.includes("stick")) return readJoystick;
  console.warn("Unknown controller — defaulting to standard layout:", gp.id);
  return readStandardGamepad;
}

export function useGameLoop(onFrame) {
  const rafRef = useRef();

  const loop = useCallback((timestamp) => {
    GamepadManager.poll();
    const gp = GamepadManager.getPrimary();
    const readInput = getInputReader(gp);
    const input = gp && readInput ? readInput(gp) : null;

    onFrame({ input, gp, timestamp, hasController: !!gp });
    rafRef.current = requestAnimationFrame(loop);
  }, [onFrame]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);
}

// Usage:
//
// function DrivingGame() {
//   useGameLoop(({ input }) => {
//     if (input) updateCarPhysics(input.steering, input.throttle, input.brake);
//   });
//   return <canvas id="game" width={1280} height={720} />;
// }
```

---

## 4. Electron — Desktop Packaging

Electron bundles your web game with a copy of Chromium into a native app. The Gamepad API works inside Electron **exactly** as in the browser — no changes needed to your controller code.

### Install

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
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../public/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  isDev
    ? win.loadURL("http://localhost:5173")
    : win.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
```

### package.json — build section

```json
{
  "name": "my-game",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "vite build && electron-builder"
  },
  "build": {
    "appId": "com.yourstudio.my-game",
    "productName": "My Game",
    "directories": { "output": "release" },
    "files": ["dist/**/*", "electron/**/*"],
    "win":   { "target": "nsis",     "icon": "public/icon.ico"  },
    "mac":   { "target": "dmg",      "icon": "public/icon.icns" },
    "linux": { "target": "AppImage", "icon": "public/icon.png", "category": "Game" }
  }
}
```

### Dev workflow

```bash
npm run electron:dev   # Starts Vite + Electron simultaneously, with hot reload
```

---

## 5. GitHub Actions — Automated Builds

On every version tag push, this workflow builds Windows, macOS, and Linux binaries in parallel and attaches them to a GitHub Release automatically.

### .github/workflows/build.yml

```yaml
name: Build & Release

on:
  push:
    tags:
      - "v*"

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci

      - name: Build web assets
        run: npm run build

      - name: Package with Electron Builder
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

### Triggering a release from Replit

```bash
git add .
git commit -m "feat: v1.0.0"
git tag v1.0.0
git push origin main --tags
# Actions spins up, builds all 3 platforms (~8–12 min), creates a GitHub Release
# Players download from: github.com/[you]/[repo]/releases
```

> `GITHUB_TOKEN` is injected automatically by GitHub Actions — you don't need to create it.

---

## 6. itch.io — Distribution

itch.io is the recommended first-launch platform. Free to list, supports both browser play and downloadable builds.

### Option A — Browser game (no install)

```bash
npm run build
cd dist && zip -r ../game-web.zip . && cd ..
```

Upload `game-web.zip` to itch.io → set Kind of project: **HTML** → check **"This file will be played in the browser"** → set viewport to **1280 × 720**.

> **Wheel users:** Racing wheels sometimes need a full browser tab. Add this to your game description: *"For best experience with a steering wheel, click 'Open game in new tab'."*

### Option B — Downloadable via butler CLI

```bash
# Install: https://itch.io/docs/butler/installing.html
butler login

butler push release/MyGame-Setup.exe  yourname/my-game:windows
butler push release/MyGame.dmg        yourname/my-game:mac
butler push release/MyGame.AppImage   yourname/my-game:linux
```

### Option C — Fully automated (GitHub Actions + butler)

Add after the electron-builder step in `build.yml`:

```yaml
      - name: Deploy to itch.io
        uses: josephbmanley/butler-publish-itchio-action@master
        env:
          BUTLER_CREDENTIALS: ${{ secrets.BUTLER_API_KEY }}
          ITCH_GAME: my-game
          ITCH_USER: yourname
          CHANNEL: ${{ matrix.os == 'windows-latest' && 'windows' || matrix.os == 'macos-latest' && 'mac' || 'linux' }}
          PACKAGE: release/
```

Get your key: **itch.io → Account Settings → API Keys**
Add to GitHub: **Repo → Settings → Secrets → Actions → New Secret → `BUTLER_API_KEY`**

---

## 7. Steam — When You're Ready

Steam is a later-stage move. The main hurdles are business requirements; the technical integration is straightforward from an Electron base.

| Requirement | Details | Cost |
|---|---|---|
| Steamworks Partner account | steamworks.steampowered.com | $100 one-time |
| App ID | Assigned after account approval | Included |
| Store page assets | Capsule images, screenshots, trailer | Your time |
| greenworks (npm) | Steamworks SDK bridge for Electron | Free |
| SteamPipe | CLI tool for uploading builds | Free |
| Review period | 30 days before going live | Time only |

### Steamworks integration

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
} catch (_) {
  console.warn("Steam unavailable — running standalone (itch.io mode)");
}

// Unlock an achievement anywhere in your game:
function unlockAchievement(id) {
  steam?.activateAchievement(id, () => console.log("Achievement unlocked:", id));
}
```

### SteamPipe upload

```bash
steamcmd +login your_steam_username \
  +run_app_build ~/steamworks/scripts/app_build_YOURAPPID.vdf \
  +quit
```

> The Gamepad API works in Electron + Steam builds with **zero code changes**. Steamworks adds achievements, leaderboards, and cloud saves on top of your existing game.

---

## 8. Replit Tips & Gotchas

| Situation | Fix |
|---|---|
| Controller not detected | Click **"Open in new tab"** — Replit's preview iframe blocks Gamepad API |
| `electron-builder` fails / OOM | Run it via GitHub Actions only — too heavy for Replit's container |
| Pushing to GitHub | Git tab in sidebar, or `git push origin main` in Shell |
| Hot reload in Electron | Works via Vite HMR — changes reflect instantly in the dev window |
| Icon files | Use [realfavicongenerator.net](https://realfavicongenerator.net) to generate `.ico` and `.icns` from one 512×512 PNG |

---

## 9. Quick Reference Cheatsheet

```bash
# Development
npm run dev               # Vite dev server (browser)
npm run electron:dev      # Game in Electron window (hot reload)

# Release
git add . && git commit -m "feat: v1.0.0"
git tag v1.0.0
git push origin main --tags   # Triggers Actions → builds all platforms

# itch.io manual deploy
butler push release/*.exe  yourname/game:windows
butler push release/*.dmg  yourname/game:mac
butler push release/*.AppImage yourname/game:linux
```

```javascript
// Gamepad API one-liners
navigator.getGamepads()                      // All connected controllers (snapshot)
gp.id                                        // e.g. "Xbox 360 Controller" or "G29..."
gp.mapping                                   // "standard" or "" (non-standard)
gp.buttons[0].pressed                        // Face button (boolean)
gp.buttons[6].value                          // Analog trigger (0.0 – 1.0)
gp.axes[0]                                   // Axis value (-1.0 – +1.0)
gp.vibrationActuator.playEffect("dual-rumble", { ... })  // Haptics
```

### Controller type quick-ID

| `gp.mapping` | `gp.id` contains | Reader to use |
|---|---|---|
| `"standard"` | anything | `readStandardGamepad` |
| `""` | "wheel", "G29", "Thrustmaster" | `readRacingWheel` |
| `""` | "joystick", "HOTAS", "stick" | `readJoystick` |
| `""` | unknown | Run detection utility → map manually |

---

## 10. Contributing

Pull requests are welcome. If you have a verified axis mapping for a specific controller model not covered here (Fanatec, Thrustmaster T300, Logitech G923, HOTAS Warthog, etc.) open a PR adding it to the relevant reader file.

When submitting a mapping, please include:
- Controller model name and firmware version
- OS and browser/Electron version tested on
- The axis/button indices confirmed via the detection utility

---

## 11. License

MIT — free to use, modify, and distribute. Attribution appreciated but not required.

---

*Built by Brian Jagger ([https://github.com/slateclick](https://github.com/slateclick)] · TechA11y*  
*Stack: Replit · Vite · React · Three.js · Cannon.js · Electron · GitHub Actions · itch.io*
