'use client';

import {
  DEFAULT_APP_SETTINGS,
  type AppSettings,
  type DashboardDensity,
  type OverlayPosition,
  type OverlayPositionOverride,
  type OverlayTheme,
  type WorkspaceFrame,
} from '@shared/settings';

const STORAGE_KEY = 'better_yt_settings';
const EVENT_NAME = 'better-yt-settings-change';
const CHANNEL_NAME = 'better-yt-settings';

type SettingsListener = (settings: AppSettings) => void;

const overlayPositions = new Set<OverlayPosition>([
  'bottom-left',
  'bottom-right',
  'top-left',
  'top-right',
  'center',
]);

const overlayThemes = new Set<OverlayTheme>(['dark', 'light']);
const dashboardDensities = new Set<DashboardDensity>([
  'compact',
  'comfortable',
  'immersive',
]);
const workspaceFrames = new Set<WorkspaceFrame>(['full', 'framed']);
const settingsKeys = Object.keys(DEFAULT_APP_SETTINGS) as (keyof AppSettings)[];

function isBrowser() {
  return typeof window !== 'undefined';
}

function asNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') {
    return value;
  }

  return fallback;
}

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function normalizeHexColor(value: unknown, fallback: string) {
  if (typeof value !== 'string') {
    return fallback;
  }

  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value.toLowerCase();
  }

  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const compact = value.slice(1).toLowerCase();
    return `#${compact[0]}${compact[0]}${compact[1]}${compact[1]}${compact[2]}${compact[2]}`;
  }

  return fallback;
}

function normalizeScale(value: unknown, fallback: number) {
  const parsed = asNumber(value, fallback);
  if (parsed <= 0) {
    return fallback;
  }

  if (parsed > 4) {
    return parsed / 100;
  }

  return parsed;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = asNumber(value, fallback);
  return Math.min(max, Math.max(min, parsed));
}

function normalizeTheme(value: unknown, fallback: OverlayTheme) {
  return typeof value === 'string' && overlayThemes.has(value as OverlayTheme)
    ? (value as OverlayTheme)
    : fallback;
}

function normalizeDensity(value: unknown, fallback: DashboardDensity) {
  return typeof value === 'string' && dashboardDensities.has(value as DashboardDensity)
    ? (value as DashboardDensity)
    : fallback;
}

function normalizeFrame(value: unknown, fallback: WorkspaceFrame) {
  return typeof value === 'string' && workspaceFrames.has(value as WorkspaceFrame)
    ? (value as WorkspaceFrame)
    : fallback;
}

function normalizePosition(
  value: unknown,
  fallback: OverlayPosition,
): OverlayPosition {
  return typeof value === 'string' && overlayPositions.has(value as OverlayPosition)
    ? (value as OverlayPosition)
    : fallback;
}

function normalizePositionOverride(
  value: unknown,
  fallback: OverlayPositionOverride,
): OverlayPositionOverride {
  if (value === '') {
    return '';
  }

  return typeof value === 'string' && overlayPositions.has(value as OverlayPosition)
    ? (value as OverlayPosition)
    : fallback;
}

