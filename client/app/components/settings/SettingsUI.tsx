import { ReactNode, memo, useState } from 'react';
import type { AppSettings, OverlayPosition, OverlayPositionOverride } from '@shared/settings';
import { DEFAULT_APP_SETTINGS } from '@shared/settings';

// ─── Merkezi Stil Tokenları ────────────────────────────────────────────────
// Tüm settings UI bileşenleri buradan stillerini çeker.
// Değiştirmek istediğinde sadece buraya dokunman yeterli.
const ui = {
  // Kart
  card:        'overflow-hidden rounded-2xl border border-white/6 bg-surface-2 shadow-sm',
  cardHeader:  'border-b border-white/6 bg-gradient-to-r from-white/[0.02] to-transparent px-5 py-3',
  cardTitle:   'text-[13px] font-semibold tracking-tight text-app-text',
  cardDesc:    'mt-0.5 text-xs text-app-text-muted',
  cardBody:    'px-5 py-3',

  // Satır (FieldRow / ColorControl)
  row:         'flex items-center justify-between gap-6 py-3 border-b border-white/4 last:border-b-0 first:pt-0',
  rowLabel:    'text-sm text-app-text',
  rowHint:     'mt-0.5 text-xs text-app-text-muted',
  rowControl:  'shrink-0 w-44',

  // Input / Select / Textarea
  input:       'h-9 w-full rounded-xl border border-white/8 bg-surface-3 px-3 text-sm text-app-text outline-none transition focus:border-app-accent/40 focus:ring-1 focus:ring-app-accent/20',
  textarea:    'w-full rounded-xl border border-white/8 bg-surface-3 px-3 py-2.5 text-sm text-app-text outline-none transition focus:border-app-accent/40 focus:ring-1 focus:ring-app-accent/20 font-mono resize-y min-h-[72px]',
  slider:      'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-app-accent',

  // Toggle switch
  switchOn:    'inline-flex h-[26px] w-12 items-center justify-end rounded-full border border-app-accent/20 bg-app-accent/90 p-0.5 transition-all duration-150',
  switchOff:   'inline-flex h-[26px] w-12 items-center justify-start rounded-full border border-white/10 bg-white/8 p-0.5 transition-all duration-150',
  switchThumb: 'h-[18px] w-[18px] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]',

  // Buton — seçenek grid'leri (position selector, preset vb.)
  optionActive:   'rounded-lg border border-app-accent/30 bg-app-accent/10 px-2.5 py-1.5 text-xs font-medium text-app-text transition shadow-sm shadow-app-accent/10',
  optionInactive: 'rounded-lg border border-white/6 bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition hover:text-app-text hover:bg-white/[0.06]',

  // Gelişmiş ayarlar toggle
  advancedToggle: 'flex w-full items-center justify-between py-3 text-left border-t border-white/6',
  advancedLabel:  'flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-app-text-subtle',

  // URL kopyala alanı
  urlBox:    'flex items-center gap-2 rounded-xl border border-white/8 bg-black/20 px-3 py-2',
  urlCode:   'min-w-0 flex-1 truncate text-xs text-app-text-secondary',
  urlButton: 'rounded-lg border border-white/8 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-app-text transition hover:bg-white/[0.09]',
};

