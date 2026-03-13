'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import type {
  AppSettings,
  DashboardDensity,
  OverlayPosition,
  OverlayPositionOverride,
  WorkspaceFrame,
} from '@shared/settings';
import { BACKEND_URL } from '../../lib/runtime';

export type SettingsSaveState =
  | 'idle'
  | 'saved-local'
  | 'synced'
  | 'sync-error';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  overlayUrls: {
    overlay: string;
    superchat: string;
    members: string;
  };
  saveState: SettingsSaveState;
}

const MOCK_AVATAR_URL = 'https://api.dicebear.com/7.x/avataaars/svg?seed=';
const POSITION_OPTIONS: Array<{ value: OverlayPosition; label: string }> = [
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'center', label: 'Center' },
];

const navItems = [
  {
    id: 'workspace',
    label: 'Workspace',
    description: 'Desktop shell, layout density, and app theme.',
  },
  {
    id: 'general',
    label: 'General',
    description: 'Global overlay, visibility, and automation.',
  },
  {
    id: 'superchat',
    label: 'Super Chats',
    description: 'Dedicated super chat look and behavior.',
  },
  {
    id: 'members',
    label: 'Members',
    description: 'Member alerts and styling overrides.',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'System config and custom CSS.',
  },
] as const;

const DENSITY_OPTIONS: Array<{ value: DashboardDensity; label: string }> = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'immersive', label: 'Immersive' },
];

const WORKSPACE_FRAME_OPTIONS: Array<{ value: WorkspaceFrame; label: string }> = [
  { value: 'full', label: 'Full Width' },
  { value: 'framed', label: 'Framed' },
];

type TabId = (typeof navItems)[number]['id'];

type ColorKey =
  | 'overlayBgColor'
  | 'overlayTxColor'
  | 'superChatOverlayBgColor'
  | 'superChatOverlayTxColor'
  | 'superChatHeaderColor'
  | 'membersOverlayBgColor'
  | 'membersOverlayTxColor'
  | 'membersGradientColor1'
  | 'membersGradientColor2';

const COLOR_DEFAULTS: Record<ColorKey, string> = {
  overlayBgColor: 'rgba(20, 20, 22, 0.95)',
  overlayTxColor: '#ffffff',
  superChatOverlayBgColor: 'rgba(20, 20, 22, 0.95)',
  superChatOverlayTxColor: '#ffffff',
  superChatHeaderColor: '#E62117',
  membersOverlayBgColor: 'rgba(20, 20, 22, 0.95)',
  membersOverlayTxColor: '#ffffff',
  membersGradientColor1: '#1a1a1e',
  membersGradientColor2: '#1a1a1e',
};

