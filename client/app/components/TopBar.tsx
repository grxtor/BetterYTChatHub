'use client';

import type { KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  isSettings?: boolean;
  connected?: boolean;
  connecting?: boolean;
  liveId?: string | null;
  streamInput?: string;
  onStreamInputChange?: (val: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  stats?: {
    messages: number;
    superChats: number;
    members: number;
  };
}

export default function TopBar({
  isSettings = false,
  connected = false,
  connecting = false,
  liveId,
  streamInput = '',
  onStreamInputChange,
  onConnect,
  onDisconnect,
  stats,
}: TopBarProps) {
  const router = useRouter();

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && onConnect) {
      onConnect();
    }
  };

  return (
    <header className="top-bar border-b border-white/6 bg-surface-1/95 px-4 shadow-panel backdrop-blur xl:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#ff2d2d] to-[#b40000] text-sm font-bold text-white shadow-lg shadow-red-950/30">
          ▶
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-[-0.02em] text-app-text md:text-base">
            BetterYT Chat
          </div>
          <div className="hidden text-xs text-app-text-subtle md:block">
            Broadcast console for live moderation and OBS output
          </div>
        </div>
      </div>

      <div className="mx-3 hidden h-6 w-px bg-white/8 lg:block" />

      {!isSettings && (
        <div className="min-w-0 flex-1">
          {!connected ? (
            <div className="flex w-full max-w-2xl items-center gap-2">
              <input
                type="text"
                className="h-10 flex-1 rounded-xl border border-white/8 bg-surface-2 px-4 text-sm text-app-text outline-none transition focus:border-app-accent/70 focus:ring-2 focus:ring-app-accent/20"
                placeholder="Paste YouTube Live URL or video ID"
                value={streamInput}
                onChange={(event) => onStreamInputChange?.(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className="h-10 rounded-xl bg-app-accent px-4 text-sm font-semibold text-white transition hover:bg-app-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onConnect}
                disabled={connecting || !streamInput.trim()}
              >
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          ) : (
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.75)]" />
                Live Connected
              </div>
              {liveId ? (
                <div className="max-w-[18rem] truncate rounded-full border border-white/8 bg-surface-2 px-3 py-1.5 font-mono text-[11px] text-app-text-muted">
                  {liveId}
                </div>
              ) : null}
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                onClick={onDisconnect}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        {!isSettings && stats ? (
          <div className="hidden items-center gap-2 lg:flex">
            {[
              { label: 'Chat', value: stats.messages, tone: 'text-sky-200' },
              { label: 'Super', value: stats.superChats, tone: 'text-amber-200' },
              { label: 'Members', value: stats.members, tone: 'text-emerald-200' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/8 bg-surface-2 px-3 py-2 text-xs"
              >
                <div className="text-app-text-subtle">{stat.label}</div>
                <div className={`font-semibold ${stat.tone}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          className={`grid h-10 w-10 place-items-center rounded-xl border transition ${
            isSettings
              ? 'border-white/10 bg-surface-2 text-app-text hover:bg-surface-3'
              : 'border-white/0 bg-transparent text-app-text-muted hover:border-white/10 hover:bg-surface-2 hover:text-app-text'
          }`}
          onClick={() => router.push(isSettings ? '/dashboard' : '/settings')}
          title={isSettings ? 'Back to Dashboard' : 'Settings'}
        >
          {isSettings ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
