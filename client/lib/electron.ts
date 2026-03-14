'use client';

import { useEffect, useState } from 'react';

export type DesktopPlatform = 'browser' | 'darwin' | 'win32' | 'linux';

type WindowStatePayload = {
  isMaximized: boolean;
};

type ElectronWindowControls = {
  minimize: () => Promise<void>;
  toggleMaximize: () => Promise<boolean>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  onStateChange: (callback: (payload: WindowStatePayload) => void) => () => void;
};

type ElectronAPI = {
  isElectron: true;
  platform: Exclude<DesktopPlatform, 'browser'>;
  showCustomWindowControls: boolean;
  windowControls: ElectronWindowControls;
};

export type ElectronShellState = {
  isElectron: boolean;
  platform: DesktopPlatform;
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  showCustomWindowControls: boolean;
  isMaximized: boolean;
};

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

function getElectronAPI(): ElectronAPI | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.electronAPI ?? null;
}

function buildShellState(
  platform: DesktopPlatform,
  showCustomWindowControls: boolean,
  isMaximized = false,
): ElectronShellState {
  return {
    isElectron: platform !== 'browser',
    platform,
    isMac: platform === 'darwin',
    isWindows: platform === 'win32',
    isLinux: platform === 'linux',
    showCustomWindowControls,
    isMaximized,
  };
}

function getInitialShellState(): ElectronShellState {
  // Keep SSR and the first client render identical to avoid hydration mismatches.
  return buildShellState('browser', false);
}

export function useElectronShell() {
  const [shell, setShell] = useState<ElectronShellState>(() => getInitialShellState());

  useEffect(() => {
    const api = getElectronAPI();

    if (!api) {
      setShell(buildShellState('browser', false));
      return;
    }

    setShell((current) => buildShellState(api.platform, api.showCustomWindowControls, current.isMaximized));

    let active = true;

    void api.windowControls.isMaximized().then((isMaximized) => {
      if (!active) {
        return;
      }

      setShell(buildShellState(api.platform, api.showCustomWindowControls, isMaximized));
    });

    const unsubscribe = api.windowControls.onStateChange(({ isMaximized }) => {
      setShell(buildShellState(api.platform, api.showCustomWindowControls, isMaximized));
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const minimize = () => getElectronAPI()?.windowControls.minimize();
  const toggleMaximize = () => getElectronAPI()?.windowControls.toggleMaximize();
  const close = () => getElectronAPI()?.windowControls.close();

  return {
    ...shell,
    minimize,
    toggleMaximize,
    close,
  };
}
