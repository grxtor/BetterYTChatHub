import { memo } from 'react';
import type { AppSettings } from '@shared/settings';
import { SwitchField, Divider, ColorControl, normalizeHex, makeResetter } from './SettingsUI';
import { OverlayCardSettings, type OverlayCardConfig } from './OverlayCardSettings';

interface Props {
  settings: AppSettings;
  setField: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateColorField: (key: keyof AppSettings, fallback: string, nextHex?: string, nextAlpha?: number) => void;
}

const SUPERCHAT_CONFIG: OverlayCardConfig = {
  title: 'Super Chat',
  description: 'Super Chat kartının overlay davranışı ve görünümü.',
  keys: {
    includeInOverlay: 'includeSuperChatsInOverlay',
    autoSelect: 'autoSelectSuperChats',
    duration: 'superChatDuration',
    overlayScale: 'superChatOverlayScale',
    fontSize: 'superChatFontSize',
    overlayBgColor: 'superChatOverlayBgColor',
    overlayTxColor: 'superChatOverlayTxColor',
    overlayPosition: 'superChatOverlayPosition',
    customCss: 'superChatCss',
  },
  labels: {
    showInOverlay: "Overlay'da Göster",
    showInOverlayHint: 'Super Chat mesajlarını OBS overlay\'ine gönderir.',
    autoSelect: 'Otomatik Seç',
    autoSelectHint: 'Yeni Super Chat geldiğinde otomatik olarak seçip overlay\'e gönderir.',
    cssPlaceholder: '/* Sadece Super Chat kartı */',
  },
  durationRange: { min: 3, max: 60 },
  bgFallback: 'rgba(20, 20, 22, 0.95)',
  txFallback: '#ffffff',
};

export const SuperChatSettings = memo(function SuperChatSettings({ settings, setField, updateColorField }: Props) {
  const reset = makeResetter(setField);

  return (
    <OverlayCardSettings
      config={SUPERCHAT_CONFIG}
      settings={settings}
      setField={setField}
      updateColorField={updateColorField}
      extraBasicFields={
        <>
          <div className="py-4">
            <ColorControl
              label="Başlık Rengi"
              value={settings.superChatHeaderColor}
              showOpacity={false}
              hint="Kart sol kenarındaki vurgu rengi. YouTube'un orijinal rengiyle uyumlu tutabilirsiniz."
              onHexChange={(v) => setField('superChatHeaderColor', normalizeHex(v))}
              onAlphaChange={() => {}}
              onReset={reset('superChatHeaderColor')}
            />
          </div>
          <Divider />
        </>
      }
      extraAdvancedFields={
        <>
          <SwitchField
            label="Popup Bildirimi"
            hint="Super Chat geldiğinde dashboard'da popup bildirim gösterir."
            checked={settings.superChatPopup}
            onToggle={() => setField('superChatPopup', !settings.superChatPopup)}
            onReset={reset('superChatPopup')}
          />
          <Divider />
        </>
      }
    />
  );
});
