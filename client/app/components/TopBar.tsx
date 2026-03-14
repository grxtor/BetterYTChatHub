'use client';

import { type CSSProperties, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SavedChannel } from '@shared/settings';
import { useElectronShell } from '../../lib/electron';
import WindowControls from './WindowControls';

interface TopBarProps {
  isSettings?: boolean;
  connected?: boolean;
  connecting?: boolean;
  liveId?: string | null;
  streamInput?: string;
  onStreamInputChange?: (val: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  savedChannels?: SavedChannel[];
  onSaveChannel?: (label: string, videoId: string) => void;
  onRemoveChannel?: (videoId: string) => void;
  onSelectChannel?: (videoId: string) => void;
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
  savedChannels = [],
  onSaveChannel,
  onRemoveChannel,
  onSelectChannel,
}: TopBarProps) {
  const router = useRouter();
  const {
    isElectron,
    isMac,
    showCustomWindowControls,
    isMaximized,
    minimize,
    toggleMaximize,
    close,
  } = useElectronShell();

  const dragStyle = isElectron ? ({ WebkitAppRegion: 'drag' } as CSSProperties) : undefined;
  const noDragStyle = isElectron ? ({ WebkitAppRegion: 'no-drag' } as CSSProperties) : undefined;

  // Favorites dropdown state
  const [showFavorites, setShowFavorites] = useState(false);
  const favoritesRef = useRef<HTMLDivElement>(null);

  // Save channel inline form state (not-connected)
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const saveFormRef = useRef<HTMLDivElement>(null);

  // Save channel inline form state (connected)
  const [showConnectedSaveForm, setShowConnectedSaveForm] = useState(false);
  const [connectedSaveLabel, setConnectedSaveLabel] = useState('');
  const connectedSaveFormRef = useRef<HTMLDivElement>(null);

  const closePopovers = () => {
    setShowFavorites(false);
    setShowSaveForm(false);
    setShowConnectedSaveForm(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function onClickOutside(e: globalThis.MouseEvent) {
      if (favoritesRef.current && !favoritesRef.current.contains(e.target as Node)) {
        setShowFavorites(false);
      }
      if (saveFormRef.current && !saveFormRef.current.contains(e.target as Node)) {
        setShowSaveForm(false);
      }
      if (connectedSaveFormRef.current && !connectedSaveFormRef.current.contains(e.target as Node)) {
        setShowConnectedSaveForm(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    setShowConnectedSaveForm(false);
    setConnectedSaveLabel('');
  }, [liveId]);

  useEffect(() => {
    if (connected) {
      setShowSaveForm(false);
      setSaveLabel('');
      return;
    }

    setShowConnectedSaveForm(false);
    setConnectedSaveLabel('');
  }, [connected]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && onConnect) {
      onConnect();
    }
  };

  const handleSaveSubmit = () => {
    if (!saveLabel.trim() || !streamInput.trim()) return;
    onSaveChannel?.(saveLabel.trim(), streamInput.trim());
    closePopovers();
    setSaveLabel('');
  };

  const handleSelectFavorite = (videoId: string) => {
    onSelectChannel?.(videoId);
    setShowFavorites(false);
  };

  const handleConnectedSaveSubmit = () => {
    if (!connectedSaveLabel.trim() || !liveId) return;
    onSaveChannel?.(connectedSaveLabel.trim(), liveId);
    closePopovers();
    setConnectedSaveLabel('');
  };

  const isSaved = liveId ? savedChannels.some(c => c.videoId === liveId) : false;

  return (
    <header
      className="top-bar relative border-b border-white/6 bg-surface-1/95 px-3 backdrop-blur xl:px-4"
      style={dragStyle}
    >
      {isElectron ? (
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-3" style={dragStyle} />
      ) : null}

      <div className="flex min-w-0 items-center gap-2.5">
        {isMac ? <div className="h-px w-[88px] shrink-0" aria-hidden="true" /> : null}
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#ff2d2d] to-[#b40000] text-[11px] font-bold text-white">
          ▶
        </div>
        <span className="truncate text-sm font-semibold tracking-tight text-app-text">
          BetterYT Chat
        </span>
      </div>

      <div className="mx-3 hidden h-5 w-px bg-white/8 lg:block" />

      {!isSettings && (
        <div className="min-w-0 flex-1" style={noDragStyle}>
          {!connected ? (
            <div className="flex w-full max-w-2xl items-center gap-2">
              <input
                type="text"
                className="h-8 flex-1 rounded-lg border border-white/8 bg-surface-2 px-3 text-sm text-app-text outline-none transition focus:border-app-accent/60 focus:ring-1 focus:ring-app-accent/20"
                placeholder="YouTube Live URL veya video ID"
                value={streamInput}
                onChange={(event) => onStreamInputChange?.(event.target.value)}
                onKeyDown={handleKeyDown}
              />

              {/* Save channel button */}
              {streamInput.trim() && (
                <div className="relative" ref={saveFormRef}>
                  <button
                    type="button"
                    title="Save this channel"
                    className="h-8 w-8 rounded-lg border border-white/8 bg-surface-2 text-app-text-muted transition hover:border-amber-500/30 hover:bg-surface-3 hover:text-amber-300"
                    onClick={() => {
                      setSaveLabel('');
                      setShowSaveForm(v => !v);
                      setShowFavorites(false);
                      setShowConnectedSaveForm(false);
                    }}
                  >
                    ★
                  </button>
                  {showSaveForm && (
                    <div className="absolute left-0 top-12 z-50 w-64 rounded-xl border border-white/10 bg-surface-2 p-3 shadow-panel-lg">
                      <p className="mb-2 text-xs text-app-text-subtle">Save current input as</p>
                      <input
                        autoFocus
                        type="text"
                        className="mb-2 h-9 w-full rounded-lg border border-white/8 bg-surface-3 px-3 text-sm text-app-text outline-none focus:border-app-accent/70"
                        placeholder="e.g. Friday stream"
                        value={saveLabel}
                        onChange={e => setSaveLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveSubmit()}
                      />
                      <p className="mb-3 truncate font-mono text-[11px] text-app-text-subtle">
                        {streamInput.trim()}
                      </p>
                      <button
                        type="button"
                        className="h-8 w-full rounded-lg bg-app-accent text-xs font-semibold text-white transition hover:bg-app-accent-hover disabled:opacity-50"
                        onClick={handleSaveSubmit}
                        disabled={!saveLabel.trim()}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Favorites dropdown */}
              <div className="relative" ref={favoritesRef}>
                <button
                  type="button"
                  title="Saved channels"
                  className={`h-8 rounded-lg border px-2.5 text-xs font-medium transition ${
                    showFavorites
                      ? 'border-app-accent/40 bg-app-accent/10 text-app-accent'
                      : 'border-white/8 bg-surface-2 text-app-text-muted hover:border-white/15 hover:bg-surface-3 hover:text-app-text'
                  }`}
                  onClick={() => {
                    setShowFavorites(v => !v);
                    setShowSaveForm(false);
                    setShowConnectedSaveForm(false);
                  }}
                >
                  ☆ Saved
                  {savedChannels.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-app-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-app-accent">
                      {savedChannels.length}
                    </span>
                  )}
                </button>

                {showFavorites && (
                  <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-white/10 bg-surface-2 py-1.5 shadow-panel-lg">
                    {savedChannels.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-app-text-subtle">
                        No saved channels yet. Enter a live URL or video ID and use the star button.
                      </p>
                    ) : (
                      savedChannels.map(ch => (
                        <div
                          key={ch.videoId}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-surface-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-app-text">{ch.label}</div>
                            <div className="truncate font-mono text-[11px] text-app-text-muted">{ch.videoId}</div>
                          </div>
                          <button
                            type="button"
                            title="Connect"
                            className="h-7 rounded-lg bg-emerald-500/15 px-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
                            onClick={() => handleSelectFavorite(ch.videoId)}
                          >
                            ▶
                          </button>
                          <button
                            type="button"
                            title="Remove"
                            className="h-7 w-7 rounded-lg bg-rose-500/10 text-xs text-rose-400 transition hover:bg-rose-500/20"
                            onClick={() => onRemoveChannel?.(ch.videoId)}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="h-8 rounded-lg bg-app-accent px-3 text-xs font-semibold text-white transition hover:bg-app-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
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
              {/* Save current live ID as favorite */}
              <div className="relative" ref={connectedSaveFormRef}>
                <button
                  type="button"
                  title={isSaved ? 'Saved' : 'Save this live stream'}
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isSaved
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      : 'border-white/8 bg-surface-2 text-app-text-muted hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300'
                  }`}
                  onClick={() => {
                    if (isSaved) return;
                    setConnectedSaveLabel('');
                    setShowConnectedSaveForm(v => !v);
                    setShowFavorites(false);
                    setShowSaveForm(false);
                  }}
                >
                  {isSaved ? 'Saved ★' : 'Save ☆'}
                </button>
                {showConnectedSaveForm && (
                  <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-white/10 bg-surface-2 p-3 shadow-panel-lg">
                    <p className="mb-2 text-xs text-app-text-subtle">Save connected stream as</p>
                    <input
                      autoFocus
                      type="text"
                      className="mb-2 h-9 w-full rounded-lg border border-white/8 bg-surface-3 px-3 text-sm text-app-text outline-none focus:border-app-accent/70"
                      placeholder="e.g. Main channel"
                      value={connectedSaveLabel}
                      onChange={e => setConnectedSaveLabel(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleConnectedSaveSubmit()}
                    />
                    {liveId ? (
                      <p className="mb-3 truncate font-mono text-[11px] text-app-text-subtle">
                        {liveId}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      className="h-8 w-full rounded-lg bg-app-accent text-xs font-semibold text-white transition hover:bg-app-accent-hover disabled:opacity-50"
                      onClick={handleConnectedSaveSubmit}
                      disabled={!connectedSaveLabel.trim()}
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
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

      {isElectron ? <div className="ml-3 hidden h-9 min-w-[120px] lg:flex" style={dragStyle} aria-hidden="true" /> : null}

      <div className="ml-auto flex items-center gap-3" style={noDragStyle}>

        <button
          type="button"
          className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
            isSettings
              ? 'border-white/10 bg-surface-2 text-app-text hover:bg-surface-3'
              : 'border-transparent bg-transparent text-app-text-muted hover:border-white/10 hover:bg-surface-2 hover:text-app-text'
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

        <WindowControls
          show={showCustomWindowControls}
          isMaximized={isMaximized}
          onMinimize={() => {
            void minimize();
          }}
          onToggleMaximize={() => {
            void toggleMaximize();
          }}
          onClose={() => {
            void close();
          }}
        />
      </div>
    </header>
  );
}
