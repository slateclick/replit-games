import { useState } from "react";

const sections = [
  {
    id: "overview",
    label: "Overview",
    icon: "🗺️",
  },
  {
    id: "gamepad",
    label: "Gamepad API",
    icon: "🎮",
  },
  {
    id: "electron",
    label: "Electron Packaging",
    icon: "📦",
  },
  {
    id: "github-actions",
    label: "GitHub Actions",
    icon: "⚙️",
  },
  {
    id: "itchio",
    label: "itch.io Deploy",
    icon: "🚀",
  },
  {
    id: "steam",
    label: "Steam (Later)",
    icon: "🎯",
  },
];

const CodeBlock = ({ code, lang = "js" }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: "relative", margin: "1.2rem 0" }}>
      <div
        style={{
          background: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 14px",
            background: "#161b22",
            borderBottom: "1px solid #30363d",
          }}
        >
          <span style={{ color: "#8b949e", fontSize: "11px", fontFamily: "monospace", letterSpacing: "0.05em" }}>
            {lang}
          </span>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? "#238636" : "transparent",
              border: `1px solid ${copied ? "#238636" : "#30363d"}`,
              borderRadius: "4px",
              color: copied ? "#fff" : "#8b949e",
              cursor: "pointer",
              fontSize: "11px",
              padding: "2px 10px",
              transition: "all 0.2s",
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <pre
          style={{
            margin: 0,
            padding: "16px",
            overflowX: "auto",
            fontSize: "13px",
            lineHeight: "1.7",
            color: "#e6edf3",
            fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
          }}
        >
          <code>{code.trim()}</code>
        </pre>
      </div>
    </div>
  );
};

const Note = ({ type = "info", children }) => {
  const styles = {
    info: { border: "#1f6feb", bg: "#0d1b2e", icon: "ℹ️" },
    warn: { border: "#9e6a03", bg: "#1f1600", icon: "⚠️" },
    tip: { border: "#238636", bg: "#0d1f12", icon: "💡" },
  };
  const s = styles[type];
  return (
    <div
      style={{
        borderLeft: `3px solid ${s.border}`,
        background: s.bg,
        borderRadius: "0 6px 6px 0",
        padding: "10px 16px",
        margin: "1rem 0",
        fontSize: "13.5px",
        color: "#c9d1d9",
        lineHeight: "1.6",
      }}
    >
      <span style={{ marginRight: "8px" }}>{s.icon}</span>
      {children}
    </div>
  );
};

