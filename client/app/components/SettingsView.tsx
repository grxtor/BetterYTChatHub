"use client";

import React, { useState } from 'react';

const MOCK_AVATAR_URL = "https://api.dicebear.com/7.x/avataaars/svg?seed=";

interface SettingsViewProps {
    settings: {
        autoSelectSuperChats: boolean;
        autoSelectMembers: boolean;
        overlayScale: number;
        overlayTheme: 'dark' | 'light';
        serverPort: number;
        overlayPosition: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center';
        showTimestamps: boolean;
        showAvatars: boolean;
        messageFontSize: number;
        maxMessages: number;
        superChatPopup: boolean;
        superChatDuration: number;
        customCss?: string;
        superChatCss?: string;
        membersCss?: string;
        messageMaxWidth?: number;
        includeSuperChatsInOverlay?: boolean;
        includeMembersInOverlay?: boolean;
        membersDuration?: number;
        overlayTxColor?: string;
        overlayBgColor?: string;
        membersOverlayScale?: number;
        membersFontSize?: number;
        membersOverlayBgColor?: string;
        membersOverlayTxColor?: string;
        superChatOverlayScale?: number;
        superChatFontSize?: number;
        superChatOverlayBgColor?: string;
        superChatOverlayTxColor?: string;
        membersOverlayPosition?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center';
        superChatOverlayPosition?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center';
        superChatHeaderColor?: string;
        membersGradientColor1?: string;
        membersGradientColor2?: string;
        useSpecialMemberStyling?: boolean;
    };
    onUpdate: (settings: any) => void;
    overlayUrl: string;
    onClose?: () => void;
}

const CopyIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const navItems = [
    { id: 'general', label: 'General', icon: '🏠' },
    { id: 'superchat', label: 'Super Chats', icon: '💎' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'advanced', label: 'Advanced', icon: '⚙️' },
] as const;

type TabId = typeof navItems[number]['id'];

