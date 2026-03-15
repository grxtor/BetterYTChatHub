import { memo } from 'react';
import type { AppSettings } from '@shared/settings';
import { SwitchField, Divider, ColorControl, normalizeHex, makeResetter } from './SettingsUI';
import { OverlayCardSettings, type OverlayCardConfig } from './OverlayCardSettings';

interface Props {
  settings: AppSettings;
  setField: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateColorField: (key: keyof AppSettings, fallback: string, nextHex?: string, nextAlpha?: number) => void;
}

const MEMBERS_CONFIG: OverlayCardConfig = {
  title: 'Üyeler',
  description: 'Üyelik etkinliklerinin overlay davranışı ve görünümü.',
  keys: {
    includeInOverlay: 'includeMembersInOverlay',
    autoSelect: 'autoSelectMembers',
    duration: 'membersDuration',
    overlayScale: 'membersOverlayScale',
    fontSize: 'membersFontSize',
    overlayBgColor: 'membersOverlayBgColor',
    overlayTxColor: 'membersOverlayTxColor',
    overlayPosition: 'membersOverlayPosition',
    customCss: 'membersCss',
  },
  labels: {
    showInOverlay: "Overlay'da Göster",
    showInOverlayHint: 'Üyelik etkinliklerini OBS overlay\'ine gönderir.',
    autoSelect: 'Otomatik Seç',
    autoSelectHint: 'Yeni üyelik geldiğinde otomatik olarak seçip overlay\'e gönderir.',
    cssPlaceholder: '/* Sadece üyelik kartı */',
  },
  durationRange: { min: 3, max: 30 },
  bgFallback: 'rgba(20, 20, 22, 0.95)',
  txFallback: '#ffffff',
};

export const MembersSettings = memo(function MembersSettings({ settings, setField, updateColorField }: Props) {
  const reset = makeResetter(setField);

  return (
    <OverlayCardSettings
      config={MEMBERS_CONFIG}
      settings={settings}
      setField={setField}
      updateColorField={updateColorField}
      extraBasicFields={
        <>
          <SwitchField
            label="Özel Üye Stili"
            hint="Üyelik kartlarına gradient arka plan ve özel görsel stil uygular."
            checked={settings.useSpecialMemberStyling}
            onToggle={() => setField('useSpecialMemberStyling', !settings.useSpecialMemberStyling)}
            onReset={reset('useSpecialMemberStyling')}
          />
          <Divider />
        </>
      }
      extraAdvancedFields={
        <>
          <div className="grid gap-4 py-4 md:grid-cols-2">
            <ColorControl
              label="Gradient Başlangıç"
              value={settings.membersGradientColor1}
              showOpacity={false}
              onHexChange={(v) => setField('membersGradientColor1', normalizeHex(v))}
              onAlphaChange={() => {}}
              onReset={reset('membersGradientColor1')}
            />
            <ColorControl
              label="Gradient Bitiş"
              value={settings.membersGradientColor2}
              showOpacity={false}
              onHexChange={(v) => setField('membersGradientColor2', normalizeHex(v))}
              onAlphaChange={() => {}}
              onReset={reset('membersGradientColor2')}
            />
          </div>
          <Divider />
        </>
      }
    />
  );
});
