import { memo } from 'react';
import type { AppSettings } from '@shared/settings';
import { DEFAULT_APP_SETTINGS } from '@shared/settings';
import { SectionCard, SwitchField, Divider, FieldRow, RangeControl, cn } from './SettingsUI';

interface Props {
  settings: AppSettings;
  setField: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export const DisplaySettings = memo(function DisplaySettings({ settings, setField }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Kart Elemanları" description="Overlay kartında hangi bilgiler gösterilsin?">
        <SwitchField label="Avatarları Göster" hint="Kullanıcı fotoğrafını kart üzerinde gösterir." checked={settings.showAvatars} onToggle={() => setField('showAvatars', !settings.showAvatars)} onReset={() => setField('showAvatars', DEFAULT_APP_SETTINGS.showAvatars)} />
        <Divider />
        <SwitchField label="Rozetleri Göster" hint="Moderatör ve üye etiketlerini gösterir." checked={settings.showBadges} onToggle={() => setField('showBadges', !settings.showBadges)} onReset={() => setField('showBadges', DEFAULT_APP_SETTINGS.showBadges)} />
        <Divider />
        <SwitchField label="Zaman Damgası" hint="Mesajın gönderildiği saati gösterir." checked={settings.showTimestamps} onToggle={() => setField('showTimestamps', !settings.showTimestamps)} onReset={() => setField('showTimestamps', DEFAULT_APP_SETTINGS.showTimestamps)} />
        <Divider />
        <SwitchField label="Seçim Önizlemesi" hint="Dashboard'da seçili mesajı sağ panelde gösterir." checked={settings.showSelectionPreview} onToggle={() => setField('showSelectionPreview', !settings.showSelectionPreview)} onReset={() => setField('showSelectionPreview', DEFAULT_APP_SETTINGS.showSelectionPreview)} />
      </SectionCard>

      <SectionCard title="Dashboard Görünümü" description="Chat listesinin yoğunluğu ve panel genişliği.">
        <FieldRow label="Liste Yoğunluğu" hint="Mesaj satırlarının yüksekliği ve boşluğu." onReset={() => setField('dashboardDensity', DEFAULT_APP_SETTINGS.dashboardDensity)}>
          <div className="flex gap-1.5">
            {(['compact', 'comfortable', 'immersive'] as const).map((d) => (
              <button
                key={d}
                type="button"
                className={cn(
                  'flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition capitalize',
                  settings.dashboardDensity === d
                    ? 'border-app-accent/30 bg-app-accent/12 text-app-text'
                    : 'border-white/8 bg-white/[0.04] text-app-text-muted hover:text-app-text',
                )}
                onClick={() => setField('dashboardDensity', d)}
              >
                {d === 'compact' ? 'Sıkışık' : d === 'comfortable' ? 'Rahat' : 'Geniş'}
              </button>
            ))}
          </div>
        </FieldRow>
        <Divider />
        <FieldRow label="Panel Genişliği" hint="Sağ rail panelinin genişliği." onReset={() => setField('dashboardPanelWidth', DEFAULT_APP_SETTINGS.dashboardPanelWidth)}>
          <RangeControl min={280} max={600} step={10} value={settings.dashboardPanelWidth} displayValue={`${settings.dashboardPanelWidth}px`} onChange={(v) => setField('dashboardPanelWidth', v)} />
        </FieldRow>
        <Divider />
        <FieldRow label="Mesaj Tamponu" hint="Chat listesinde tutulacak maksimum mesaj sayısı." onReset={() => setField('maxMessages', DEFAULT_APP_SETTINGS.maxMessages)}>
          <RangeControl min={10} max={200} step={10} value={settings.maxMessages} displayValue={`${settings.maxMessages}`} onChange={(v) => setField('maxMessages', v)} />
        </FieldRow>
      </SectionCard>
    </div>
  );
});
