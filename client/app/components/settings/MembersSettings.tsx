import { memo } from 'react';
import type { AppSettings } from '@shared/settings';
import { DEFAULT_APP_SETTINGS } from '@shared/settings';
import { SectionCard, SwitchField, Divider, AdvancedSection, FieldRow, RangeControl, ColorControl, normalizeHex, PositionSelector } from './SettingsUI';

interface Props {
  settings: AppSettings;
  setField: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateColorField: (key: keyof AppSettings, fallback: string, nextHex?: string, nextAlpha?: number) => void;
}

export const MembersSettings = memo(function MembersSettings({ settings, setField, updateColorField }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Üyeler" description="Üyelik etkinliklerinin overlay davranışı ve görünümü.">

        {/* ── Temel Ayarlar ── */}
        <SwitchField
          label="Overlay'da Göster"
          hint="Üyelik etkinliklerini OBS overlay'ine gönderir."
          checked={settings.includeMembersInOverlay}
          onToggle={() => setField('includeMembersInOverlay', !settings.includeMembersInOverlay)}
          onReset={() => setField('includeMembersInOverlay', DEFAULT_APP_SETTINGS.includeMembersInOverlay)}
        />
        <Divider />
        <SwitchField
          label="Otomatik Seç"
          hint="Yeni üyelik geldiğinde otomatik olarak seçip overlay'e gönderir."
          checked={settings.autoSelectMembers}
          onToggle={() => setField('autoSelectMembers', !settings.autoSelectMembers)}
          onReset={() => setField('autoSelectMembers', DEFAULT_APP_SETTINGS.autoSelectMembers)}
        />
        <Divider />
        <SwitchField
          label="Özel Üye Stili"
          hint="Üyelik kartlarına gradient arka plan ve özel görsel stil uygular."
          checked={settings.useSpecialMemberStyling}
          onToggle={() => setField('useSpecialMemberStyling', !settings.useSpecialMemberStyling)}
          onReset={() => setField('useSpecialMemberStyling', DEFAULT_APP_SETTINGS.useSpecialMemberStyling)}
        />
        <Divider />
        <FieldRow
          label="Gösterim Süresi"
          hint="Kart overlay'da kaç saniye kalacak."
          onReset={() => setField('membersDuration', DEFAULT_APP_SETTINGS.membersDuration)}
        >
          <RangeControl min={3} max={30} step={1} value={settings.membersDuration} displayValue={`${settings.membersDuration}s`} onChange={(v) => setField('membersDuration', v)} />
        </FieldRow>
        <Divider />
        <FieldRow
          label="Ölçek"
          hint="Üyelik kartını büyütür veya küçültür."
          onReset={() => setField('membersOverlayScale', DEFAULT_APP_SETTINGS.membersOverlayScale)}
        >
          <RangeControl min={0.5} max={2} step={0.05} value={settings.membersOverlayScale} displayValue={`${Math.round(settings.membersOverlayScale * 100)}%`} onChange={(v) => setField('membersOverlayScale', v)} />
        </FieldRow>

        {/* ── Gelişmiş ── */}
        <AdvancedSection>
          <FieldRow label="Yazı Boyutu" onReset={() => setField('membersFontSize', DEFAULT_APP_SETTINGS.membersFontSize)}>
            <RangeControl min={10} max={30} step={1} value={settings.membersFontSize} displayValue={`${settings.membersFontSize}px`} onChange={(v) => setField('membersFontSize', v)} />
          </FieldRow>
          <Divider />
          <div className="grid gap-4 py-4 md:grid-cols-2">
            <ColorControl
              label="Arka Plan"
              value={settings.membersOverlayBgColor || 'rgba(20, 20, 22, 0.95)'}
              onHexChange={(v) => updateColorField('membersOverlayBgColor', 'rgba(20, 20, 22, 0.95)', v)}
              onAlphaChange={(v) => updateColorField('membersOverlayBgColor', 'rgba(20, 20, 22, 0.95)', undefined, v)}
              onReset={() => setField('membersOverlayBgColor', DEFAULT_APP_SETTINGS.membersOverlayBgColor)}
            />
            <ColorControl
              label="Yazı Rengi"
              value={settings.membersOverlayTxColor || '#ffffff'}
              onHexChange={(v) => updateColorField('membersOverlayTxColor', '#ffffff', v)}
              onAlphaChange={(v) => updateColorField('membersOverlayTxColor', '#ffffff', undefined, v)}
              onReset={() => setField('membersOverlayTxColor', DEFAULT_APP_SETTINGS.membersOverlayTxColor)}
            />
          </div>
          <Divider />
          <div className="grid gap-4 py-4 md:grid-cols-2">
            <ColorControl
              label="Gradient Başlangıç"
              value={settings.membersGradientColor1}
              showOpacity={false}
              onHexChange={(v) => setField('membersGradientColor1', normalizeHex(v))}
              onAlphaChange={() => {}}
              onReset={() => setField('membersGradientColor1', DEFAULT_APP_SETTINGS.membersGradientColor1)}
            />
            <ColorControl
              label="Gradient Bitiş"
              value={settings.membersGradientColor2}
              showOpacity={false}
              onHexChange={(v) => setField('membersGradientColor2', normalizeHex(v))}
              onAlphaChange={() => {}}
              onReset={() => setField('membersGradientColor2', DEFAULT_APP_SETTINGS.membersGradientColor2)}
            />
          </div>
          <Divider />
          <div className="py-4">
            <FieldRow label="Ekran Konumu" hint="Diğer kartlardan bağımsız konum." onReset={() => setField('membersOverlayPosition', DEFAULT_APP_SETTINGS.membersOverlayPosition)}>
              <PositionSelector value={settings.membersOverlayPosition || settings.overlayPosition} onChange={(v) => setField('membersOverlayPosition', v)} />
            </FieldRow>
          </div>
          <Divider />
          <div className="py-4">
            <div className="mb-2 text-xs font-semibold text-app-text-subtle">Özel CSS</div>
            <textarea
              className="w-full rounded-xl border border-white/8 bg-surface-3 px-3 py-2.5 font-mono text-sm text-app-text outline-none transition focus:border-app-accent/40 focus:ring-1 focus:ring-app-accent/20 resize-y min-h-[80px]"
              value={settings.membersCss}
              placeholder="/* Sadece üyelik kartı */"
              onChange={(e) => setField('membersCss', e.target.value)}
              rows={3}
            />
          </div>
        </AdvancedSection>

      </SectionCard>
    </div>
  );
});
