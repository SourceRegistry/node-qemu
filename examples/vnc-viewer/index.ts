/**
 * VNC Viewer example: boot a graphical Linux VM and view/control it in a browser
 * via noVNC over WebSocket.
 *
 * Architecture:
 *   Browser <-> node-webserver WS /websockify <-> QEMU VNC WebSocket (port 5700)
 *
 * Run:
 *   npx tsx examples/vnc-viewer/index.ts
 * Then open the printed URL.
 */

import { createWriteStream, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";
import { html, WebServer } from "@sourceregistry/node-webserver";
import { QemuProcess, QMPClient } from "../../src/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const TMP = join(HERE, "../../tmp");
const PREFERRED_QMP_PORT = 4452;
const PREFERRED_VNC_DISPLAY = 1;
const PREFERRED_VNC_WS_PORT = 5700;
const PREFERRED_WEB_PORT = 8080;

const VM_PROFILES = {
  lubuntu: {
    name: "Lubuntu 24.04.4 LXQt",
    iso: join(TMP, "lubuntu-24.04.4-desktop-amd64.iso"),
    url: "https://mirrors.mit.edu/ubuntu-cdimage/lubuntu/releases/24.04/release/lubuntu-24.04.4-desktop-amd64.iso",
    size: "~3.2 GiB",
    memory: 2048,
  },
  "debian-xfce": {
    name: "Debian Live 13.5 XFCE",
    iso: join(TMP, "debian-live-13.5.0-amd64-xfce.iso"),
    url: "https://ftp.gwdg.de/pub/linux/debian/debian-cd/current-live/amd64/iso-hybrid/debian-live-13.5.0-amd64-xfce.iso",
    size: "~3.6 GiB",
    memory: 2048,
  },
  porteus: {
    name: "Porteus 5.01 XFCE",
    iso: join(TMP, "porteus-xfce-v5.01-x86_64.iso"),
    url: "https://ftp.nluug.nl/os/Linux/distr/porteus/x86_64/current/Porteus-XFCE-v5.01-x86_64.iso",
    size: "~533 MiB",
    memory: 1024,
  },
} as const;

type VmProfileName = keyof typeof VM_PROFILES;

function resolveProfile(): (typeof VM_PROFILES)[VmProfileName] {
  const requested = process.env.VNC_VM ?? "lubuntu";
  if (requested in VM_PROFILES) return VM_PROFILES[requested as VmProfileName];

  const valid = Object.keys(VM_PROFILES).join(", ");
  throw new Error(`Unknown VNC_VM "${requested}". Valid values: ${valid}`);
}

const VM = resolveProfile();

function resolveAccel(): "kvm" | "hvf" | "tcg" | "whpx" {
  const requested = process.env.QEMU_ACCEL;
  if (requested === "kvm" || requested === "hvf" || requested === "tcg" || requested === "whpx") {
    return requested;
  }

  if (process.platform === "win32") return "whpx";
  if (process.platform === "darwin") return "hvf";
  if (process.platform === "linux" && existsSync("/dev/kvm")) return "kvm";
  return "tcg";
}

async function ensureIso(): Promise<void> {
  if (existsSync(VM.iso)) return;

  console.log(`Downloading ${VM.name} live ISO (${VM.size}) ...`);
  const res = await fetch(VM.url);
  if (!res.ok) throw new Error(`HTTP ${res.status} while downloading ${VM.url}`);
  if (!res.body) throw new Error("Download response did not include a body");

  const total = Number(res.headers.get("content-length") ?? 0);
  let received = 0;
  let lastPct = -1;

  const progress = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      received += chunk.byteLength;

      if (total) {
        const pct = Math.floor((received / total) * 100);
        if (pct !== lastPct && pct % 10 === 0) {
          process.stdout.write(`\r  ${pct}%`);
          lastPct = pct;
        }
      }

      callback(null, chunk);
    },
    flush(callback) {
      process.stdout.write("\r  100%\n");
      callback();
    },
  });

  const body = Readable.fromWeb(res.body as unknown as NodeReadableStream<Uint8Array>);
  await pipeline(body, progress, createWriteStream(VM.iso));
  console.log("Download complete.");
}

