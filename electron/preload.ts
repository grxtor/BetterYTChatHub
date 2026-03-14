import { contextBridge, ipcRenderer } from 'electron';

const WINDOW_STATE_CHANNEL = 'window:state-changed';

type WindowStatePayload = {
  isMaximized: boolean;
};

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  showCustomWindowControls: process.platform !== 'darwin',
  windowControls: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize') as Promise<boolean>,
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized') as Promise<boolean>,
    onStateChange: (callback: (payload: WindowStatePayload) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: WindowStatePayload) => {
        callback(payload);
      };

      ipcRenderer.on(WINDOW_STATE_CHANNEL, listener);

      return () => {
        ipcRenderer.removeListener(WINDOW_STATE_CHANNEL, listener);
      };
    },
  },
});
