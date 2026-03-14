import { memo } from 'react';
import type { AppSettings } from '@shared/settings';
import { DEFAULT_APP_SETTINGS } from '@shared/settings';
import { SectionCard, SwitchField, Divider, AdvancedSection, FieldRow, RangeControl, ColorControl, normalizeHex, PositionSelector } from './SettingsUI';

interface Props {
  settings: AppSettings;
  setField: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateColorField: (key: keyof AppSettings, fallback: string, nextHex?: string, nextAlpha?: number) => void;
}

export const SuperChatSettings = memo(function SuperChatSettings({ settings, setField, updateColorField }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <SectionCard title="Super Chat" description="Super Chat kartının overlay davranışı ve görünümü.">

        {/* ── Temel Ayarlar ── */}
        <SwitchField
          label="Overlay'da Göster"
          hint="Super Chat mesajlarını OBS overlay'ine gönderir."
          checked={settings.includeSuperChatsInOverlay}
          onToggle={() => setField('includeSuperChatsInOverlay', !settings.includeSuperChatsInOverlay)}
          onReset={() => setField('includeSuperChatsInOverlay', DEFAULT_APP_SETTINGS.includeSuperChatsInOverlay)}
        />
        <Divider />
        <SwitchField
          label="Otomatik Seç"
          hint="Yeni Super Chat geldiğinde otomatik olarak seçip overlay'e gönderir."
          checked={settings.autoSelectSuperChats}
          onToggle={() => setField('autoSelectSuperChats', !settings.autoSelectSuperChats)}
          onReset={() => setField('autoSelectSuperChats', DEFAULT_APP_SETTINGS.autoSelectSuperChats)}
        />
        <Divider />
        <FieldRow
          label="Gösterim Süresi"
          hint="Kart overlay'da kaç saniye kalacak."
          onReset={() => setField('superChatDuration', DEFAULT_APP_SETTINGS.superChatDuration)}
        >
          <RangeControl min={3} max={60} step={1} value={settings.superChatDuration} displayValue={`${settings.superChatDuration}s`} onChange={(v) => setField('superChatDuration', v)} />
        </FieldRow>
        <Divider />
        <FieldRow
          label="Ölçek"
          hint="Super Chat kartını büyütür veya küçültür."
          onReset={() => setField('superChatOverlayScale', DEFAULT_APP_SETTINGS.superChatOverlayScale)}
        >
          <RangeControl min={0.5} max={2} step={0.05} value={settings.superChatOverlayScale} displayValue={`${Math.round(settings.superChatOverlayScale * 100)}%`} onChange={(v) => setField('superChatOverlayScale', v)} />
        </FieldRow>
        <Divider />
        <div className="py-4">
          <ColorControl
            label="Başlık Rengi"
            value={settings.superChatHeaderColor}
            showOpacity={false}
            hint="Kart sol kenarındaki vurgu rengi. YouTube'un orijinal rengiyle uyumlu tutabilirsiniz."
            onHexChange={(v) => setField('superChatHeaderColor', normalizeHex(v))}
            onAlphaChange={() => {}}
            onReset={() => setField('superChatHeaderColor', DEFAULT_APP_SETTINGS.superChatHeaderColor)}
          />
        </div>

        {/* ── Gelişmiş ── */}
        <AdvancedSection>
          <SwitchField
            label="Popup Bildirimi"
            hint="Super Chat geldiğinde dashboard'da popup bildirim gösterir."
            checked={settings.superChatPopup}
            onToggle={() => setField('superChatPopup', !settings.superChatPopup)}
            onReset={() => setField('superChatPopup', DEFAULT_APP_SETTINGS.superChatPopup)}
          />
          <Divider />
          <FieldRow label="Yazı Boyutu" onReset={() => setField('superChatFontSize', DEFAULT_APP_SETTINGS.superChatFontSize)}>
            <RangeControl min={10} max={30} step={1} value={settings.superChatFontSize} displayValue={`${settings.superChatFontSize}px`} onChange={(v) => setField('superChatFontSize', v)} />
          </FieldRow>
          <Divider />
          <div className="grid gap-4 py-4 md:grid-cols-2">
            <ColorControl
              label="Arka Plan"
              value={settings.superChatOverlayBgColor || 'rgba(20, 20, 22, 0.95)'}
              onHexChange={(v) => updateColorField('superChatOverlayBgColor', 'rgba(20, 20, 22, 0.95)', v)}
              onAlphaChange={(v) => updateColorField('superChatOverlayBgColor', 'rgba(20, 20, 22, 0.95)', undefined, v)}
              onReset={() => setField('superChatOverlayBgColor', DEFAULT_APP_SETTINGS.superChatOverlayBgColor)}
            />
            <ColorControl
              label="Yazı Rengi"
              value={settings.superChatOverlayTxColor || '#ffffff'}
              onHexChange={(v) => updateColorField('superChatOverlayTxColor', '#ffffff', v)}
              onAlphaChange={(v) => updateColorField('superChatOverlayTxColor', '#ffffff', undefined, v)}
              onReset={() => setField('superChatOverlayTxColor', DEFAULT_APP_SETTINGS.superChatOverlayTxColor)}
            />
          </div>
          <Divider />
          <div className="py-4">
            <FieldRow label="Ekran Konumu" hint="Diğer kartlardan bağımsız konum." onReset={() => setField('superChatOverlayPosition', DEFAULT_APP_SETTINGS.superChatOverlayPosition)}>
              <PositionSelector value={settings.superChatOverlayPosition || settings.overlayPosition} onChange={(v) => setField('superChatOverlayPosition', v)} />
            </FieldRow>
          </div>
          <Divider />
          <div className="py-4">
            <div className="mb-2 text-xs font-semibold text-app-text-subtle">Özel CSS</div>
            <textarea
              className="w-full rounded-xl border border-white/8 bg-surface-3 px-3 py-2.5 font-mono text-sm text-app-text outline-none transition focus:border-app-accent/40 focus:ring-1 focus:ring-app-accent/20 resize-y min-h-[80px]"
              value={settings.superChatCss}
              placeholder="/* Sadece Super Chat kartı */"
              onChange={(e) => setField('superChatCss', e.target.value)}
              rows={3}
            />
          </div>
        </AdvancedSection>

      </SectionCard>
    </div>
  );
});
