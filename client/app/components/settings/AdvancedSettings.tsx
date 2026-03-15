import { memo } from 'react';
import type { AppSettings } from '@shared/settings';
import { SectionCard, FieldRow, Divider, cn, fieldControlClass, textareaClass, makeResetter } from './SettingsUI';

interface Props {
  settings: AppSettings;
  setField: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  clearAdvancedCss: () => void;
}

export const AdvancedSettings = memo(function AdvancedSettings({ settings, setField, clearAdvancedCss }: Props) {
  const reset = makeResetter(setField);

  return (
    <div className="flex flex-col gap-3">
      <SectionCard title="Sistem" description="Sunucu portu ve pencere ayarları.">
        <FieldRow label="Sunucu Portu" hint="Backend API'nin dinleyeceği port. Değişiklik sonrası yeniden başlatın." onReset={reset('serverPort')}>
          <input
            type="number"
            min={1024}
            max={65535}
            className={fieldControlClass}
            value={settings.serverPort}
            onChange={(e) => setField('serverPort', Number(e.target.value))}
          />
        </FieldRow>
        <Divider />
        <FieldRow label="Pencere Çerçevesi" hint="Electron pencere stili. Electron dışında etkisizdir." onReset={reset('workspaceFrame')}>
          <div className="flex gap-1.5">
            {(['full', 'framed'] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={cn(
                  'flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition',
                  settings.workspaceFrame === f
                    ? 'border-app-accent/30 bg-app-accent/12 text-app-text'
                    : 'border-white/8 bg-white/[0.04] text-app-text-muted hover:text-app-text',
                )}
                onClick={() => setField('workspaceFrame', f)}
              >
                {f === 'full' ? 'Tam Ekran' : 'Çerçeveli'}
              </button>
            ))}
          </div>
        </FieldRow>
      </SectionCard>

      <SectionCard title="Genel Overlay CSS" description="Tüm overlay kartlarına uygulanan global CSS kuralları.">
        <FieldRow label="Genel Overlay" hint=".overlay__card sınıfını hedef alır." onReset={reset('customCss')}>
          <textarea
            className={textareaClass}
            value={settings.customCss}
            placeholder="/* Tüm kartlara uygulanır */"
            onChange={(e) => setField('customCss', e.target.value)}
            rows={4}
          />
        </FieldRow>
      </SectionCard>

      <div className="rounded-2xl border border-rose-400/15 bg-rose-400/5 p-4">
        <div className="text-sm font-semibold text-app-text">CSS Sıfırlama</div>
        <p className="mt-1 text-sm text-app-text-muted">Tüm özel CSS alanlarını (genel, super chat, üye) temizler.</p>
        <button
          type="button"
          className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-400/18"
          onClick={clearAdvancedCss}
        >
          Tüm CSS'i Temizle
        </button>
      </div>
    </div>
  );
});
