'use client';

import { type CSSProperties, useCallback, useEffect, useState } from 'react';
import { normalizeChannelHandle } from '@shared/channel';
import { useRouter } from 'next/navigation';
import { applyAppTheme } from '../lib/appTheme';
import { loadStoredSettings, subscribeToSettingsChanges } from '../lib/appSettings';
import { BACKEND_URL } from '../lib/runtime';
import { useElectronShell } from '../lib/electron';
import { loadSavedChannels, removeSavedChannel } from '../lib/savedChannels';
import { type SavedChannel } from '@shared/settings';
import WindowControls from './components/WindowControls';

const FAVORITES_STORAGE_KEY = 'better_yt_favorites';

interface FavoriteChannel {
  id: string;
  name: string;
  handle: string; // @username
  channelId?: string;
  avatarUrl?: string;
  liveId?: string;
  isLive?: boolean;
  lastChecked?: number;
}

type FavoriteChannelStatusResponse = {
  channelId?: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  isLive: boolean;
  liveId?: string;
  checkedAt: number;
};

type FavoriteChannelStatusResult = FavoriteChannelStatusResponse | null;

function normalizeFavoriteChannel(value: unknown): FavoriteChannel | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const favorite = value as Partial<FavoriteChannel>;
  const handle = typeof favorite.handle === 'string' ? normalizeChannelHandle(favorite.handle) : '';
  const name = typeof favorite.name === 'string' && favorite.name.trim() ? favorite.name.trim() : handle;

  if (!handle) {
    return null;
  }

  return {
    id: typeof favorite.id === 'string' && favorite.id.trim() ? favorite.id : `ch_${handle.toLowerCase()}`,
    name,
    handle,
    channelId: typeof favorite.channelId === 'string' ? favorite.channelId : undefined,
    avatarUrl: typeof favorite.avatarUrl === 'string' ? favorite.avatarUrl : undefined,
    isLive: false,
    liveId: undefined,
    lastChecked: undefined
  };
}

