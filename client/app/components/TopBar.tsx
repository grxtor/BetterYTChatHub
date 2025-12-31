'use client';

import React from 'react';
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
    stats
}: TopBarProps) {
    const router = useRouter();

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onConnect) {
            onConnect();
        }
    };

    return (
        <header className="top-bar" style={{
            padding: '0 16px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-1)', // User liked this background
            flexShrink: 0
        }}>
            <div className="top-bar__brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="top-bar__logo" style={{ width: '32px', height: '32px', background: '#ff0000', borderRadius: '8px', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 'bold' }}>▶</div>
                <span className="top-bar__title" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>BetterYT Chat</span>
            </div>

            <div className="top-bar__divider" style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 16px' }} />

            {/* DASHBOARD CONTROLS */}
            {!isSettings && (
                <>
                    {!connected ? (
                        <div className="connection-input" style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                className="connection-input__field"
                                placeholder="YouTube Live URL or Video ID..."
                                value={streamInput}
                                onChange={(e) => onStreamInputChange?.(e.target.value)}
                                onKeyDown={handleKeyDown}
                                style={{
                                    background: 'var(--bg-2)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    color: 'var(--text)',
                                    width: '300px',
                                    outline: 'none'
                                }}
                            />
                            <button
                                className="connection-input__btn"
                                onClick={onConnect}
                                disabled={connecting || !streamInput?.trim()}
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '0 16px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    opacity: connecting ? 0.7 : 1
                                }}
                            >
                                {connecting ? 'Connecting...' : 'Connect'}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="top-bar__status" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <div className="top-bar__dot online" style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
                                <span className="top-bar__status-text" style={{ color: '#10b981', fontSize: '13px', fontWeight: 600 }}>Live</span>
                            </div>
                            {liveId && (
                                <div className="top-bar__stream-id" title={liveId} style={{ marginLeft: '12px', color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'monospace', background: 'var(--bg-2)', padding: '4px 8px', borderRadius: '4px' }}>
                                    {liveId}
                                </div>
                            )}
                            <button className="disconnect-btn" onClick={onDisconnect} style={{ marginLeft: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>✕ Disconnect</span>
                            </button>
                        </>
                    )}
                </>
            )}

            <div style={{ flex: 1 }} />

            {/* DASHBOARD STATS */}
            {!isSettings && stats && (
                <div className="top-bar__stats" style={{ display: 'flex', gap: '16px', marginRight: '24px' }}>
                    <div className="top-bar__stat" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="top-bar__stat-icon">💬</span>
                        <span className="top-bar__stat-value" style={{ fontWeight: 600 }}>{stats.messages}</span>
                    </div>
                    <div className="top-bar__stat" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="top-bar__stat-icon">💎</span>
                        <span className="top-bar__stat-value" style={{ fontWeight: 600 }}>{stats.superChats}</span>
                    </div>
                    <div className="top-bar__stat" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="top-bar__stat-icon">⭐</span>
                        <span className="top-bar__stat-value" style={{ fontWeight: 600 }}>{stats.members}</span>
                    </div>
                </div>
            )}

            {/* ACTIONS */}
            <div className="top-bar__actions">
                {isSettings ? (
                    <button
                        className="icon-btn active"
                        style={{ background: 'var(--surface-2)', color: 'var(--text)', width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', display: 'grid', placeItems: 'center', transition: 'all 0.2s' }}
                        onClick={() => router.push('/dashboard')}
                        title="Back to Dashboard"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </button>
                ) : (
                    <button
                        className="icon-btn"
                        style={{ background: 'transparent', color: 'var(--text-muted)', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'grid', placeItems: 'center', border: '1px solid transparent', transition: 'all 0.2s' }}
                        onClick={() => router.push('/settings')}
                        title="Settings"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    </button>
                )}
            </div>
        </header>
    );
}
