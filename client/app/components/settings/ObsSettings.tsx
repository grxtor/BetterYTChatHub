import { memo } from 'react';
import type { AppSettings } from '@shared/settings';
import { SectionCard, CopyUrlField, Divider, PositionSelector } from './SettingsUI';

interface Props {
  settings: AppSettings;
  setField: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  overlayUrls: {
    overlay: string;
    superchat: string;
    members: string;
  };
}

export const ObsSettings = memo(function ObsSettings({ settings, setField, overlayUrls }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Overlay URL'leri" description="Bu URL'leri OBS tarayıcı kaynağına yapıştırın.">
        <CopyUrlField label="Ana Overlay" url={overlayUrls.overlay} />
        <Divider />
        <CopyUrlField label="Super Chat Overlay" url={overlayUrls.superchat} />
        <Divider />
        <CopyUrlField label="Üyelik Overlay" url={overlayUrls.members} />
      </SectionCard>

      <SectionCard title="Varsayılan Konum" description="Overlay kartlarının varsayılan konumu.">
        <PositionSelector value={settings.overlayPosition} onChange={(v) => setField('overlayPosition', v)} />
      </SectionCard>

      <SectionCard title="Bilgi" description="OBS entegrasyon detayları.">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-surface-3 p-3">
            <div className="text-[11px] uppercase tracking-[0.12em] text-app-text-subtle">Arka Plan</div>
            <div className="mt-2 text-sm font-semibold text-app-text">Şeffaf sayfa</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-surface-3 p-3">
            <div className="text-[11px] uppercase tracking-[0.12em] text-app-text-subtle">Konum</div>
            <div className="mt-2 text-sm font-semibold text-app-text">OBS&apos;de ayarlanır</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-surface-3 p-3">
            <div className="text-[11px] uppercase tracking-[0.12em] text-app-text-subtle">Özel Kartlar</div>
            <div className="mt-2 text-sm font-semibold text-app-text">Aynı görsel dil</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
});
