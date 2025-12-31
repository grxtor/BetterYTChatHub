'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type { ChatMessage, Poll } from '@shared/chat';
import { useTimezone } from '../../lib/TimezoneContext';
import { formatTimestamp } from '../../lib/timezone';
import { proxyImageUrl } from '../../lib/imageProxy';
import { useRouter } from 'next/navigation';
import TopBar from '../components/TopBar';
// import SettingsView from '../components/SettingsView'; // Unused now

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4100';
const OVERLAY_PORT = 4100;
const POLL_INTERVAL = 2500;

let globalSSEConnection: EventSource | null = null;
let globalConnectionListeners: Set<(payload: any) => void> = new Set();

/**
 * CUSTOM HOOKS
 */

function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/chat/messages`);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const data = await response.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [refresh]);

  return { messages, refresh, error };
}

function useOverlaySelection() {
  const [selection, setSelection] = useState<ChatMessage | null>(null);
  const listenerRef = useRef<((payload: any) => void) | null>(null);

  useEffect(() => {
    if (!globalSSEConnection) {
      globalSSEConnection = new EventSource(`${BACKEND_URL}/overlay/stream`);
      globalSSEConnection.addEventListener('selection', ((event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          globalConnectionListeners.forEach(listener => listener(payload));
        } catch (error) {
          console.error(error);
        }
      }) as EventListener);
    }

    const myListener = (payload: any) => {
      setSelection(payload.message);
    };

    listenerRef.current = myListener;
    globalConnectionListeners.add(myListener);

    return () => {
      if (listenerRef.current) {
        globalConnectionListeners.delete(listenerRef.current);
      }
    };
  }, []);

  return { selection };
}

function useConnection() {
  const [connected, setConnected] = useState(false);
  const [liveId, setLiveId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      const data = await response.json();
      setConnected(data.connected);
      setLiveId(data.liveId);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const connect = useCallback(async (liveId: string) => {
    setConnecting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/chat/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveId })
      });
      if (!response.ok) throw new Error('Failed');
      await checkStatus();
    } catch (error) {
      alert('Failed to connect');
    } finally {
      setConnecting(false);
    }
  }, [checkStatus]);

  const disconnect = useCallback(async () => {
    try {
      await fetch(`${BACKEND_URL}/chat/disconnect`, { method: 'POST' });
      await checkStatus();
    } catch (error) {
      console.error(error);
    }
  }, [checkStatus]);

  return { connected, liveId, connect, disconnect, connecting };
}

/**
 * SVG ICONS
 */
const Icons = {
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  Pin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  ),
  Link: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  Disconnect: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
};

/**
 * COMPONENTS
 */

function MessageRow({
  message,
  isSelected,
  onSelect,
  onCopy,
  onFilterUser,
  onContextMenu
}: {
  message: ChatMessage;
  isSelected: boolean;
  onSelect: () => void;
  onCopy: (text: string) => void;
  onFilterUser: (author: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const { timezone } = useTimezone();

  return (
    <div
      className={`message-row ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      onContextMenu={onContextMenu}
    >
      {message.authorPhoto && (
        <img
          src={proxyImageUrl(message.authorPhoto)}
          alt=""
          className="message-row__avatar"
        />
      )}
      <div className="message-row__content">
        <div className="message-row__header">
          <span
            className="message-row__author clickable"
            onClick={(e) => { e.stopPropagation(); onFilterUser(message.author); }}
            title={`Filter by ${message.author}`}
          >
            {message.author}
          </span>
          <span className="message-row__time">{formatTimestamp(message.publishedAt, timezone)}</span>
          {message.superChat && (
            <span className="message-row__badge superchat">SC</span>
          )}
          {(message.membershipGift || message.membershipGiftPurchase) && (
            <span className="message-row__badge member">NEW</span>
          )}
        </div>
        <p className="message-row__text">{message.text}</p>
      </div>

      <div className="message-row__actions">
        <button
          className="action-btn"
          onClick={(e) => { e.stopPropagation(); onCopy(message.text); }}
          title="Copy"
        >
          <Icons.Copy />
        </button>
      </div>
    </div>
  );
}

