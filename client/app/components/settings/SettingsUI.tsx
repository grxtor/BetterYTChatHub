import { ReactNode, memo, useState } from 'react';
import type { OverlayPosition, OverlayPositionOverride } from '@shared/settings';

const POSITION_OPTIONS: { value: OverlayPosition; label: string }[] = [
  { value: 'top-left', label: 'Sol Üst' },
  { value: 'top-right', label: 'Sağ Üst' },
  { value: 'center', label: 'Orta' },
  { value: 'bottom-left', label: 'Sol Alt' },
  { value: 'bottom-right', label: 'Sağ Alt' },
];

export const sliderClass = 'h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-app-accent';
export const fieldControlClass = 'h-10 w-full rounded-xl border border-white/8 bg-surface-3 px-3 text-sm text-app-text outline-none transition focus:border-app-accent/40 focus:ring-1 focus:ring-app-accent/20';
export const textareaClass = 'w-full rounded-xl border border-white/8 bg-surface-3 px-3 py-2.5 text-sm text-app-text outline-none transition focus:border-app-accent/40 focus:ring-1 focus:ring-app-accent/20 font-mono resize-y min-h-[100px]';

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

export const ResetButton = memo(function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1 text-app-text-muted hover:text-app-text transition rounded-full hover:bg-white/5"
      title="Varsayılana Sıfırla"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
      </svg>
    </button>
  );
});

export const SectionCard = memo(function SectionCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-white/6 bg-surface-2">
      <div className="border-b border-white/6 px-5 py-4">
        <h2 className="text-base font-semibold text-app-text">{title}</h2>
        <p className="mt-1 text-sm text-app-text-muted">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
});

export const Divider = memo(function Divider() {
  return <div className="border-t border-white/8" />;
});

export const AdvancedSection = memo(function AdvancedSection({ children, defaultOpen = false }: { children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-white/8">
      <button
        type="button"
        className="flex w-full items-center justify-between px-0 py-3.5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-app-text-subtle">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
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
      {open && (
        <div className="pb-2">
          {children}
        </div>
      )}
    </div>
  );
});

export const FieldRow = memo(function FieldRow({ label, hint, children, onReset }: { label: string; hint?: string; children: ReactNode; onReset?: () => void }) {
  return (
    <div className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
      <div className="max-w-lg">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-app-text">{label}</div>
          {onReset && <ResetButton onClick={onReset} />}
        </div>
        {hint ? <div className="mt-1 text-sm text-app-text-muted">{hint}</div> : null}
      </div>
      <div className="w-full lg:min-w-[260px] lg:max-w-[320px]">{children}</div>
    </div>
  );
});

export const RangeControl = memo(function RangeControl({ min, max, step, value, displayValue, onChange }: { min: number; max: number; step: number; value: number; displayValue: string; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <input type="range" min={min} max={max} step={step} value={value} className={sliderClass} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="text-right text-sm text-app-text-secondary">{displayValue}</div>
    </div>
  );
});

export const SwitchField = memo(function SwitchField({ label, hint, checked, onToggle, onReset }: { label: string; hint?: string; checked: boolean; onToggle: () => void; onReset?: () => void }) {
  return (
    <FieldRow label={label} hint={hint} onReset={onReset}>
      <button
        type="button"
        className={cn(
          'inline-flex h-7 w-12 items-center rounded-full border p-1 transition',
          checked ? 'justify-end border-app-accent/20 bg-app-accent/90' : 'justify-start border-white/10 bg-white/8',
        )}
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
      >
        <span className="h-5 w-5 rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.35)]" />
      </button>
    </FieldRow>
  );
});

export const ColorControl = memo(function ColorControl({ label, value, hint, showOpacity = true, onHexChange, onAlphaChange, onReset }: { label: string; value: string; hint?: string; showOpacity?: boolean; onHexChange: (v: string) => void; onAlphaChange: (v: number) => void; onReset?: () => void }) {
  const parsed = parseColorValue(value, value);
  return (
    <div className="rounded-[18px] border border-white/8 bg-surface-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-app-text">{label}</div>
            {onReset && <ResetButton onClick={onReset} />}
          </div>
          {hint ? <div className="mt-1 text-sm text-app-text-muted">{hint}</div> : null}
        </div>
        <code className="max-w-[140px] break-all text-right text-xs text-app-text-secondary">{value}</code>
      </div>
      <div className="mt-4 space-y-3">
        <input type="color" value={parsed.hex} className="h-11 w-full cursor-pointer rounded-[14px] border border-white/8 bg-transparent" onChange={(e) => onHexChange(e.target.value)} />
        {showOpacity ? (
          <label className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm text-app-text-secondary">
            <span>Opaklık</span>
            <input type="range" min="0" max="100" step="1" value={Math.round(parsed.alpha * 100)} className={sliderClass} onChange={(e) => onAlphaChange(Number(e.target.value) / 100)} />
            <strong className="text-app-text">{Math.round(parsed.alpha * 100)}%</strong>
          </label>
        ) : null}
      </div>
    </div>
  );
});

export const PositionSelector = memo(function PositionSelector({ value, onChange }: { value: OverlayPosition | OverlayPositionOverride; onChange: (v: OverlayPosition) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {POSITION_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={cn(
            'rounded-xl border px-3 py-2 text-xs font-medium transition',
            value === opt.value
              ? 'border-app-accent/30 bg-app-accent/12 text-app-text'
              : 'border-white/8 bg-white/[0.04] text-app-text-muted hover:text-app-text',
          )}
          onClick={() => onChange(opt.value)}
        >
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
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="text-sm font-semibold text-app-text mb-2">{label}</div>
      <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-black/20 p-2">
        <code className="min-w-0 flex-1 truncate px-2 text-xs text-app-text-secondary">{url}</code>
        <button
          type="button"
          className="rounded-lg border border-white/8 bg-white/[0.05] px-3 py-2 text-xs font-medium text-app-text transition hover:bg-white/[0.09]"
          onClick={copy}
        >
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </button>
      </div>
    </div>
  );
});
