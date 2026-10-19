// نقطة تشغيل نسخة سطح المكتب (ويندوز): تشغّل خادم التطبيق محلياً داخل الجهاز
// ثم تفتح نافذة التطبيق عليه — بلا أي اعتماد على الإنترنت.
const { app, BrowserWindow, shell, Menu, dialog } = require("electron");
const path = require("node:path");
const net = require("node:net");
const fs = require("node:fs");

const isDev = !app.isPackaged;
const appRoot = isDev ? path.join(__dirname, "..") : process.resourcesPath;
const serverDir = path.join(appRoot, "dist-electron");

let win = null;
let port = 0;

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const p = srv.address().port;
      srv.close(() => resolve(p));
    });
  });
}

function waitForServer() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 30000;
    const tick = () => {
      const sock = net.connect(port, "127.0.0.1");
      sock.once("connect", () => {
        sock.destroy();
        resolve();
      });
      sock.once("error", () => {
        sock.destroy();
        if (Date.now() > deadline) reject(new Error("server timeout"));
        else setTimeout(tick, 250);
      });
    };
    tick();
  });
}

async function startServer() {
  // A stable loopback origin preserves the customer's local work across restarts.
  const portFile = path.join(app.getPath("userData"), "local-port.json");
  try { port = JSON.parse(fs.readFileSync(portFile, "utf8")).port; } catch { port = 0; }
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    port = await freePort();
    fs.mkdirSync(path.dirname(portFile), { recursive: true });
    fs.writeFileSync(portFile, JSON.stringify({ port }));
  }
  process.env.PORT = String(port);
  process.env.HOST = "127.0.0.1";
  process.env.NITRO_PORT = String(port);
  process.env.NITRO_HOST = "127.0.0.1";
  // Offline admin login: the package ships only a SHA-256 hash, never the password.
  try { process.env.ADMIN_PASSWORD_SHA256 = fs.readFileSync(path.join(serverDir, "admin.sha256"), "utf8").trim(); } catch {}
  process.chdir(serverDir);
  await import(require("node:url").pathToFileURL(path.join(serverDir, "server", "index.mjs")).href);
  await waitForServer();
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: "#0b1220",
    autoHideMenuBar: true,
    icon: path.join(serverDir, "public", "brand", "app-icon.png"),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, autoplayPolicy: "no-user-gesture-required" },
  });
  win.once("ready-to-show", () => {
    win.show();
    win.maximize();
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  if (port) void win.loadURL(`http://127.0.0.1:${port}/`);
}

// Hybrid sync: live site when online (always latest), bundled local server when offline.
const LIVE_URL = process.env.ARSH_LIVE_URL || "https://mark-muse-logo-studio.lovable.app/";
let localReady = null;

function ensureLocal() {
  if (!localReady) localReady = startServer();
  return localReady;
}

async function isOnline() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1000);
    const res = await fetch(LIVE_URL, { method: "HEAD", signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

async function loadLocal() {
  await ensureLocal();
  await win.loadURL(`http://127.0.0.1:${port}/`);
}

Menu.setApplicationMenu(null);
if (!app.requestSingleInstanceLock()) app.quit();
app.on("second-instance", () => { if (win) { win.restore(); win.focus(); } });

app.whenReady().then(async () => {
  const online = await isOnline();
  try {
    if (!online) await ensureLocal();
  } catch (err) {
    console.error("failed to start local server", err);
    dialog.showErrorBox("TAMKEEN", "تعذر تشغيل التطبيق المحلي. أغلق النسخ الأخرى ثم حاول مجددًا.");
    app.quit();
    return;
  }
  createWindow();
  if (online) {
    // If the live site fails mid-load, fall back to the offline copy.
    win.webContents.once("did-fail-load", (_e, code, _d, _u, isMain) => {
      if (isMain && code !== -3) void loadLocal().catch(() => {});
    });
    void win.loadURL(LIVE_URL);
  }
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
