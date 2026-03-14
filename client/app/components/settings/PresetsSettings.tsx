import { memo } from 'react';
import type { AppSettings } from '@shared/settings';
import { SectionCard } from './SettingsUI';
import { PRESETS } from './presets';

interface Props {
  settings: AppSettings;
  onApplyPreset: (values: Partial<AppSettings>) => void;
}

export const PresetsSettings = memo(function PresetsSettings({ settings, onApplyPreset }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Hazır Temalar (Presets)" description="Önceden yapılandırılmış ayar profilleri ile hızlıca görünümü değiştirin.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="group flex flex-col items-start gap-2 rounded-2xl border border-white/8 bg-surface-3 p-5 text-left transition hover:border-app-accent/40 hover:bg-app-accent/5 hover:shadow-lg"
              onClick={() => onApplyPreset(preset.values)}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-base font-semibold tracking-tight text-app-text transition group-hover:text-app-accent">
                  {preset.name}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 tracking-wider text-app-text-muted transition group-hover:bg-app-accent/20 group-hover:text-app-accent">
                  →
                </span>
              </div>
              <p className="text-sm leading-relaxed text-app-text-muted transition group-hover:text-app-text-secondary">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Özel Görünümler Özelleştirilebilir" description="Bir temayı seçtikten sonra diğer sekmelerden dilediğiniz ince ayarı yapabilirsiniz.">
        <ul className="list-inside list-disc space-y-2 text-sm text-app-text-muted">
          <li>Temalar ayarlarınızı sıfırlamaz, sadece ilgili alanların (renk, boyut, yapı) üstüne yazar.</li>
          <li>Gelişmiş sekmesindeki özel CSS kodları temadan bağımsız çalışır.</li>
          <li>Varsayılan temaya dönmek için &quot;Varsayılan&quot; preset&apos;ini seçebilirsiniz.</li>
        </ul>
      </SectionCard>
    </div>
  );
});