export default function SettingsView({ settings, onUpdate, overlayUrl, onClose }: SettingsViewProps) {
    const [activeTab, setActiveTab] = useState<TabId>('general');
    const [copied, setCopied] = useState(false);

    const toggle = (key: string) => {
        onUpdate({ ...settings, [key]: !((settings as any)[key]) });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="settings-layout-v2">
            {/* LEFT SIDEBAR NAVIGATION */}
            <div className="settings-sidebar">
                <div className="settings-sidebar__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Settings</h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'var(--surface-2)',
                                border: '1px solid var(--border)',
                                color: 'var(--text)',
                                fontSize: '13px',
                                cursor: 'pointer',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                            }}
                            className="settings-back-btn"
                        >
                            Done
                        </button>
                    )}
                </div>
                <nav className="settings-nav">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`settings-nav__item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <span className="settings-nav__icon">{item.icon}</span>
                            <span className="settings-nav__label">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* CENTER - Settings Content */}
            <div className="settings-content-v2">
                {/* General Tab */}
                {activeTab === 'general' && (
                    <>
                        <div className="settings-card">
                            <div className="settings-card__header">
                                <h3 className="settings-card__title">OBS Overlay</h3>
                                <p className="settings-card__desc">Main browser source URL for your stream.</p>
                            </div>
                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Overlay URL</div>
                                </div>
                                <div className="url-copy-field">
                                    <code className="url-copy-field__url">{overlayUrl}</code>
                                    <button className="url-copy-field__btn" onClick={() => copyToClipboard(overlayUrl)}>
                                        {copied ? '✓' : <CopyIcon />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="settings-card">
                            <div className="settings-card__header">
                                <h3 className="settings-card__title">Global Appearance</h3>
                            </div>
                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Base Theme</div>
                                </div>
                                <div className="segmented">
                                    <button className={`segmented__btn ${settings.overlayTheme === 'dark' ? 'active' : ''}`}
                                        onClick={() => onUpdate({
                                            ...settings,
                                            overlayTheme: 'dark',
                                            overlayBgColor: 'rgba(20, 20, 22, 0.95)',
                                            overlayTxColor: '#ffffff'
                                        })}>Dark</button>
                                    <button className={`segmented__btn ${settings.overlayTheme === 'light' ? 'active' : ''}`}
                                        onClick={() => onUpdate({
                                            ...settings,
                                            overlayTheme: 'light',
                                            overlayBgColor: 'rgba(255, 255, 255, 0.95)',
                                            overlayTxColor: '#1a1a1e'
                                        })}>Light</button>
                                </div>
                            </div>

                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Overlay Position</div>
                                </div>
                                <select
                                    className="select-input"
                                    value={settings.overlayPosition}
                                    onChange={(e) => onUpdate({ ...settings, overlayPosition: e.target.value })}
                                >
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="bottom-right">Bottom Right</option>
                                    <option value="top-left">Top Left</option>
                                    <option value="top-right">Top Right</option>
                                    <option value="center">Center</option>
                                </select>
                            </div>

                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Overlay Scale</div>
                                </div>
                                <div className="range-slider">
                                    <input type="range" min="0.5" max="2" step="0.1" value={settings.overlayScale}
                                        onChange={(e) => onUpdate({ ...settings, overlayScale: parseFloat(e.target.value) })} />
                                    <span className="range-slider__value">{(settings.overlayScale * 100).toFixed(0)}%</span>
                                </div>
                            </div>

                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Main Colors</div>
                                    <div className="setting-row__hint">Default bg and text colors</div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '8px' }}>
                                        <input
                                            type="color"
                                            value={settings.overlayBgColor || '#141416'}
                                            onChange={(e) => onUpdate({ ...settings, overlayBgColor: e.target.value })}
                                            style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '100%', cursor: 'pointer', background: 'none' }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Backdrop</span>
                                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-subtle)' }}>{settings.overlayBgColor || '#141416'}</span>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '8px' }}>
                                        <input
                                            type="color"
                                            value={settings.overlayTxColor || '#ffffff'}
                                            onChange={(e) => onUpdate({ ...settings, overlayTxColor: e.target.value })}
                                            style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '100%', cursor: 'pointer', background: 'none' }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Text Color</span>
                                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-subtle)' }}>{settings.overlayTxColor || '#ffffff'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Font Size</div>
                                </div>
                                <div className="range-slider">
                                    <input type="range" min="10" max="48" step="1" value={settings.messageFontSize}
                                        onChange={(e) => onUpdate({ ...settings, messageFontSize: parseInt(e.target.value) })} />
                                    <span className="range-slider__value">{settings.messageFontSize}px</span>
                                </div>
                            </div>

                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Max Width</div>
                                </div>
                                <div className="range-slider">
                                    <input type="range" min="200" max="1200" step="10" value={settings.messageMaxWidth || 400}
                                        onChange={(e) => onUpdate({ ...settings, messageMaxWidth: parseInt(e.target.value) })} />
                                    <span className="range-slider__value">{settings.messageMaxWidth || 400}px</span>
                                </div>
                            </div>
                        </div>

                        <div className="settings-card">
                            <div className="settings-card__header">
                                <h3 className="settings-card__title">Visibility & Automation</h3>
                            </div>
                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Show Avatars</div>
                                </div>
                                <div className={`toggle ${settings.showAvatars ? 'active' : ''}`} onClick={() => toggle('showAvatars')} />
                            </div>
                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Show Timestamps</div>
                                </div>
                                <div className={`toggle ${settings.showTimestamps ? 'active' : ''}`} onClick={() => toggle('showTimestamps')} />
                            </div>
                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Include Super Chats</div>
                                    <div className="setting-row__hint">Show SC in main overlay</div>
                                </div>
                                <div className={`toggle ${settings.includeSuperChatsInOverlay ? 'active' : ''}`} onClick={() => toggle('includeSuperChatsInOverlay')} />
                            </div>
                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Include Members</div>
                                    <div className="setting-row__hint">Show member join/gifts in main overlay</div>
                                </div>
                                <div className={`toggle ${settings.includeMembersInOverlay ? 'active' : ''}`} onClick={() => toggle('includeMembersInOverlay')} />
                            </div>
                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Auto-Select Super Chats</div>
                                </div>
                                <div className={`toggle ${settings.autoSelectSuperChats ? 'active' : ''}`} onClick={() => toggle('autoSelectSuperChats')} />
                            </div>
                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Auto-Select Members</div>
                                </div>
                                <div className={`toggle ${settings.autoSelectMembers ? 'active' : ''}`} onClick={() => toggle('autoSelectMembers')} />
                            </div>
                        </div>
                    </>
                )}

                {/* Super Chat Tab */}
                {activeTab === 'superchat' && (
                    <div className="settings-card">
                        <div className="settings-card__header">
                            <h3 className="settings-card__title">Super Chat Display</h3>
                            <p className="settings-card__desc">Configure how super chats appear on stream.</p>
                        </div>
                        <div className="setting-row" style={settings.includeSuperChatsInOverlay ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                            <div className="setting-row__info">
                                <div className="setting-row__label">Dedicated URL</div>
                                <div className="setting-row__hint">Add as a separate Browser Source (Super Chats only)</div>
                            </div>
                            <div className="url-copy-field">
                                <code className="url-copy-field__url">{`http://localhost:3000/superchat`}</code>
                                <button className="url-copy-field__btn" onClick={() => copyToClipboard(`http://localhost:3000/superchat`)}>
                                    {copied ? '✓' : <CopyIcon />}
                                </button>
                            </div>
                        </div>

                        <div className="setting-row">
                            <div className="setting-row__info">
                                <div className="setting-row__label">Popup Mode</div>
                                <div className="setting-row__hint">Show super chats in a separate floating window</div>
                            </div>
                            <div className={`toggle ${settings.superChatPopup ? 'active' : ''}`} onClick={() => toggle('superChatPopup')} />
                        </div>

                        <div className="setting-row">
                            <div className="setting-row__info">
                                <div className="setting-row__label">Alert Duration</div>
                                <div className="setting-row__hint">How long super chats stay visible</div>
                            </div>
                            <div className="range-slider">
                                <input type="range" min="3" max="60" step="1" value={settings.superChatDuration}
                                    onChange={(e) => onUpdate({ ...settings, superChatDuration: parseInt(e.target.value) })} />
                                <span className="range-slider__value">{settings.superChatDuration}s</span>
                            </div>
                        </div>

                        <div className="setting-row">
                            <div className="setting-row__info">
                                <div className="setting-row__label">Override Position</div>
                            </div>
                            <select
                                className="select-input"
                                value={settings.superChatOverlayPosition || settings.overlayPosition}
                                onChange={(e) => onUpdate({ ...settings, superChatOverlayPosition: e.target.value })}
                            >
                                <option value="">Use Global Position</option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="bottom-right">Bottom Right</option>
                                <option value="top-left">Top Left</option>
                                <option value="top-right">Top Right</option>
                                <option value="center">Center</option>
                            </select>
                        </div>

                        <div className="setting-row">
                            <div className="setting-row__info">
                                <div className="setting-row__label">Override Scale</div>
                            </div>
                            <div className="range-slider">
                                <input type="range" min="0.5" max="2" step="0.1" value={settings.superChatOverlayScale || 1}
                                    onChange={(e) => onUpdate({ ...settings, superChatOverlayScale: parseFloat(e.target.value) })} />
                                <span className="range-slider__value">{((settings.superChatOverlayScale || 1) * 100).toFixed(0)}%</span>
                            </div>
                        </div>

                        <div className="setting-row">
                            <div className="setting-row__info">
                                <div className="setting-row__label">Override Font Size</div>
                            </div>
                            <div className="range-slider">
                                <input type="range" min="12" max="48" step="1" value={settings.superChatFontSize || settings.messageFontSize || 14}
                                    onChange={(e) => onUpdate({ ...settings, superChatFontSize: parseInt(e.target.value) })} />
                                <span className="range-slider__value">{settings.superChatFontSize || settings.messageFontSize || 14}px</span>
                            </div>
                        </div>

                        <div className="setting-row" style={{ marginTop: '16px' }}>
                            <div className="setting-row__info">
                                <div className="setting-row__label">Custom Theme</div>
                                <div className="setting-row__hint">Override global colors for super chats</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '8px' }}>
                                        <input
                                            type="color"
                                            value={settings.superChatOverlayBgColor || settings.overlayBgColor || '#141416'}
                                            onChange={(e) => onUpdate({ ...settings, superChatOverlayBgColor: e.target.value })}
                                            style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '100%', cursor: 'pointer', background: 'none' }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Backdrop</span>
                                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-subtle)' }}>{settings.superChatOverlayBgColor || 'Global'}</span>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '8px' }}>
                                        <input
                                            type="color"
                                            value={settings.superChatOverlayTxColor || settings.overlayTxColor || '#ffffff'}
                                            onChange={(e) => onUpdate({ ...settings, superChatOverlayTxColor: e.target.value })}
                                            style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '100%', cursor: 'pointer', background: 'none' }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Text Color</span>
                                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-subtle)' }}>{settings.superChatOverlayTxColor || 'Global'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '8px' }}>
                                    <input
                                        type="color"
                                        value={settings.superChatHeaderColor || '#E62117'}
                                        onChange={(e) => onUpdate({ ...settings, superChatHeaderColor: e.target.value })}
                                        style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '100%', cursor: 'pointer', background: 'none' }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Header Color</span>
                                        <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-subtle)' }}>{settings.superChatHeaderColor || '#E62117'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="setting-row" style={{ alignItems: 'flex-start' }}>
                            <div className="setting-row__info">
                                <div className="setting-row__label">Super Chat Specific CSS</div>
                            </div>
                            <div className="css-editor">
                                <textarea
                                    className="css-editor__textarea"
                                    value={settings.superChatCss || ''}
                                    onChange={(e) => onUpdate({ ...settings, superChatCss: e.target.value })}
                                    placeholder=".overlay__superchat-header { background: red; }"
                                    spellCheck={false}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                    <div className="settings-card">
                        <div className="settings-card__header">
                            <h3 className="settings-card__title">Members Display</h3>
                            <p className="settings-card__desc">Configure how member alerts appear on stream.</p>
                        </div>
                        <div className="setting-row" style={settings.includeMembersInOverlay ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                            <div className="setting-row__info">
                                <div className="setting-row__label">Dedicated URL</div>
                                <div className="setting-row__hint">Add as a separate Browser Source (Members only)</div>
                            </div>
                            <div className="url-copy-field">
                                <code className="url-copy-field__url">{`http://localhost:3000/members`}</code>
                                <button className="url-copy-field__btn" onClick={() => copyToClipboard(`http://localhost:3000/members`)}>
                                    {copied ? '✓' : <CopyIcon />}
                                </button>
                            </div>
                        </div>

                        <div className="setting-row">
                            <div className="setting-row__info">
                                <div className="setting-row__label">Alert Duration</div>
                                <div className="setting-row__hint">How long members notifications stay visible</div>
                            </div>
                            <div className="range-slider">
                                <input type="range" min="3" max="60" step="1" value={settings.membersDuration || 5}
                                    onChange={(e) => onUpdate({ ...settings, membersDuration: parseInt(e.target.value) })} />
                                <span className="range-slider__value">{settings.membersDuration || 5}s</span>
                            </div>
                        </div>

                        <div className="setting-row">
                            <div className="setting-row__info">
                                <div className="setting-row__label">Override Position</div>
                                <div className="setting-row__hint">Leave default or choose for Members only</div>
                            </div>
                            <select
                                className="select-input"
                                value={settings.membersOverlayPosition || settings.overlayPosition}
                                onChange={(e) => onUpdate({ ...settings, membersOverlayPosition: e.target.value })}
                            >
                                <option value="">Use Global Position</option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="bottom-right">Bottom Right</option>
                                <option value="top-left">Top Left</option>
                                <option value="top-right">Top Right</option>
                                <option value="center">Center</option>
                            </select>
                        </div>

                        <div className="setting-row">
                            <div className="setting-row__info">
                                <div className="setting-row__label">Override Scale</div>
                            </div>
                            <div className="range-slider">
                                <input type="range" min="0.5" max="2" step="0.1" value={settings.membersOverlayScale || 1}
                                    onChange={(e) => onUpdate({ ...settings, membersOverlayScale: parseFloat(e.target.value) })} />
                                <span className="range-slider__value">{((settings.membersOverlayScale || 1) * 100).toFixed(0)}%</span>
                            </div>
                        </div>

                        <div className="setting-row">
                            <div className="setting-row__info">
                                <div className="setting-row__label">Special Member Styling</div>
                                <div className="setting-row__hint">Apply custom colors/gradients to member chat messages</div>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings.useSpecialMemberStyling !== false}
                                    onChange={(e) => onUpdate({ ...settings, useSpecialMemberStyling: e.target.checked })}
                                />
                                <span className="switch__slider"></span>
                            </label>
                        </div>

                        <div className="setting-row" style={{ marginTop: '16px' }}>
                            <div className="setting-row__info">
                                <div className="setting-row__label">Custom Theme</div>
                                <div className="setting-row__hint">Override global colors for members</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '8px' }}>
                                        <input
                                            type="color"
                                            value={settings.membersOverlayBgColor || settings.overlayBgColor || '#141416'}
                                            onChange={(e) => onUpdate({ ...settings, membersOverlayBgColor: e.target.value })}
                                            style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '100%', cursor: 'pointer', background: 'none' }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Backdrop</span>
                                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-subtle)' }}>{settings.membersOverlayBgColor || 'Global'}</span>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '8px' }}>
                                        <input
                                            type="color"
                                            value={settings.membersOverlayTxColor || settings.overlayTxColor || '#ffffff'}
                                            onChange={(e) => onUpdate({ ...settings, membersOverlayTxColor: e.target.value })}
                                            style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '100%', cursor: 'pointer', background: 'none' }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Text Color</span>
                                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-subtle)' }}>{settings.membersOverlayTxColor || 'Global'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '8px' }}>
                                        <input
                                            type="color"
                                            value={settings.membersGradientColor1 || '#1a1a1e'}
                                            onChange={(e) => onUpdate({ ...settings, membersGradientColor1: e.target.value })}
                                            style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '100%', cursor: 'pointer', background: 'none' }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Gradient Start</span>
                                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-subtle)' }}>{settings.membersGradientColor1 || '#1a1a1e'}</span>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '8px' }}>
                                        <input
                                            type="color"
                                            value={settings.membersGradientColor2 || '#1a1a1e'}
                                            onChange={(e) => onUpdate({ ...settings, membersGradientColor2: e.target.value })}
                                            style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '100%', cursor: 'pointer', background: 'none' }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Gradient End</span>
                                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-subtle)' }}>{settings.membersGradientColor2 || '#1a1a1e'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="setting-row" style={{ alignItems: 'flex-start' }}>
                            <div className="setting-row__info">
                                <div className="setting-row__label">Member Specific CSS</div>
                            </div>
                            <div className="css-editor">
                                <textarea
                                    className="css-editor__textarea"
                                    value={settings.membersCss || ''}
                                    onChange={(e) => onUpdate({ ...settings, membersCss: e.target.value })}
                                    placeholder=".overlay__membership-header { background: purple; }"
                                    spellCheck={false}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Advanced Tab */}
                {activeTab === 'advanced' && (
                    <>
                        <div className="settings-card">
                            <div className="settings-card__header">
                                <h3 className="settings-card__title">System Configuration</h3>
                            </div>
                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Server Port</div>
                                    <div className="setting-row__hint">WebSocket & API port (Requires restart)</div>
                                </div>
                                <div className="number-input">
                                    <input
                                        type="number"
                                        className="number-input__field"
                                        value={settings.serverPort}
                                        onChange={(e) => onUpdate({ ...settings, serverPort: parseInt(e.target.value) || 4100 })}
                                        min={1000}
                                        max={65535}
                                    />
                                </div>
                            </div>
                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Max Messages</div>
                                    <div className="setting-row__hint">Number of messages to keep in history</div>
                                </div>
                                <div className="number-input">
                                    <input type="number" className="number-input__field" value={settings.maxMessages}
                                        onChange={(e) => onUpdate({ ...settings, maxMessages: parseInt(e.target.value) || 100 })}
                                        min={10} max={1000} step={10} />
                                </div>
                            </div>
                        </div>

                        <div className="settings-card">
                            <div className="settings-card__header">
                                <h3 className="settings-card__title">Global Custom CSS</h3>
                                <p className="settings-card__desc">Advanced styling that applies to all overlays.</p>
                            </div>
                            <div className="css-editor">
                                <textarea
                                    className="css-editor__textarea"
                                    placeholder=".overlay__card { background: rgba(0,0,0,0.8); }"
                                    value={settings.customCss || ''}
                                    onChange={(e) => onUpdate({ ...settings, customCss: e.target.value })}
                                    spellCheck={false}
                                />
                            </div>
                        </div>

                        <div className="settings-card">
                            <div className="settings-card__header">
                                <h3 className="settings-card__title">System Status</h3>
                            </div>
                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Backend API</div>
                                    <div className="setting-row__hint">http://localhost:{settings.serverPort}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(46, 204, 113, 0.2)', borderRadius: '100px', color: '#2ecc71', fontSize: '12px', fontWeight: 600 }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 10px #2ecc71' }}></span> Connected
                                </div>
                            </div>
                            <div className="setting-row">
                                <div className="setting-row__info">
                                    <div className="setting-row__label">Troubleshooting</div>
                                </div>
                                <button className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => window.location.reload()}>Force Reload</button>
                            </div>
                        </div>
                    </>
                )}


            </div >

            {/* RIGHT - Live Preview (16:9) */}
            < div className="settings-preview-v2" >
                <div className="preview-card">
                    <div className="preview-card__header">
                        <span>Live Preview</span>
                        <span className="preview-card__ratio">16:9</span>
                    </div>
                    <div className="preview-canvas">
                        {/* Safe Area */}
                        <div className="preview-canvas__safe-area" />

                        {/* Preview Message */}
                        {/* Dynamic Preview */}
                        {activeTab === 'superchat' ? (
                            <div className="preview-message" style={{
                                width: '100%',
                                maxWidth: `${settings.messageMaxWidth}px`,
                                ...((settings.superChatOverlayPosition || settings.overlayPosition) === 'center'
                                    ? { top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${(settings.superChatOverlayScale || 1) * 0.7})` }
                                    : {
                                        transform: `scale(${(settings.superChatOverlayScale || 1) * 0.7})`,
                                        transformOrigin: `${(settings.superChatOverlayPosition || settings.overlayPosition).includes('bottom') ? 'bottom' : 'top'} ${(settings.superChatOverlayPosition || settings.overlayPosition).includes('left') ? 'left' : 'right'}`,
                                        ...((settings.superChatOverlayPosition || settings.overlayPosition).includes('bottom') ? { bottom: '12%' } : { top: '12%' }),
                                        ...((settings.superChatOverlayPosition || settings.overlayPosition).includes('left') ? { left: '5%' } : { right: '5%' })
                                    }
                                )
                            }}>
                                <div className="overlay__card overlay__card--superchat-only" style={{
                                    background: settings.superChatOverlayBgColor || 'rgba(20, 20, 22, 0.95)',
                                    color: settings.superChatOverlayTxColor || '#ffffff'
                                }}>
                                    <div className="overlay__superchat-header" style={{ background: settings.superChatHeaderColor || 'linear-gradient(90deg, #E62117, #CC0000)' }}>
                                        {settings.showAvatars && <img src={MOCK_AVATAR_URL + "Felix"} className="overlay__superchat-avatar" />}
                                        <div className="overlay__superchat-info">
                                            <span className="overlay__superchat-name">Super Fan</span>
                                            <span className="overlay__superchat-amount">$50.00</span>
                                        </div>
                                    </div>
                                    <div className="overlay__superchat-text" style={{ fontSize: `${settings.superChatFontSize || 14}px`, color: settings.superChatOverlayTxColor || '#ffffff' }}>
                                        This is a Super Chat preview! 🚀
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'members' ? (
                            <div className="preview-message" style={{
                                width: '100%',
                                maxWidth: `${settings.messageMaxWidth}px`,
                                ...((settings.membersOverlayPosition || settings.overlayPosition) === 'center'
                                    ? { top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${(settings.membersOverlayScale || 1) * 0.7})` }
                                    : {
                                        transform: `scale(${(settings.membersOverlayScale || 1) * 0.7})`,
                                        transformOrigin: `${(settings.membersOverlayPosition || settings.overlayPosition).includes('bottom') ? 'bottom' : 'top'} ${(settings.membersOverlayPosition || settings.overlayPosition).includes('left') ? 'left' : 'right'}`,
                                        ...((settings.membersOverlayPosition || settings.overlayPosition).includes('bottom') ? { bottom: '12%' } : { top: '12%' }),
                                        ...((settings.membersOverlayPosition || settings.overlayPosition).includes('left') ? { left: '5%' } : { right: '5%' })
                                    }
                                )
                            }}>
                                <div className="overlay__card overlay__card--member-only" style={{
                                    background: (settings.useSpecialMemberStyling !== false)
                                        ? (settings.membersGradientColor1 && settings.membersGradientColor2
                                            ? `linear-gradient(90deg, ${settings.membersGradientColor1}, ${settings.membersGradientColor2})`
                                            : (settings.membersOverlayBgColor || 'rgba(20, 20, 22, 0.95)'))
                                        : (settings.overlayBgColor || 'rgba(20, 20, 22, 0.95)'),
                                    color: (settings.useSpecialMemberStyling !== false)
                                        ? (settings.membersOverlayTxColor || '#ffffff')
                                        : (settings.overlayTxColor || '#ffffff')
                                }}>
                                    <div className="overlay__membership-header">
                                        {settings.showAvatars && <img src={MOCK_AVATAR_URL + "Aneka"} className="overlay__membership-avatar" />}
                                        <div className="overlay__membership-info">
                                            <span className="overlay__membership-name">New Member</span>
                                            <span className="overlay__membership-level">Welcome!</span>
                                        </div>
                                    </div>
                                    <div className="overlay__membership-text" style={{ fontSize: `${settings.membersFontSize || 14}px`, color: settings.membersOverlayTxColor || '#ffffff' }}>
                                        Just joined the channel! ⭐
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="preview-message"
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    maxWidth: `${settings.messageMaxWidth}px`,
                                    ...(settings.overlayPosition === 'center'
                                        ? { top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${settings.overlayScale * 0.7})` }
                                        : {
                                            transform: `scale(${settings.overlayScale * 0.7})`,
                                            transformOrigin: `${settings.overlayPosition.includes('bottom') ? 'bottom' : 'top'} ${settings.overlayPosition.includes('left') ? 'left' : 'right'}`,
                                            ...(settings.overlayPosition.includes('bottom') ? { bottom: '12%' } : { top: '12%' }),
                                            ...(settings.overlayPosition.includes('left') ? { left: '5%' } : { right: '5%' })
                                        }
                                    )
                                }}
                            >
                                <div
                                    className="preview-message__content"
                                    style={{
                                        background: settings.overlayBgColor || (settings.overlayTheme === 'dark' ? 'rgba(20, 20, 22, 0.95)' : 'rgba(255, 255, 255, 0.95)'),
                                        color: settings.overlayTxColor || (settings.overlayTheme === 'dark' ? '#f0f0f2' : '#1a1a1e'),
                                    }}
                                >
                                    {settings.showAvatars && (
                                        <div className="preview-message__avatar">JD</div>
                                    )}
                                    <div className="preview-message__body">
                                        <div className="preview-message__header">
                                            John Doe
                                            {settings.showTimestamps && (
                                                <span className="preview-message__time">12:34</span>
                                            )}
                                        </div>
                                        <div className="preview-message__text" style={{ fontSize: `${settings.messageFontSize}px`, lineHeight: '1.4' }}>
                                            Hello world! This is a test message. 👋
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Position Indicator */}
                        <div className="preview-canvas__position">
                            {(activeTab === 'superchat'
                                ? (settings.superChatOverlayPosition || settings.overlayPosition)
                                : activeTab === 'members'
                                    ? (settings.membersOverlayPosition || settings.overlayPosition)
                                    : settings.overlayPosition
                            ).replace('-', ' ')}
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}
