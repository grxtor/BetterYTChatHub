'use client';

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import type { ChatMessage } from '@shared/chat';
import { DEFAULT_APP_SETTINGS, type AppSettings } from '@shared/settings';
import { useTimezone } from '../../lib/TimezoneContext';
import { formatTimestamp } from '../../lib/timezone';
import { proxyImageUrl } from '../../lib/imageProxy';
import {
  loadStoredSettings,
  normalizeSettings,
  settingsAreEqual,
  subscribeToSettingsChanges,
} from '../../lib/appSettings';
import { applyAppTheme } from '../../lib/appTheme';
import { BACKEND_URL } from '../../lib/runtime';
import { loadSavedChannels, addSavedChannel, removeSavedChannel } from '../../lib/savedChannels';
import { type SavedChannel } from '@shared/settings';
import TopBar from '../components/TopBar';
import { DashboardIcons } from '../components/Icons';
import { DraggableCard } from '../components/DraggableCard';

const STREAM_MESSAGE_LIMIT = 200;
const VIRTUAL_LIST_OVERSCAN = 6;

/**
 * CUSTOM HOOKS
 */

function appendStreamMessage(messages: ChatMessage[], message: ChatMessage) {
  if (messages.length < STREAM_MESSAGE_LIMIT) {
    return [...messages, message];
  }

  const next = messages.slice(1);
  next.push(message);
  return next;
}

function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({ superChats: 0, members: 0, messages: 0 });
  const [backendAvailable, setBackendAvailable] = useState(false);
  const retryCountRef = useRef(0);
  const sourceRef = useRef<EventSource | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    const source = new EventSource(`${BACKEND_URL}/chat/stream`);
    sourceRef.current = source;
    source.onopen = () => {
      retryCountRef.current = 0;
      setBackendAvailable(true);
    };

    source.addEventListener('backlog', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        const msgs: ChatMessage[] = Array.isArray(data.messages) ? data.messages : [];
        setMessages(msgs.slice(-STREAM_MESSAGE_LIMIT));
        
        let sc = 0, mem = 0;
        msgs.forEach(m => {
          if (m.superChat) sc++;
          if (m.membershipGift || m.membershipGiftPurchase || m.isMember || m.membershipLevel) mem++;
        });
        setMetrics({ superChats: sc, members: mem, messages: msgs.length });
      } catch { /* ignore parse errors */ }
    });

    source.addEventListener('message', (e: MessageEvent) => {
      try {
        const msg: ChatMessage = JSON.parse(e.data);
        setMessages((prev) => appendStreamMessage(prev, msg));
        setMetrics(prev => {
          const isSc = !!msg.superChat;
          const isMem = !!(msg.membershipGift || msg.membershipGiftPurchase || msg.isMember || msg.membershipLevel);
          return {
            superChats: prev.superChats + (isSc ? 1 : 0),
            members: prev.members + (isMem ? 1 : 0),
            messages: prev.messages + 1
          };
        });
      } catch { /* ignore parse errors */ }
    });

    source.addEventListener('heartbeat', () => {
      retryCountRef.current = 0;
    });

    source.onerror = () => {
      setBackendAvailable(false);
      source.close();
      sourceRef.current = null;
      const count = retryCountRef.current++;
      const delay = Math.min(1000 * Math.pow(2, count), 30000);
      retryTimerRef.current = setTimeout(connect, delay);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      sourceRef.current?.close();
      sourceRef.current = null;
      setBackendAvailable(false);
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [connect]);

  return { messages, backendAvailable, metrics, error: null };
}

