import { memo } from 'react';
import type { AppSettings } from '@shared/settings';
import { DEFAULT_APP_SETTINGS } from '@shared/settings';
import { SectionCard, FieldRow, RangeControl, Divider, ColorControl, normalizeHex } from './SettingsUI';

interface Props {
  settings: AppSettings;
  setField: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateColorField: (key: keyof AppSettings, fallback: string, nextHex?: string, nextAlpha?: number) => void;
  resetOverlayTheme: (theme: 'dark' | 'light') => void;
}

export const AppearanceSettings = memo(function AppearanceSettings({ settings, setField, updateColorField, resetOverlayTheme }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <SectionCard title="Kart Görünümü" description="Overlay mesaj kartının boyut ve renk ayarları.">
        <FieldRow label="Mesaj Kartı Boyutu" hint="Seçili mesaj kartını büyütür veya küçültür." onReset={() => setField('overlayScale', DEFAULT_APP_SETTINGS.overlayScale)}>
          <RangeControl min={0.7} max={1.8} step={0.05} value={settings.overlayScale} displayValue={`${Math.round(settings.overlayScale * 100)}%`} onChange={(v) => setField('overlayScale', v)} />
        </FieldRow>
        <Divider />
        <FieldRow label="Mesaj Kartı Genişliği" hint="Seçili mesaj kutusunun genişliğini belirler." onReset={() => setField('messageMaxWidth', DEFAULT_APP_SETTINGS.messageMaxWidth)}>
          <RangeControl min={260} max={820} step={10} value={settings.messageMaxWidth} displayValue={`${settings.messageMaxWidth}px`} onChange={(v) => setField('messageMaxWidth', v)} />
        </FieldRow>
        <Divider />
        <FieldRow label="Yazı Boyutu" hint="Overlay kartının ana yazı boyutu." onReset={() => setField('messageFontSize', DEFAULT_APP_SETTINGS.messageFontSize)}>
          <RangeControl min={12} max={34} step={1} value={settings.messageFontSize} displayValue={`${settings.messageFontSize}px`} onChange={(v) => setField('messageFontSize', v)} />
        </FieldRow>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ColorControl
            label="Kart Arka Planı"
            value={settings.overlayBgColor}
            hint="Sadece mesaj kartının arka planı. Geri kalan şeffaf kalır."
            onHexChange={(v) => updateColorField('overlayBgColor', 'rgba(20, 20, 22, 0.95)', v)}
            onAlphaChange={(v) => updateColorField('overlayBgColor', 'rgba(20, 20, 22, 0.95)', undefined, v)}
            onReset={() => setField('overlayBgColor', DEFAULT_APP_SETTINGS.overlayBgColor)}
          />
          <ColorControl
            label="Yazı Rengi"
            value={settings.overlayTxColor}
            hint="Yüksek kontrastlı bir ön plan rengi kullanın."
            onHexChange={(v) => updateColorField('overlayTxColor', '#ffffff', v)}
            onAlphaChange={(v) => updateColorField('overlayTxColor', '#ffffff', undefined, v)}
            onReset={() => setField('overlayTxColor', DEFAULT_APP_SETTINGS.overlayTxColor)}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" className="rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 text-left transition hover:bg-white/[0.07]" onClick={() => resetOverlayTheme('dark')}>
            <div className="text-sm font-semibold text-app-text">Koyu Tema</div>
            <div className="mt-1 text-sm text-app-text-muted">Çoğu OBS sahnesine uygun güvenli varsayılan.</div>
          </button>
          <button type="button" className="rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 text-left transition hover:bg-white/[0.07]" onClick={() => resetOverlayTheme('light')}>
            <div className="text-sm font-semibold text-app-text">Açık Tema</div>
            <div className="mt-1 text-sm text-app-text-muted">Koyu arka planlı sahneler için kullanışlı.</div>
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Vurgu Rengi" description="Uygulamanın genel vurgu rengini ayarlayın.">
        <ColorControl
          label="Accent Rengi"
          value={settings.accentColor}
          showOpacity={false}
          onHexChange={(v) => setField('accentColor', normalizeHex(v))}
          onAlphaChange={() => {}}
          onReset={() => setField('accentColor', DEFAULT_APP_SETTINGS.accentColor)}
        />
      </SectionCard>
    </div>
  );
});