const Badge = ({ children, color = "#1f6feb" }) => (
  <span
    style={{
      background: color + "22",
      border: `1px solid ${color}55`,
      borderRadius: "4px",
      color: color,
      fontSize: "11px",
      fontWeight: 700,
      padding: "2px 8px",
      marginRight: "6px",
      letterSpacing: "0.04em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </span>
);

const H2 = ({ children }) => (
  <h2
    style={{
      color: "#e6edf3",
      fontSize: "20px",
      fontWeight: 700,
      margin: "2rem 0 0.75rem",
      paddingBottom: "8px",
      borderBottom: "1px solid #21262d",
      fontFamily: "'DM Mono', monospace",
      letterSpacing: "-0.01em",
    }}
  >
    {children}
  </h2>
);

const H3 = ({ children }) => (
  <h3
    style={{
      color: "#58a6ff",
      fontSize: "15px",
      fontWeight: 600,
      margin: "1.5rem 0 0.5rem",
      fontFamily: "'DM Mono', monospace",
    }}
  >
    {children}
  </h3>
);

const P = ({ children }) => (
  <p style={{ color: "#c9d1d9", lineHeight: "1.75", fontSize: "14px", margin: "0.5rem 0" }}>
    {children}
  </p>
);

const Table = ({ headers, rows }) => (
  <div style={{ overflowX: "auto", margin: "1rem 0" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th
              key={h}
              style={{
                background: "#161b22",
                border: "1px solid #30363d",
                color: "#8b949e",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "8px 12px",
                textAlign: "left",
                textTransform: "uppercase",
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "#0d1117" }}>
            {row.map((cell, j) => (
              <td
                key={j}
                style={{
                  border: "1px solid #21262d",
                  color: "#e6edf3",
                  padding: "8px 12px",
                  verticalAlign: "top",
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── SECTION CONTENT ───────────────────────────────────────────────────────────

const OverviewSection = () => (
  <div>
    <H2>🗺️ Full Pipeline Overview</H2>
    <P>
      This guide covers the complete path from building a game in Replit all the way to a
      downloadable package on itch.io or Steam — including how to wire up gamepad, racing
      wheel, and joystick controllers in the browser.
    </P>

    <div
      style={{
        background: "#0d1117",
        border: "1px solid #30363d",
        borderRadius: "10px",
        padding: "20px 24px",
        margin: "1.5rem 0",
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#8b949e",
        lineHeight: "2.2",
      }}
    >
      <div style={{ color: "#58a6ff", fontWeight: 700, marginBottom: "8px" }}>PIPELINE FLOW</div>
      <div>
        <span style={{ color: "#3fb950" }}>① Build</span> in Replit (React + Three.js + Gamepad API)
      </div>
      <div style={{ paddingLeft: "20px", color: "#30363d" }}>↓</div>
      <div>
        <span style={{ color: "#3fb950" }}>② Push</span> to GitHub repo
      </div>
      <div style={{ paddingLeft: "20px", color: "#30363d" }}>↓</div>
      <div>
        <span style={{ color: "#3fb950" }}>③ GitHub Actions</span> triggers on push → builds Electron
        .exe / .dmg / .AppImage
      </div>
      <div style={{ paddingLeft: "20px", color: "#30363d" }}>↓</div>
      <div>
        <span style={{ color: "#3fb950" }}>④ Artifacts</span> uploaded to GitHub Release automatically
      </div>
      <div style={{ paddingLeft: "20px", color: "#30363d" }}>↓</div>
      <div>
        <span style={{ color: "#3fb950" }}>⑤ Deploy</span> to itch.io (and later Steam)
      </div>
    </div>

    <Table
      headers={["Stage", "Tool", "Where it runs"]}
      rows={[
        ["Write code", "Replit", "Cloud IDE"],
        ["Version control", "GitHub", "Cloud"],
        ["Desktop packaging", "Electron + electron-builder", "GitHub Actions CI"],
        ["Binary builds", "GitHub Actions (Windows/Mac/Linux)", "CI runners"],
        ["Distribution", "itch.io / Steam", "Platform"],
      ]}
    />

    <Note type="tip">
      Your Replit project connects to GitHub via <strong>Version Control</strong> tab (built-in git). Every push
      triggers the Actions pipeline automatically — no extra tooling needed in Replit itself.
    </Note>
  </div>
);

const GamepadSection = () => (
  <div>
    <H2>🎮 Gamepad API — Full Reference</H2>
    <P>
      The browser's native Gamepad API works for gamepads, racing wheels, joysticks, and flight sticks.
      It requires no npm packages — it's built into Chrome, Firefox, Edge, and Safari.
    </P>

    <Note type="warn">
      When testing in Replit's preview pane (iframe), gamepad events may be blocked. Always
      open your game in a new tab (<strong>Open in new tab</strong> button) when testing controllers.
    </Note>

    <H3>1. Detecting Controller Connection</H3>
    <CodeBlock lang="javascript" code={`
// gamepad-manager.js — put this in your game's entry point

class GamepadManager {
  constructor() {
    this.controllers = {};
    this.init();
  }

  init() {
    // Fired when any controller is plugged in or first interacted with
    window.addEventListener("gamepadconnected", (e) => {
      console.log(\`Controller connected: \${e.gamepad.id}\`);
      console.log(\`  Buttons: \${e.gamepad.buttons.length}\`);
      console.log(\`  Axes: \${e.gamepad.axes.length}\`);
      this.controllers[e.gamepad.index] = e.gamepad;
    });

    // Fired when a controller is unplugged
    window.addEventListener("gamepaddisconnected", (e) => {
      console.log(\`Controller disconnected: \${e.gamepad.id}\`);
      delete this.controllers[e.gamepad.index];
    });
  }

  // Call this every frame inside requestAnimationFrame
  poll() {
    // IMPORTANT: getGamepads() returns a SNAPSHOT — must be called every frame
    const gamepads = navigator.getGamepads();
    for (const gp of gamepads) {
      if (gp) this.controllers[gp.index] = gp;
    }
    return this.controllers;
  }
}

export default new GamepadManager();
    `} />

    <H3>2. Standard Gamepad Layout (Xbox / PS / Switch)</H3>
    <CodeBlock lang="javascript" code={`
// Standard gamepad mapping (works for Xbox, PS4/5, Switch Pro)
// https://w3c.github.io/gamepad/#dfn-standard-gamepad

function readStandardGamepad(gp) {
  return {
    // ── BUTTONS (0 = not pressed, 1 = fully pressed) ──
    a:          gp.buttons[0].pressed,   // Cross / A
    b:          gp.buttons[1].pressed,   // Circle / B
    x:          gp.buttons[2].pressed,   // Square / X
    y:          gp.buttons[3].pressed,   // Triangle / Y

    lb:         gp.buttons[4].pressed,   // Left Bumper (L1)
    rb:         gp.buttons[5].pressed,   // Right Bumper (R1)

    // Analog triggers — value is 0.0 to 1.0
    lt:         gp.buttons[6].value,     // Left Trigger (L2)
    rt:         gp.buttons[7].value,     // Right Trigger (R2)

    select:     gp.buttons[8].pressed,
    start:      gp.buttons[9].pressed,

    // D-Pad
    dUp:        gp.buttons[12].pressed,
    dDown:      gp.buttons[13].pressed,
    dLeft:      gp.buttons[14].pressed,
    dRight:     gp.buttons[15].pressed,

    // ── AXES (-1.0 to +1.0) ──
    leftX:      gp.axes[0],  // Left stick horizontal (-1=left, +1=right)
    leftY:      gp.axes[1],  // Left stick vertical   (-1=up,   +1=down)
    rightX:     gp.axes[2],  // Right stick horizontal
    rightY:     gp.axes[3],  // Right stick vertical
  };
}
    `} />

    <H3>3. Racing Wheel (Logitech G29 / Thrustmaster)</H3>
    <P>Racing wheels register as gamepads but expose more axes — steering, gas, brake, clutch, and often force feedback.</P>
    <CodeBlock lang="javascript" code={`
// Racing wheel axis mapping varies by model.
// Run this detection utility first to map YOUR wheel:

function detectWheelMapping(gp) {
  console.log("=== Wheel Detection Utility ===");
  console.log("Controller ID:", gp.id);
  console.log("\\n--- AXES (rotate wheel, press pedals) ---");
  gp.axes.forEach((val, i) => {
    if (Math.abs(val) > 0.05) { // Only show axes with input
      console.log(\`  Axis[\${i}] = \${val.toFixed(3)}\`);
    }
  });
  console.log("\\n--- BUTTONS ---");
  gp.buttons.forEach((btn, i) => {
    if (btn.pressed || btn.value > 0.05) {
      console.log(\`  Button[\${i}] pressed, value = \${btn.value.toFixed(3)}\`);
    }
  });
}

// Typical Logitech G29 mapping (verify with utility above):
function readRacingWheel(gp) {
  return {
    steering:   gp.axes[0],        // -1 (full left) to +1 (full right)
    throttle:   1 - (gp.axes[1] + 1) / 2,  // Remap: 0 = no gas, 1 = full gas
    brake:      1 - (gp.axes[2] + 1) / 2,  // Remap: 0 = no brake, 1 = full brake
    clutch:     1 - (gp.axes[3] + 1) / 2,  // If present

    // Paddle shifters
    shiftUp:    gp.buttons[4].pressed,
    shiftDown:  gp.buttons[5].pressed,

    // Apply deadzone to steering to prevent drift
    steeringClean: applyDeadzone(gp.axes[0], 0.05),
  };
}

// Always apply deadzone to analog axes
function applyDeadzone(value, threshold = 0.08) {
  if (Math.abs(value) < threshold) return 0;
  // Scale remaining range back to -1..1
  const sign = value > 0 ? 1 : -1;
  return sign * (Math.abs(value) - threshold) / (1 - threshold);
}
    `} />

    <H3>4. Joystick / Flight Stick</H3>
    <CodeBlock lang="javascript" code={`
// Joysticks typically expose pitch/roll/yaw/throttle as axes
function readJoystick(gp) {
  return {
    // Primary stick
    roll:       applyDeadzone(gp.axes[0]),  // Left/Right tilt
    pitch:      applyDeadzone(gp.axes[1]),  // Forward/Back tilt
    yaw:        applyDeadzone(gp.axes[2]),  // Twist (if supported)
    throttle:   gp.axes[3],                 // Throttle slider

    // Common buttons
    trigger:    gp.buttons[0].pressed,
    thumb:      gp.buttons[1].pressed,
    hatUp:      gp.buttons[12]?.pressed,    // POV hat
    hatDown:    gp.buttons[13]?.pressed,
    hatLeft:    gp.buttons[14]?.pressed,
    hatRight:   gp.buttons[15]?.pressed,
  };
}
    `} />

    <H3>5. The Game Loop (React + requestAnimationFrame)</H3>
    <CodeBlock lang="javascript" code={`
// In your main game component or game loop file

import { useEffect, useRef } from "react";
import GamepadManager from "./gamepad-manager";

function useGameLoop(onFrame) {
  const rafRef = useRef();

  useEffect(() => {
    const loop = (timestamp) => {
      // 1. Poll fresh gamepad state every frame
      const controllers = GamepadManager.poll();
      const gp = Object.values(controllers)[0]; // First controller

      if (gp) {
        const input = gp.mapping === "standard"
          ? readStandardGamepad(gp)
          : readRacingWheel(gp); // or readJoystick

        // 2. Pass input to your game update function
        onFrame(input, timestamp);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onFrame]);
}

// Usage in your driving game component:
function DrivingGame() {
  useGameLoop((input, ts) => {
    // input.steering, input.throttle, input.brake are live here
    updateCarPhysics(input);
    renderFrame();
  });

  return <canvas id="game-canvas" width={1280} height={720} />;
}
    `} />

    <H3>6. Force Feedback (Haptics)</H3>
    <CodeBlock lang="javascript" code={`
// Vibration / rumble — supported on most gamepads in Chrome
// Racing wheels: force feedback support varies by driver

async function rumble(gamepad, duration = 200, strong = 0.8, weak = 0.4) {
  if (!gamepad.vibrationActuator) return; // Not supported on this controller

  try {
    await gamepad.vibrationActuator.playEffect("dual-rumble", {
      startDelay: 0,
      duration: duration,
      weakMagnitude: weak,    // High-frequency motor (0.0 – 1.0)
      strongMagnitude: strong, // Low-frequency motor (0.0 – 1.0)
    });
  } catch (e) {
    console.warn("Haptics not available:", e);
  }
}

// Example: rumble on collision
function onCarCollision(gamepad) {
  rumble(gamepad, 300, 1.0, 0.5);
}
    `} />

    <Note type="tip">
      Always check <code>gp.mapping === "standard"</code> — if true, the browser has auto-remapped the
      controller to the standard layout. If false (common with wheels/joysticks), you'll need to detect
      manually using the detection utility above.
    </Note>
  </div>
);

const ElectronSection = () => (
  <div>
    <H2>📦 Electron Packaging</H2>
    <P>
      Electron wraps your web game in a Chromium shell, turning it into a native .exe / .dmg / .AppImage
      that players download and install like any other game.
    </P>

    <H3>Project Structure</H3>
    <CodeBlock lang="bash" code={`
my-driving-game/
├── public/
├── src/              ← Your React game code
├── electron/
│   ├── main.js       ← Electron entry point
│   └── preload.js    ← Optional: secure bridge to Node APIs
├── package.json
└── .github/
    └── workflows/
        └── build.yml ← GitHub Actions config
    `} />

    <H3>1. Install Dependencies</H3>
    <CodeBlock lang="bash" code={`
npm install --save-dev electron electron-builder concurrently wait-on
    `} />

    <H3>2. electron/main.js</H3>
    <CodeBlock lang="javascript" code={`
const { app, BrowserWindow } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: "My Driving Game",
    icon: path.join(__dirname, "../public/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In dev: load from Vite/CRA dev server
  // In production: load from built static files
  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Gamepad API works natively — no extra config needed in Electron
  // The embedded Chromium handles it exactly like the browser
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
    `} />

    <H3>3. package.json — Key Sections</H3>
    <CodeBlock lang="json" code={`
{
  "name": "my-driving-game",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently \\"vite\\" \\"wait-on http://localhost:5173 && electron .\\"",
    "electron:build": "vite build && electron-builder"
  },
  "build": {
    "appId": "com.yourstudio.drivingame",
    "productName": "My Driving Game",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
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
    `} />

    <Note type="info">
      <strong>Gamepad API in Electron:</strong> Because Electron uses Chromium under the hood, the Web
      Gamepad API works identically to the browser — zero extra code needed. Your existing
      gamepad-manager.js works as-is in the packaged game.
    </Note>
  </div>
);

const GithubActionsSection = () => (
  <div>
    <H2>⚙️ GitHub Actions — Auto Build Pipeline</H2>
    <P>
      This workflow automatically builds Windows (.exe), macOS (.dmg), and Linux (.AppImage)
      binaries every time you push a version tag like <code>v1.0.0</code> to GitHub.
    </P>

    <H3>.github/workflows/build.yml</H3>
    <CodeBlock lang="yaml" code={`
name: Build & Release Game

on:
  push:
    tags:
      - "v*"        # Triggers on: git tag v1.0.0 && git push --tags

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]

    runs-on: \${{ matrix.os }}

    steps:
      # 1. Check out your code
      - name: Checkout
        uses: actions/checkout@v4

      # 2. Set up Node
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      # 3. Install dependencies
      - name: Install dependencies
        run: npm ci

      # 4. Build the React/Vite app
      - name: Build web assets
        run: npm run build

      # 5. Package with electron-builder
      - name: Package Electron app
        run: npx electron-builder --publish never
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      # 6. Upload built binaries to GitHub Release
      - name: Upload Release Assets
        uses: softprops/action-gh-release@v2
        with:
          files: |
            release/*.exe
            release/*.dmg
            release/*.AppImage
            release/*.zip
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
    `} />

    <H3>How to Trigger a Release from Replit</H3>
    <CodeBlock lang="bash" code={`
# In Replit's Shell tab:

# 1. Commit your latest changes
git add .
git commit -m "Release v1.0.0"

# 2. Tag the release
git tag v1.0.0

# 3. Push both the commit and the tag
git push origin main --tags

# GitHub Actions now automatically:
#   → Builds on Windows, macOS, Linux
#   → Creates a GitHub Release
#   → Attaches .exe, .dmg, .AppImage files
# Done. Players can download from your GitHub Releases page.
    `} />

    <Note type="tip">
      The <code>GITHUB_TOKEN</code> secret is automatically available in GitHub Actions — you don't
      need to create it. Your builds will be publicly downloadable from your repo's Releases tab.
    </Note>
  </div>
);

const ItchioSection = () => (
  <div>
    <H2>🚀 itch.io Distribution</H2>
    <P>
      itch.io is the best first stop for indie games. Zero upfront cost, accepts web games AND
      downloadable executables, and has a passionate indie gaming community.
    </P>

    <H3>Option A — Web Game (No Install Required)</H3>
    <P>
      Build your Vite/React game, upload the <code>/dist</code> folder as a ZIP, and itch.io
      hosts it as an in-browser game. Players click Play — no download.
    </P>
    <CodeBlock lang="bash" code={`
# Build your web game
npm run build

# Zip the dist folder
cd dist && zip -r ../game-web.zip . && cd ..

# Upload game-web.zip to itch.io
# → Set "Kind of project" to HTML
# → Check "This file will be played in the browser"
# → Set viewport to 1280x720
    `} />

    <Note type="warn">
      Gamepad API works in the itch.io browser embed for most controllers, but racing wheels
      may need the player to open the game in a new tab. Include a note in your game description.
    </Note>

    <H3>Option B — Downloadable via GitHub Release</H3>
    <P>
      On itch.io, you can link your GitHub Release binaries directly, or upload them manually.
      Use <strong>butler</strong> (itch.io's CLI) for automated deploys.
    </P>
    <CodeBlock lang="bash" code={`
# Install butler (itch.io's deployment CLI)
# Download from: https://itch.io/docs/butler/

# Push Windows build
butler push release/MyDrivingGame-Setup.exe yourusername/my-driving-game:windows

# Push macOS build
butler push release/MyDrivingGame.dmg yourusername/my-driving-game:mac

# Push Linux build
butler push release/MyDrivingGame.AppImage yourusername/my-driving-game:linux
    `} />

    <H3>Add butler to GitHub Actions (Full Automation)</H3>
    <CodeBlock lang="yaml" code={`
# Add this step after the electron-builder step in build.yml:

      - name: Deploy to itch.io
        uses: josephbmanley/butler-publish-itchio-action@master
        env:
          BUTLER_CREDENTIALS: \${{ secrets.BUTLER_API_KEY }}
          CHANNEL: \${{ matrix.os == 'windows-latest' && 'windows' || matrix.os == 'macos-latest' && 'mac' || 'linux' }}
          ITCH_GAME: my-driving-game
          ITCH_USER: yourusername
          PACKAGE: release/
    `} />

    <Note type="tip">
      Get your Butler API key from itch.io → Account Settings → API Keys. Add it to GitHub as a
      repository secret named <code>BUTLER_API_KEY</code>.
    </Note>
  </div>
);

const SteamSection = () => (
  <div>
    <H2>🎯 Steam (When You're Ready)</H2>
    <P>
      Steam is a later-stage move once your game is polished. The technical integration is
      straightforward from an Electron base — the business requirements are the main hurdle.
    </P>

    <Table
      headers={["Requirement", "Details", "Cost"]}
      rows={[
        ["Steam Developer Account", "Steamworks partner program", "$100 one-time"],
        ["App ID", "Assigned after account approval", "Included"],
        ["Steamworks SDK", "greenworks npm package wraps it for Electron", "Free"],
        ["SteamPipe", "CLI tool for uploading builds", "Free"],
        ["Review period", "30 days from first upload before going live", "Time cost"],
      ]}
    />

    <H3>greenworks — Steamworks in Electron</H3>
    <CodeBlock lang="bash" code={`
# greenworks bridges the Steamworks C++ SDK to Node/Electron
npm install greenworks
    `} />

    <CodeBlock lang="javascript" code={`
// electron/main.js — add Steamworks init
const greenworks = require("greenworks");

if (greenworks.init()) {
  console.log("Steam initialized. User:", greenworks.getSteamId().getAccountId());
  // Now you can use: achievements, leaderboards, cloud saves, etc.
} else {
  console.warn("Steam not running — launching without Steam features");
  // Game still works fine without Steam
}

// Example: unlock an achievement
function unlockAchievement(id) {
  if (greenworks.activateAchievement) {
    greenworks.activateAchievement(id, () => {
      console.log("Achievement unlocked:", id);
    });
  }
}
    `} />

    <H3>SteamPipe Upload (from CLI)</H3>
    <CodeBlock lang="bash" code={`
# After building your Electron .exe:
# 1. Download Steamworks SDK from partner.steamgames.com
# 2. Configure app_build.vdf with your App ID and depots
# 3. Upload:

steamcmd +login your_steam_account \\
  +run_app_build ../scripts/app_build_YOURAPPID.vdf \\
  +quit
    `} />

    <Note type="info">
      The Gamepad API continues to work inside the Electron/Steam build — no changes needed.
      Steamworks adds achievements, leaderboards, and cloud saves on top of your existing game.
    </Note>

    <div
      style={{
        background: "#0d1f12",
        border: "1px solid #238636",
        borderRadius: "8px",
        padding: "16px 20px",
        margin: "1.5rem 0",
      }}
    >
      <div style={{ color: "#3fb950", fontWeight: 700, marginBottom: "8px", fontSize: "14px" }}>
        ✅ Recommended Launch Order
      </div>
      <div style={{ color: "#c9d1d9", fontSize: "13px", lineHeight: "2" }}>
        1. Build & test in Replit (web browser, gamepad working)<br />
        2. Wrap in Electron, test locally<br />
        3. Set up GitHub → GitHub Actions pipeline<br />
        4. Launch on <strong>itch.io</strong> (web + downloadable) — get feedback<br />
        5. Polish based on feedback<br />
        6. Submit to <strong>Steam</strong> with Steamworks integration
      </div>
    </div>
  </div>
);

const sectionComponents = {
  overview: OverviewSection,
  gamepad: GamepadSection,
  electron: ElectronSection,
  "github-actions": GithubActionsSection,
  itchio: ItchioSection,
  steam: SteamSection,
};

// ─── MAIN APP ──────────────────────────────────────────────────────────────────

export default function App() {
  const [active, setActive] = useState("overview");
  const ActiveSection = sectionComponents[active];

  return (
    <div
      style={{
        background: "#010409",
        minHeight: "100vh",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#0d1117",
          borderBottom: "1px solid #21262d",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1f6feb, #58a6ff)",
            borderRadius: "8px",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}
        >
          🕹️
        </div>
        <div>
          <div
            style={{
              color: "#e6edf3",
              fontSize: "15px",
              fontWeight: 700,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Replit → Game Distribution Pipeline
          </div>
          <div style={{ color: "#8b949e", fontSize: "12px" }}>
            Gamepad API · Electron · GitHub Actions · itch.io · Steam
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          <Badge color="#3fb950">Gamepad API</Badge>
          <Badge color="#58a6ff">Electron</Badge>
          <Badge color="#f78166">Steam</Badge>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar Nav */}
        <div
          style={{
            background: "#0d1117",
            borderRight: "1px solid #21262d",
            width: "200px",
            flexShrink: 0,
            padding: "12px 0",
          }}
        >
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              style={{
                width: "100%",
                background: active === s.id ? "#1f2937" : "transparent",
                border: "none",
                borderLeft: active === s.id ? "3px solid #58a6ff" : "3px solid transparent",
                color: active === s.id ? "#e6edf3" : "#8b949e",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: active === s.id ? 600 : 400,
                padding: "10px 16px",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <span style={{ marginRight: "8px" }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 32px",
            maxWidth: "860px",
          }}
        >
          <ActiveSection />
        </div>
      </div>
    </div>
  );
}
