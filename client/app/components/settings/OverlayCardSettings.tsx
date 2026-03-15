import { memo, type ReactNode } from 'react';
import type { AppSettings } from '@shared/settings';
import {
  SectionCard,
  SwitchField,
  Divider,
  AdvancedSection,
  FieldRow,
  RangeControl,
  ColorControl,
  PositionSelector,
  makeResetter,
} from './SettingsUI';

export interface OverlayCardConfig {
  title: string;
  description: string;
  keys: {
    includeInOverlay: keyof AppSettings;
    autoSelect: keyof AppSettings;
    duration: keyof AppSettings;
    overlayScale: keyof AppSettings;
    fontSize: keyof AppSettings;
    overlayBgColor: keyof AppSettings;
    overlayTxColor: keyof AppSettings;
    overlayPosition: keyof AppSettings;
    customCss: keyof AppSettings;
  };
  labels: {
    showInOverlay: string;
    showInOverlayHint: string;
    autoSelect: string;
    autoSelectHint: string;
    cssPlaceholder: string;
  };
  durationRange: { min: number; max: number };
  bgFallback: string;
  txFallback: string;
}

interface Props {
  config: OverlayCardConfig;
  settings: AppSettings;
  setField: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateColorField: (key: keyof AppSettings, fallback: string, nextHex?: string, nextAlpha?: number) => void;
  extraBasicFields?: ReactNode;
  extraAdvancedFields?: ReactNode;
}

export const OverlayCardSettings = memo(function OverlayCardSettings({
  config,
  settings,
  setField,
  updateColorField,
  extraBasicFields,
  extraAdvancedFields,
}: Props) {
  const { keys, labels, durationRange, bgFallback, txFallback } = config;
  const reset = makeResetter(setField);

  const duration = settings[keys.duration] as number;
  const scale = settings[keys.overlayScale] as number;
  const fontSize = settings[keys.fontSize] as number;
  const bgColor = (settings[keys.overlayBgColor] as string) || bgFallback;
  const txColor = (settings[keys.overlayTxColor] as string) || txFallback;
  const position = (settings[keys.overlayPosition] as string) || settings.overlayPosition;
  const css = settings[keys.customCss] as string;

  return (
    <div className="flex flex-col gap-3">
      <SectionCard title={config.title} description={config.description}>
        <SwitchField
          label={labels.showInOverlay}
          hint={labels.showInOverlayHint}
          checked={settings[keys.includeInOverlay] as boolean}
          onToggle={() => setField(keys.includeInOverlay, !settings[keys.includeInOverlay] as AppSettings[typeof keys.includeInOverlay])}
          onReset={reset(keys.includeInOverlay)}
        />
        <Divider />
        <SwitchField
          label={labels.autoSelect}
          hint={labels.autoSelectHint}
          checked={settings[keys.autoSelect] as boolean}
          onToggle={() => setField(keys.autoSelect, !settings[keys.autoSelect] as AppSettings[typeof keys.autoSelect])}
          onReset={reset(keys.autoSelect)}
        />
        <Divider />

        {extraBasicFields}

        <FieldRow
          label="Gösterim Süresi"
          hint="Kart overlay'da kaç saniye kalacak."
          onReset={reset(keys.duration)}
        >
          <RangeControl
            min={durationRange.min}
            max={durationRange.max}
            step={1}
            value={duration}
            displayValue={`${duration}s`}
            onChange={(v) => setField(keys.duration, v as AppSettings[typeof keys.duration])}
          />
        </FieldRow>
        <Divider />
        <FieldRow
          label="Ölçek"
          hint="Kartı büyütür veya küçültür."
          onReset={reset(keys.overlayScale)}
        >
          <RangeControl
            min={0.5}
            max={2}
            step={0.05}
            value={scale}
            displayValue={`${Math.round(scale * 100)}%`}
            onChange={(v) => setField(keys.overlayScale, v as AppSettings[typeof keys.overlayScale])}
          />
        </FieldRow>

        <AdvancedSection>
          {extraAdvancedFields}

          <FieldRow label="Yazı Boyutu" onReset={reset(keys.fontSize)}>
            <RangeControl
              min={10}
              max={30}
              step={1}
              value={fontSize}
              displayValue={`${fontSize}px`}
              onChange={(v) => setField(keys.fontSize, v as AppSettings[typeof keys.fontSize])}
            />
          </FieldRow>
          <Divider />
          <div className="grid gap-4 py-4 md:grid-cols-2">
            <ColorControl
              label="Arka Plan"
              value={bgColor}
              onHexChange={(v) => updateColorField(keys.overlayBgColor, bgFallback, v)}
              onAlphaChange={(v) => updateColorField(keys.overlayBgColor, bgFallback, undefined, v)}
              onReset={reset(keys.overlayBgColor)}
            />
            <ColorControl
              label="Yazı Rengi"
              value={txColor}
              onHexChange={(v) => updateColorField(keys.overlayTxColor, txFallback, v)}
              onAlphaChange={(v) => updateColorField(keys.overlayTxColor, txFallback, undefined, v)}
              onReset={reset(keys.overlayTxColor)}
            />
          </div>
          <Divider />
          <div className="py-4">
            <FieldRow
              label="Ekran Konumu"
              hint="Diğer kartlardan bağımsız konum."
              onReset={reset(keys.overlayPosition)}
            >
              <PositionSelector
                value={position as any}
                onChange={(v) => setField(keys.overlayPosition, v as AppSettings[typeof keys.overlayPosition])}
              />
            </FieldRow>
          </div>
          <Divider />
          <div className="py-4">
            <div className="mb-2 text-xs font-semibold text-app-text-subtle">Özel CSS</div>
            <textarea
              className="w-full rounded-xl border border-white/8 bg-surface-3 px-3 py-2.5 font-mono text-sm text-app-text outline-none transition focus:border-app-accent/40 focus:ring-1 focus:ring-app-accent/20 resize-y min-h-[80px]"
              value={css}
              placeholder={labels.cssPlaceholder}
              onChange={(e) => setField(keys.customCss, e.target.value as AppSettings[typeof keys.customCss])}
              rows={3}
            />
          </div>
        </AdvancedSection>
      </SectionCard>
    </div>
  );
});
