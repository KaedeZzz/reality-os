const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

async function launch() {
  const app = new EventEmitter();
  Object.assign(app, {
    setName() {}, getPath: () => 'test-data', setPath() {},
    requestSingleInstanceLock: () => true,
    whenReady: () => Promise.resolve(), quit() {},
  });
  let created;
  class Window {
    constructor(options) {
      this.options = options;
      this.shown = options.show;
      this.webContents = new EventEmitter();
      this.webContents.setWindowOpenHandler = () => {};
      this.webContents.session = { setPermissionRequestHandler() {} };
      created = this;
    }
    loadFile(file) { this.file = file; return Promise.resolve(); }
    isDestroyed() { return false; }
    isMinimized() { return Boolean(this.minimized); }
    restore() { this.minimized = false; }
    show() { this.shown = true; }
    focus() { this.focused = true; }
  }
  const electron = { app, BrowserWindow: Window, Menu: { setApplicationMenu() {} }, dialog: { showErrorBox() {} } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'main.cjs'), 'utf8'), {
    __dirname,
    require(name) {
      if (name === 'electron') return electron;
      if (name === 'node:fs') return { mkdirSync() {}, appendFileSync() {} };
      return require(name);
    },
  });
  await new Promise((resolve) => setImmediate(resolve));
  return { app, window: created };
}

test('shows the startup window without waiting for a paint event', async () => {
  const { window } = await launch();
  assert.equal(window.options.show, true);
  assert.equal(window.shown, true);
  assert.equal(window.file, path.join(__dirname, 'out', 'index.html'));
  assert.equal(window.options.webPreferences.nodeIntegration, false);
});
test('a second launch reveals and restores the existing window', async () => {
  const { app, window } = await launch();
  window.shown = false;
  window.minimized = true;
  app.emit('second-instance');
  assert.equal(window.shown, true);
  assert.equal(window.minimized, false);
  assert.equal(window.focused, true);
});
