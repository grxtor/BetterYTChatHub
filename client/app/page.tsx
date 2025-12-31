'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4100';

interface FavoriteChannel {
  id: string;
  name: string;
  handle: string; // @username
  avatarUrl?: string;
  isLive?: boolean;
  lastChecked?: number;
}

// Simulated live check (in real app, this would call YouTube API)
async function checkChannelLiveStatus(handle: string): Promise<{ isLive: boolean; liveId?: string }> {
  // For demo purposes, we'll just return a mock response
  // In production, this would call the YouTube Data API
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Mock: randomly determine if channel is live (for testing)
    const isLive = Math.random() > 0.7;
    return {
      isLive,
      liveId: isLive ? `live_${handle}_${Date.now()}` : undefined
    };
  } catch {
    return { isLive: false };
  }
}

export default function HomePage() {
  const router = useRouter();
  const [streamInput, setStreamInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [favoriteChannels, setFavoriteChannels] = useState<FavoriteChannel[]>([]);
  const [newChannelInput, setNewChannelInput] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [checkingLive, setCheckingLive] = useState<string | null>(null);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('better_yt_favorites');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFavoriteChannels(parsed);
      } catch (e) {
        console.error('Failed to load favorites', e);
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('better_yt_favorites', JSON.stringify(favoriteChannels));
  }, [favoriteChannels]);

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

    // Extract handle from URL or use as-is
    let handle = newChannelInput.trim();
    const handleMatch = handle.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
    if (handleMatch) {
      handle = handleMatch[1];
    }
    // Remove @ if present
    if (handle.startsWith('@')) {
      handle = handle.slice(1);
    }

    // Check if already exists
    if (favoriteChannels.some(c => c.handle.toLowerCase() === handle.toLowerCase())) {
      alert('This channel is already in your favorites.');
      return;
    }

    const newChannel: FavoriteChannel = {
      id: `ch_${Date.now()}`,
      name: handle,
      handle: handle,
      isLive: false
    };

    setFavoriteChannels(prev => [...prev, newChannel]);
    setNewChannelInput('');
    setShowAddChannel(false);
  };

  const handleRemoveChannel = (id: string) => {
    setFavoriteChannels(prev => prev.filter(c => c.id !== id));
  };

  const handleCheckLive = async (channel: FavoriteChannel) => {
    setCheckingLive(channel.id);
    const result = await checkChannelLiveStatus(channel.handle);
    setFavoriteChannels(prev => prev.map(c =>
      c.id === channel.id
        ? { ...c, isLive: result.isLive, lastChecked: Date.now() }
        : c
    ));
    setCheckingLive(null);
  };

  const handleConnectToChannel = async (channel: FavoriteChannel) => {
    // In real app, this would get the live stream ID from the channel
    // For now, we'll simulate with the channel handle
    setConnecting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/chat/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveId: channel.handle })
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

  return (
    <div className="home-container">
      <div className="home-content">
        {/* Hero Section */}
        <div className="home-hero">
          <div className="home-logo">
            <span className="home-logo__icon">▶</span>
          </div>
          <h1 className="home-title">BetterYT Chat</h1>
          <p className="home-subtitle">
            Stream chat overlay for OBS. Connect to any YouTube Live stream.
          </p>
        </div>

        {/* Connect Input */}
        <div className="connect-card">
          <div className="connect-card__header">
            <h2>Connect to Live Stream</h2>
            <p>Paste a YouTube Live URL or Video ID to get started</p>
          </div>

          <div className="connect-input-group">
            <input
              type="text"
              className="connect-input"
              placeholder="https://youtube.com/watch?v=... or Video ID"
              value={streamInput}
              onChange={(e) => setStreamInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            <button
              className="connect-btn"
              onClick={handleConnect}
              disabled={connecting || !streamInput.trim()}
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>

        {/* Favorite Channels */}
        <div className="favorites-section">
          <div className="favorites-header">
            <h3>Favorite Channels</h3>
            <button
              className="add-channel-btn"
              onClick={() => setShowAddChannel(!showAddChannel)}
            >
              {showAddChannel ? '✕ Cancel' : '+ Add Channel'}
            </button>
          </div>

          {/* Add Channel Form */}
          {showAddChannel && (
            <div className="add-channel-form">
              <input
                type="text"
                className="add-channel-input"
                placeholder="Channel URL (e.g. youtube.com/@username) or @handle"
                value={newChannelInput}
                onChange={(e) => setNewChannelInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
                autoFocus
              />
              <button
                className="add-channel-submit"
                onClick={handleAddChannel}
                disabled={!newChannelInput.trim()}
              >
                Add
              </button>
            </div>
          )}

          {/* Channel List */}
          {favoriteChannels.length === 0 ? (
            <div className="favorites-empty">
              <span className="favorites-empty__icon">⭐</span>
              <p>No favorite channels yet</p>
              <span className="favorites-empty__hint">
                Add your favorite streamers to quickly connect when they go live
              </span>
            </div>
          ) : (
            <div className="channel-list">
              {favoriteChannels.map(channel => (
                <div key={channel.id} className="channel-item">
                  <div className="channel-item__avatar">
                    {channel.avatarUrl ? (
                      <img src={channel.avatarUrl} alt="" />
                    ) : (
                      <span>{channel.name[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="channel-item__info">
                    <span className="channel-item__name">{channel.name}</span>
                    <span className="channel-item__handle">@{channel.handle}</span>
                  </div>
                  <div className="channel-item__status">
                    {channel.isLive ? (
                      <span className="live-badge">🔴 LIVE</span>
                    ) : (
                      <span className="offline-badge">Offline</span>
                    )}
                  </div>
                  <div className="channel-item__actions">
                    <button
                      className="channel-action-btn check"
                      onClick={() => handleCheckLive(channel)}
                      disabled={checkingLive === channel.id}
                      title="Check if live"
                    >
                      {checkingLive === channel.id ? '...' : '🔄'}
                    </button>
                    {channel.isLive && (
                      <button
                        className="channel-action-btn connect"
                        onClick={() => handleConnectToChannel(channel)}
                        disabled={connecting}
                        title="Connect"
                      >
                        ▶
                      </button>
                    )}
                    <button
                      className="channel-action-btn remove"
                      onClick={() => handleRemoveChannel(channel.id)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <a href="/dashboard" className="quick-link">
            <span>📊</span> Dashboard
          </a>
          <a href="/overlay" className="quick-link">
            <span>🎬</span> OBS Overlay
          </a>
        </div>
      </div>
    </div>
  );
}