function closeServer(app: WebServer): Promise<void> {
  if (!app.listening) return Promise.resolve();

  return new Promise((resolve, reject) => {
    app.close((err) => {
      if (err && "code" in err && err.code === "ERR_SERVER_NOT_RUNNING") resolve();
      else if (err) reject(err);
      else resolve();
    });
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForExit(proc: QemuProcess): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve) => {
    proc.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

function pointerDeviceArgs(): string[] {
  const requested = process.env.QEMU_POINTER ?? "virtio-tablet";

  if (requested === "usb-tablet") {
    return ["-device", "qemu-xhci,id=xhci", "-device", "usb-tablet,bus=xhci.0"];
  }

  if (requested === "virtio-tablet") {
    return ["-device", "virtio-tablet-pci"];
  }

  if (requested === "none") return [];

  throw new Error('Unknown QEMU_POINTER. Valid values: "virtio-tablet", "usb-tablet", "none"');
}

function canListen(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function findAvailablePort(start: number, host = "127.0.0.1"): Promise<number> {
  for (let port = start; port < start + 100; port += 1) {
    if (await canListen(port, host)) return port;
  }

  throw new Error(`No available local port found from ${start} to ${start + 99}`);
}

async function findAvailableVncDisplay(start: number): Promise<number> {
  for (let display = start; display < start + 100; display += 1) {
    if (await canListen(5900 + display)) return display;
  }

  throw new Error(`No available VNC display found from :${start} to :${start + 99}`);
}

await mkdir(TMP, { recursive: true });
await ensureIso();

const QMP_PORT = await findAvailablePort(PREFERRED_QMP_PORT);
const VNC_DISPLAY = await findAvailableVncDisplay(PREFERRED_VNC_DISPLAY);
const VNC_WS_PORT = await findAvailablePort(PREFERRED_VNC_WS_PORT);
const WEB_PORT = await findAvailablePort(PREFERRED_WEB_PORT);
const ACCEL = resolveAccel();
const POINTER_ARGS = pointerDeviceArgs();

console.log(`Using QEMU accelerator: ${ACCEL}`);
console.log(`Booting VM profile: ${VM.name}`);

const proc = new QemuProcess({
  config: {
    machine: {
      type: "q35",
      accel: ACCEL,
    },
    smp: 2,
    memory: { size: VM.memory },
    drives: [
      { file: VM.iso, format: "raw", media: "cdrom", readonly: true },
    ],
    net: [{ type: "user", id: "net0" }],
    qmp: { host: "127.0.0.1", port: QMP_PORT },
    vnc: { display: `127.0.0.1:${VNC_DISPLAY}`, websocket: VNC_WS_PORT },
    extraArgs: [
      "-vga",
      "std",
      ...POINTER_ARGS,
      "-boot",
      "order=d",
    ],
  },
});

proc.on("stderr", (line) => {
  if (!line.includes("warning:")) process.stderr.write(line);
});
proc.on("exit", (code, signal) => console.log("QEMU exited:", { code, signal }));

await proc.start();
console.log("QEMU started, PID:", proc.pid);

const earlyExit = waitForExit(proc);
const started = await Promise.race([
  wait(1_500).then(() => true),
  earlyExit.then(({ code, signal }) => {
    throw new Error(`QEMU exited before QMP was ready: code=${code}, signal=${signal}`);
  }),
]);

if (!started) throw new Error("QEMU failed to start");

const client = new QMPClient({ host: "127.0.0.1", port: QMP_PORT });
await client.connect();
console.log("QMP connected");

client.on("SHUTDOWN", (e) => console.log("[QMP] SHUTDOWN:", e.reason));
client.on("RESET", () => console.log("[QMP] RESET"));

const { qemu } = await client.queryVersion();
console.log(`QEMU ${qemu.major}.${qemu.minor}.${qemu.micro} running`);

const app = new WebServer();
let shuttingDown = false;

app.GET("/", () => html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>VM Console</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #111;
      color: #ccc;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100vh;
      overflow: hidden;
    }
    #toolbar {
      width: 100%;
      background: #1e1e1e;
      border-bottom: 1px solid #333;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
      min-height: 48px;
    }
    #toolbar h1 { font-size: 14px; color: #e0e0e0; white-space: nowrap; }
    #status { font-size: 12px; color: #888; margin-left: auto; }
    #status.connected { color: #4caf50; }
    #status.error { color: #f44336; }
    #controls { display: flex; gap: 8px; flex-wrap: wrap; }
    button {
      background: #2a2a2a;
      color: #ccc;
      border: 1px solid #444;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      line-height: 1;
    }
    button.active { background: #34513d; border-color: #5f9f70; color: #e8ffed; }
    button:hover { background: #333; border-color: #666; }
    button.danger:hover { background: #3a1a1a; border-color: #f44; color: #f88; }
    #main {
      flex: 1;
      width: 100%;
      min-height: 0;
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      background: #000;
    }
    #sidebar {
      background: #181818;
      border-right: 1px solid #333;
      padding: 12px;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    #sidebar.closed {
      display: none;
    }
    #main.sidebar-closed {
      grid-template-columns: minmax(0, 1fr);
    }
    .panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .panel h2 {
      color: #f0f0f0;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #ddd;
    }
    textarea {
      width: 100%;
      min-height: 110px;
      resize: vertical;
      background: #101010;
      color: #ddd;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 8px;
      font: 12px ui-monospace, SFMono-Regular, Consolas, monospace;
    }
    #screen-container {
      width: 100%;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      position: relative;
    }
    #screen-container.actual {
      overflow: auto;
      align-items: flex-start;
      justify-content: flex-start;
    }
    #screen-container canvas {
      display: block;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      image-rendering: auto;
    }
    @media (max-width: 720px) {
      #main { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); }
      #main.sidebar-closed { grid-template-rows: minmax(0, 1fr); }
      #sidebar { max-height: 38vh; border-right: 0; border-bottom: 1px solid #333; }
      #toolbar { align-items: flex-start; gap: 8px; padding: 8px; }
      #status { width: 100%; margin-left: 0; }
      button { padding: 6px 10px; }
    }
  </style>
