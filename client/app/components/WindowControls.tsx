'use client';

import type { CSSProperties } from 'react';

interface WindowControlsProps {
  show: boolean;
  isMaximized: boolean;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
  className?: string;
}

const noDragStyle = { WebkitAppRegion: 'no-drag' } as CSSProperties;

const buttonClassName =
  'grid h-full w-10 place-items-center border-l border-white/6 text-app-text-muted transition hover:bg-white/6 hover:text-app-text';

export default function WindowControls({
  show,
  isMaximized,
  onMinimize,
  onToggleMaximize,
  onClose,
  className = '',
}: WindowControlsProps) {
  if (!show) {
    return null;
  }

  return (
    <div
      className={`-my-2.5 -mr-3 xl:-mr-4 flex h-[44px] overflow-hidden ${className}`.trim()}
      style={noDragStyle}
    >
      <button
        type="button"
        aria-label="Minimize window"
        className={buttonClassName}
        onClick={onMinimize}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 7h8" />
        </svg>
      </button>

      <button
        type="button"
        aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
        className={buttonClassName}
        onClick={onToggleMaximize}
      >
        {isMaximized ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M4.5 4.5h5v5h-5z" />
            <path d="M6.5 2.5h5v5" />
            <path d="M9.5 4.5h2v2" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="3.5" y="3.5" width="7" height="7" />
          </svg>
        )}
      </button>

      <button
        type="button"
        aria-label="Close window"
        className={`${buttonClassName} hover:border-rose-500/20 hover:bg-rose-500/80 hover:text-white`}
        onClick={onClose}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 4l6 6" />
          <path d="M10 4 4 10" />
        </svg>
      </button>
    </div>
  );
}
