'use client';

import { useEffect, useState } from 'react';
import type { AppSettings } from '@shared/settings';
import { DEFAULT_APP_SETTINGS } from '@shared/settings';
import SettingsView, { type SettingsSaveState } from '../components/SettingsView';
import TopBar from '../components/TopBar';
import {
  loadStoredSettings,
  normalizeSettings,
  persistSettings,
  settingsAreEqual,
  subscribeToSettingsChanges,
} from '../../lib/appSettings';
import { applyAppTheme } from '../../lib/appTheme';
import { BACKEND_URL, getOverlayUrls } from '../../lib/runtime';

const SYNC_DEBOUNCE_MS = 220;

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SettingsSaveState>('idle');

  useEffect(() => {
    const initialSettings = loadStoredSettings();
    setSettings(initialSettings);
    setLoaded(true);

    return subscribeToSettingsChanges((incoming) => {
      setSettings((current) =>
        settingsAreEqual(current, incoming) ? current : incoming,
      );
    });
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    applyAppTheme(settings);

    const normalized = persistSettings(settings);
    setSettings((current) =>
      settingsAreEqual(current, normalized) ? current : normalized,
    );
    setSaveState('saved-local');

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/settings/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized),
        });

        if (!response.ok) {
          throw new Error(`Settings sync failed: ${response.status}`);
        }

        setSaveState('synced');
      } catch (error) {
        console.error('Failed to sync settings', error);
        setSaveState('sync-error');
      }
    }, SYNC_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [loaded, settings]);

  const handleUpdate = (nextSettings: AppSettings) => {
    setSettings(normalizeSettings(nextSettings));
  };

  if (!loaded) {
    return <div className="h-screen w-screen bg-app-bg" />;
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-app-bg">
      <TopBar isSettings />
      <div className="flex-1 overflow-hidden">
        <SettingsView
          settings={settings}
          onUpdate={handleUpdate}
          overlayUrls={getOverlayUrls()}
          saveState={saveState}
        />
      </div>
    </div>
  );
}
