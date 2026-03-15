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
    <div className="flex flex-col gap-3">
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
    </div>
  );
});