function SuperChatItem({
  message,
  isSelected,
  onSelect
}: {
  message: ChatMessage;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={`superchat-item ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="superchat-item__header">
        {message.authorPhoto && (
          <img src={proxyImageUrl(message.authorPhoto)} alt="" className="superchat-item__avatar" />
        )}
        <div className="superchat-item__info">
          <div className="superchat-item__author">{message.author}</div>
        </div>
        {message.superChat && (
          <div className="superchat-item__amount">{message.superChat.amount}</div>
        )}
      </div>
      {message.text && <p className="superchat-item__text">{message.text}</p>}
    </div>
  );
}

function MemberItem({
  message,
  isSelected,
  onSelect
}: {
  message: ChatMessage;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={`member-item ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
      {message.authorPhoto && (
        <img src={proxyImageUrl(message.authorPhoto)} alt="" className="member-item__avatar" />
      )}
      <div className="member-item__info">
        <div className="member-item__name">{message.author}</div>
        <div className="member-item__label">New Member</div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  small = false
}: {
  icon: string;
  title: string;
  description: string;
  small?: boolean;
}) {
  return (
    <div className={`empty-state ${small ? 'empty-state--sm' : ''}`}>
      <div className="empty-state__icon">{icon}</div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__desc">{description}</p>
    </div>
  );
}

function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="toast" onClick={onClose}>
      {message}
    </div>
  );
}

/**
 * MAIN COMPONENT
 */