</head>
<body>
  <div id="toolbar">
    <h1>VM Console</h1>
    <div id="controls">
      <button id="btn-stop">Pause</button>
      <button id="btn-cont">Resume</button>
      <button id="btn-reset">Reset</button>
      <button id="btn-sidebar" class="active">Sidebar</button>
      <button id="btn-fullscreen">Fullscreen</button>
      <button id="btn-quit" class="danger">Quit VM</button>
    </div>
    <span id="status">Connecting...</span>
  </div>
  <div id="main">
    <aside id="sidebar">
      <section class="panel">
        <h2>Display</h2>
        <div class="row">
          <button id="btn-fit" class="active">Fit</button>
          <button id="btn-actual">1:1</button>
        </div>
        <label><input id="toggle-view-only" type="checkbox"> View only</label>
        <label><input id="toggle-dot" type="checkbox" checked> Local cursor dot</label>
      </section>
      <section class="panel">
        <h2>Session</h2>
        <div class="row">
          <button id="btn-reconnect">Reconnect</button>
          <button id="btn-disconnect">Disconnect</button>
          <button id="btn-cad">Ctrl Alt Del</button>
        </div>
      </section>
      <section class="panel">
        <h2>Clipboard</h2>
        <textarea id="clipboard" spellcheck="false"></textarea>
        <div class="row">
          <button id="btn-clip-send">Send</button>
          <button id="btn-clip-clear">Clear</button>
        </div>
      </section>
    </aside>
    <div id="screen-container"></div>
  </div>

  <script type="module">
    import RFB from 'https://cdn.jsdelivr.net/npm/@novnc/novnc@1.7.0/core/rfb.js';

    const status = document.getElementById('status');
    const setStatus = (msg, cls = '') => {
      status.textContent = msg;
      status.className = cls;
    };

    let rfb;
    let currentScaleMode = 'fit';
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const screen = document.getElementById('screen-container');
    const main = document.getElementById('main');
    const sidebar = document.getElementById('sidebar');
    const sidebarButton = document.getElementById('btn-sidebar');
    const fitButton = document.getElementById('btn-fit');
    const actualButton = document.getElementById('btn-actual');
    const viewOnlyToggle = document.getElementById('toggle-view-only');
    const dotToggle = document.getElementById('toggle-dot');
    const clipboard = document.getElementById('clipboard');

    const setScaleMode = (mode) => {
      currentScaleMode = mode;
      const fit = mode === 'fit';
      if (rfb) rfb.scaleViewport = fit;
      screen.classList.toggle('actual', !fit);
      fitButton.classList.toggle('active', fit);
      actualButton.classList.toggle('active', !fit);
    };

    const connect = () => {
      if (rfb) rfb.disconnect();

      setStatus('Connecting...');
      rfb = new RFB(screen, protocol + '//' + location.host + '/websockify');
      rfb.scaleViewport = currentScaleMode === 'fit';
      rfb.resizeSession = false;
      rfb.viewOnly = viewOnlyToggle.checked;
      rfb.showDotCursor = dotToggle.checked;
      rfb.focusOnClick = true;
      rfb.compressionLevel = 0;
      rfb.qualityLevel = 6;

      rfb.addEventListener('connect', () => setStatus('Connected', 'connected'));
      rfb.addEventListener('disconnect', (event) => {
        setStatus('Disconnected: ' + (event.detail.reason || 'unknown'), 'error');
      });
      rfb.addEventListener('credentialsrequired', () => rfb.sendCredentials({ password: '' }));
      rfb.addEventListener('clipboard', (event) => {
        clipboard.value = event.detail.text;
      });
    };

    const qmp = (action) => fetch('/qmp/' + action, { method: 'POST' });

    document.getElementById('btn-stop').onclick = () => qmp('stop');
    document.getElementById('btn-cont').onclick = () => qmp('cont');
    document.getElementById('btn-reset').onclick = () => qmp('reset');
    sidebarButton.onclick = () => {
      const closed = sidebar.classList.toggle('closed');
      main.classList.toggle('sidebar-closed', closed);
      sidebarButton.classList.toggle('active', !closed);
    };
    fitButton.onclick = () => setScaleMode('fit');
    actualButton.onclick = () => setScaleMode('actual');
    viewOnlyToggle.onchange = () => { if (rfb) rfb.viewOnly = viewOnlyToggle.checked; };
    dotToggle.onchange = () => { if (rfb) rfb.showDotCursor = dotToggle.checked; };
    document.getElementById('btn-reconnect').onclick = connect;
    document.getElementById('btn-disconnect').onclick = () => rfb?.disconnect();
    document.getElementById('btn-cad').onclick = () => rfb?.sendCtrlAltDel();
    document.getElementById('btn-clip-send').onclick = () => rfb?.clipboardPasteFrom(clipboard.value);
    document.getElementById('btn-clip-clear').onclick = () => { clipboard.value = ''; };
    document.getElementById('btn-quit').onclick = () => {
      if (confirm('Quit the VM?')) qmp('quit');
    };
    document.getElementById('btn-fullscreen').onclick = () => {
      if (screen.requestFullscreen) screen.requestFullscreen();
    };

    setScaleMode('fit');
    connect();
  </script>