function useOverlayStream(enabled: boolean) {
  const [selection, setSelection] = useState<ChatMessage | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<AppSettings | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) {
      sourceRef.current?.close();
      sourceRef.current = null;
      setSelection(null);
      setRemoteSettings(null);
      return;
    }

    const source = new EventSource(`${BACKEND_URL}/overlay/stream`);
    sourceRef.current = source;

    source.addEventListener('selection', (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        setSelection(payload.message ?? null);
      } catch (error) {
        console.error(error);
      }
    });

    source.addEventListener('settings', (event: MessageEvent) => {
      try {
        setRemoteSettings(normalizeSettings(JSON.parse(event.data)));
      } catch (error) {
        console.error('Failed to parse settings event', error);
      }
    });

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [enabled]);

  return { selection, remoteSettings };
}

function useConnection(backendAvailable: boolean) {
  const [connected, setConnected] = useState(false);
  const [liveId, setLiveId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      if (!response.ok) {
        throw new Error(`Health request failed: ${response.status}`);
      }
      const data = await response.json();
      setConnected(Boolean(data.connected));
      setLiveId(data.liveId);
    } catch {
      setConnected(false);
      setLiveId(null);
    }
  }, []);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (!backendAvailable) {
      setConnected(false);
      setLiveId(null);
      return;
    }

    void checkStatus();
  }, [backendAvailable, checkStatus]);

  const connect = useCallback(async (liveId: string) => {
    if (!backendAvailable) {
      alert('Backend is not running. Start the backend and try again.');
      return;
    }

    setConnecting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/chat/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveId })
      });
      if (!response.ok) throw new Error('Failed');
      await checkStatus();
    } catch {
      alert('Failed to connect');
    } finally {
      setConnecting(false);
    }
  }, [backendAvailable, checkStatus]);

  const disconnect = useCallback(async () => {
    try {
      await fetch(`${BACKEND_URL}/chat/disconnect`, { method: 'POST' });
      await checkStatus();
    } catch {
      setConnected(false);
      setLiveId(null);
    }
  }, [checkStatus]);

  return { backendAvailable, connected, liveId, connect, disconnect, connecting };
}

function getEstimatedRowHeight(density: AppSettings['dashboardDensity']) {
  switch (density) {
    case 'compact':
      return 88;
    case 'immersive':
      return 116;
    case 'comfortable':
    default:
      return 100;
  }
}



import { MessageRow, getDensityStyles, type DensityStyles } from './components/MessageRow';


function getMessageSearchValue(message: ChatMessage) {
  const runText = message.runs?.map((run) => run.text || '').join(' ') ?? '';
  return `${message.author} ${message.text ?? ''} ${runText}`.trim().toLowerCase();
}

/**
 * COMPONENTS
 */

import { SuperChatItem, MemberItem } from './components/DashboardItems';
import { SelectionPreviewCard } from './components/SelectionPreviewCard';
import { DashboardStats, type DashboardMetrics } from './components/DashboardStats';
import { EmptyStateCard } from './components/EmptyStateCard';

function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-6 right-6 z-50 cursor-pointer rounded-2xl border border-app-accent/25 bg-app-accent/15 px-4 py-3 text-sm font-medium text-white shadow-panel-lg backdrop-blur"
      onClick={onClose}
    >
      {message}
    </div>
  );
}

/**
 * MAIN COMPONENT
 */