export default function DashboardPage() {
  const router = useRouter();
  const { messages } = useChatMessages();
  const { selection } = useOverlaySelection();
  const { connected, liveId, connect, disconnect, connecting } = useConnection();

  const [activeView, setActiveView] = useState<'chat' | 'settings'>('chat');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [streamInput, setStreamInput] = useState('');
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true); // Auto-scroll enabled by default
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: ChatMessage;
  } | null>(null);

  const chatListRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const isAutoScrolling = useRef(false);

  const [settings, setSettings] = useState({
    autoSelectSuperChats: true,
    autoSelectMembers: true,
    overlayScale: 100,
    overlayTheme: 'dark' as const,
    serverPort: 4100,
    overlayPosition: 'bottom-right' as const,
    showTimestamps: true,
    showAvatars: true,
    messageFontSize: 16,
    maxMessages: 50,
    superChatPopup: true,
    superChatDuration: 10,
    customCss: '',
    superChatCss: '',
    membersCss: '',
    messageMaxWidth: 400,
    includeSuperChatsInOverlay: true,
    includeMembersInOverlay: true,
    membersDuration: 5,
    overlayTxColor: '#ffffff',
    overlayBgColor: 'rgba(20, 20, 22, 0.95)',
    // Member Overrides
    membersOverlayScale: 1,
    membersFontSize: 14,
    membersOverlayBgColor: '',
    membersOverlayTxColor: '',
    // Super Chat Overrides
    superChatOverlayScale: 1,
    superChatFontSize: 14,
    superChatOverlayBgColor: '',
    superChatOverlayTxColor: '',
    membersOverlayPosition: 'bottom-right' as const,
    superChatOverlayPosition: 'bottom-right' as const,
    superChatHeaderColor: '#E62117',
    membersGradientColor1: '#1a1a1e',
    membersGradientColor2: '#1a1a1e',
    useSpecialMemberStyling: true,
  });

  const hasInitializedRef = useRef(false);
  const prevSuperChatCountRef = useRef(0);
  const prevMemberCountRef = useRef(0);

  // Persistence & Sync
  useEffect(() => {
    // 1. Initial Load from localStorage
    const saved = localStorage.getItem('better_yt_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    }

    // 2. Listen for SSE settings updates (from other windows/processes)
    if (!globalSSEConnection) {
      // useChatMessages hook might have initialized it, but let's be safe
      // In the current implementation, useOverlaySelection initializes it.
    }

    const onSettingsUpdate = (payload: any) => {
      if (payload.settings) {
        setSettings(prev => ({ ...prev, ...payload.settings }));
      } else if (typeof payload === 'object' && !payload.message) {
        // Some events might just be the settings object itself
        setSettings(prev => ({ ...prev, ...payload }));
      }
    };

    // The globalConnectionListeners handles 'selection' events.
    // We need to either add 'settings' event listener to globalSSEConnection
    // OR ensure the 'settings' data comes through a generic listener.
    // Let's check how the settings are emitted from backend.

    const settingsListener = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setSettings(prev => ({ ...prev, ...data }));
      } catch (e) { }
    };

    if (globalSSEConnection) {
      globalSSEConnection.addEventListener('settings', settingsListener as EventListener);
    }

    return () => {
      if (globalSSEConnection) {
        globalSSEConnection.removeEventListener('settings', settingsListener as EventListener);
      }
    };
  }, []);

  // Save on changes (Debounced or conditional to prevent overwrite)
  // Actually, we skip saving here if we want /settings to be the source of truth,
  // but Dashboard also has some settings like auto-scroll (not yet in global settings).
  // For now, let's keep it but ensure it doesn't run before the first load.
  const isLoadedRef = useRef(false);
  useEffect(() => {
    if (!isLoadedRef.current) {
      isLoadedRef.current = true;
      return;
    }
    localStorage.setItem('better_yt_settings', JSON.stringify(settings));
  }, [settings]);

  const handleConnect = () => {
    if (streamInput.trim()) {
      // Extract video ID from URL if full URL is provided
      let videoId = streamInput.trim();
      const urlMatch = streamInput.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/);
      if (urlMatch) {
        videoId = urlMatch[1];
      }
      connect(videoId);
      setStreamInput('');
    }
  };

  const handleSelect = useCallback(
    async (message: ChatMessage) => {
      try {
        if (selection?.id === message.id) {
          await fetch(`${BACKEND_URL}/overlay/selection`, { method: 'DELETE' });
        } else {
          await fetch(`${BACKEND_URL}/overlay/selection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: message.id })
          });
        }
      } catch (error) {
        console.error('Failed to select message', error);
      }
    },
    [selection]
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage('Copied!');
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleClearSelection = useCallback(async () => {
    try {
      await fetch(`${BACKEND_URL}/overlay/selection`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to clear selection', error);
    }
  }, []);

  const superChats = useMemo(() => messages.filter(m => m.superChat), [messages]);
  const newMembers = useMemo(() => messages.filter(m => m.membershipGift || m.membershipGiftPurchase), [messages]);
  const regularMessages = useMemo(() => messages.filter(m => !m.superChat && !m.membershipGift && !m.membershipGiftPurchase), [messages]);

  // Apply user filter
  const filteredMessages = useMemo(() => {
    if (!userFilter) return regularMessages;
    return regularMessages.filter(m => m.author === userFilter);
  }, [regularMessages, userFilter]);

  // Auto-selection
  useEffect(() => {
    if (!hasInitializedRef.current && messages.length > 0) {
      hasInitializedRef.current = true;
      prevSuperChatCountRef.current = superChats.length;
      prevMemberCountRef.current = newMembers.length;
      return;
    }

    if (settings.autoSelectSuperChats && superChats.length > prevSuperChatCountRef.current) {
      handleSelect(superChats[superChats.length - 1]);
    }
    if (settings.autoSelectMembers && newMembers.length > prevMemberCountRef.current) {
      handleSelect(newMembers[newMembers.length - 1]);
    }

    prevSuperChatCountRef.current = superChats.length;
    prevMemberCountRef.current = newMembers.length;
  }, [superChats.length, newMembers.length, settings.autoSelectSuperChats, settings.autoSelectMembers, handleSelect, messages.length]);

  // Initial scroll to bottom when messages first load
  useEffect(() => {
    if (filteredMessages.length > 0 && chatListRef.current && prevMessageCountRef.current === 0) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
      prevMessageCountRef.current = filteredMessages.length;
    }
  }, [filteredMessages.length]);

  // Auto-scroll: When autoScroll is ON, scroll to bottom on every new message
  useEffect(() => {
    const count = filteredMessages.length;
    if (count > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
      // New messages arrived
      if (autoScroll && chatListRef.current) {
        isAutoScrolling.current = true;
        requestAnimationFrame(() => {
          if (chatListRef.current) {
            chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
            setTimeout(() => { isAutoScrolling.current = false; }, 100);
          }
        });
      }
    }
    prevMessageCountRef.current = count;
  }, [filteredMessages.length, autoScroll]);

  // Track user scroll - if user scrolls up, disable auto-scroll
  const lastScrollTop = useRef(0);
  const handleScroll = useCallback(() => {
    if (!chatListRef.current || isAutoScrolling.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatListRef.current;

    // Check distance from bottom with higher tolerance (50px)
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    // Check if user scrolled UP manually AND is not sticking to bottom
    if (scrollTop < lastScrollTop.current - 5 && !isAtBottom) {
      // User scrolled up specifically to read old messages - disable auto-scroll
      setAutoScroll(false);
    }

    // If user scrolls to very bottom (or close to it), re-enable auto-scroll
    if (isAtBottom) {
      setAutoScroll(true);
    }

    lastScrollTop.current = scrollTop;
  }, []);

  // Sync button clicked - scroll to bottom and re-enable auto-scroll
  const scrollToBottom = useCallback(() => {
    if (chatListRef.current) {
      isAutoScrolling.current = true;
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
      setAutoScroll(true);
      setTimeout(() => { isAutoScrolling.current = false; }, 100);
    }
  }, []);

  const handleSettingsUpdate = useCallback((newSettings: typeof settings) => {
    setSettings(newSettings);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, message: ChatMessage) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, message });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    if (contextMenu) {
      const handleClick = () => closeContextMenu();
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu, closeContextMenu]);

  const overlayUrl = `http://localhost:3000/overlay`;

  return (
    <div className="app-container">
      {/* TOP BAR */}
      {/* TOP BAR */}
      <TopBar
        connected={connected}
        connecting={connecting}
        liveId={liveId}
        streamInput={streamInput}
        onStreamInputChange={setStreamInput}
        onConnect={handleConnect}
        onDisconnect={disconnect}
        stats={{
          messages: regularMessages.length,
          superChats: superChats.length,
          members: newMembers.length
        }}
      />

      {/* MAIN LAYOUT */}
      {/* MAIN LAYOUT */}
      <>
        <div className="main-layout">
          <div className="main-content">
            {/* CHAT PANEL */}
            <div className="chat-panel">
              <div className="panel-header">
                <h2 className="panel-header__title">Chat Stream</h2>
                <span className="panel-header__count">{filteredMessages.length}</span>
                {userFilter && (
                  <span className="user-filter-badge">
                    <span>@{userFilter}</span>
                    <button onClick={() => setUserFilter(null)} title="Clear filter">✕</button>
                  </span>
                )}
                <div className="panel-header__spacer" />
                {selection && (
                  <button className="panel-header__btn" onClick={handleClearSelection}>
                    Clear Selection
                  </button>
                )}
              </div>

              {filteredMessages.length === 0 ? (
                <EmptyState
                  icon="💬"
                  title={userFilter ? `No messages from @${userFilter}` : "No messages yet"}
                  description={userFilter
                    ? "This user hasn't sent any messages yet. Click their name again or clear the filter."
                    : connected
                      ? "Waiting for chat messages from the live stream..."
                      : "Enter a YouTube Live URL or Video ID above to connect."}
                />
              ) : (
                <div className="chat-list-container">
                  <div
                    className="chat-list"
                    ref={chatListRef}
                    onScroll={handleScroll}
                  >
                    {filteredMessages.map(msg => (
                      <MessageRow
                        key={msg.id}
                        message={msg}
                        isSelected={selection?.id === msg.id}
                        onSelect={() => handleSelect(msg)}
                        onCopy={handleCopy}
                        onFilterUser={setUserFilter}
                        onContextMenu={(e) => handleContextMenu(e, msg)}
                      />
                    ))}
                  </div>
                  {!autoScroll && (
                    <button className="sync-button" onClick={scrollToBottom}>
                      ↓ Scroll to Bottom
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* EVENTS PANEL */}
            <div className="events-panel">
              {/* Super Chats Section */}
              <div className="event-section">
                <div className="section-header">
                  <span className="section-header__title">Super Chats</span>
                  {superChats.length > 0 && (
                    <span className="section-header__badge">{superChats.length}</span>
                  )}
                </div>
                <div className="section-content">
                  {superChats.length === 0 ? (
                    <EmptyState
                      icon="💎"
                      title="No super chats yet"
                      description="When someone sends a super chat, it will appear here."
                      small
                    />
                  ) : (
                    superChats.map(msg => (
                      <SuperChatItem
                        key={msg.id}
                        message={msg}
                        isSelected={selection?.id === msg.id}
                        onSelect={() => handleSelect(msg)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* New Members Section */}
              <div className="event-section">
                <div className="section-header">
                  <span className="section-header__title">New Members</span>
                  {newMembers.length > 0 && (
                    <span className="section-header__badge">{newMembers.length}</span>
                  )}
                </div>
                <div className="section-content">
                  {newMembers.length === 0 ? (
                    <EmptyState
                      icon="⭐"
                      title="No new members yet"
                      description="New channel members will appear here when they join."
                      small
                    />
                  ) : (
                    newMembers.map(msg => (
                      <MemberItem
                        key={msg.id}
                        message={msg}
                        isSelected={selection?.id === msg.id}
                        onSelect={() => handleSelect(msg)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="context-menu__item"
            onClick={() => { setUserFilter(contextMenu.message.author); closeContextMenu(); }}
          >
            <span>👤</span>
            <span>Show {contextMenu.message.author}'s messages</span>
          </button>
          <button
            className="context-menu__item"
            onClick={() => { handleSelect(contextMenu.message); closeContextMenu(); }}
          >
            <span>📌</span>
            <span>Select for overlay</span>
          </button>
          <div className="context-menu__divider" />
          <button
            className="context-menu__item"
            onClick={() => { handleCopy(contextMenu.message.text); closeContextMenu(); }}
          >
            <span>📋</span>
            <span>Copy message</span>
          </button>
          <button
            className="context-menu__item"
            onClick={() => { handleCopy(contextMenu.message.author); closeContextMenu(); }}
          >
            <span>@</span>
            <span>Copy username</span>
          </button>
        </div>
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