export function normalizeSettings(raw: unknown): AppSettings {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  return {
    autoSelectSuperChats: asBoolean(
      source.autoSelectSuperChats,
      DEFAULT_APP_SETTINGS.autoSelectSuperChats,
    ),
    autoSelectMembers: asBoolean(
      source.autoSelectMembers,
      DEFAULT_APP_SETTINGS.autoSelectMembers,
    ),
    accentColor: normalizeHexColor(
      source.accentColor,
      DEFAULT_APP_SETTINGS.accentColor,
    ),
    overlayScale: normalizeScale(
      source.overlayScale,
      DEFAULT_APP_SETTINGS.overlayScale,
    ),
    overlayTheme: normalizeTheme(
      source.overlayTheme,
      DEFAULT_APP_SETTINGS.overlayTheme,
    ),
    serverPort: asNumber(source.serverPort, DEFAULT_APP_SETTINGS.serverPort),
    overlayPosition: normalizePosition(
      source.overlayPosition,
      DEFAULT_APP_SETTINGS.overlayPosition,
    ),
    dashboardDensity: normalizeDensity(
      source.dashboardDensity,
      DEFAULT_APP_SETTINGS.dashboardDensity,
    ),
    dashboardPanelWidth: clampNumber(
      source.dashboardPanelWidth,
      DEFAULT_APP_SETTINGS.dashboardPanelWidth,
      280,
      520,
    ),
    workspaceFrame: normalizeFrame(
      source.workspaceFrame,
      DEFAULT_APP_SETTINGS.workspaceFrame,
    ),
    showAmbientGlow: asBoolean(
      source.showAmbientGlow,
      DEFAULT_APP_SETTINGS.showAmbientGlow,
    ),
    showBadges: asBoolean(source.showBadges, DEFAULT_APP_SETTINGS.showBadges),
    showSelectionPreview: asBoolean(
      source.showSelectionPreview,
      DEFAULT_APP_SETTINGS.showSelectionPreview,
    ),
    showTimestamps: asBoolean(
      source.showTimestamps,
      DEFAULT_APP_SETTINGS.showTimestamps,
    ),
    showAvatars: asBoolean(source.showAvatars, DEFAULT_APP_SETTINGS.showAvatars),
    messageFontSize: asNumber(
      source.messageFontSize,
      DEFAULT_APP_SETTINGS.messageFontSize,
    ),
    maxMessages: asNumber(source.maxMessages, DEFAULT_APP_SETTINGS.maxMessages),
    superChatPopup: asBoolean(
      source.superChatPopup,
      DEFAULT_APP_SETTINGS.superChatPopup,
    ),
    superChatDuration: asNumber(
      source.superChatDuration,
      DEFAULT_APP_SETTINGS.superChatDuration,
    ),
    customCss: asString(source.customCss, DEFAULT_APP_SETTINGS.customCss),
    superChatCss: asString(
      source.superChatCss,
      DEFAULT_APP_SETTINGS.superChatCss,
    ),
    membersCss: asString(source.membersCss, DEFAULT_APP_SETTINGS.membersCss),
    messageMaxWidth: asNumber(
      source.messageMaxWidth,
      DEFAULT_APP_SETTINGS.messageMaxWidth,
    ),
    includeSuperChatsInOverlay: asBoolean(
      source.includeSuperChatsInOverlay,
      DEFAULT_APP_SETTINGS.includeSuperChatsInOverlay,
    ),
    includeMembersInOverlay: asBoolean(
      source.includeMembersInOverlay,
      DEFAULT_APP_SETTINGS.includeMembersInOverlay,
    ),
    membersDuration: asNumber(
      source.membersDuration,
      DEFAULT_APP_SETTINGS.membersDuration,
    ),
    overlayTxColor: asString(
      source.overlayTxColor,
      DEFAULT_APP_SETTINGS.overlayTxColor,
    ),
    overlayBgColor: asString(
      source.overlayBgColor,
      DEFAULT_APP_SETTINGS.overlayBgColor,
    ),
    membersOverlayScale: normalizeScale(
      source.membersOverlayScale,
      DEFAULT_APP_SETTINGS.membersOverlayScale,
    ),
    membersFontSize: asNumber(
      source.membersFontSize,
      DEFAULT_APP_SETTINGS.membersFontSize,
    ),
    membersOverlayBgColor: asString(
      source.membersOverlayBgColor,
      DEFAULT_APP_SETTINGS.membersOverlayBgColor,
    ),
    membersOverlayTxColor: asString(
      source.membersOverlayTxColor,
      DEFAULT_APP_SETTINGS.membersOverlayTxColor,
    ),
    superChatOverlayScale: normalizeScale(
      source.superChatOverlayScale,
      DEFAULT_APP_SETTINGS.superChatOverlayScale,
    ),
    superChatFontSize: asNumber(
      source.superChatFontSize,
      DEFAULT_APP_SETTINGS.superChatFontSize,
    ),
    superChatOverlayBgColor: asString(
      source.superChatOverlayBgColor,
      DEFAULT_APP_SETTINGS.superChatOverlayBgColor,
    ),
    superChatOverlayTxColor: asString(
      source.superChatOverlayTxColor,
      DEFAULT_APP_SETTINGS.superChatOverlayTxColor,
    ),
    membersOverlayPosition: normalizePositionOverride(
      source.membersOverlayPosition,
      DEFAULT_APP_SETTINGS.membersOverlayPosition,
    ),
    superChatOverlayPosition: normalizePositionOverride(
      source.superChatOverlayPosition,
      DEFAULT_APP_SETTINGS.superChatOverlayPosition,
    ),
    superChatHeaderColor: asString(
      source.superChatHeaderColor,
      DEFAULT_APP_SETTINGS.superChatHeaderColor,
    ),
    membersGradientColor1: asString(
      source.membersGradientColor1,
      DEFAULT_APP_SETTINGS.membersGradientColor1,
    ),
    membersGradientColor2: asString(
      source.membersGradientColor2,
      DEFAULT_APP_SETTINGS.membersGradientColor2,
    ),
    useSpecialMemberStyling: asBoolean(
      source.useSpecialMemberStyling,
      DEFAULT_APP_SETTINGS.useSpecialMemberStyling,
    ),
  };
}

export function loadStoredSettings() {
  if (!isBrowser()) {
    return DEFAULT_APP_SETTINGS;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    return normalizeSettings(JSON.parse(raw));
  } catch (error) {
    console.error('Failed to parse stored settings', error);
    return DEFAULT_APP_SETTINGS;
  }
}

function dispatchSettings(settings: AppSettings) {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, {
      detail: settings,
    }),
  );

  if (typeof window.BroadcastChannel !== 'undefined') {
    const channel = new window.BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(settings);
    channel.close();
  }
}

export function persistSettings(settings: AppSettings) {
  const normalized = normalizeSettings(settings);

  if (!isBrowser()) {
    return normalized;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  dispatchSettings(normalized);
  return normalized;
}

export function settingsAreEqual(a: AppSettings, b: AppSettings) {
  for (const key of settingsKeys) {
    if (!Object.is(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

export function subscribeToSettingsChanges(listener: SettingsListener) {
  if (!isBrowser()) {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      listener(normalizeSettings(JSON.parse(event.newValue)));
    } catch (error) {
      console.error('Failed to parse settings from storage event', error);
    }
  };

  const handleCustom = (event: Event) => {
    const customEvent = event as CustomEvent<AppSettings>;
    if (customEvent.detail) {
      listener(normalizeSettings(customEvent.detail));
    }
  };

  let channel: BroadcastChannel | null = null;
  if (typeof window.BroadcastChannel !== 'undefined') {
    channel = new window.BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (message) => {
      listener(normalizeSettings(message.data));
    };
  }

  window.addEventListener('storage', handleStorage);
  window.addEventListener(EVENT_NAME, handleCustom as EventListener);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(EVENT_NAME, handleCustom as EventListener);
    channel?.close();
  };
}
