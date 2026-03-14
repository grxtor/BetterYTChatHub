'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { AppSettings } from '@shared/settings';
import { SettingsIcons } from './Icons';
import { cn, normalizeHex, parseColorValue, serializeColor, SectionCard } from './settings/SettingsUI';
import { AppearanceSettings } from './settings/AppearanceSettings';
import { DisplaySettings } from './settings/DisplaySettings';
import { SuperChatSettings } from './settings/SuperChatSettings';
import { MembersSettings } from './settings/MembersSettings';
import { PreviewSettings, PreviewMode, OverlayPreview } from './settings/PreviewSettings';
import { ObsSettings } from './settings/ObsSettings';
import { AdvancedSettings } from './settings/AdvancedSettings';
import { PresetsSettings } from './settings/PresetsSettings';

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

type SettingsSection =
  | 'presets'
  | 'appearance'
  | 'display'
  | 'superchat'
  | 'members'
  | 'preview'
  | 'obs'
  | 'advanced';

interface SectionMeta {
  id: SettingsSection;
  label: string;
  hint: string;
  icon: ReactNode;
}

const SECTIONS: SectionMeta[] = [
  {
    id: 'presets',
    label: 'Temalar',
    hint: 'Hazır görünümler',
    icon: <SettingsIcons.Preview />,
  },
  {
    id: 'appearance',
    label: 'Görünüm',
    hint: 'Renk ve boyut',
    icon: <SettingsIcons.Appearance />,
  },
  {
    id: 'display',
    label: 'Ekran',
    hint: 'Avatarlar, rozetler, yoğunluk',
    icon: <SettingsIcons.Display />,
  },
  {
    id: 'superchat',
    label: 'Super Chat',
    hint: 'Bağış ayarları',
    icon: <SettingsIcons.SuperChat />,
  },
  {
    id: 'members',
    label: 'Üyeler',
    hint: 'Üyelik ayarları',
    icon: <SettingsIcons.Members />,
  },
  {
    id: 'preview',
    label: 'Önizleme',
    hint: 'Canlı görünüm',
    icon: <SettingsIcons.Preview />,
  },
  {
    id: 'obs',
    label: 'OBS',
    hint: 'Entegrasyon',
    icon: <SettingsIcons.Obs />,
  },
  {
    id: 'advanced',
    label: 'Gelişmiş',
    hint: 'Sistem ayarları',
    icon: <SettingsIcons.Advanced />,
  },
];

function getSaveLabel(s: SettingsSaveState) {
  switch (s) {
    case 'saved-local': return 'Kaydedildi';
    case 'synced': return 'Senkronize';
    case 'sync-error': return 'Senkron hatası';
    default: return 'Hazır';
  }
}

function getSaveTone(s: SettingsSaveState) {
  switch (s) {
    case 'saved-local': return 'border-amber-300/20 bg-amber-300/10 text-amber-100';
    case 'synced': return 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100';
    case 'sync-error': return 'border-rose-300/20 bg-rose-300/10 text-rose-100';
    default: return 'border-white/8 bg-white/[0.04] text-app-text-secondary';
  }
}

// ─── Mini Bileşenler ──────────────────────────────────────────────────────
const PREVIEW_MODES = [
  { id: 'dashboard', label: 'Akış' },
  { id: 'message',   label: 'Mesaj' },
  { id: 'superchat', label: 'Super Chat' },
  { id: 'members',   label: 'Üyelik' },
] as const;

function NavButton({ section, active, onClick }: { section: SectionMeta; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        'mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition',
        active ? 'bg-white/[0.08] text-app-text' : 'text-app-text-muted hover:bg-white/[0.04] hover:text-app-text',
      )}
      onClick={onClick}
    >
      <span className={cn('shrink-0', active ? 'text-app-text' : 'text-app-text-subtle')}>{section.icon}</span>
      <span className="font-medium">{section.label}</span>
    </button>
  );
}

function MobileTab({ section, active, onClick }: { section: SectionMeta; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
        active ? 'border-app-accent/30 bg-app-accent/12 text-app-text' : 'border-white/8 bg-white/[0.04] text-app-text-muted',
      )}
      onClick={onClick}
    >
      <span className={cn('shrink-0', active ? 'text-app-accent' : 'text-app-text-subtle')}>{section.icon}</span>
      {section.label}
    </button>
  );
}

