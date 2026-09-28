const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

app.setName('Reality OS');
const dataDirectory = path.join(app.getPath('appData'), 'Reality OS');
fs.mkdirSync(dataDirectory, { recursive: true });
app.setPath('userData', dataDirectory);
const log = (message) => fs.appendFileSync(path.join(dataDirectory, 'startup.log'), `${new Date().toISOString()} ${message}\n`);
const entry = path.join(__dirname, 'out', 'index.html');
const entryURL = pathToFileURL(entry).href;
let window;
function showWindow() {
  if (!window || window.isDestroyed()) return;
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', showWindow);
  app.on('activate', showWindow);
  app.whenReady().then(async () => {
    log('Creating window');
    Menu.setApplicationMenu(null);
    window = new BrowserWindow({
      width: 1280, height: 900, minWidth: 390, minHeight: 600,
      title: 'Reality OS', backgroundColor: '#12121c', show: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
    });
    window.webContents.setWindowOpenHandler(({ url }) => {
      try {
        const source = new URL(url);
        if (source.protocol === 'https:' && ['knoops.com', 'rog.asus.com'].includes(source.hostname)) {
          shell.openExternal(url).catch(() => log('Could not open product reference'));
        }
      } catch { /* Keep unknown destinations inside neither app nor browser. */ }
      return { action: 'deny' };
    });
    window.webContents.on('will-navigate', (event, url) => {
      if (url.split('#')[0] !== entryURL) event.preventDefault();
    });
    window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    window.webContents.on('did-finish-load', () => log('Local interface loaded'));
    window.webContents.on('render-process-gone', (_event, details) => log(`Renderer stopped: ${details.reason}`));
    window.webContents.on('did-fail-load', (_event, code, description) => log(`Load failed: ${code} ${description}`));
    try {
      await window.loadFile(entry);
      showWindow();
    } catch (error) {
      log(`Startup failed: ${error.message}`);
      dialog.showErrorBox('Reality OS 无法启动', `本地界面加载失败。请保留完整应用文件夹。\n${error.message}`);
      app.quit();
    }
  }).catch((error) => {
    log(`Window failed: ${error.message}`);
    dialog.showErrorBox('Reality OS 无法启动', error.message);
    app.quit();
  });
  app.on('window-all-closed', () => app.quit());
}