</body>
</html>`));

app.POST("/qmp/stop", async () => {
  await client.stop();
  return new Response(null, { status: 204 });
});
app.POST("/qmp/cont", async () => {
  await client.cont();
  return new Response(null, { status: 204 });
});
app.POST("/qmp/reset", async () => {
  await client.systemReset();
  return new Response(null, { status: 204 });
});
app.POST("/qmp/quit", async () => {
  await client.quit();
  return new Response(null, { status: 204 });
});

app.WS("/websockify", ({ websocket }) => {
  const qemuWs = new WebSocket(`ws://127.0.0.1:${VNC_WS_PORT}`, ["binary"]);

  const forward = (src: WebSocket, dst: WebSocket) => {
    src.on("message", (data, isBinary) => {
      if (dst.readyState === WebSocket.OPEN) dst.send(data, { binary: isBinary });
    });
  };

  qemuWs.on("open", () => {
    forward(websocket, qemuWs);
    forward(qemuWs, websocket);
  });

  const close = () => {
    if (qemuWs.readyState < WebSocket.CLOSING) qemuWs.close();
    if (websocket.readyState < WebSocket.CLOSING) websocket.close();
  };

  qemuWs.on("close", close);
  qemuWs.on("error", close);
  websocket.on("close", close);
  websocket.on("error", close);

  return true;
});

app.listen(WEB_PORT);
console.log(`\nVNC viewer ready -> http://localhost:${WEB_PORT}\n`);
console.log("Controls: Ctrl+C to shut down\n");

process.on("SIGINT", async () => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("\nShutting down ...");
  try {
    await client.quit();
  } catch {
    // The VM may already be stopped.
  }
  await client.close();
  await proc.stop(5_000);
  await closeServer(app);
  process.exit(0);
});

await earlyExit;

if (!shuttingDown) {
  shuttingDown = true;
  await client.close();
  await closeServer(app);
}