const ACCENT_FALLBACK = '#818cf8';

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(value: string) {
  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value.toLowerCase();
  }

  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const compact = value.slice(1).toLowerCase();
    return `#${compact[0]}${compact[0]}${compact[1]}${compact[1]}${compact[2]}${compact[2]}`;
  }

  return '#ffffff';
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex).slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => clamp(value, 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

function parseColorValue(value: string, fallback: string) {
  const source = value || fallback;
  const rgbaMatch = source.match(
    /rgba?\(\s*(\d{1,3})[,\s]+(\d{1,3})[,\s]+(\d{1,3})(?:[,\s/]+([0-9.]+))?\s*\)/i,
  );

  if (rgbaMatch) {
    return {
      hex: rgbToHex(
        Number(rgbaMatch[1]),
        Number(rgbaMatch[2]),
        Number(rgbaMatch[3]),
      ),
      alpha: clamp(
        rgbaMatch[4] === undefined ? 1 : Number(rgbaMatch[4]),
        0,
        1,
      ),
    };
  }

  return {
    hex: normalizeHex(source),
    alpha: 1,
  };
}

function serializeColor(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  const normalizedAlpha = clamp(Number(alpha.toFixed(2)), 0, 1);

  if (normalizedAlpha >= 0.99) {
    return normalizeHex(hex);
  }

  return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`;
}

function getSaveLabel(saveState: SettingsSaveState) {
  switch (saveState) {
    case 'saved-local':
      return 'Saved locally';
    case 'synced':
      return 'Synced';
    case 'sync-error':
      return 'Sync failed';
    default:
      return 'Ready';
  }
}

function getPositionLabel(position: OverlayPositionOverride | OverlayPosition) {
  if (!position) {
    return 'Global';
  }

  return POSITION_OPTIONS.find((option) => option.value === position)?.label ?? position;
}

function getPreviewPlacement(position: OverlayPosition, scale: number) {
  const previewScale = clamp(scale, 0.5, 2) * 0.72;

  if (position === 'center') {
    return {
      top: '50%',
      left: '50%',
      transform: `translate(-50%, -50%) scale(${previewScale})`,
    };
  }

  const base = {
    transform: `scale(${previewScale})`,
    transformOrigin: `${
      position.includes('bottom') ? 'bottom' : 'top'
    } ${position.includes('left') ? 'left' : 'right'}`,
  } as const;

  return {
    ...base,
    ...(position.includes('bottom') ? { bottom: '11%' } : { top: '11%' }),
    ...(position.includes('left') ? { left: '5%' } : { right: '5%' }),
  };
}

function PreviewStandard({
  settings,
  position,
}: {
  settings: AppSettings;
  position: OverlayPosition;
}) {
  return (
    <div
      className="preview-message"
      style={{
        ...getPreviewPlacement(position, settings.overlayScale),
        maxWidth: `${settings.messageMaxWidth}px`,
      }}
    >
      <div
        className="preview-message__content preview-message__content--standard"
        style={{
          background: settings.overlayBgColor,
          color: settings.overlayTxColor,
        }}
      >
        {settings.showAvatars && (
          <div className="preview-message__avatar">JD</div>
        )}
        <div className="preview-message__body">
          <div className="preview-message__header">
            <span>John Doe</span>
            {settings.showTimestamps && (
              <span className="preview-message__time">12:34</span>
            )}
          </div>
          <p
            className="preview-message__text"
            style={{ fontSize: `${settings.messageFontSize}px` }}
          >
            Clean broadcast-console style chat card with live settings preview.
          </p>
        </div>
      </div>
    </div>
  );
}

function PreviewSuperchat({
  settings,
  position,
}: {
  settings: AppSettings;
  position: OverlayPosition;
}) {
  return (
    <div
      className="preview-message"
      style={{
        ...getPreviewPlacement(position, settings.superChatOverlayScale),
        maxWidth: `${settings.messageMaxWidth}px`,
      }}
    >
      <div
        className="overlay__card overlay__card--superchat-only preview-card-sim"
        style={{
          background:
            settings.superChatOverlayBgColor || settings.overlayBgColor,
          color: settings.superChatOverlayTxColor || settings.overlayTxColor,
        }}
      >
        <div
          className="overlay__superchat-header"
          style={{ background: settings.superChatHeaderColor }}
        >
          {settings.showAvatars && (
            <img
              src={`${MOCK_AVATAR_URL}Felix`}
              alt=""
              className="overlay__superchat-avatar"
            />
          )}
          <div className="overlay__superchat-info">
            <span className="overlay__superchat-name">Super Fan</span>
            <span className="overlay__superchat-amount">$50.00</span>
          </div>
        </div>
        <div
          className="overlay__superchat-text"
          style={{
            fontSize: `${settings.superChatFontSize}px`,
            color: settings.superChatOverlayTxColor || settings.overlayTxColor,
          }}
        >
          Highlighted donation message with stronger hierarchy and cleaner spacing.
        </div>
      </div>
    </div>
  );
}

function PreviewMember({
  settings,
  position,
}: {
  settings: AppSettings;
  position: OverlayPosition;
}) {
  const memberBackground =
    settings.useSpecialMemberStyling &&
    settings.membersGradientColor1 &&
    settings.membersGradientColor2
      ? `linear-gradient(90deg, ${settings.membersGradientColor1}, ${settings.membersGradientColor2})`
      : settings.membersOverlayBgColor || settings.overlayBgColor;

  return (
    <div
      className="preview-message"
      style={{
        ...getPreviewPlacement(position, settings.membersOverlayScale),
        maxWidth: `${settings.messageMaxWidth}px`,
      }}
    >
      <div
        className="overlay__card overlay__card--member-only preview-card-sim"
        style={{
          background: memberBackground,
          color: settings.membersOverlayTxColor || settings.overlayTxColor,
        }}
      >
        <div className="overlay__membership-header">
          {settings.showAvatars && (
            <img
              src={`${MOCK_AVATAR_URL}Aneka`}
              alt=""
              className="overlay__membership-avatar"
            />
          )}
          <div className="overlay__membership-info">
            <span className="overlay__membership-name">New Member</span>
            <span className="overlay__membership-level">Welcome aboard</span>
          </div>
        </div>
        <div
          className="overlay__membership-text"
          style={{
            fontSize: `${settings.membersFontSize}px`,
            color: settings.membersOverlayTxColor || settings.overlayTxColor,
          }}
        >
          Membership alert preview with dedicated styling and safe-area placement.
        </div>
      </div>
    </div>
  );
}

function WorkspacePreview({ settings }: { settings: AppSettings }) {
  const densityMap = {
    compact: {
      padding: '10px',
      avatar: '30px',
      line: '10px',
    },
    comfortable: {
      padding: '14px',
      avatar: '36px',
      line: '12px',
    },
    immersive: {
      padding: '18px',
      avatar: '42px',
      line: '13px',
    },
  } as const;

  const density = densityMap[settings.dashboardDensity];

  return (
    <div
      className={`workspace-preview ${
        settings.workspaceFrame === 'framed' ? 'is-framed' : 'is-full'
      }`}
      style={
        {
          '--workspace-accent': settings.accentColor || ACCENT_FALLBACK,
          '--workspace-rail-width': `${Math.round(settings.dashboardPanelWidth * 0.34)}px`,
          '--workspace-density-padding': density.padding,
          '--workspace-avatar-size': density.avatar,
          '--workspace-line-height': density.line,
        } as CSSProperties
      }
    >
      <div className="workspace-preview__toolbar">
        <span className="workspace-preview__brand">Studio Shell</span>
        <span className="workspace-preview__chip">
          {settings.workspaceFrame === 'full' ? 'Full Width' : 'Framed'}
        </span>
      </div>
      <div className="workspace-preview__metrics">
        <div className="workspace-preview__metric" />
        <div className="workspace-preview__metric" />
        <div className="workspace-preview__metric" />
      </div>
      <div className="workspace-preview__layout">
        <div className="workspace-preview__feed">
          <div className="workspace-preview__search" />
          <div className="workspace-preview__message is-selected">
            <div className="workspace-preview__avatar" />
            <div className="workspace-preview__message-body">
              <div className="workspace-preview__line is-short" />
              <div className="workspace-preview__line" />
            </div>
          </div>
          <div className="workspace-preview__message">
            <div className="workspace-preview__avatar" />
            <div className="workspace-preview__message-body">
              <div className="workspace-preview__line is-short" />
              <div className="workspace-preview__line" />
            </div>
          </div>
        </div>
        <div className="workspace-preview__rail">
          {settings.showSelectionPreview ? (
            <div className="workspace-preview__rail-card is-accent" />
          ) : null}
          <div className="workspace-preview__rail-card" />
          <div className="workspace-preview__rail-card" />
        </div>
      </div>
      <div className="workspace-preview__footer">
        <span>{settings.dashboardDensity}</span>
        <span>{settings.showBadges ? 'Badges on' : 'Badges off'}</span>
        <span>{settings.showAmbientGlow ? 'Ambient glow' : 'Clean chrome'}</span>
      </div>
    </div>
  );
}

function UrlField({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="setting-row setting-row--stacked">
      <div className="setting-row__info">
        <div className="setting-row__label">{label}</div>
      </div>
      <div className="url-copy-field">
        <code className="url-copy-field__url">{value}</code>
        <button className="url-copy-field__btn" onClick={onCopy} type="button">
          {copied ? '✓' : <CopyIcon />}
        </button>
      </div>
    </div>
  );
}

function SwitchField({
  label,
  hint,
  checked,
  onToggle,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="setting-row">
      <div className="setting-row__info">
        <div className="setting-row__label">{label}</div>
        {hint ? <div className="setting-row__hint">{hint}</div> : null}
      </div>
      <button
        type="button"
        className={`switch-button ${checked ? 'is-on' : ''}`}
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
      >
        <span className="switch-button__thumb" />
      </button>
    </div>
  );
}

function SettingsView({
  settings,
  onUpdate,
  overlayUrls,
  saveState,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('workspace');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const saveLabel = useMemo(() => getSaveLabel(saveState), [saveState]);

  const setField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdate({ ...settings, [key]: value });
  };

  const toggleField = (key: keyof Pick<
    AppSettings,
    | 'showAvatars'
    | 'showTimestamps'
    | 'showBadges'
    | 'showAmbientGlow'
    | 'showSelectionPreview'
    | 'includeSuperChatsInOverlay'
    | 'includeMembersInOverlay'
    | 'autoSelectSuperChats'
    | 'autoSelectMembers'
    | 'superChatPopup'
    | 'useSpecialMemberStyling'
  >) => {
    setField(key, !settings[key] as AppSettings[typeof key]);
  };

  const updateColorField = (key: ColorKey, nextHex?: string, nextAlpha?: number) => {
    const current = parseColorValue(settings[key] || COLOR_DEFAULTS[key], COLOR_DEFAULTS[key]);
    const hex = nextHex ?? current.hex;
    const alpha = nextAlpha ?? current.alpha;
    setField(key, serializeColor(hex, alpha));
  };

  const updateAccentColor = (nextColor: string) => {
    const normalized = /^#[0-9a-f]{6}$/i.test(nextColor)
      ? nextColor.toLowerCase()
      : ACCENT_FALLBACK;
    setField('accentColor', normalized);
  };

  const copyToClipboard = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(label);
    window.setTimeout(() => {
      setCopiedField((current) => (current === label ? null : current));
    }, 1800);
  };

  const previewPosition =
    activeTab === 'superchat'
      ? (settings.superChatOverlayPosition || settings.overlayPosition)
      : activeTab === 'members'
        ? (settings.membersOverlayPosition || settings.overlayPosition)
        : settings.overlayPosition;

  const renderColorControl = (
    key: ColorKey,
    label: string,
    hint?: string,
  ) => {
    const parsed = parseColorValue(settings[key] || COLOR_DEFAULTS[key], COLOR_DEFAULTS[key]);

    return (
      <div className="color-field">
        <div className="color-field__header">
          <div>
            <div className="color-field__label">{label}</div>
            {hint ? <div className="color-field__hint">{hint}</div> : null}
          </div>
          <code className="color-field__value">{settings[key] || COLOR_DEFAULTS[key]}</code>
        </div>
        <div className="color-field__controls">
          <input
            type="color"
            value={parsed.hex}
            onChange={(event) => updateColorField(key, event.target.value)}
          />
          <label className="color-field__alpha">
            <span>Opacity</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round(parsed.alpha * 100)}
              onChange={(event) =>
                updateColorField(key, undefined, Number(event.target.value) / 100)
              }
            />
            <strong>{Math.round(parsed.alpha * 100)}%</strong>
          </label>
        </div>
      </div>
    );
  };

  const renderAccentControl = () => (
    <div className="color-field">
      <div className="color-field__header">
        <div>
          <div className="color-field__label">Accent Color</div>
          <div className="color-field__hint">
            Applied across the dashboard shell, controls, and focused states.
          </div>
        </div>
        <code className="color-field__value">{settings.accentColor}</code>
      </div>
      <div className="color-field__controls">
        <input
          type="color"
          value={settings.accentColor || ACCENT_FALLBACK}
          onChange={(event) => updateAccentColor(event.target.value)}
        />
      </div>
    </div>
  );

  return (
    <div className="settings-layout-v3">
      <aside className="settings-sidebar">
        <div className="settings-sidebar__header">
          <div>
            <p className="settings-sidebar__eyebrow">Control Room</p>
            <h2>Studio Settings</h2>
          </div>
          <span className={`settings-save-pill is-${saveState}`}>{saveLabel}</span>
        </div>
        <nav className="settings-nav" aria-label="Settings sections">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-nav__item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="settings-nav__title">{item.label}</span>
              <span className="settings-nav__desc">{item.description}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="settings-content-v3">
        {activeTab === 'workspace' && (
          <>
            <div className="settings-card">
              <div className="settings-card__header">
                <h3 className="settings-card__title">Desktop Workspace</h3>
                <p className="settings-card__desc">
                  Tune the shell for Electron-style operation instead of a narrow web page.
                </p>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Workspace Frame</div>
                  <div className="setting-row__hint">
                    Full width works better for desktop windows and multi-panel workflows.
                  </div>
                </div>
                <div className="segmented">
                  {WORKSPACE_FRAME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`segmented__btn ${
                        settings.workspaceFrame === option.value ? 'active' : ''
                      }`}
                      onClick={() => setField('workspaceFrame', option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Message Density</div>
                  <div className="setting-row__hint">
                    Controls spacing, avatar size, and message rhythm inside the dashboard.
                  </div>
                </div>
                <div className="segmented">
                  {DENSITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`segmented__btn ${
                        settings.dashboardDensity === option.value ? 'active' : ''
                      }`}
                      onClick={() => setField('dashboardDensity', option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Activity Rail Width</div>
                  <div className="setting-row__hint">
                    Wider rails give super chats and member events more breathing room.
                  </div>
                </div>
                <div className="range-slider">
                  <input
                    type="range"
                    min="280"
                    max="520"
                    step="10"
                    value={settings.dashboardPanelWidth}
                    onChange={(event) =>
                      setField('dashboardPanelWidth', Number(event.target.value))
                    }
                  />
                  <span className="range-slider__value">
                    {settings.dashboardPanelWidth}px
                  </span>
                </div>
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-card__header">
                <h3 className="settings-card__title">Visual Identity</h3>
                <p className="settings-card__desc">
                  Shape the product feel with stronger app-level controls.
                </p>
              </div>
              <div className="settings-card__body settings-card__body--grid">
                {renderAccentControl()}
              </div>
              <SwitchField
                label="Ambient Background"
                hint="Adds a soft console glow behind the workspace shell."
                checked={settings.showAmbientGlow}
                onToggle={() => toggleField('showAmbientGlow')}
              />
              <SwitchField
                label="Show Badges"
                hint="Display moderator/member/leaderboard badges in the dashboard feed."
                checked={settings.showBadges}
                onToggle={() => toggleField('showBadges')}
              />
              <SwitchField
                label="Selection Preview Panel"
                hint="Shows the currently pinned overlay item inside the dashboard rail."
                checked={settings.showSelectionPreview}
                onToggle={() => toggleField('showSelectionPreview')}
              />
            </div>
          </>
        )}

        {activeTab === 'general' && (
          <>
            <div className="settings-card">
              <div className="settings-card__header">
                <h3 className="settings-card__title">Browser Sources</h3>
                <p className="settings-card__desc">
                  These URLs are generated from the active frontend origin.
                </p>
              </div>
              <UrlField
                label="Main Overlay"
                value={overlayUrls.overlay}
                copied={copiedField === 'overlay'}
                onCopy={() => copyToClipboard('overlay', overlayUrls.overlay)}
              />
              <UrlField
                label="Super Chat Overlay"
                value={overlayUrls.superchat}
                copied={copiedField === 'superchat'}
                onCopy={() => copyToClipboard('superchat', overlayUrls.superchat)}
              />
              <UrlField
                label="Members Overlay"
                value={overlayUrls.members}
                copied={copiedField === 'members'}
                onCopy={() => copyToClipboard('members', overlayUrls.members)}
              />
            </div>

            <div className="settings-card">
              <div className="settings-card__header">
                <h3 className="settings-card__title">Global Appearance</h3>
                <p className="settings-card__desc">
                  Base positioning, scale, and color system for the main overlay.
                </p>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Base Theme</div>
                  <div className="setting-row__hint">
                    Applies default text/background pairing.
                  </div>
                </div>
                <div className="segmented">
                  <button
                    type="button"
                    className={`segmented__btn ${
                      settings.overlayTheme === 'dark' ? 'active' : ''
                    }`}
                    onClick={() =>
                      onUpdate({
                        ...settings,
                        overlayTheme: 'dark',
                        overlayBgColor: 'rgba(20, 20, 22, 0.95)',
                        overlayTxColor: '#ffffff',
                      })
                    }
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    className={`segmented__btn ${
                      settings.overlayTheme === 'light' ? 'active' : ''
                    }`}
                    onClick={() =>
                      onUpdate({
                        ...settings,
                        overlayTheme: 'light',
                        overlayBgColor: 'rgba(255, 255, 255, 0.95)',
                        overlayTxColor: '#1a1a1e',
                      })
                    }
                  >
                    Light
                  </button>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Overlay Position</div>
                </div>
                <select
                  className="select-input"
                  value={settings.overlayPosition}
                  onChange={(event) =>
                    setField('overlayPosition', event.target.value as OverlayPosition)
                  }
                >
                  {POSITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Overlay Scale</div>
                </div>
                <div className="range-slider">
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={settings.overlayScale}
                    onChange={(event) =>
                      setField('overlayScale', Number(event.target.value))
                    }
                  />
                  <span className="range-slider__value">
                    {Math.round(settings.overlayScale * 100)}%
                  </span>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Font Size</div>
                </div>
                <div className="range-slider">
                  <input
                    type="range"
                    min="10"
                    max="48"
                    step="1"
                    value={settings.messageFontSize}
                    onChange={(event) =>
                      setField('messageFontSize', Number(event.target.value))
                    }
                  />
                  <span className="range-slider__value">
                    {settings.messageFontSize}px
                  </span>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Message Max Width</div>
                </div>
                <div className="range-slider">
                  <input
                    type="range"
                    min="220"
                    max="1200"
                    step="10"
                    value={settings.messageMaxWidth}
                    onChange={(event) =>
                      setField('messageMaxWidth', Number(event.target.value))
                    }
                  />
                  <span className="range-slider__value">
                    {settings.messageMaxWidth}px
                  </span>
                </div>
              </div>
              <div className="settings-card__body settings-card__body--grid">
                {renderColorControl('overlayBgColor', 'Backdrop')}
                {renderColorControl('overlayTxColor', 'Text Color')}
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-card__header">
                <h3 className="settings-card__title">Visibility & Automation</h3>
                <p className="settings-card__desc">
                  Dashboard and preview update instantly as these values change.
                </p>
              </div>
              <SwitchField
                label="Show Avatars"
                checked={settings.showAvatars}
                onToggle={() => toggleField('showAvatars')}
              />
              <SwitchField
                label="Show Timestamps"
                checked={settings.showTimestamps}
                onToggle={() => toggleField('showTimestamps')}
              />
              <SwitchField
                label="Include Super Chats"
                hint="Allow selected super chats on the shared overlay."
                checked={settings.includeSuperChatsInOverlay}
                onToggle={() => toggleField('includeSuperChatsInOverlay')}
              />
              <SwitchField
                label="Include Members"
                hint="Allow member joins and gifts on the shared overlay."
                checked={settings.includeMembersInOverlay}
                onToggle={() => toggleField('includeMembersInOverlay')}
              />
              <SwitchField
                label="Auto-Select Super Chats"
                checked={settings.autoSelectSuperChats}
                onToggle={() => toggleField('autoSelectSuperChats')}
              />
              <SwitchField
                label="Auto-Select Members"
                checked={settings.autoSelectMembers}
                onToggle={() => toggleField('autoSelectMembers')}
              />
            </div>
          </>
        )}

        {activeTab === 'superchat' && (
          <>
            <div className="settings-card">
              <div className="settings-card__header">
                <h3 className="settings-card__title">Super Chat Delivery</h3>
                <p className="settings-card__desc">
                  Configure dedicated super chat output and timing.
                </p>
              </div>
              <UrlField
                label="Dedicated URL"
                value={overlayUrls.superchat}
                copied={copiedField === 'superchat-dedicated'}
                onCopy={() =>
                  copyToClipboard('superchat-dedicated', overlayUrls.superchat)
                }
              />
              <SwitchField
                label="Popup Mode"
                hint="Use a separate, time-limited super chat browser source."
                checked={settings.superChatPopup}
                onToggle={() => toggleField('superChatPopup')}
              />
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Alert Duration</div>
                </div>
                <div className="range-slider">
                  <input
                    type="range"
                    min="3"
                    max="60"
                    step="1"
                    value={settings.superChatDuration}
                    onChange={(event) =>
                      setField('superChatDuration', Number(event.target.value))
                    }
                  />
                  <span className="range-slider__value">
                    {settings.superChatDuration}s
                  </span>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Override Position</div>
                </div>
                <select
                  className="select-input"
                  value={settings.superChatOverlayPosition}
                  onChange={(event) =>
                    setField(
                      'superChatOverlayPosition',
                      event.target.value as OverlayPositionOverride,
                    )
                  }
                >
                  <option value="">Use Global Position</option>
                  {POSITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Override Scale</div>
                </div>
                <div className="range-slider">
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={settings.superChatOverlayScale}
                    onChange={(event) =>
                      setField(
                        'superChatOverlayScale',
                        Number(event.target.value),
                      )
                    }
                  />
                  <span className="range-slider__value">
                    {Math.round(settings.superChatOverlayScale * 100)}%
                  </span>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Font Size Override</div>
                </div>
                <div className="range-slider">
                  <input
                    type="range"
                    min="12"
                    max="48"
                    step="1"
                    value={settings.superChatFontSize}
                    onChange={(event) =>
                      setField('superChatFontSize', Number(event.target.value))
                    }
                  />
                  <span className="range-slider__value">
                    {settings.superChatFontSize}px
                  </span>
                </div>
              </div>
              <div className="settings-card__body settings-card__body--grid">
                {renderColorControl('superChatOverlayBgColor', 'Backdrop')}
                {renderColorControl('superChatOverlayTxColor', 'Text Color')}
                {renderColorControl('superChatHeaderColor', 'Header Accent', 'Amount strip color')}
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-card__header">
                <h3 className="settings-card__title">Super Chat CSS</h3>
                <p className="settings-card__desc">
                  Advanced overrides that apply only to the dedicated super chat overlay.
                </p>
              </div>
              <div className="css-editor">
                <textarea
                  className="css-editor__textarea"
                  value={settings.superChatCss}
                  onChange={(event) => setField('superChatCss', event.target.value)}
                  spellCheck={false}
                  placeholder=".overlay__superchat-header { letter-spacing: 0.02em; }"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'members' && (
          <>
            <div className="settings-card">
              <div className="settings-card__header">
                <h3 className="settings-card__title">Member Alerts</h3>
                <p className="settings-card__desc">
                  Dedicated layout controls for members and gifted memberships.
                </p>
              </div>
              <UrlField
                label="Dedicated URL"
                value={overlayUrls.members}
                copied={copiedField === 'members-dedicated'}
                onCopy={() =>
                  copyToClipboard('members-dedicated', overlayUrls.members)
                }
              />
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Alert Duration</div>
                </div>
                <div className="range-slider">
                  <input
                    type="range"
                    min="3"
                    max="60"
                    step="1"
                    value={settings.membersDuration}
                    onChange={(event) =>
                      setField('membersDuration', Number(event.target.value))
                    }
                  />
                  <span className="range-slider__value">{settings.membersDuration}s</span>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Override Position</div>
                </div>
                <select
                  className="select-input"
                  value={settings.membersOverlayPosition}
                  onChange={(event) =>
                    setField(
                      'membersOverlayPosition',
                      event.target.value as OverlayPositionOverride,
                    )
                  }
                >
                  <option value="">Use Global Position</option>
                  {POSITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Override Scale</div>
                </div>
                <div className="range-slider">
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={settings.membersOverlayScale}
                    onChange={(event) =>
                      setField('membersOverlayScale', Number(event.target.value))
                    }
                  />
                  <span className="range-slider__value">
                    {Math.round(settings.membersOverlayScale * 100)}%
                  </span>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Font Size Override</div>
                </div>
                <div className="range-slider">
                  <input
                    type="range"
                    min="12"
                    max="48"
                    step="1"
                    value={settings.membersFontSize}
                    onChange={(event) =>
                      setField('membersFontSize', Number(event.target.value))
                    }
                  />
                  <span className="range-slider__value">
                    {settings.membersFontSize}px
                  </span>
                </div>
              </div>
              <SwitchField
                label="Special Member Styling"
                hint="Enable dedicated member gradients and colors."
                checked={settings.useSpecialMemberStyling}
                onToggle={() => toggleField('useSpecialMemberStyling')}
              />
              <div className="settings-card__body settings-card__body--grid">
                {renderColorControl('membersOverlayBgColor', 'Backdrop')}
                {renderColorControl('membersOverlayTxColor', 'Text Color')}
                {renderColorControl('membersGradientColor1', 'Gradient Start')}
                {renderColorControl('membersGradientColor2', 'Gradient End')}
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-card__header">
                <h3 className="settings-card__title">Members CSS</h3>
                <p className="settings-card__desc">
                  Advanced overrides that apply only to member overlays.
                </p>
              </div>
              <div className="css-editor">
                <textarea
                  className="css-editor__textarea"
                  value={settings.membersCss}
                  onChange={(event) => setField('membersCss', event.target.value)}
                  spellCheck={false}
                  placeholder=".overlay__membership-header { backdrop-filter: blur(12px); }"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'advanced' && (
          <>
            <div className="settings-card">
              <div className="settings-card__header">
                <h3 className="settings-card__title">System Configuration</h3>
                <p className="settings-card__desc">
                  Local-only controls. These values are stored immediately.
                </p>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Server Port</div>
                  <div className="setting-row__hint">
                    Stored for reference. Backend URL uses environment config.
                  </div>
                </div>
                <div className="number-input">
                  <input
                    type="number"
                    className="number-input__field"
                    value={settings.serverPort}
                    onChange={(event) =>
                      setField('serverPort', Number(event.target.value) || 4100)
                    }
                    min={1000}
                    max={65535}
                  />
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Max Messages</div>
                </div>
                <div className="number-input">
                  <input
                    type="number"
                    className="number-input__field"
                    value={settings.maxMessages}
                    onChange={(event) =>
                      setField('maxMessages', Number(event.target.value) || 50)
                    }
                    min={10}
                    max={1000}
                    step={10}
                  />
                </div>
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-card__header">
                <h3 className="settings-card__title">Global Custom CSS</h3>
                <p className="settings-card__desc">
                  Injected into overlay, member, and super chat pages.
                </p>
              </div>
              <div className="css-editor">
                <textarea
                  className="css-editor__textarea"
                  value={settings.customCss}
                  onChange={(event) => setField('customCss', event.target.value)}
                  spellCheck={false}
                  placeholder=".overlay__card { box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55); }"
                />
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-card__header">
                <h3 className="settings-card__title">Runtime Status</h3>
                <p className="settings-card__desc">
                  Auto-save writes locally first, then syncs to backend.
                </p>
              </div>
              <div className="settings-status-grid">
                <div className="settings-status-card">
                  <span className="settings-status-card__label">Save State</span>
                  <strong>{saveLabel}</strong>
                </div>
                <div className="settings-status-card">
                  <span className="settings-status-card__label">Backend</span>
                  <strong>{BACKEND_URL}</strong>
                </div>
                <div className="settings-status-card">
                  <span className="settings-status-card__label">Placement</span>
                  <strong>{getPositionLabel(previewPosition)}</strong>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-row__info">
                  <div className="setting-row__label">Troubleshooting</div>
                  <div className="setting-row__hint">
                    Reload the UI if OBS or another tab is holding stale state.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => window.location.reload()}
                >
                  Refresh App
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <aside className="settings-preview-v3">
        <div className="preview-card">
          <div className="preview-card__header">
            <div>
              <span>Live Preview</span>
              <p>{navItems.find((item) => item.id === activeTab)?.label}</p>
            </div>
            <span className="preview-card__ratio">16:9</span>
          </div>
          <div className="preview-canvas">
            <div className="preview-canvas__safe-area" />
            {activeTab === 'workspace' ? (
              <WorkspacePreview settings={settings} />
            ) : activeTab === 'superchat' ? (
              <PreviewSuperchat
                settings={settings}
                position={settings.superChatOverlayPosition || settings.overlayPosition}
              />
            ) : activeTab === 'members' ? (
              <PreviewMember
                settings={settings}
                position={settings.membersOverlayPosition || settings.overlayPosition}
              />
            ) : (
              <PreviewStandard settings={settings} position={settings.overlayPosition} />
            )}
            <div className="preview-canvas__position">
              {getPositionLabel(previewPosition)}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default SettingsView;
