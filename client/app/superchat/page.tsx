'use client';

import { useEffect, useState, useRef } from 'react';
import type { ChatMessage } from '@shared/chat';
import { proxyImageUrl } from '../../lib/imageProxy';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4100';

type SelectionPayload = {
    message: ChatMessage | null;
};

export default function SuperChatOverlayPage() {
    const [message, setMessage] = useState<ChatMessage | null>(null);
    const [displayMessage, setDisplayMessage] = useState<ChatMessage | null>(null);
    const [connected, setConnected] = useState(false);
    const [fadingOut, setFadingOut] = useState(false);
    const [switching, setSwitching] = useState(false);
    const connectionRef = useRef<EventSource | null>(null);
    const switchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Full settings object state
    const [settings, setSettings] = useState<any>({
        superChatOverlayScale: 1,
        superChatFontSize: 14,
        superChatOverlayBgColor: '',
        superChatOverlayTxColor: '',
        superChatCss: '',
        customCss: '',
        superChatDuration: 10,
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
                // ONLY accept SuperChat and Sticky messages
                if (payload.message &&
                    (payload.message.superChat || (payload.message as any).superSticker)) {
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
                console.log('[SuperChat] Received settings update:', newSettings);
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

    // Cleanup for display duration
    useEffect(() => {
        if (!displayMessage) return;

        const timer = setTimeout(() => {
            // In dedicated overlay we might just keep it?
            // Or follow user preference. Usually dedicated overlays keep last message?
            // But settings has "Display Duration". So let's respect it.
            setFadingOut(true);
            setTimeout(() => {
                setDisplayMessage(null);
                setFadingOut(false);
            }, 300);
        }, (settings.superChatDuration || 10) * 1000);

        return () => clearTimeout(timer);
    }, [displayMessage, settings.superChatDuration]);


    const getPositionStyle = () => {
        const scale = settings.superChatOverlayScale || 1;
        const position = settings.superChatOverlayPosition || settings.overlayPosition || 'bottom-right';

        const baseStyle: React.CSSProperties = {
            position: 'absolute',
            transform: `scale(${scale})`,
            transformOrigin: 'bottom right',
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
            case 'bottom-left':
                baseStyle.bottom = 0;
                baseStyle.left = 0;
                baseStyle.transformOrigin = 'bottom left';
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
            case 'bottom-right':
            default:
                baseStyle.bottom = 0;
                baseStyle.right = 0;
                baseStyle.transformOrigin = 'bottom right';
                break;
        }

        return baseStyle;
    };


    return (
        <main className="overlay">
            <style>{'html, body { background: transparent !important; }'}</style>
            {settings.customCss && <style>{settings.customCss}</style>}
            {settings.superChatCss && <style>{settings.superChatCss}</style>}
            {displayMessage && (
                <div
                    className={`overlay__card ${fadingOut ? 'overlay__card--fadeOut' : ''} overlay__card--superchat-only`}
                    style={{
                        ...getPositionStyle(),
                        maxWidth: `${settings.messageMaxWidth}px`,
                        width: '100%',
                        backgroundColor: settings.superChatOverlayBgColor || settings.overlayBgColor,
                        color: settings.superChatOverlayTxColor || settings.overlayTxColor
                    }}
                >
                    <div
                        className="overlay__superchat-header"
                        style={{
                            backgroundColor: settings.superChatHeaderColor || displayMessage.superChat?.color || '#ff0000'
                        }}
                    >
                        {displayMessage.authorPhoto && settings.showAvatars !== false && (
                            <img src={proxyImageUrl(displayMessage.authorPhoto)} alt={displayMessage.author} className="overlay__superchat-avatar" />
                        )}
                        <div className="overlay__superchat-info">
                            <span className="overlay__superchat-name">{displayMessage.author}</span>
                            <span className="overlay__superchat-amount">{displayMessage.superChat?.amount}</span>
                        </div>
                    </div>
                    {displayMessage.runs?.length ? (
                        <p className="overlay__superchat-text" style={{ fontSize: `${settings.superChatFontSize || 14}px`, color: settings.superChatOverlayTxColor || settings.overlayTxColor }}>
                            {displayMessage.runs.map((r, i) =>
                                r.emojiUrl ? (
                                    <img key={i} src={proxyImageUrl(r.emojiUrl)} alt={r.emojiAlt || 'emoji'} className="overlay__emoji" />
                                ) : (
                                    <span key={i}>{r.text}</span>
                                )
                            )}
                        </p>
                    ) : displayMessage.text && displayMessage.text !== 'N/A' && (
                        <p className="overlay__superchat-text" style={{ fontSize: `${settings.superChatFontSize || 14}px`, color: settings.superChatOverlayTxColor || settings.overlayTxColor }}>{displayMessage.text}</p>
                    )}
                    {displayMessage.superChat?.stickerUrl && (
                        <div className="overlay__sticker">
                            <img src={proxyImageUrl(displayMessage.superChat.stickerUrl)} alt="Super Sticker" />
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