export default function DashboardPage() {
  const router = useRouter();
  const { messages, backendAvailable, metrics } = useChatStream();
  const { connected, liveId, connect, disconnect, connecting } = useConnection(backendAvailable);
  const { selection, remoteSettings } = useOverlayStream(backendAvailable);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [streamInput, setStreamInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true); // Auto-scroll enabled by default
  const [savedChannels, setSavedChannels] = useState<SavedChannel[]>([]);

  // Load saved channels only on client to avoid hydration mismatch
  useEffect(() => {
    setSavedChannels(loadSavedChannels());
  }, []);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: ChatMessage;
  } | null>(null);

  const chatListRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const isAutoScrolling = useRef(false);
  const [chatViewportHeight, setChatViewportHeight] = useState(0);
  const [chatScrollTop, setChatScrollTop] = useState(0);

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const hasInitializedRef = useRef(false);
  const prevSuperChatCountRef = useRef(0);
  const prevMemberCountRef = useRef(0);

  useEffect(() => {
    const initial = loadStoredSettings();
    setSettings(initial);

    const unsubscribe = subscribeToSettingsChanges((incoming) => {
      setSettings((current) =>
        settingsAreEqual(current, incoming) ? current : incoming,
      );
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!remoteSettings) {
      return;
    }

    setSettings((current) => {
      const merged = normalizeSettings({ ...current, ...remoteSettings });
      return settingsAreEqual(current, merged) ? current : merged;
    });
  }, [remoteSettings]);

  useEffect(() => {
    applyAppTheme(settings);
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

  const handleSaveChannel = (label: string, videoId: string) => {
    setSavedChannels(addSavedChannel({ label, videoId }));
  };

  const handleRemoveChannel = (videoId: string) => {
    setSavedChannels(removeSavedChannel(videoId));
  };

  const handleSelectChannel = (videoId: string) => {
    connect(videoId);
  };

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    router.push('/');
  }, [disconnect, router]);

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
  const densityStyles = useMemo(
    () => getDensityStyles(settings.dashboardDensity),
    [settings.dashboardDensity],
  );
  const estimatedRowHeight = useMemo(
    () => getEstimatedRowHeight(settings.dashboardDensity),
    [settings.dashboardDensity],
  );

  // Apply user and query filter
  const filteredMessages = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    return regularMessages.filter((message) => {
      if (userFilter && message.author !== userFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return getMessageSearchValue(message).includes(query);
    });
  }, [deferredSearchQuery, regularMessages, userFilter]);


  const dashboardShellStyle = useMemo(
    () =>
      ({
        '--dashboard-rail-width': `${settings.dashboardPanelWidth}px`,
      }) as CSSProperties,
    [settings.dashboardPanelWidth],
  );

  const virtualizedFeed = useMemo(() => {
    const viewportHeight = Math.max(chatViewportHeight, estimatedRowHeight);
    const startIndex = Math.max(
      0,
      Math.floor(chatScrollTop / estimatedRowHeight) - VIRTUAL_LIST_OVERSCAN,
    );
    const endIndex = Math.min(
      filteredMessages.length,
      Math.ceil((chatScrollTop + viewportHeight) / estimatedRowHeight) + VIRTUAL_LIST_OVERSCAN,
    );
    const visibleMessages = filteredMessages.slice(startIndex, endIndex);
    const topSpacerHeight = startIndex * estimatedRowHeight;
    const bottomSpacerHeight = Math.max(
      0,
      (filteredMessages.length - endIndex) * estimatedRowHeight,
    );

    return {
      visibleMessages,
      topSpacerHeight,
      bottomSpacerHeight,
    };
  }, [
    chatScrollTop,
    chatViewportHeight,
    estimatedRowHeight,
    filteredMessages,
  ]);

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
  }, [messages.length, newMembers, settings.autoSelectMembers, settings.autoSelectSuperChats, superChats, handleSelect]);

  // Initial scroll to bottom when messages first load
  useEffect(() => {
    if (filteredMessages.length > 0 && chatListRef.current && prevMessageCountRef.current === 0) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
      setChatScrollTop(chatListRef.current.scrollTop);
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
            setChatScrollTop(chatListRef.current.scrollTop);
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
    setChatScrollTop(scrollTop);

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
      setChatScrollTop(chatListRef.current.scrollTop);
      setAutoScroll(true);
      setTimeout(() => { isAutoScrolling.current = false; }, 100);
    }
  }, []);

  const handleContextMenu = useCallback((e: MouseEvent, message: ChatMessage) => {
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

  useEffect(() => {
    const node = chatListRef.current;
    if (!node) {
      return;
    }

    const updateViewport = () => {
      setChatViewportHeight(node.clientHeight);
      setChatScrollTop(node.scrollTop);
    };

    updateViewport();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateViewport);
      return () => window.removeEventListener('resize', updateViewport);
    }

    const observer = new ResizeObserver(() => updateViewport());
    observer.observe(node);

    return () => observer.disconnect();
  }, [backendAvailable, filteredMessages.length]);

  return (
    <div className="app-container bg-app-bg">
      <TopBar
        connected={connected}
        connecting={connecting}
        liveId={liveId}
        streamInput={streamInput}
        onStreamInputChange={setStreamInput}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        savedChannels={savedChannels}
        onSaveChannel={handleSaveChannel}
        onRemoveChannel={handleRemoveChannel}
        onSelectChannel={handleSelectChannel}
      />

      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{ background: 'var(--bg)' }}
      >
        <DashboardStats metrics={metrics} />

        <div className="flex min-h-0 flex-1 flex-col px-4 py-4 xl:px-6">
          <div
            className={`mx-auto flex h-full min-h-0 w-full flex-col gap-4 ${
              settings.workspaceFrame === 'framed' ? 'max-w-[1600px]' : 'max-w-none'
            }`}
          >
            <div
              className="flex-1 grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_var(--dashboard-rail-width)]"
              style={dashboardShellStyle}
            >
              <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/6 bg-surface-2">
                <div className="border-b border-white/6 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${autoScroll ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <h2 className="text-sm font-semibold text-app-text">Live Chat</h2>
                    </div>
                    <span className="text-xs text-app-text-subtle">{filteredMessages.length}</span>
                    {userFilter ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-app-accent/10 px-2 py-0.5 text-[11px] text-app-accent">
                        @{userFilter}
                        <button type="button" className="opacity-60 hover:opacity-100" onClick={() => setUserFilter(null)}>✕</button>
                      </span>
                    ) : null}
                    <div className="flex-1" />
                    {selection ? (
                      <span className="flex items-center gap-1 rounded-full border border-app-accent/20 bg-app-accent/8 px-2 py-0.5 text-[11px] text-app-accent">
                        <span className="h-1 w-1 rounded-full bg-app-accent" />
                        Pinned
                      </span>
                    ) : null}
                    {selection && !settings.showSelectionPreview ? (
                      <button
                        type="button"
                        className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-app-text-muted transition hover:bg-white/10 hover:text-app-text"
                        onClick={handleClearSelection}
                      >
                        Kaldır
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-col gap-2 xl:flex-row xl:items-center">
                    <label className="relative flex-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-app-text-subtle">
                        ⌕
                      </span>
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search author, text, or emoji alt text"
                        className="h-9 w-full rounded-md border border-white/8 bg-surface-3 pl-8 pr-3 text-sm text-app-text outline-none transition focus:border-app-accent/40 focus:ring-1 focus:ring-app-accent/20"
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {userFilter ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-app-accent/10 px-2 py-1 text-[11px] text-app-accent">
                          <span>@{userFilter}</span>
                          <button
                            type="button"
                            className="text-[10px] opacity-60 transition hover:opacity-100"
                            onClick={() => setUserFilter(null)}
                            title="Clear author filter"
                          >
                            ✕
                          </button>
                        </span>
                      ) : null}
                      {deferredSearchQuery ? (
                        <button
                          type="button"
                          className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-app-text-muted transition hover:bg-white/10"
                          onClick={() => setSearchQuery('')}
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {filteredMessages.length === 0 ? (
                  <EmptyStateCard
                    icon="💬"
                    title={
                      deferredSearchQuery
                        ? `No results for "${deferredSearchQuery}"`
                        : userFilter
                          ? `No messages from @${userFilter}`
                          : 'No messages yet'
                    }
                    description={
                      deferredSearchQuery
                        ? 'Try a different keyword or clear the search to restore the live feed.'
                        : userFilter
                          ? "This user hasn't sent anything in the current buffer. Clear the filter to return to the full queue."
                          : !backendAvailable
                            ? 'Backend is offline. Start the backend on port 4100, then reconnect.'
                            : connected
                              ? 'Waiting for chat messages from the live stream...'
                              : 'Enter a YouTube Live URL or Video ID above to connect.'
                    }
                  />
                ) : (
                  <div className="relative flex min-h-0 flex-1 flex-col">
                    <div
                      className="flex-1 overflow-y-auto px-3 py-2"
                      ref={chatListRef}
                      onScroll={handleScroll}
                    >
                      {virtualizedFeed.topSpacerHeight > 0 ? (
                        <div style={{ height: `${virtualizedFeed.topSpacerHeight}px` }} />
                      ) : null}
                      {virtualizedFeed.visibleMessages.map((msg) => (
                        <MessageRow
                          key={msg.id}
                          message={msg}
                          isSelected={selection?.id === msg.id}
                          onSelect={() => handleSelect(msg)}
                          onCopy={handleCopy}
                          onFilterUser={setUserFilter}
                          onContextMenu={(event) => handleContextMenu(event, msg)}
                          densityStyles={densityStyles}
                          showBadges={settings.showBadges}
                          showAvatars={settings.showAvatars}
                          showTimestamps={settings.showTimestamps}
                        />
                      ))}
                      {virtualizedFeed.bottomSpacerHeight > 0 ? (
                        <div style={{ height: `${virtualizedFeed.bottomSpacerHeight}px` }} />
                      ) : null}
                    </div>
                    {!autoScroll && (
                      <button
                        className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-md bg-surface-3 px-3 py-1.5 text-xs text-app-text-secondary shadow-md transition hover:bg-surface-4"
                        onClick={scrollToBottom}
                      >
                        <span>↓</span>
                        <span>Jump to live</span>
                      </button>
                    )}
                  </div>
                )}
              </section>

              <aside className="relative min-h-0 flex-1">
                {settings.showSelectionPreview && (
                  <DraggableCard id="selection-preview">
                    <SelectionPreviewCard
                      selection={selection}
                      settings={settings}
                      onClear={handleClearSelection}
                    />
                  </DraggableCard>
                )}

                <DraggableCard id="superchat-panel">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 border-b border-white/6 px-4 py-3 flex-shrink-0">
                      <h3 className="text-sm font-semibold text-app-text">Super Chats</h3>
                      <div className="flex-1" />
                      <span className="rounded-md bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                        {superChats.length}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
                      {superChats.length === 0 ? (
                        <EmptyStateCard
                          icon="💎"
                          title="No super chats yet"
                          description="When someone sends a super chat, it will appear here."
                          small
                        />
                      ) : (
                        superChats.map((msg) => (
                          <SuperChatItem
                            key={msg.id}
                            message={msg}
                            isSelected={selection?.id === msg.id}
                            onSelect={() => handleSelect(msg)}
                            showAvatars={settings.showAvatars}
                            showTimestamps={settings.showTimestamps}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </DraggableCard>

                <DraggableCard id="members-panel">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 border-b border-white/6 px-4 py-3 flex-shrink-0">
                      <h3 className="text-sm font-semibold text-app-text">New Members</h3>
                      <div className="flex-1" />
                      <span className="rounded-md bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                        {newMembers.length}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
                      {newMembers.length === 0 ? (
                        <EmptyStateCard
                          icon="⭐"
                          title="No new members yet"
                          description="New channel members will appear here when they join."
                          small
                        />
                      ) : (
                        newMembers.map((msg, idx) => (
                          <MemberItem
                            key={`${msg.id}-${idx}`}
                            message={msg}
                            isSelected={selection?.id === msg.id}
                            onSelect={() => handleSelect(msg)}
                            showAvatars={settings.showAvatars}
                            showTimestamps={settings.showTimestamps}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </DraggableCard>
              </aside>
            </div>
          </div>
        </div>
      </div>

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
            <span>Show {contextMenu.message.author}&apos;s messages</span>
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
