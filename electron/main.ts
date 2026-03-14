import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron';
import { spawn, type ChildProcess } from 'child_process';
import http from 'http';
import path from 'path';

const isDev = !app.isPackaged;
const BACKEND_PORT = 4100;
const FRONTEND_PORT = 3000;
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}/`;
const WINDOW_STATE_CHANNEL = 'window:state-changed';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let backendProcess: ChildProcess | null = null;
let frontendProcess: ChildProcess | null = null;

const repoRoot = isDev
  ? path.join(__dirname, '..', '..')
  : process.resourcesPath;

function spawnBackend() {
  const cmd = isDev
    ? path.join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx')
    : 'node';
  const entry = isDev
    ? path.join(repoRoot, 'backend', 'src', 'index.ts')
    : path.join(repoRoot, 'backend', 'dist', 'backend', 'src', 'index.js');

  backendProcess = spawn(cmd, [entry], {
    cwd: repoRoot,
    env: { ...process.env, PORT: String(BACKEND_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  backendProcess.stdout?.on('data', (d) => process.stdout.write(`[backend] ${d}`));
  backendProcess.stderr?.on('data', (d) => process.stderr.write(`[backend] ${d}`));
  backendProcess.on('exit', (code) => {
    console.log(`[backend] exited with code ${code}`);
    backendProcess = null;
  });
}

function spawnFrontend() {
  const nextBin = path.join(
    repoRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'next.cmd' : 'next',
  );
  const args = isDev ? ['dev', 'client'] : ['start', 'client'];

  frontendProcess = spawn(nextBin, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(FRONTEND_PORT),
      NEXT_PUBLIC_BACKEND_URL: `http://localhost:${BACKEND_PORT}`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  frontendProcess.stdout?.on('data', (d) => process.stdout.write(`[frontend] ${d}`));
  frontendProcess.stderr?.on('data', (d) => process.stderr.write(`[frontend] ${d}`));
  frontendProcess.on('exit', (code) => {
    console.log(`[frontend] exited with code ${code}`);
    frontendProcess = null;
  });
}

function waitForPort(port: number, maxMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
      });
      req.on('error', retry);
      req.setTimeout(500, () => { req.destroy(); retry(); });
    };
    const retry = () => {
      if (Date.now() - start > maxMs) {
        reject(new Error(`Timed out waiting for port ${port}`));
        return;
      }
      setTimeout(check, 500);
    };
    check();
  });
}

function getWindowState(window: BrowserWindow) {
  return {
    isMaximized: window.isMaximized(),
  };
}

function sendWindowState(window: BrowserWindow | null) {
  if (!window || window.isDestroyed()) {
    return;
  }

  window.webContents.send(WINDOW_STATE_CHANNEL, getWindowState(window));
}

function getWindowOptions(): Electron.BrowserWindowConstructorOptions {
  const baseOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'BetterYT Chat Hub',
    backgroundColor: '#09090b',
    autoHideMenuBar: process.platform !== 'darwin',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  };

  if (process.platform === 'darwin') {
    return {
      ...baseOptions,
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 18, y: 18 },
    };
  }

  return {
    ...baseOptions,
    titleBarStyle: 'hidden',
  };
}

function createWindow() {
  mainWindow = new BrowserWindow(getWindowOptions());

  if (process.platform !== 'darwin') {
    mainWindow.removeMenu();
  }

  mainWindow.loadURL(FRONTEND_URL);
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    sendWindowState(mainWindow);
  });

  mainWindow.on('maximize', () => sendWindowState(mainWindow));
  mainWindow.on('unmaximize', () => sendWindowState(mainWindow));
  mainWindow.on('enter-full-screen', () => sendWindowState(mainWindow));
  mainWindow.on('leave-full-screen', () => sendWindowState(mainWindow));
  mainWindow.on('restore', () => sendWindowState(mainWindow));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Minimal 1x1 transparent image as placeholder tray icon
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('BetterYT Chat Hub');
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Göster',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: () => app.quit(),
    },
  ]));
}

function killChildren() {
  backendProcess?.kill();
  frontendProcess?.kill();
  backendProcess = null;
  frontendProcess = null;
}

ipcMain.handle('window:minimize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.minimize();
});

ipcMain.handle('window:toggle-maximize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    return false;
  }

  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }

  return window.isMaximized();
});

ipcMain.handle('window:close', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.close();
});

ipcMain.handle('window:is-maximized', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  return window?.isMaximized() ?? false;
});

app.on('ready', async () => {
  spawnBackend();
  spawnFrontend();

  createTray();

  try {
    console.log('[electron] Waiting for frontend to be ready...');
    await waitForPort(FRONTEND_PORT, 60000);
    console.log('[electron] Frontend ready, opening window.');
  } catch {
    console.error('[electron] Frontend did not start in time.');
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  killChildren();
});