// ─── Yardımcılar ──────────────────────────────────────────────────────────
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeHex(value: string) {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const c = value.slice(1).toLowerCase();
    return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`;
  }
  return '#ffffff';
}

function hexToRgb(hex: string) {
  const n = normalizeHex(hex).slice(1);
  return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => clamp(v, 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

export function parseColorValue(value: string, fallback: string) {
  const source = value || fallback;
  const m = source.match(/rgba?\(\s*(\d{1,3})[,\s]+(\d{1,3})[,\s]+(\d{1,3})(?:[,\s/]+([0-9.]+))?\s*\)/i);
  if (m) return { hex: rgbToHex(Number(m[1]), Number(m[2]), Number(m[3])), alpha: clamp(m[4] === undefined ? 1 : Number(m[4]), 0, 1) };
  return { hex: normalizeHex(source), alpha: 1 };
}

export function serializeColor(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  const a = clamp(Number(alpha.toFixed(2)), 0, 1);
  if (a >= 0.99) return normalizeHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ─── Reset Helper ───────────────────────────────────────────────────────
export function makeResetter(
  setField: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void,
) {
  return <K extends keyof AppSettings>(key: K) =>
    () => setField(key, DEFAULT_APP_SETTINGS[key]);
}

// Dışarıdan kullanılanlar (input/textarea için className)
export const fieldControlClass = ui.input;
export const textareaClass = ui.textarea;
export const sliderClass = ui.slider;

const POSITION_OPTIONS: { value: OverlayPosition; label: string }[] = [
  { value: 'top-left',     label: 'Sol Üst' },
  { value: 'top-right',    label: 'Sağ Üst' },
  { value: 'center',       label: 'Orta' },
  { value: 'bottom-left',  label: 'Sol Alt' },
  { value: 'bottom-right', label: 'Sağ Alt' },
];

// ─── Bileşenler ───────────────────────────────────────────────────────────

export const ResetButton = memo(function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1 text-app-text-muted hover:text-app-text transition rounded-full hover:bg-white/5"
      title="Varsayılana Sıfırla"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
      </svg>
    </button>
  );
});

export const SectionCard = memo(function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className={ui.card}>
      <div className={ui.cardHeader}>
        <h2 className={ui.cardTitle}>{title}</h2>
        {description ? <p className={ui.cardDesc}>{description}</p> : null}
      </div>
      <div className={ui.cardBody}>{children}</div>
    </section>
  );
});

export const Divider = memo(function Divider() {
  return <div className="border-t border-white/8" />;
});

export const AdvancedSection = memo(function AdvancedSection({ children, defaultOpen = false }: { children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button type="button" className={ui.advancedToggle} onClick={() => setOpen((v) => !v)}>
        <span className={ui.advancedLabel}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
          Gelişmiş Ayarlar
        </span>
        {!open && (
          <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-app-text-subtle">
            gizli
          </span>
        )}
      </button>
      {open && <div className="pb-1">{children}</div>}
    </div>
  );
});

export const FieldRow = memo(function FieldRow({ label, hint, children, onReset }: { label: string; hint?: string; children: ReactNode; onReset?: () => void }) {
  return (
    <div className={ui.row}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={ui.rowLabel}>{label}</span>
          {onReset && <ResetButton onClick={onReset} />}
        </div>
        {hint ? <div className={ui.rowHint}>{hint}</div> : null}
      </div>
      <div className={ui.rowControl}>{children}</div>
    </div>
  );
});

export const RangeControl = memo(function RangeControl({ min, max, step, value, displayValue, onChange }: { min: number; max: number; step: number; value: number; displayValue: string; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <input type="range" min={min} max={max} step={step} value={value} className={ui.slider} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="flex justify-end">
        <span className="rounded-md border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium tabular-nums text-app-text-secondary">
          {displayValue}
        </span>
      </div>
    </div>
  );
});

export const SwitchField = memo(function SwitchField({ label, hint, checked, onToggle, onReset }: { label: string; hint?: string; checked: boolean; onToggle: () => void; onReset?: () => void }) {
  return (
    <FieldRow label={label} hint={hint} onReset={onReset}>
      <button type="button" className={checked ? ui.switchOn : ui.switchOff} role="switch" aria-checked={checked} onClick={onToggle}>
        <span className={ui.switchThumb} />
      </button>
    </FieldRow>
  );
});

export const ColorControl = memo(function ColorControl({ label, value, hint, showOpacity = true, onHexChange, onAlphaChange, onReset }: { label: string; value: string; hint?: string; showOpacity?: boolean; onHexChange: (v: string) => void; onAlphaChange: (v: number) => void; onReset?: () => void }) {
  const parsed = parseColorValue(value, value);
  return (
    <div>
      <div className={ui.row}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={ui.rowLabel}>{label}</span>
            {onReset && <ResetButton onClick={onReset} />}
          </div>
          {hint ? <div className={ui.rowHint}>{hint}</div> : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-app-text-muted">{Math.round(parsed.alpha * 100)}%</span>
          <input type="color" value={parsed.hex} className="h-7 w-10 cursor-pointer rounded border border-white/8 bg-transparent" onChange={(e) => onHexChange(e.target.value)} />
        </div>
      </div>
      {showOpacity && (
        <div className="flex items-center gap-3 pb-2 pt-1">
          <span className="text-[10px] font-medium text-app-text-subtle w-14 shrink-0">Opaklık</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={parsed.alpha}
            className={ui.slider}
            onChange={(e) => onAlphaChange(Number(e.target.value))}
          />
          <span className="text-xs tabular-nums text-app-text-secondary w-10 text-right">{Math.round(parsed.alpha * 100)}%</span>
        </div>
      )}
    </div>
  );
});

export const PositionSelector = memo(function PositionSelector({ value, onChange }: { value: OverlayPosition | OverlayPositionOverride; onChange: (v: OverlayPosition) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {POSITION_OPTIONS.map((opt) => (
        <button key={opt.value} type="button" className={value === opt.value ? ui.optionActive : ui.optionInactive} onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  );
});

export const CopyUrlField = memo(function CopyUrlField({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="py-2 first:pt-0 last:pb-0">
      <div className="mb-1.5 text-sm text-app-text">{label}</div>
      <div className={ui.urlBox}>
        <code className={ui.urlCode}>{url}</code>
        <button type="button" className={ui.urlButton} onClick={copy}>
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </button>
      </div>
    </div>
  );
});
