'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ChatMessage } from '@shared/chat';
import { DEFAULT_APP_SETTINGS, type AppSettings } from '@shared/settings';
import { proxyImageUrl } from '../../lib/imageProxy';
import {
  loadStoredSettings,
  normalizeSettings,
  persistSettings,
  settingsAreEqual,
  subscribeToSettingsChanges,
} from '../../lib/appSettings';
import { applyAppTheme } from '../../lib/appTheme';
import { BACKEND_URL } from '../../lib/runtime';
import { OverlayCard } from '../components/OverlayCard';

type SelectionPayload = {
  message: (ChatMessage & { timestamp?: string | number | Date }) | null;
};

export default function OverlayPage() {
  const [message, setMessage] = useState<(ChatMessage & { timestamp?: string | number | Date }) | null>(null);
  const [connected, setConnected] = useState(false);
  const connectionRef = useRef<EventSource | null>(null);

  // Expanded Settings State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

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
        const merged = normalizeSettings({ ...settingsRef.current, ...newSettings });
        persistSettings(merged);
        settingsRef.current = merged;
        setSettings((current) => (settingsAreEqual(current, merged) ? current : merged));
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
    };
  }, []); // Empty dependency array - only connect once

  useEffect(() => {
    const initial = loadStoredSettings();
    settingsRef.current = initial;
    setSettings(initial);

    return subscribeToSettingsChanges((incoming) => {
      settingsRef.current = incoming;
      setSettings((current) => (settingsAreEqual(current, incoming) ? current : incoming));
    });
  }, []);

  useEffect(() => {
    applyAppTheme(settings);
  }, [settings]);

  // Helper to determine message type
  const isMemberEvent = message && (
    message.membershipGift ||
    message.membershipGiftPurchase
  );

  const isMemberMsg = message && (
    isMemberEvent ||
    message.isMember ||
    message.membershipLevel
  );

  const isSuperChatMsg = message && (
    message.superChat ||
    (message as any).superSticker
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
      <style>{'html, body { background: transparent !important; overflow: hidden; }'}</style>
      {settings.customCss && <style>{settings.customCss}</style>}
      {isMemberMsg && settings.membersCss && <style>{settings.membersCss}</style>}
      {isSuperChatMsg && settings.superChatCss && <style>{settings.superChatCss}</style>}

      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{ ...getPositionStyle() }}
          >
            <OverlayCard message={message} settings={settings} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
