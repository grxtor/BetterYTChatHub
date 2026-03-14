'use client';

import { useElectronShell } from './electron';

export function useIsElectron() {
  return useElectronShell().isElectron;
}
