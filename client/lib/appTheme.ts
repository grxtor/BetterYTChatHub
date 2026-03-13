'use client';

import type { AppSettings } from '@shared/settings';

function normalizeHexColor(value: string, fallback: string) {
  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value.toLowerCase();
  }

  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const compact = value.slice(1).toLowerCase();
    return `#${compact[0]}${compact[0]}${compact[1]}${compact[1]}${compact[2]}${compact[2]}`;
  }

  return fallback;
}

function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex, '#818cf8').slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0'))
    .join('')}`;
}

function shadeHex(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const next = (value: number) => value + (255 - value) * amount;
  return rgbToHex(next(r), next(g), next(b));
}

export function applyAppTheme(
  settings: Pick<AppSettings, 'accentColor' | 'showAmbientGlow'>,
) {
  if (typeof document === 'undefined') {
    return;
  }

  const accent = normalizeHexColor(settings.accentColor, '#818cf8');
  const { r, g, b } = hexToRgb(accent);
  const root = document.documentElement;

  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-hover', shadeHex(accent, -0.12));
  root.style.setProperty('--accent-muted', `rgba(${r}, ${g}, ${b}, 0.14)`);
  root.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.32)`);
  root.style.setProperty(
    '--ambient-opacity',
    settings.showAmbientGlow ? '1' : '0',
  );
}
