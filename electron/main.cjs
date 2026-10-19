// Always local: public published releases are saved atomically, never remote-only.
const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const { savedRelease, syncRelease } = require('./updates.cjs');
const LIVE = 'https://markmuse-logo-garden.lovable.app';
const serverDir = path.join(app.isPackaged ? process.resourcesPath : path.join(__dirname, '..'), 'dist-electron');
let win, port, innerPort, activeRelease, pendingRelease, syncing = false;
const releaseRoot = () => path.join(app.getPath('userData'), 'releases');
async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}
async function online() {
  try { return (await fetch(`${LIVE}/robots.txt`, { method: 'HEAD', signal: AbortSignal.timeout(3000), cache: 'no-store' })).ok; }
  catch { return false; }
}
async function checkUpdates(manual = false) {
  if (syncing) return;
  syncing = true;
  try {
    pendingRelease = await syncRelease(releaseRoot(), LIVE);
    if (pendingRelease !== activeRelease) {
      const { response } = await dialog.showMessageBox(win, { type: 'info', message: 'تم حفظ تحديث تمكين على جهازك.', detail: 'يمكن تطبيقه الآن أو عند فتح التطبيق لاحقًا؛ يبقى محفوظًا دون إنترنت.', buttons: ['لاحقًا', 'تطبيق الآن'], defaultId: 0 });
      if (response === 1) { activeRelease = pendingRelease; await win.loadURL(`http://127.0.0.1:${port}/`); }
    } else if (manual) await dialog.showMessageBox(win, { message: 'التطبيق محدث.' });
  } catch {
    if (manual) await dialog.showMessageBox(win, { message: 'التحديث غير متوفر الآن. تبقى نسختك المحلية جاهزة؛ حاول عند توفر الإنترنت.' });
  } finally { syncing = false; }
}
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
async function serve(request, response) {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    if (url.pathname === '/desktop-online') { response.writeHead(await online() ? 204 : 503, { 'Cache-Control': 'no-store' }); response.end(); return; }
    const pathname = decodeURIComponent(url.pathname);
    if (activeRelease && request.method === 'GET' && !pathname.startsWith('/api/') && !pathname.startsWith('/_serverFn')) {
      const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
      const filename = path.resolve(activeRelease, relative);
      if (filename.startsWith(`${activeRelease}${path.sep}`) && fs.existsSync(filename) && fs.statSync(filename).isFile()) {
        response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        fs.createReadStream(filename).pipe(response); return;
      }
    }
    const rpc = pathname.startsWith('/_serverFn') || pathname.startsWith('/api/');
    const remote = rpc && await online();
    const target = remote ? new URL(request.url, LIVE) : new URL(request.url, `http://127.0.0.1:${innerPort}`);
    const headers = { ...request.headers, host: target.host };
    if (remote) { headers.origin = LIVE; headers.referer = `${LIVE}/`; delete headers.cookie; }
    const proxy = (remote ? require('node:https') : http).request(target, { method: request.method, headers, timeout: 15000 }, upstream => {
      response.writeHead(upstream.statusCode || 502, upstream.headers);
      upstream.pipe(response);
    });
    proxy.on('timeout', () => proxy.destroy());
    proxy.on('error', () => { if (!response.headersSent) response.writeHead(503, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ error: 'الإنترنت غير متوفر أو تعذر الاتصال' })); });
    request.pipe(proxy);
  } catch { response.writeHead(503); response.end('تعذر الاتصال'); }
}
async function start() {
  innerPort = await freePort();
  process.env.PORT = process.env.NITRO_PORT = String(innerPort);
  process.env.HOST = process.env.NITRO_HOST = '127.0.0.1';
  process.chdir(serverDir);
  await import(require('node:url').pathToFileURL(path.join(serverDir, 'server/index.mjs')).href);
  const portFile = path.join(app.getPath('userData'), 'local-port.json');
  try { port = JSON.parse(fs.readFileSync(portFile, 'utf8')).port; } catch {}
  if (!Number.isInteger(port) || port < 1024 || port > 65535) port = await freePort();
  fs.mkdirSync(path.dirname(portFile), { recursive: true });
  fs.writeFileSync(portFile, JSON.stringify({ port }));
  activeRelease = await savedRelease(releaseRoot());
  await new Promise((resolve, reject) => { const server = http.createServer(serve); server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  win = new BrowserWindow({ width: 1440, height: 900, minWidth: 1024, minHeight: 700, show: false, icon: path.join(activeRelease || path.join(serverDir, 'public'), 'brand/app-icon.png'), webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, autoplayPolicy: 'no-user-gesture-required' } });
  win.once('ready-to-show', () => { win.show(); win.maximize(); });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url === 'about:blank' || url.startsWith(`http://127.0.0.1:${port}/`) || url.startsWith('blob:')) return { action: 'allow', overrideBrowserWindowOptions: { webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } } };
    if (/^https?:\/\//.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => { if (!url.startsWith(`http://127.0.0.1:${port}/`)) { event.preventDefault(); if (/^https?:\/\//.test(url)) void shell.openExternal(url); } });
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: 'تمكين', submenu: [{ label: 'فحص التحديثات الآن', click: () => void checkUpdates(true) }, { role: 'quit', label: 'إغلاق' }] }]));
  await win.loadURL(`http://127.0.0.1:${port}/`);
  void checkUpdates();
  setInterval(() => void checkUpdates(), 10 * 60 * 1000);
}
if (!app.requestSingleInstanceLock()) app.quit();
else app.whenReady().then(start).catch(() => { dialog.showErrorBox('تمكين', 'تعذر تشغيل النسخة المحلية. أغلق النسخ الأخرى ثم حاول مجددًا.'); app.quit(); });
app.on('second-instance', () => { if (win) { win.restore(); win.focus(); } });
app.on('window-all-closed', () => app.quit());
