import { memo } from 'react';
import type { AppSettings } from '@shared/settings';
import { SectionCard, FieldRow, RangeControl, Divider, ColorControl, normalizeHex, makeResetter } from './SettingsUI';
import { PRESETS } from './presets';

interface Props {
  settings: AppSettings;
  setField: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateColorField: (key: keyof AppSettings, fallback: string, nextHex?: string, nextAlpha?: number) => void;
  resetOverlayTheme: (theme: 'dark' | 'light') => void;
  onApplyPreset: (values: Partial<AppSettings>) => void;
}

function getPresetSwatches(preset: (typeof PRESETS)[number]) {
  const v = preset.values;
  const colors: string[] = [];
  if (v.overlayBgColor) colors.push(v.overlayBgColor.startsWith('rgba') ? '#141416' : v.overlayBgColor);
  if (v.overlayTxColor) colors.push(v.overlayTxColor);
  if (v.accentColor) colors.push(v.accentColor);
  if (v.membersGradientColor1) colors.push(v.membersGradientColor1);
  return colors.slice(0, 4);
}

export const AppearanceSettings = memo(function AppearanceSettings({ settings, setField, updateColorField, resetOverlayTheme, onApplyPreset }: Props) {
  const reset = makeResetter(setField);

  return (
    <div className="flex flex-col gap-3">
      {/* ── Preset Strip ── */}
      <SectionCard title="Hazır Temalar" description="Hızlıca görünümü değiştirmek için bir tema seçin.">
        <div className="grid gap-2 sm:grid-cols-2">
          {PRESETS.map((preset) => {
            const swatches = getPresetSwatches(preset);
            return (
              <button
                key={preset.id}
                type="button"
                className="group flex flex-col items-start gap-1.5 rounded-xl border border-white/8 bg-surface-3 px-3.5 py-3 text-left transition hover:border-app-accent/40 hover:bg-app-accent/5"
                onClick={() => onApplyPreset(preset.values)}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-semibold tracking-tight text-app-text transition group-hover:text-app-accent">
                    {preset.name}
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-xs text-app-text-muted transition group-hover:bg-app-accent/20 group-hover:text-app-accent">
                    →
                  </span>
                </div>
                <p className="text-xs leading-normal text-app-text-muted transition group-hover:text-app-text-secondary">
                  {preset.description}
                </p>
                {swatches.length > 0 && (
                  <div className="flex gap-1.5 pt-0.5">
                    {swatches.map((c, i) => (
                      <span
                        key={i}
                        className="h-3 w-3 rounded-full border border-white/10"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* ── Kart Görünümü ── */}
      <SectionCard title="Kart Görünümü" description="Overlay mesaj kartının boyut ve renk ayarları.">
        <FieldRow label="Mesaj Kartı Boyutu" hint="Seçili mesaj kartını büyütür veya küçültür." onReset={reset('overlayScale')}>
          <RangeControl min={0.7} max={1.8} step={0.05} value={settings.overlayScale} displayValue={`${Math.round(settings.overlayScale * 100)}%`} onChange={(v) => setField('overlayScale', v)} />
        </FieldRow>
        <Divider />
        <FieldRow label="Mesaj Kartı Genişliği" hint="Seçili mesaj kutusunun genişliğini belirler." onReset={reset('messageMaxWidth')}>
          <RangeControl min={260} max={820} step={10} value={settings.messageMaxWidth} displayValue={`${settings.messageMaxWidth}px`} onChange={(v) => setField('messageMaxWidth', v)} />
        </FieldRow>
        <Divider />
        <FieldRow label="Yazı Boyutu" hint="Overlay kartının ana yazı boyutu." onReset={reset('messageFontSize')}>
          <RangeControl min={12} max={34} step={1} value={settings.messageFontSize} displayValue={`${settings.messageFontSize}px`} onChange={(v) => setField('messageFontSize', v)} />
        </FieldRow>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ColorControl
            label="Kart Arka Planı"
            value={settings.overlayBgColor}
            hint="Sadece mesaj kartının arka planı. Geri kalan şeffaf kalır."
            onHexChange={(v) => updateColorField('overlayBgColor', 'rgba(20, 20, 22, 0.95)', v)}
            onAlphaChange={(v) => updateColorField('overlayBgColor', 'rgba(20, 20, 22, 0.95)', undefined, v)}
            onReset={reset('overlayBgColor')}
          />
          <ColorControl
            label="Yazı Rengi"
            value={settings.overlayTxColor}
            hint="Yüksek kontrastlı bir ön plan rengi kullanın."
            onHexChange={(v) => updateColorField('overlayTxColor', '#ffffff', v)}
            onAlphaChange={(v) => updateColorField('overlayTxColor', '#ffffff', undefined, v)}
            onReset={reset('overlayTxColor')}
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

      {/* ── Vurgu Rengi ── */}
      <SectionCard title="Vurgu Rengi" description="Uygulamanın genel vurgu rengini ayarlayın.">
        <ColorControl
          label="Accent Rengi"
          value={settings.accentColor}
          showOpacity={false}
          onHexChange={(v) => setField('accentColor', normalizeHex(v))}
          onAlphaChange={() => {}}
          onReset={reset('accentColor')}
        />
      </SectionCard>
    </div>
  );
});