function PreviewTab({ label, active, onClick }: { mode: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-md border px-2 py-1 text-[11px] font-medium transition',
        active ? 'border-app-accent/30 bg-app-accent/10 text-app-text' : 'border-white/6 bg-transparent text-app-text-muted hover:text-app-text',
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// ─── Layout Tokenları ─────────────────────────────────────────────────────
const layout = {
  nav:         'flex w-56 shrink-0 flex-col border-r border-white/6 bg-surface-1',
  content:     'min-w-0 flex-1 overflow-y-auto',
  contentInner:'w-full max-w-4xl px-8 py-4',
  sectionGap:  'space-y-3',
  preview:     'sticky top-0 hidden w-[30rem] shrink-0 border-l border-white/6 bg-surface-1 lg:flex lg:flex-col',
  previewTabs: 'grid grid-cols-2 gap-1.5 border-b border-white/6 p-3',
};

export default function SettingsView({ settings, onUpdate, overlayUrls, saveState }: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('presets');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('message');

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const syncViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);

    return () => {
      window.removeEventListener('resize', syncViewport);
    };
  }, []);

  useEffect(() => {
    if (activeSection === 'superchat') {
      setPreviewMode('superchat');
      return;
    }

    if (activeSection === 'members') {
      setPreviewMode('members');
      return;
    }

    if (activeSection === 'display') {
      setPreviewMode('dashboard');
      return;
    }

    if (activeSection === 'appearance' || activeSection === 'obs' || activeSection === 'presets') {
      setPreviewMode('message');
    }
  }, [activeSection]);

  const setField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdate({ ...settings, [key]: value });
  };

  const updateColorField = (key: keyof AppSettings, fallback: string, nextHex?: string, nextAlpha?: number) => {
    const current = parseColorValue((settings[key] as string) || fallback, fallback);
    const hex = nextHex ?? current.hex;
    const alpha = nextAlpha ?? current.alpha;
    setField(key, serializeColor(hex, alpha) as AppSettings[typeof key]);
  };

  const resetOverlayTheme = (theme: 'dark' | 'light') => {
    onUpdate({
      ...settings,
      overlayTheme: theme,
      overlayBgColor: theme === 'dark' ? 'rgba(20, 20, 22, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      overlayTxColor: theme === 'dark' ? '#ffffff' : '#18181b',
    });
  };

  const clearAdvancedCss = () => {
    onUpdate({ ...settings, customCss: '', superChatCss: '', membersCss: '' });
  };

  const applyPreset = (values: Partial<AppSettings>) => {
    onUpdate({ ...settings, ...values });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'presets':
        return <PresetsSettings settings={settings} onApplyPreset={applyPreset} />;
      case 'appearance':
        return <AppearanceSettings settings={settings} setField={setField} updateColorField={updateColorField} resetOverlayTheme={resetOverlayTheme} />;
      case 'display':
        return <DisplaySettings settings={settings} setField={setField} />;
      case 'superchat':
        return <SuperChatSettings settings={settings} setField={setField} updateColorField={updateColorField} />;
      case 'members':
        return <MembersSettings settings={settings} setField={setField} updateColorField={updateColorField} />;
      case 'preview':
        return <PreviewSettings settings={settings} previewMode={previewMode} setPreviewMode={setPreviewMode} />;
      case 'obs':
        return <ObsSettings settings={settings} setField={setField} overlayUrls={overlayUrls} />;
      case 'advanced':
        return <AdvancedSettings settings={settings} setField={setField} clearAdvancedCss={clearAdvancedCss} />;
    }
  };

  const currentSection = SECTIONS.find((s) => s.id === activeSection)!;
  const showDesktopPreviewRail = activeSection !== 'preview';

  return (
    <div className="flex h-full">
      {isDesktop ? (
        <>
          <nav className={layout.nav}>
            <div className="px-4 pt-5 pb-3">
              <h1 className="text-base font-semibold text-app-text">Ayarlar</h1>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {SECTIONS.map((section) => (
                <NavButton
                  key={section.id}
                  section={section}
                  active={activeSection === section.id}
                  onClick={() => setActiveSection(section.id)}
                />
              ))}
            </div>
            <div className="border-t border-white/6 px-3 py-2.5">
              <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium ${getSaveTone(saveState)}`}>
                {getSaveLabel(saveState)}
              </span>
            </div>
          </nav>

          <div className="flex h-full min-w-0 flex-1">
            <div className={layout.content}>
              <div className={layout.contentInner}>
                <div className={layout.sectionGap}>
                  <div className="mb-3">
                    <h2 className="text-lg font-semibold text-app-text">{currentSection.label}</h2>
                    <p className="mt-0.5 text-sm text-app-text-muted">{currentSection.hint}</p>
                  </div>
                  {renderContent()}
                </div>
              </div>
            </div>

            {showDesktopPreviewRail ? (
              <aside className={layout.preview} style={{ height: '100%' }}>
                <div className={layout.previewTabs}>
                  {PREVIEW_MODES.map(({ id, label }) => (
                    <PreviewTab
                      key={id}
                      mode={id}
                      label={label}
                      active={previewMode === id}
                      onClick={() => setPreviewMode(id)}
                    />
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <OverlayPreview settings={settings} previewMode={previewMode} />
                </div>
              </aside>
            ) : null}
          </div>
        </>
      ) : (
        <div className="flex h-full w-full flex-col">
          <div className="shrink-0 border-b border-white/6 bg-surface-1 px-3 py-2">
            <div className="mb-2 flex items-center justify-between">
              <h1 className="text-lg font-semibold tracking-[-0.03em] text-app-text">Ayarlar</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${getSaveTone(saveState)}`}>
                {getSaveLabel(saveState)}
              </span>
            </div>
            <div className="scrollbar-none flex gap-1 overflow-x-auto pb-1">
              {SECTIONS.map((section) => (
                <MobileTab
                  key={section.id}
                  section={section}
                  active={activeSection === section.id}
                  onClick={() => setActiveSection(section.id)}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-app-text">{currentSection.label}</h2>
                <p className="mt-1 text-sm text-app-text-muted">{currentSection.hint}</p>
              </div>
              {renderContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
