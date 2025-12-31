'use client';

import { useEffect, useState, useRef } from 'react';
import type { ChatMessage } from '@shared/chat';
import { proxyImageUrl } from '../../lib/imageProxy';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4100';

type SelectionPayload = {
    message: ChatMessage | null;
};

export default function MembersOverlayPage() {
    const [message, setMessage] = useState<ChatMessage | null>(null);
    const [displayMessage, setDisplayMessage] = useState<ChatMessage | null>(null);
    const [connected, setConnected] = useState(false);
    const [fadingOut, setFadingOut] = useState(false);
    const [switching, setSwitching] = useState(false);
    const connectionRef = useRef<EventSource | null>(null);
    const switchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Full settings object state
    const [settings, setSettings] = useState<any>({
        membersOverlayScale: 1,
        membersFontSize: 14,
        membersOverlayBgColor: '',
        membersOverlayTxColor: '',
        membersCss: '',
        customCss: '',
        messageMaxWidth: 400,
        overlayBgColor: 'rgba(20, 20, 22, 0.95)',
        overlayTxColor: '#ffffff'
    });

    // Load settings from local storage
    useEffect(() => {
        const saved = localStorage.getItem('better_yt_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings((prev: any) => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error('Failed to load settings', e);
            }
        }
    }, []);

    useEffect(() => {
        if (connectionRef.current) return;

        const source = new EventSource(`${BACKEND_URL}/overlay/stream`);
        connectionRef.current = source;

        const onSelection = (event: MessageEvent) => {
            try {
                const payload: SelectionPayload = JSON.parse(event.data);
                // ONLY accept Member messages
                if (payload.message && (
                    payload.message.membershipGift ||
                    payload.message.membershipGiftPurchase ||
                    payload.message.isMember ||
                    payload.message.membershipLevel
                )) {
                    setMessage(payload.message);
                } else if (payload.message === null) {
                    setMessage(null);
                }
                setConnected(true);
            } catch (error) {
                console.error('overlay: failed to parse payload', error);
            }
        };

        const onSettingsUpdate = (event: MessageEvent) => {
            try {
                const newSettings = JSON.parse(event.data);
                console.log('[Members] Received settings update:', newSettings);
                setSettings((prev: any) => {
                    const merged = { ...prev, ...newSettings };
                    localStorage.setItem('better_yt_settings', JSON.stringify(merged));
                    return merged;
                });
            } catch (err) {
                console.error('Failed to parse settings event', err);
            }
        };

        source.addEventListener('selection', onSelection as EventListener);
        source.addEventListener('settings', onSettingsUpdate as EventListener);
        source.addEventListener('heartbeat', () => setConnected(true));
        source.onerror = () => setConnected(false);

        return () => {
            source.removeEventListener('selection', onSelection as EventListener);
            source.removeEventListener('settings', onSettingsUpdate as EventListener);
            source.close();
            connectionRef.current = null;
        };
    }, []);

    // Handle message transitions
    useEffect(() => {
        if (switchTimeoutRef.current) {
            clearTimeout(switchTimeoutRef.current);
            switchTimeoutRef.current = null;
        }

        if (message === null && displayMessage !== null) {
            setFadingOut(true);
            setSwitching(false);
            switchTimeoutRef.current = setTimeout(() => {
                setDisplayMessage(null);
                setFadingOut(false);
            }, 300);
        } else if (message !== null && displayMessage !== null && message.id !== displayMessage.id) {
            setSwitching(true);
            setFadingOut(true);
            switchTimeoutRef.current = setTimeout(() => {
                setDisplayMessage(message);
                setFadingOut(false);
                setSwitching(false);
            }, 300);
        } else if (message !== null && displayMessage === null) {
            setDisplayMessage(message);
            setFadingOut(false);
            setSwitching(false);
        }
    }, [message, displayMessage]);

    const getPositionStyle = () => {
        const scale = settings.membersOverlayScale || 1;
        const position = settings.membersOverlayPosition || settings.overlayPosition || 'bottom-left';

        const baseStyle: React.CSSProperties = {
            position: 'absolute',
            transform: `scale(${scale})`,
            transformOrigin: 'bottom left',
            margin: '20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        };

        switch (position) {
            case 'center':
                baseStyle.top = '50%';
                baseStyle.left = '50%';
                baseStyle.transform = `translate(-50%, -50%) scale(${scale})`;
                baseStyle.transformOrigin = 'center center';
                baseStyle.margin = 0;
                break;
            case 'bottom-right':
                baseStyle.bottom = 0;
                baseStyle.right = 0;
                baseStyle.transformOrigin = 'bottom right';
                break;
            case 'top-left':
                baseStyle.top = 0;
                baseStyle.left = 0;
                baseStyle.transformOrigin = 'top left';
                break;
            case 'top-right':
                baseStyle.top = 0;
                baseStyle.right = 0;
                baseStyle.transformOrigin = 'top right';
                break;
            case 'bottom-left':
            default:
                baseStyle.bottom = 0;
                baseStyle.left = 0;
                baseStyle.transformOrigin = 'bottom left';
                break;
        }

        return baseStyle;
    };

    return (
        <main className="overlay">
            <style>{'html, body { background: transparent !important; }'}</style>
            {settings.customCss && <style>{settings.customCss}</style>}
            {settings.membersCss && <style>{settings.membersCss}</style>}
            {displayMessage && (
                <div
                    className={`overlay__card ${fadingOut ? 'overlay__card--fadeOut' : ''} overlay__card--member-only`}
                    style={{
                        ...getPositionStyle(),
                        maxWidth: `${settings.messageMaxWidth}px`,
                        width: '100%',
                        backgroundColor: (settings.useSpecialMemberStyling !== false || (displayMessage.membershipGift || displayMessage.membershipGiftPurchase))
                            ? ((settings.membersGradientColor1 && settings.membersGradientColor2)
                                ? undefined
                                : (settings.membersOverlayBgColor || settings.overlayBgColor))
                            : (settings.overlayBgColor),
                        background: (settings.useSpecialMemberStyling !== false || (displayMessage.membershipGift || displayMessage.membershipGiftPurchase))
                            ? ((settings.membersGradientColor1 && settings.membersGradientColor2)
                                ? `linear-gradient(90deg, ${settings.membersGradientColor1}, ${settings.membersGradientColor2})`
                                : undefined)
                            : undefined,
                        color: (settings.useSpecialMemberStyling !== false || (displayMessage.membershipGift || displayMessage.membershipGiftPurchase))
                            ? (settings.membersOverlayTxColor || settings.overlayTxColor)
                            : (settings.overlayTxColor)
                    }}
                >
                    {/* Header Area */}
                    {(displayMessage.membershipGift || displayMessage.membershipGiftPurchase) ? (
                        <div className="overlay__membership-header">
                            {displayMessage.authorPhoto && (
                                <img src={proxyImageUrl(displayMessage.authorPhoto)} alt={displayMessage.author} className="overlay__membership-avatar" />
                            )}
                            <div className="overlay__membership-info">
                                <span className="overlay__membership-name">{displayMessage.author}</span>
                                <span className="overlay__membership-separator"> - </span>
                                <span className="overlay__membership-level">
                                    {displayMessage.membershipGiftPurchase && displayMessage.giftCount
                                        ? `Sent ${displayMessage.giftCount} Gift Membership${displayMessage.giftCount > 1 ? 's' : ''}`
                                        : displayMessage.membershipLevel || 'Member'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        // Normal Header (for regular chat messages from Members)
                        <div className="overlay__header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                            {displayMessage.authorPhoto && (
                                <img src={proxyImageUrl(displayMessage.authorPhoto)} alt="" className="overlay__avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                            )}
                            <div className="overlay__meta">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="overlay__author" style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>{displayMessage.author}</span>
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: '#10b981',
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        textTransform: 'uppercase'
                                    }}>Member</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {displayMessage.runs?.length ? (
                        <p className="overlay__membership-text" style={{ fontSize: `${settings.membersFontSize || 14}px`, color: settings.membersOverlayTxColor || settings.overlayTxColor }}>
                            {displayMessage.runs.map((r, i) =>
                                r.emojiUrl ? (
                                    <img key={i} src={proxyImageUrl(r.emojiUrl)} alt={r.emojiAlt || 'emoji'} className="overlay__emoji" />
                                ) : (
                                    <span key={i}>{r.text}</span>
                                )
                            )}
                        </p>
                    ) : displayMessage.text && displayMessage.text !== 'N/A' && (
                        <p className="overlay__membership-text" style={{ fontSize: `${settings.membersFontSize || 14}px`, color: settings.membersOverlayTxColor || settings.overlayTxColor }}>{displayMessage.text}</p>
                    )}
                </div>
            )}
        </main>
    );
}