async function fetchChannelLiveStatus(handle: string): Promise<FavoriteChannelStatusResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/channels/live-status?${new URLSearchParams({ handle }).toString()}`);

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    // Only log actual errors, not failed fetches when offline
    if (!(error instanceof TypeError && error.message === 'Failed to fetch')) {
      console.error('Failed to fetch channel live status:', error);
    }
    return null;
  }
}

export default function HomePage() {
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
  const [streamInput, setStreamInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [favoriteChannels, setFavoriteChannels] = useState<FavoriteChannel[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [newChannelInput, setNewChannelInput] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [checkingLiveIds, setCheckingLiveIds] = useState<string[]>([]);
  const [savedChannels, setSavedChannels] = useState<SavedChannel[]>([]);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  // Check backend health
  const checkBackendHealth = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      setBackendAvailable(response.ok);
    } catch {
      setBackendAvailable(false);
    }
  }, []);

  useEffect(() => {
    void checkBackendHealth();
    // Check every 30 seconds if offline
    const timer = setInterval(() => {
      if (!backendAvailable) {
        void checkBackendHealth();
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [backendAvailable, checkBackendHealth]);

  // Load saved channels only on client to avoid hydration mismatch
  useEffect(() => {
    setSavedChannels(loadSavedChannels());
  }, []);

  const setChannelChecking = useCallback((channelId: string, active: boolean) => {
    setCheckingLiveIds((current) => {
      if (active) {
        return current.includes(channelId) ? current : [...current, channelId];
      }

      return current.filter((id) => id !== channelId);
    });
  }, []);

  const refreshFavoriteChannel = useCallback(async (channel: FavoriteChannel) => {
    setChannelChecking(channel.id, true);

    try {
      const result = await fetchChannelLiveStatus(channel.handle);

      if (!result) {
        const fallbackChannel: FavoriteChannel = {
          ...channel,
          isLive: false,
          liveId: undefined,
          lastChecked: Date.now(),
        };

        setFavoriteChannels((current) =>
          current.map((item) => (item.id === channel.id ? fallbackChannel : item))
        );

        return fallbackChannel;
      }

      const updatedChannel: FavoriteChannel = {
        ...channel,
        channelId: result.channelId,
        name: result.name || channel.name,
        handle: normalizeChannelHandle(result.handle || channel.handle),
        avatarUrl: result.avatarUrl || channel.avatarUrl,
        isLive: result.isLive,
        liveId: result.liveId,
        lastChecked: result.checkedAt
      };

      setFavoriteChannels((current) =>
        current.map((item) => (item.id === channel.id ? updatedChannel : item))
      );

      return updatedChannel;
    } finally {
      setChannelChecking(channel.id, false);
    }
  }, [setChannelChecking]);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (!saved) {
      setFavoritesLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      const normalizedFavorites = Array.isArray(parsed)
        ? parsed
            .map((item) => normalizeFavoriteChannel(item))
            .filter((item): item is FavoriteChannel => item !== null)
        : [];

      setFavoriteChannels(normalizedFavorites);

      if (backendAvailable) {
        void (async () => {
          const BATCH_SIZE = 3;
          for (let i = 0; i < normalizedFavorites.length; i += BATCH_SIZE) {
            const batch = normalizedFavorites.slice(i, i + BATCH_SIZE);
            await Promise.allSettled(batch.map((channel) => refreshFavoriteChannel(channel)));
          }
        })();
      }
    } catch (e) {
      console.error('Failed to load favorites', e);
    } finally {
      setFavoritesLoaded(true);
    }
  }, [refreshFavoriteChannel, backendAvailable]);

  useEffect(() => {
    if (!favoritesLoaded) {
      return;
    }

    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteChannels));
  }, [favoriteChannels, favoritesLoaded]);

  useEffect(() => {
    const syncSavedChannels = () => {
      setSavedChannels(loadSavedChannels());
    };

    window.addEventListener('focus', syncSavedChannels);
    window.addEventListener('storage', syncSavedChannels);

    return () => {
      window.removeEventListener('focus', syncSavedChannels);
      window.removeEventListener('storage', syncSavedChannels);
    };
  }, []);

  useEffect(() => {
    const initial = loadStoredSettings();
    applyAppTheme(initial);
    return subscribeToSettingsChanges((incoming) => {
      applyAppTheme(incoming);
    });
  }, []);

  const handleConnect = async () => {
    if (!streamInput.trim()) return;

    setConnecting(true);
    try {
      // Extract video ID from URL
      let videoId = streamInput.trim();
      const urlMatch = streamInput.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/);
      if (urlMatch) {
        videoId = urlMatch[1];
      }

      const response = await fetch(`${BACKEND_URL}/chat/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveId: videoId })
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to connect. Make sure the video ID is correct.');
      }
    } catch (error) {
      alert('Connection error. Is the backend running?');
    } finally {
      setConnecting(false);
    }
  };

  const handleAddChannel = () => {
    if (!newChannelInput.trim()) return;

    const handle = normalizeChannelHandle(newChannelInput);

    if (!handle) {
      alert('Enter a valid channel handle or channel URL.');
      return;
    }

    // Check if already exists
    if (favoriteChannels.some(c => c.handle.toLowerCase() === handle.toLowerCase())) {
      alert('This channel is already in your favorites.');
      return;
    }

    const newChannel: FavoriteChannel = {
      id: `ch_${Date.now()}`,
      name: handle,
      handle,
      isLive: false
    };

    setFavoriteChannels(prev => [...prev, newChannel]);
    setNewChannelInput('');
    setShowAddChannel(false);
    void refreshFavoriteChannel(newChannel);
  };

  const handleRemoveChannel = (id: string) => {
    setFavoriteChannels(prev => prev.filter(c => c.id !== id));
  };

  const handleCheckLive = async (channel: FavoriteChannel) => {
    const updatedChannel = await refreshFavoriteChannel(channel);

    if (!updatedChannel) {
      alert('Could not check this channel right now.');
    }
  };

  const handleConnectToChannel = async (channel: FavoriteChannel) => {
    const updatedChannel = await refreshFavoriteChannel(channel);

    if (!updatedChannel?.isLive || !updatedChannel.liveId) {
      alert('This channel does not have an active live stream right now.');
      return;
    }

    setConnecting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/chat/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveId: updatedChannel.liveId })
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to connect to this channel.');
      }
    } catch (error) {
      alert('Connection error.');
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectSavedChannel = async (videoId: string) => {
    setConnecting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/chat/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveId: videoId })
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to connect to this saved channel.');
      }
    } catch {
      alert('Connection error.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-app-bg text-app-text">
      {isElectron && (
        <header
          className="top-bar relative border-b border-white/6 bg-surface-1/95 px-4 shadow-panel backdrop-blur xl:px-6"
          style={{ WebkitAppRegion: 'drag' } as CSSProperties}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-3"
            style={{ WebkitAppRegion: 'drag' } as CSSProperties}
          />
          <div className="flex min-w-0 items-center gap-3">
            {isMac ? <div className="h-px w-[88px] shrink-0" aria-hidden="true" /> : null}
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#ff2d2d] to-[#b40000] text-sm font-bold text-white shadow-lg shadow-red-950/30">
              ▶
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-[-0.02em] text-app-text md:text-base">
                BetterYT Chat
              </div>
              <div className="hidden text-xs text-app-text-subtle md:block">
                Local workspace for live moderation and OBS output
              </div>
            </div>
          </div>

          <div className="hidden h-full min-w-8 flex-1 xl:block" aria-hidden="true" />

          <div
            className="ml-auto flex items-center gap-3"
            style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}
          >
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
      )}
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <section className="max-w-2xl">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-[20px] border border-red-400/20 bg-gradient-to-br from-[#ff2d2d] to-[#b40000] text-[26px] font-bold text-white shadow-[0_18px_40px_rgba(120,0,0,0.28)]">
            ▶
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-app-text sm:text-5xl">
            BetterYT Chat
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-app-text-muted sm:text-base">
            Fast local moderation desk for YouTube Live. Connect a stream, track favorite channels,
            and send highlights to OBS without the usual panel clutter.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-[24px] border border-white/8 bg-white/[0.035] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.2)]">
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-app-text-subtle">
                Connect
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-app-text">
                Open a live chat
              </h2>
              <p className="mt-2 text-sm text-app-text-muted">
                Paste a YouTube Live URL or video ID and jump straight into the dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                className="h-12 flex-1 rounded-2xl border border-white/8 bg-black/20 px-4 text-sm text-app-text outline-none transition focus:border-app-accent/40 focus:bg-black/30 focus:ring-2 focus:ring-app-accent/15"
                placeholder="https://youtube.com/watch?v=... or Video ID"
                value={streamInput}
                onChange={(e) => setStreamInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              />
              <button
                type="button"
                className="h-12 rounded-2xl bg-app-accent px-5 text-sm font-semibold text-white transition hover:bg-app-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleConnect}
                disabled={connecting || !streamInput.trim() || backendAvailable === false}
              >
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
            </div>

            {backendAvailable === false && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-300">
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                Backend is offline. Start the backend on port 4100 to enable favorites and connection.
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-app-text-secondary transition hover:border-white/14 hover:bg-white/[0.07] hover:text-app-text"
              >
                <span>📊</span>
                <span>Dashboard</span>
              </a>
              <a
                href="/overlay"
                className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-app-text-secondary transition hover:border-white/14 hover:bg-white/[0.07] hover:text-app-text"
              >
                <span>🎬</span>
                <span>OBS Overlay</span>
              </a>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.16)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-app-text-subtle">
                  Quick Access
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-app-text">
                  Quick launches and favorites
                </h2>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-app-text-secondary transition hover:border-app-accent/30 hover:bg-app-accent/10 hover:text-app-text"
                onClick={() => setShowAddChannel(!showAddChannel)}
              >
                {showAddChannel ? 'Cancel' : 'Add channel'}
              </button>
            </div>

            {showAddChannel ? (
              <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-white/8 bg-black/10 p-3 sm:flex-row">
                <input
                  type="text"
                  className="h-11 flex-1 rounded-xl border border-white/8 bg-black/20 px-4 text-sm text-app-text outline-none transition focus:border-app-accent/40 focus:bg-black/30 focus:ring-2 focus:ring-app-accent/15"
                  placeholder="Channel URL (youtube.com/@name) or @handle"
                  value={newChannelInput}
                  onChange={(e) => setNewChannelInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
                  autoFocus
                />
                <button
                  type="button"
                  className="h-11 rounded-xl bg-app-accent px-4 text-sm font-semibold text-white transition hover:bg-app-accent-hover disabled:opacity-60"
                  onClick={handleAddChannel}
                  disabled={!newChannelInput.trim()}
                >
                  Save
                </button>
              </div>
            ) : null}

            <div className="mt-5 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-app-text">Quick launches</h3>
                  <span className="text-[11px] text-app-text-subtle">{savedChannels.length}</span>
                </div>

                {savedChannels.length === 0 ? (
                  <div className="rounded-[18px] border border-dashed border-white/8 bg-white/[0.025] px-5 py-6 text-center">
                    <div className="text-2xl">★</div>
                    <p className="mt-3 text-sm font-medium text-app-text">No starred live IDs yet</p>
                    <p className="mt-1 text-xs leading-5 text-app-text-subtle">
                      Star a live ID from the dashboard and it will appear here for one-click launch.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/6 overflow-hidden rounded-[18px] border border-white/8 bg-black/10">
                    {savedChannels.map((channel) => (
                      <div key={channel.videoId} className="flex items-center gap-3 px-4 py-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/8 bg-gradient-to-br from-amber-300/25 to-app-accent/30 text-sm font-semibold text-white">
                          ★
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-app-text">{channel.label}</div>
                          <div className="truncate text-xs text-app-text-subtle">{channel.videoId}</div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/15 disabled:opacity-50"
                            onClick={() => handleConnectSavedChannel(channel.videoId)}
                            disabled={connecting}
                          >
                            Launch
                          </button>
                          <button
                            type="button"
                            className="grid h-8 w-8 place-items-center rounded-lg text-app-text-muted transition hover:bg-white/8 hover:text-app-text"
                            onClick={() => setSavedChannels(removeSavedChannel(channel.videoId))}
                            title="Remove quick launch"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-app-text">Favorite channels</h3>
                  <span className="text-[11px] text-app-text-subtle">{favoriteChannels.length}</span>
                </div>

                {favoriteChannels.length === 0 ? (
                  <div className="rounded-[18px] border border-dashed border-white/8 bg-white/[0.025] px-5 py-6 text-center">
                    <div className="text-2xl">☆</div>
                    <p className="mt-3 text-sm font-medium text-app-text">No favorite channels yet</p>
                    <p className="mt-1 text-xs leading-5 text-app-text-subtle">
                      Add creator handles here to monitor whether they are live before connecting.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/6 overflow-hidden rounded-[18px] border border-white/8 bg-black/10">
                    {favoriteChannels.map((channel) => {
                  const isChecking = checkingLiveIds.includes(channel.id);

                  return (
                    <div key={channel.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-app-accent/40 to-sky-500/25 text-sm font-semibold text-white">
                        {channel.avatarUrl ? (
                          <img src={channel.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span>{channel.name[0].toUpperCase()}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-app-text">{channel.name}</div>
                        <div className="truncate text-xs text-app-text-subtle">@{channel.handle}</div>
                      </div>

                      <div className="shrink-0">
                        {isChecking ? (
                          <span className="text-[11px] font-medium text-app-text-subtle">Checking...</span>
                        ) : channel.isLive ? (
                          <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-300">
                            Live
                          </span>
                        ) : channel.lastChecked ? (
                          <span className="text-[11px] font-medium text-app-text-subtle">Offline</span>
                        ) : (
                          <span className="text-[11px] font-medium text-app-text-subtle">Syncing</span>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-lg text-app-text-muted transition hover:bg-white/8 hover:text-app-text disabled:opacity-50"
                          onClick={() => handleCheckLive(channel)}
                          disabled={isChecking}
                          title="Check if live"
                        >
                          {isChecking ? '…' : '↻'}
                        </button>
                        {channel.isLive && channel.liveId ? (
                          <button
                            type="button"
                            className="grid h-8 w-8 place-items-center rounded-lg text-emerald-300 transition hover:bg-emerald-500/15 disabled:opacity-50"
                            onClick={() => handleConnectToChannel(channel)}
                            disabled={connecting || isChecking}
                            title="Connect"
                          >
                            ▶
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-lg text-rose-400 transition hover:bg-rose-500/12"
                          onClick={() => handleRemoveChannel(channel.id)}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
