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
          <nav className="flex w-56 shrink-0 flex-col border-r border-white/6 bg-surface-1">
            <div className="px-3 pt-5 pb-4">
              <h1 className="text-base font-semibold tracking-[-0.02em] text-app-text">Ayarlar</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-1.5 py-2">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={cn(
                    'mb-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition',
                    activeSection === section.id
                      ? 'bg-white/[0.06] text-app-text'
                      : 'text-app-text-muted hover:bg-white/[0.03] hover:text-app-text',
                  )}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span
                    className={cn(
                      'shrink-0 transition',
                      activeSection === section.id ? 'text-app-accent' : 'text-app-text-subtle',
                    )}
                  >
                    {section.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{section.label}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-white/6 px-3 py-3">
              <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-medium ${getSaveTone(saveState)}`}>
                {getSaveLabel(saveState)}
              </span>
            </div>
          </nav>

          <div className="flex-1 overflow-y-auto">
            <div className="flex h-full w-full gap-4 px-5 py-5 lg:gap-5 lg:px-6">
              <div className="min-w-0 flex-1">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-app-text">{currentSection.label}</h2>
                  <p className="mt-1 text-sm text-app-text-muted">{currentSection.hint}</p>
                </div>
                <div className="max-w-2xl">
                  {renderContent()}
                </div>
              </div>

              {showDesktopPreviewRail ? (
                <aside className="sticky top-5 hidden w-96 shrink-0 self-start lg:block">
                  <div className="flex flex-col gap-3">
                    <div className="rounded-2xl border border-white/6 bg-surface-2 p-3">
                      <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-app-text-subtle">
                        Preview
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['dashboard', 'message', 'superchat', 'members'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            className={cn(
                              'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
                              previewMode === mode
                                ? 'border-app-accent/30 bg-white/[0.08] text-app-text'
                                : 'border-white/8 bg-white/[0.03] text-app-text-muted hover:text-app-text',
                            )}
                            onClick={() => setPreviewMode(mode)}
                          >
                            {mode === 'dashboard' ? 'Akış' : mode === 'message' ? 'Mesaj' : mode === 'superchat' ? 'Super Chat' : 'Üyelik'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <OverlayPreview settings={settings} previewMode={previewMode} />

                    <SectionCard title="Canlı Ön İzleme" description="Ayarlamalar anında burada görünür.">
                      <div className="space-y-2 text-sm text-app-text-muted">
                        <p>Kart tasarımı, renkler ve boyut değişiklikleri canlı yansır.</p>
                        <p>OBS overlay'daki görünüm ile eşleşir.</p>
                      </div>
                    </SectionCard>
                  </div>
                </aside>
              ) : null}
            </div>
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
                <button
                  key={section.id}
                  type="button"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                    activeSection === section.id
                      ? 'border-app-accent/30 bg-app-accent/12 text-app-text'
                      : 'border-white/8 bg-white/[0.04] text-app-text-muted',
                  )}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className={cn('shrink-0', activeSection === section.id ? 'text-app-accent' : 'text-app-text-subtle')}>
                    {section.icon}
                  </span>
                  {section.label}
                </button>
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
