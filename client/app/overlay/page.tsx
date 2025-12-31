'use client';

import { useEffect, useState, useRef } from 'react';
import type { ChatMessage } from '@shared/chat';
import { proxyImageUrl } from '../../lib/imageProxy';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4100';

type SelectionPayload = {
  message: (ChatMessage & { timestamp?: string | number | Date }) | null;
};

export default function OverlayPage() {
  const [message, setMessage] = useState<(ChatMessage & { timestamp?: string | number | Date }) | null>(null);
  const [displayMessage, setDisplayMessage] = useState<(ChatMessage & { timestamp?: string | number | Date }) | null>(null);
  const [connected, setConnected] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [switching, setSwitching] = useState(false);
  const connectionRef = useRef<EventSource | null>(null);
  const switchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Expanded Settings State
  const [settings, setSettings] = useState<any>({
    overlayScale: 1,
    overlayPosition: 'bottom-left',
    overlayTheme: 'dark',
    messageFontSize: 14,
    showAvatars: true,
    showTimestamps: true,
    messageMaxWidth: 400,
    includeSuperChatsInOverlay: true,
    includeMembersInOverlay: true,
    membersDuration: 5,
    overlayTxColor: '#ffffff',
    overlayBgColor: 'rgba(20, 20, 22, 0.95)',
    customCss: '',
    // Member Overrides
    membersOverlayScale: 1,
    membersFontSize: 14,
    membersOverlayBgColor: '',
    membersOverlayTxColor: '',
    membersCss: '',
    // Super Chat Overrides
    superChatOverlayScale: 1,
    superChatFontSize: 14,
    superChatOverlayBgColor: '',
    superChatOverlayTxColor: '',
    superChatCss: '',
    superChatDuration: 10
  });

  const settingsRef = useRef(settings);
  settingsRef.current = settings;


  useEffect(() => {
    // Prevent multiple connections
    if (connectionRef.current) {
      console.log('[Overlay] SSE already connected');
      return;
    }

    console.log('[Overlay] Creating SSE connection');
    const source = new EventSource(`${BACKEND_URL}/overlay/stream`);
    connectionRef.current = source;

    const onSelection = (event: MessageEvent) => {
      try {
        const payload: SelectionPayload = JSON.parse(event.data);

        // Check if Super Chat needs to be filtered out
        if (payload.message?.superChat && settingsRef.current.includeSuperChatsInOverlay === false) {
          console.log('[Overlay] Skipping Super Chat (disabled in global settings)');
          return;
        }

        // Check if Member msg needs to be filtered out
        const isMemberMsg = payload.message?.membershipGift ||
          payload.message?.membershipGiftPurchase ||
          payload.message?.isMember ||
          payload.message?.membershipLevel;

        if (isMemberMsg && settingsRef.current.includeMembersInOverlay === false) {
          console.log('[Overlay] Skipping Member Message (disabled in global settings)');
          return;
        }

        setMessage(payload.message);
        setConnected(true);
      } catch (error) {
        console.error('overlay: failed to parse payload', error);
      }
    };

    const onSettingsUpdate = (event: MessageEvent) => {
      try {
        const newSettings = JSON.parse(event.data);
        console.log('[Overlay] Received settings update:', newSettings);
        setSettings((prev: any) => {
          const merged = { ...prev, ...newSettings };
          // Persist to localStorage for this browser context (e.g. OBS)
          localStorage.setItem('better_yt_settings', JSON.stringify(merged));
          return merged;
        });
        settingsRef.current = { ...settingsRef.current, ...newSettings };
      } catch (err) {
        console.error('Failed to parse settings event', err);
      }
    };

    source.addEventListener('selection', onSelection as EventListener);
    source.addEventListener('settings', onSettingsUpdate as EventListener);
    source.addEventListener('heartbeat', () => setConnected(true));
    source.onerror = () => setConnected(false);

    return () => {
      console.log('[Overlay] Closing SSE connection');
      source.removeEventListener('selection', onSelection as EventListener);
      source.removeEventListener('settings', onSettingsUpdate as EventListener);
      source.close();
      connectionRef.current = null;
      if (switchTimeoutRef.current) {
        clearTimeout(switchTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array - only connect once

  // Handle message transitions
  useEffect(() => {
    // Clear any pending timeout
    if (switchTimeoutRef.current) {
      clearTimeout(switchTimeoutRef.current);
      switchTimeoutRef.current = null;
    }

    if (message === null && displayMessage !== null) {
      // Deselecting - fade out
      setFadingOut(true);
      setSwitching(false);
      switchTimeoutRef.current = setTimeout(() => {
        setDisplayMessage(null);
        setFadingOut(false);
      }, 300);
    } else if (message !== null && displayMessage !== null && message.id !== displayMessage.id) {
      // Switching between messages - fade out then fade in
      setSwitching(true);
      setFadingOut(true);
      switchTimeoutRef.current = setTimeout(() => {
        setDisplayMessage(message);
        setFadingOut(false);
        setSwitching(false);
      }, 300);
    } else if (message !== null && displayMessage === null) {
      // First message - just show it
      setDisplayMessage(message);
      setFadingOut(false);
      setSwitching(false);
    }
  }, [message, displayMessage]);

  useEffect(() => {
    const saved = localStorage.getItem('better_yt_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings((prev: any) => ({
          ...prev,
          ...parsed
        }));
      } catch (e) {
      }
    }

    // Listen for changes from other tabs (Settings page)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'better_yt_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings((prev: any) => ({ ...prev, ...parsed }));
          settingsRef.current = { ...settingsRef.current, ...parsed };
        } catch (error) {
          console.error('Failed to parse settings update', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper to determine message type
  const isMemberEvent = displayMessage && (
    displayMessage.membershipGift ||
    displayMessage.membershipGiftPurchase
  );

  const isMemberMsg = displayMessage && (
    isMemberEvent ||
    displayMessage.isMember ||
    displayMessage.membershipLevel
  );

  const isSuperChatMsg = displayMessage && (
    displayMessage.superChat ||
    (displayMessage as any).superSticker
  );


  const getPositionStyle = () => {
    const scale = isMemberMsg
      ? (settings.membersOverlayScale || 1)
      : isSuperChatMsg
        ? (settings.superChatOverlayScale || 1)
        : (settings.overlayScale || 1);

    const position = isMemberMsg
      ? (settings.membersOverlayPosition || settings.overlayPosition)
      : isSuperChatMsg
        ? (settings.superChatOverlayPosition || settings.overlayPosition)
        : settings.overlayPosition;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      transform: `scale(${scale})`,
      transformOrigin: 'bottom left', // Default
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

  // Dynamic Styles Logic
  const useMemberStyling = isMemberMsg && (isMemberEvent || settings.useSpecialMemberStyling !== false);

  const dynamicBgColor = useMemberStyling
    ? ((settings.membersGradientColor1 && settings.membersGradientColor2) ? undefined : (settings.membersOverlayBgColor || settings.overlayBgColor))
    : isSuperChatMsg
      ? (settings.superChatOverlayBgColor || settings.overlayBgColor)
      : settings.overlayBgColor;

  const dynamicGradient = useMemberStyling && settings.membersGradientColor1 && settings.membersGradientColor2
    ? `linear-gradient(90deg, ${settings.membersGradientColor1}, ${settings.membersGradientColor2})`
    : undefined;

  const dynamicTxColor = useMemberStyling
    ? (settings.membersOverlayTxColor || settings.overlayTxColor)
    : isSuperChatMsg
      ? (settings.superChatOverlayTxColor || settings.overlayTxColor)
      : settings.overlayTxColor;

  const dynamicFontSize = useMemberStyling
    ? (settings.membersFontSize || settings.messageFontSize || 14)
    : isSuperChatMsg
      ? (settings.superChatFontSize || settings.messageFontSize || 14)
      : (settings.messageFontSize || 14);


  return (
    <main className="overlay">
      <style>{'html, body { background: transparent !important; overflow: hidden; }'}</style>
      {settings.customCss && <style>{settings.customCss}</style>}
      {isMemberMsg && settings.membersCss && <style>{settings.membersCss}</style>}
      {isSuperChatMsg && settings.superChatCss && <style>{settings.superChatCss}</style>}

      {displayMessage && (
        <div
          className={`overlay__card ${fadingOut ? 'overlay__card--fadeOut' : ''} ${isMemberMsg ? 'overlay__card--member-only' : ''} ${isSuperChatMsg ? 'overlay__card--superchat-only' : ''}`}
          style={{
            ...getPositionStyle(),
            maxWidth: `${settings.messageMaxWidth}px`,
            width: '100%',
            backgroundColor: dynamicBgColor,
            background: dynamicGradient,
            color: dynamicTxColor
          }}
        >
          {/* Header Area */}
          {displayMessage.superChat ? (
            <div className="overlay__superchat-header" style={{ backgroundColor: settings.superChatHeaderColor || displayMessage.superChat.color }}>
              {displayMessage.authorPhoto && settings.showAvatars !== false && (
                <img src={proxyImageUrl(displayMessage.authorPhoto)} alt="" className="overlay__superchat-avatar" />
              )}
              <div className="overlay__superchat-info">
                <span className="overlay__superchat-name">{displayMessage.author}</span>
                <span className="overlay__superchat-amount">{displayMessage.superChat.amount}</span>
              </div>
            </div>
          ) : isMemberEvent ? (
            <div className="overlay__membership-header">
              {displayMessage.authorPhoto && settings.showAvatars !== false && (
                <img src={proxyImageUrl(displayMessage.authorPhoto)} alt="" className="overlay__membership-avatar" />
              )}
              <div className="overlay__membership-info">
                <span className="overlay__membership-name">{displayMessage.author}</span>
                <span className="overlay__membership-level">
                  {displayMessage.membershipGiftPurchase && displayMessage.giftCount
                    ? `Sent ${displayMessage.giftCount} Gift Membership${displayMessage.giftCount > 1 ? 's' : ''}`
                    : displayMessage.membershipLevel || 'Member'}
                </span>
              </div>
            </div>
          ) : (
            // Normal Header (including regular messages from Members)
            <div className="overlay__header">
              {displayMessage.authorPhoto && settings.showAvatars !== false && (
                <img src={proxyImageUrl(displayMessage.authorPhoto)} alt="" className="overlay__avatar" />
              )}
              <div className="overlay__meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="overlay__author" style={{ color: dynamicTxColor }}>{displayMessage.author}</span>
                  {isMemberMsg && (
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>Member</span>
                  )}
                </div>
                {settings.showTimestamps && displayMessage.timestamp && (
                  <span className="overlay__time" style={{ color: dynamicTxColor, opacity: 0.7 }}>
                    {new Date(displayMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="overlay__content">
            {displayMessage.runs?.length ? (
              <p className={isSuperChatMsg ? "overlay__superchat-text" : isMemberMsg ? "overlay__membership-text" : "overlay__text"}
                style={{ fontSize: `${dynamicFontSize}px`, color: dynamicTxColor }}
              >
                {displayMessage.runs.map((r, i) =>
                  r.emojiUrl ? (
                    <img key={i} src={proxyImageUrl(r.emojiUrl)} alt={r.emojiAlt || 'emoji'} className="overlay__emoji" style={{ height: `${dynamicFontSize * 1.5}px` }} />
                  ) : (
                    <span key={i} style={{ color: dynamicTxColor }}>{r.text}</span>
                  )
                )}
              </p>
            ) : displayMessage.text && (
              <p className={isSuperChatMsg ? "overlay__superchat-text" : isMemberMsg ? "overlay__membership-text" : "overlay__text"}
                style={{ fontSize: `${dynamicFontSize}px`, color: dynamicTxColor }}
              >
                {displayMessage.text}
              </p>
            )}

            {isSuperChatMsg && displayMessage.superChat?.stickerUrl && (
              <div className="overlay__sticker">
                <img src={proxyImageUrl(displayMessage.superChat.stickerUrl)} alt="Sticker" />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
