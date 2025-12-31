"use client";

import React from 'react';

interface SidebarProps {
    activeView: 'chat' | 'settings';
    onViewChange: (view: 'chat' | 'settings') => void;
    connectionInfo: { connected: boolean; liveId: string | null } | null;
    stats: {
        messages: number;
        superchats: number;
        members: number;
    };
}

export default function Sidebar({ activeView, onViewChange, connectionInfo, stats }: SidebarProps) {
    return (
        <aside className="sidebar">
            <div className="sidebar__brand">
                <div style={{ width: '28px', height: '28px', background: '#EAB308', borderRadius: '6px', display: 'grid', placeItems: 'center', fontWeight: 'bold', color: '#000' }}>⚡️</div>
                <h1>BetterYT</h1>
            </div>

            {/* Stream Connection (Compact) */}
            <div className="sidebar-section">
                <h3>Connection</h3>
                <div className="connection-card">
                    <div className="status-indicator">
                        <div className={`dot ${connectionInfo?.connected ? 'green' : 'red'}`} />
                        <span>{connectionInfo?.connected ? 'Connected' : 'Offline'}</span>
                    </div>
                    {connectionInfo?.connected && connectionInfo.liveId && (
                        <div className="connection-id">{connectionInfo.liveId}</div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="sidebar-section" style={{ marginBottom: 'auto' }}>
                <h3>Navigation</h3>
                <nav className="sidebar__nav">
                    <button
                        className={`nav-item ${activeView === 'chat' ? 'active' : ''}`}
                        onClick={() => onViewChange('chat')}
                    >
                        <span>💬</span> Chat Feed
                    </button>
                    <button
                        className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
                        onClick={() => onViewChange('settings')}
                    >
                        <span>⚙️</span> Settings
                    </button>
                </nav>
            </div>

            {/* Session Stats (Secondary) */}
            <div className="sidebar-section" style={{ marginBottom: 0 }}>
                <h3>Session Stats</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <StatBox label="MSGS" value={stats.messages} />
                    <StatBox label="SUPER" value={stats.superchats} color="#ef4444" />
                    <StatBox label="MBRS" value={stats.members} color="#EAB308" />
                </div>
            </div>
        </aside>
    );
}

function StatBox({ label, value, color }: { label: string, value: number, color?: string }) {
    return (
        <div style={{ background: 'var(--bg-2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: color || 'var(--text-primary)' }}>{value}</div>
        </div>
    );
}
