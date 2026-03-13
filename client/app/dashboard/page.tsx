'use client';

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
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
import TopBar from '../components/TopBar';

const POLL_INTERVAL = 2500;

let globalSSEConnection: EventSource | null = null;
let globalConnectionListeners: Set<(payload: any) => void> = new Set();

/**
 * CUSTOM HOOKS
 */

function useChatMessages(enabled: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setMessages([]);
      setError(null);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/chat/messages`);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const data = await response.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
    if (!enabled) {
      return;
    }

    const timer = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [enabled, refresh]);

  return { messages, refresh, error };
}

function useOverlaySelection(enabled: boolean) {
  const [selection, setSelection] = useState<ChatMessage | null>(null);
  const listenerRef = useRef<((payload: any) => void) | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (globalSSEConnection) {
        globalSSEConnection.close();
        globalSSEConnection = null;
      }
      globalConnectionListeners.clear();
      setSelection(null);
      return;
    }

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
  }, [enabled]);

  return { selection };
}

function useConnection() {
  const [connected, setConnected] = useState(false);
  const [liveId, setLiveId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      if (!response.ok) {
        throw new Error(`Health request failed: ${response.status}`);
      }
      const data = await response.json();
      setBackendAvailable(true);
      setConnected(data.connected);
      setLiveId(data.liveId);
    } catch {
      setBackendAvailable(false);
      setConnected(false);
      setLiveId(null);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

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
      setBackendAvailable(false);
      setConnected(false);
      setLiveId(null);
    }
  }, [checkStatus]);

  return { backendAvailable, connected, liveId, connect, disconnect, connecting };
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
  Pin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  )
};

const DENSITY_STYLES = {
  compact: {
    row: 'gap-2.5 rounded-[18px] p-3',
    avatar: 'h-10 w-10 rounded-xl',
    fallbackAvatar: 'h-10 w-10 rounded-xl text-xs',
    body: 'mt-1.5 text-[13px] leading-5',
    author: 'text-[14px]',
    timestamp: 'text-[10px]',
    action: 'h-8 w-8 rounded-lg',
  },
  comfortable: {
    row: 'gap-3 rounded-[20px] p-4',
    avatar: 'h-11 w-11 rounded-2xl',
    fallbackAvatar: 'h-11 w-11 rounded-2xl text-sm',
    body: 'mt-2 text-[14px] leading-6',
    author: 'text-[15px]',
    timestamp: 'text-[11px]',
    action: 'h-9 w-9 rounded-xl',
  },
  immersive: {
    row: 'gap-4 rounded-[24px] p-5',
    avatar: 'h-12 w-12 rounded-[18px]',
    fallbackAvatar: 'h-12 w-12 rounded-[18px] text-sm',
    body: 'mt-2.5 text-[15px] leading-7',
    author: 'text-[16px]',
    timestamp: 'text-xs',
    action: 'h-10 w-10 rounded-xl',
  },
} as const;

type DensityStyles = (typeof DENSITY_STYLES)[keyof typeof DENSITY_STYLES];

function getDensityStyles(density: AppSettings['dashboardDensity']) {
  return DENSITY_STYLES[density];
}

function getMessageKind(message: ChatMessage | null) {
  if (!message) {
    return 'Chat';
  }

  if (message.superChat) {
    return 'Super Chat';
  }

  if (message.membershipGift || message.membershipGiftPurchase || message.membershipLevel) {
    return 'Member';
  }

  return 'Chat';
}

function getMessageSearchValue(message: ChatMessage) {
  const runText = message.runs?.map((run) => run.text || '').join(' ') ?? '';
  return `${message.author} ${message.text ?? ''} ${runText}`.trim().toLowerCase();
}

/**
 * COMPONENTS
 */

function MessageBadges({
  message,
  enabled = true,
}: {
  message: ChatMessage;
  enabled?: boolean;
}) {
  if (!enabled || (!message.badges?.length && !message.leaderboardRank)) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {message.badges?.map((badge, index) => (
        <span
          key={`${badge.type}-${index}`}
          className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/6 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-app-text-secondary"
        >
          {badge.imageUrl ? (
            <img
              src={proxyImageUrl(badge.imageUrl)}
              alt={badge.label || badge.type}
              className="h-3.5 w-3.5 rounded-full object-cover"
            />
          ) : badge.icon ? (
            <span>{badge.icon}</span>
          ) : null}
          <span>{badge.label || badge.type}</span>
        </span>
      ))}
      {message.leaderboardRank ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-200">
          <span>👑</span>
          <span>#{message.leaderboardRank}</span>
        </span>
      ) : null}
    </div>
  );
}

function MessageContent({
  message,
  className,
}: {
  message: ChatMessage;
  className: string;
}) {
  if (message.runs?.length) {
    return (
      <p className={className}>
        {message.runs.map((run, index) =>
          run.emojiUrl ? (
            <img
              key={`${message.id}-emoji-${index}`}
              src={proxyImageUrl(run.emojiUrl)}
              alt={run.emojiAlt || 'emoji'}
              className="mx-0.5 inline h-5 w-5 align-[-0.35em]"
            />
          ) : (
            <span key={`${message.id}-text-${index}`}>{run.text}</span>
          ),
        )}
      </p>
    );
  }

  if (!message.text || message.text === 'N/A') {
    return null;
  }

  return <p className={className}>{message.text}</p>;
}

function MessageRow({
  message,
  isSelected,
  onSelect,
  onCopy,
  onFilterUser,
  onContextMenu,
  densityStyles,
  showBadges = true,
  showAvatars = true,
  showTimestamps = true,
}: {
  message: ChatMessage;
  isSelected: boolean;
  onSelect: () => void;
  onCopy: (text: string) => void;
  onFilterUser: (author: string) => void;
  onContextMenu: (e: MouseEvent<HTMLDivElement>) => void;
  densityStyles: DensityStyles;
  showBadges?: boolean;
  showAvatars?: boolean;
  showTimestamps?: boolean;
}) {
  const { timezone } = useTimezone();

  return (
    <div
      className={`group grid border transition ${densityStyles.row} ${
        showAvatars ? 'grid-cols-[auto_minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,1fr)_auto]'
      } ${
        isSelected
          ? 'border-app-accent/45 bg-app-accent/10 shadow-[0_0_0_1px_rgba(129,140,248,0.18),0_20px_45px_rgba(15,23,42,0.45)]'
          : 'border-white/7 bg-[linear-gradient(180deg,rgba(24,24,27,0.92),rgba(17,17,19,0.9))] hover:border-white/12 hover:bg-[linear-gradient(180deg,rgba(31,31,35,0.95),rgba(24,24,27,0.94))]'
      }`}
      onClick={onSelect}
      onContextMenu={onContextMenu}
    >
      {showAvatars && message.authorPhoto && (
        <img
          src={proxyImageUrl(message.authorPhoto)}
          alt=""
          className={`${densityStyles.avatar} border border-white/8 object-cover shadow-md shadow-black/40`}
        />
      )}
      {showAvatars && !message.authorPhoto && (
        <div className={`grid place-items-center border border-white/8 bg-gradient-to-br from-app-accent/45 to-sky-500/30 font-semibold text-white shadow-md shadow-black/30 ${densityStyles.fallbackAvatar}`}>
          {message.author.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-start gap-2">
          <button
            type="button"
            className={`truncate text-left font-semibold tracking-[-0.01em] text-app-text transition hover:text-app-accent ${densityStyles.author}`}
            onClick={(e) => { e.stopPropagation(); onFilterUser(message.author); }}
            title={`Filter by ${message.author}`}
          >
            {message.author}
          </button>
          <MessageBadges message={message} enabled={showBadges} />
          {showTimestamps && (
            <span className={`ml-auto shrink-0 rounded-full border border-white/8 bg-white/4 px-2 py-0.5 font-medium text-app-text-subtle ${densityStyles.timestamp}`}>
              {formatTimestamp(message.publishedAt, timezone)}
            </span>
          )}
        </div>
        <MessageContent
          message={message}
          className={`${densityStyles.body} text-app-text-secondary`}
        />
      </div>

      <div className="flex items-start gap-2 opacity-100 transition md:opacity-60 md:group-hover:opacity-100">
        <button
          type="button"
          className={`grid place-items-center border border-white/8 bg-white/4 text-app-text-muted transition hover:border-app-accent/30 hover:bg-app-accent/10 hover:text-app-text ${densityStyles.action}`}
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          title="Pin to overlay"
        >
          <Icons.Pin />
        </button>
        <button
          type="button"
          className={`grid place-items-center border border-white/8 bg-white/4 text-app-text-muted transition hover:border-app-accent/30 hover:bg-app-accent/10 hover:text-app-text ${densityStyles.action}`}
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
  onSelect,
  densityStyles,
  showAvatars = true,
  showTimestamps = true,
}: {
  message: ChatMessage;
  isSelected: boolean;
  onSelect: () => void;
  densityStyles: DensityStyles;
  showAvatars?: boolean;
  showTimestamps?: boolean;
}) {
  const { timezone } = useTimezone();
  return (
    <div
      className={`rounded-3xl border p-4 transition ${
        isSelected
          ? 'border-amber-300/35 bg-amber-400/12 shadow-[0_0_0_1px_rgba(251,191,36,0.18)]'
          : 'border-white/7 bg-[linear-gradient(180deg,rgba(43,32,14,0.92),rgba(24,18,10,0.9))] hover:border-amber-300/18'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {showAvatars && message.authorPhoto ? (
          <img
            src={proxyImageUrl(message.authorPhoto)}
            alt=""
            className={`${densityStyles.avatar} border border-amber-200/10 object-cover`}
          />
        ) : showAvatars ? (
          <div className={`grid place-items-center border border-amber-200/10 bg-gradient-to-br from-amber-400/35 to-orange-500/20 font-semibold text-white ${densityStyles.fallbackAvatar}`}>
            {message.author.charAt(0).toUpperCase()}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className={`truncate font-semibold text-app-text ${densityStyles.author}`}>{message.author}</div>
            <span className="rounded-full border border-amber-300/20 bg-amber-300/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-100">
              Super Chat
            </span>
          </div>
          {showTimestamps ? (
            <div className={`mt-1 text-amber-100/70 ${densityStyles.timestamp}`}>
              {formatTimestamp(message.publishedAt, timezone)}
            </div>
          ) : null}
        </div>
        {message.superChat && (
          <div className="rounded-2xl border border-amber-300/25 bg-amber-300/12 px-3 py-1 text-sm font-semibold text-amber-50">
            {message.superChat.amount}
          </div>
        )}
      </div>
      <MessageContent
        message={message}
        className={`${densityStyles.body} text-amber-50/85`}
      />
      {message.superChat?.stickerUrl ? (
        <div className="mt-3 rounded-2xl border border-amber-300/10 bg-black/10 p-3">
          <img
            src={proxyImageUrl(message.superChat.stickerUrl)}
            alt={message.superChat.stickerAlt || 'Super sticker'}
            className="mx-auto max-h-28 w-auto"
          />
        </div>
      ) : null}
    </div>
  );
}

function MemberItem({
  message,
  isSelected,
  onSelect,
  densityStyles,
  showAvatars = true,
  showTimestamps = true,
}: {
  message: ChatMessage;
  isSelected: boolean;
  onSelect: () => void;
  densityStyles: DensityStyles;
  showAvatars?: boolean;
  showTimestamps?: boolean;
}) {
  const { timezone } = useTimezone();
  return (
    <div
      className={`rounded-3xl border p-4 transition ${
        isSelected
          ? 'border-emerald-300/30 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(52,211,153,0.18)]'
          : 'border-white/7 bg-[linear-gradient(180deg,rgba(8,43,31,0.82),rgba(9,24,18,0.9))] hover:border-emerald-300/18'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {showAvatars && message.authorPhoto ? (
          <img
            src={proxyImageUrl(message.authorPhoto)}
            alt=""
            className={`${densityStyles.avatar} border border-emerald-200/10 object-cover`}
          />
        ) : showAvatars ? (
          <div className={`grid place-items-center border border-emerald-200/10 bg-gradient-to-br from-emerald-400/35 to-teal-500/20 font-semibold text-white ${densityStyles.fallbackAvatar}`}>
            {message.author.charAt(0).toUpperCase()}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className={`truncate font-semibold text-app-text ${densityStyles.author}`}>{message.author}</div>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-100">
              {message.membershipGiftPurchase ? 'Gifted' : 'Member'}
            </span>
          </div>
          {showTimestamps ? (
            <div className={`mt-1 text-emerald-100/70 ${densityStyles.timestamp}`}>
              {formatTimestamp(message.publishedAt, timezone)}
            </div>
          ) : null}
        </div>
      </div>
      <div className={`${densityStyles.body} text-emerald-50/85`}>
        {message.membershipGiftPurchase && message.giftCount
          ? `${message.giftCount} gift membership${message.giftCount > 1 ? 's' : ''} sent`
          : message.membershipLevel || 'New member alert'}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  toneClass,
}: {
  label: string;
  value: string;
  hint: string;
  toneClass: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,27,0.94),rgba(14,14,17,0.98))] p-4 shadow-panel">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-app-text-subtle">
        {label}
      </div>
      <div className={`mt-3 text-2xl font-semibold tracking-[-0.04em] ${toneClass}`}>
        {value}
      </div>
      <div className="mt-1 text-sm text-app-text-muted">{hint}</div>
    </div>
  );
}

function SelectionPreviewCard({
  selection,
  densityStyles,
  showAvatars,
  showBadges,
  showTimestamps,
  onClear,
}: {
  selection: ChatMessage | null;
  densityStyles: DensityStyles;
  showAvatars: boolean;
  showBadges: boolean;
  showTimestamps: boolean;
  onClear: () => void;
}) {
  const { timezone } = useTimezone();

  return (
    <section className="overflow-hidden rounded-[28px] border border-app-accent/18 bg-[linear-gradient(180deg,rgba(26,27,37,0.94),rgba(15,16,23,0.98))] shadow-[0_24px_60px_rgba(15,23,42,0.48)]">
      <div className="flex items-center gap-3 border-b border-white/6 px-5 py-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-app-accent/80">
            Overlay Preview
          </span>
          <h3 className="mt-1 text-base font-semibold text-app-text">
            {selection ? getMessageKind(selection) : 'Pinned Message'}
          </h3>
        </div>
        <div className="flex-1" />
        {selection ? (
          <button
            type="button"
            className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-semibold text-app-text-secondary transition hover:border-app-accent/30 hover:bg-app-accent/10 hover:text-app-text"
            onClick={onClear}
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="p-4">
        {selection ? (
          <div className="rounded-[24px] border border-app-accent/16 bg-black/20 p-4">
            <div className="flex items-start gap-3">
              {showAvatars ? (
                selection.authorPhoto ? (
                  <img
                    src={proxyImageUrl(selection.authorPhoto)}
                    alt=""
                    className={`${densityStyles.avatar} border border-white/10 object-cover`}
                  />
                ) : (
                  <div className={`grid place-items-center border border-white/10 bg-gradient-to-br from-app-accent/55 to-sky-500/30 font-semibold text-white ${densityStyles.fallbackAvatar}`}>
                    {selection.author.charAt(0).toUpperCase()}
                  </div>
                )
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start gap-2">
                  <div className={`truncate font-semibold text-app-text ${densityStyles.author}`}>
                    {selection.author}
                  </div>
                  <MessageBadges message={selection} enabled={showBadges} />
                  {showTimestamps ? (
                    <span className={`ml-auto rounded-full border border-white/8 bg-white/4 px-2 py-0.5 font-medium text-app-text-subtle ${densityStyles.timestamp}`}>
                      {formatTimestamp(selection.publishedAt, timezone)}
                    </span>
                  ) : null}
                </div>
                <MessageContent
                  message={selection}
                  className={`${densityStyles.body} text-app-text-secondary`}
                />
                {selection.superChat?.amount ? (
                  <div className="mt-3 inline-flex rounded-full border border-amber-300/20 bg-amber-300/12 px-3 py-1 text-xs font-semibold text-amber-100">
                    {selection.superChat.amount}
                  </div>
                ) : null}
                {selection.membershipGiftPurchase || selection.membershipLevel ? (
                  <div className="mt-3 inline-flex rounded-full border border-emerald-300/18 bg-emerald-300/12 px-3 py-1 text-xs font-semibold text-emerald-100">
                    {selection.membershipGiftPurchase
                      ? `${selection.giftCount || 1} gift membership${selection.giftCount && selection.giftCount > 1 ? 's' : ''}`
                      : selection.membershipLevel || 'Member highlight'}
                  </div>
                ) : null}
                {selection.superChat?.stickerUrl ? (
                  <div className="mt-3 rounded-[20px] border border-amber-300/10 bg-black/20 p-3">
                    <img
                      src={proxyImageUrl(selection.superChat.stickerUrl)}
                      alt={selection.superChat.stickerAlt || 'Super sticker'}
                      className="mx-auto max-h-28 w-auto"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon="📌"
            title="Nothing pinned yet"
            description="Select any message from the feed or event rail to preview what OBS will receive."
            small
          />
        )}
      </div>
    </section>
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
    <div
      className={`flex h-full flex-col items-center justify-center rounded-[28px] border border-dashed border-white/8 bg-white/[0.03] text-center ${
        small ? 'min-h-[180px] px-5 py-8' : 'min-h-[360px] px-8 py-14'
      }`}
    >
      <div className={`${small ? 'text-3xl' : 'text-5xl'}`}>{icon}</div>
      <h3 className={`mt-4 font-semibold text-app-text ${small ? 'text-base' : 'text-xl'}`}>
        {title}
      </h3>
      <p className={`mt-2 max-w-sm text-app-text-muted ${small ? 'text-sm' : 'text-base'}`}>
        {description}
      </p>
    </div>
  );
}

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
  const { backendAvailable, connected, liveId, connect, disconnect, connecting } = useConnection();
  const { messages } = useChatMessages(backendAvailable);
  const { selection } = useOverlaySelection(backendAvailable);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [streamInput, setStreamInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const hasInitializedRef = useRef(false);
  const prevSuperChatCountRef = useRef(0);
  const prevMemberCountRef = useRef(0);

  useEffect(() => {
    const initial = loadStoredSettings();
    setSettings(initial);

    const settingsListener = (event: MessageEvent) => {
      try {
        const incoming = JSON.parse(event.data);
        setSettings((current) => {
          const merged = normalizeSettings({ ...current, ...incoming });
          return settingsAreEqual(current, merged) ? current : merged;
        });
      } catch (error) {
        console.error('Failed to parse settings event', error);
      }
    };

    const unsubscribe = subscribeToSettingsChanges((incoming) => {
      setSettings((current) =>
        settingsAreEqual(current, incoming) ? current : incoming,
      );
    });

    globalSSEConnection?.addEventListener('settings', settingsListener as EventListener);

    return () => {
      unsubscribe();
      globalSSEConnection?.removeEventListener('settings', settingsListener as EventListener);
    };
  }, [backendAvailable]);

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

  const uniqueAuthors = useMemo(
    () => new Set(regularMessages.map((message) => message.author)).size,
    [regularMessages],
  );

  const railSpecialCount = superChats.length + newMembers.length;

  const dashboardShellStyle = useMemo(
    () =>
      ({
        '--dashboard-rail-width': `${settings.dashboardPanelWidth}px`,
      }) as CSSProperties,
    [settings.dashboardPanelWidth],
  );

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

  return (
    <div className="app-container bg-app-bg">
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

      <div
        className="relative flex-1 overflow-auto"
        style={{
          background: settings.showAmbientGlow
            ? 'radial-gradient(circle at top left, var(--accent-glow), transparent 26%), radial-gradient(circle at bottom right, rgba(56,189,248,0.12), transparent 28%), var(--bg)'
            : 'var(--bg)',
        }}
      >
        <div className="px-4 py-4 xl:px-6">
          <div
            className={`mx-auto flex min-h-full w-full flex-col gap-4 ${
              settings.workspaceFrame === 'framed' ? 'max-w-[1600px]' : 'max-w-none'
            }`}
          >
            <section className="grid gap-3 xl:grid-cols-3">
              <MetricCard
                label="Visible Feed"
                value={String(filteredMessages.length)}
                hint={
                  userFilter
                    ? `Filtered to @${userFilter}`
                    : deferredSearchQuery
                      ? `Search: ${deferredSearchQuery}`
                      : 'Operator moderation queue'
                }
                toneClass="text-sky-200"
              />
              <MetricCard
                label="Active Authors"
                value={String(uniqueAuthors)}
                hint={
                  regularMessages.length > 0
                    ? 'Unique chatters in the current buffer'
                    : connected
                      ? 'Unique chatters in current session'
                      : 'Connect to a live stream to populate'
                }
                toneClass="text-emerald-200"
              />
              <MetricCard
                label="Overlay Output"
                value={selection ? getMessageKind(selection) : 'Idle'}
                hint={
                  selection
                    ? `Pinned from @${selection.author}`
                    : railSpecialCount > 0
                      ? `${railSpecialCount} highlight items waiting in rail`
                      : 'Nothing pinned yet'
                }
                toneClass="text-amber-200"
              />
            </section>

            <div
              className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_var(--dashboard-rail-width)]"
              style={dashboardShellStyle}
            >
              <section className="flex min-h-[720px] flex-col overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,19,26,0.92),rgba(11,12,18,0.98))] shadow-[0_28px_70px_rgba(0,0,0,0.42)] backdrop-blur">
                <div className="border-b border-white/6 px-5 py-5">
                  <div className="flex flex-wrap items-start gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-app-text-subtle">
                        Live Feed
                      </div>
                      <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-app-text">
                        Broadcast Command Deck
                      </h2>
                      <p className="mt-1 text-sm text-app-text-muted">
                        Search, inspect, and route messages to the overlay without leaving the desk.
                      </p>
                    </div>
                    <div className="flex-1" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs font-semibold text-app-text-secondary">
                        {autoScroll ? 'Live follow on' : 'Manual review'}
                      </span>
                      <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs font-semibold text-app-text-secondary">
                        Density: {settings.dashboardDensity}
                      </span>
                      {selection ? (
                        <span className="rounded-full border border-app-accent/20 bg-app-accent/10 px-3 py-1 text-xs font-semibold text-app-accent">
                          Pinned: {getMessageKind(selection)}
                        </span>
                      ) : null}
                      {selection && !settings.showSelectionPreview ? (
                        <button
                          type="button"
                          className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs font-semibold text-app-text-secondary transition hover:border-app-accent/30 hover:bg-app-accent/10 hover:text-app-text"
                          onClick={handleClearSelection}
                        >
                          Clear selection
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center">
                    <label className="relative flex-1">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-app-text-subtle">
                        ⌕
                      </span>
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search author, text, or emoji alt text"
                        className="h-12 w-full rounded-2xl border border-white/8 bg-black/20 pl-11 pr-4 text-sm text-app-text outline-none transition focus:border-app-accent/40 focus:bg-black/30 focus:ring-2 focus:ring-app-accent/15"
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-2">
                      {userFilter ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-app-accent/20 bg-app-accent/10 px-3 py-2 text-xs font-semibold text-app-accent">
                          <span>@{userFilter}</span>
                          <button
                            type="button"
                            className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[10px] text-white transition hover:bg-white/20"
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
                          className="rounded-full border border-white/8 bg-white/5 px-3 py-2 text-xs font-semibold text-app-text-secondary transition hover:border-white/12 hover:bg-white/8"
                          onClick={() => setSearchQuery('')}
                        >
                          Clear search
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {filteredMessages.length === 0 ? (
                  <EmptyState
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
                      className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
                      ref={chatListRef}
                      onScroll={handleScroll}
                    >
                      {filteredMessages.map((msg) => (
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
                    </div>
                    {!autoScroll && (
                      <button
                        className="absolute bottom-5 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-app-accent px-4 py-2 text-xs font-semibold text-white shadow-panel transition hover:bg-app-accent-hover"
                        onClick={scrollToBottom}
                      >
                        <span>↓</span>
                        <span>Jump to live edge</span>
                      </button>
                    )}
                  </div>
                )}
              </section>

              <aside className="flex min-h-0 flex-col gap-4">
                {settings.showSelectionPreview ? (
                  <SelectionPreviewCard
                    selection={selection}
                    densityStyles={densityStyles}
                    showAvatars={settings.showAvatars}
                    showBadges={settings.showBadges}
                    showTimestamps={settings.showTimestamps}
                    onClear={handleClearSelection}
                  />
                ) : null}

                <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
                  <section className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(27,21,11,0.9),rgba(19,14,8,0.97))] shadow-panel-lg backdrop-blur">
                    <div className="flex items-center gap-3 border-b border-white/6 px-5 py-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-100/80">
                          Revenue
                        </span>
                        <h3 className="mt-1 text-base font-semibold text-app-text">Super Chats</h3>
                      </div>
                      <div className="flex-1" />
                      <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                        {superChats.length}
                      </span>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                      {superChats.length === 0 ? (
                        <EmptyState
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
                            densityStyles={densityStyles}
                            showAvatars={settings.showAvatars}
                            showTimestamps={settings.showTimestamps}
                          />
                        ))
                      )}
                    </div>
                  </section>

                  <section className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,28,22,0.92),rgba(8,17,13,0.98))] shadow-panel-lg backdrop-blur">
                    <div className="flex items-center gap-3 border-b border-white/6 px-5 py-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/80">
                          Community
                        </span>
                        <h3 className="mt-1 text-base font-semibold text-app-text">New Members</h3>
                      </div>
                      <div className="flex-1" />
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                        {newMembers.length}
                      </span>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                      {newMembers.length === 0 ? (
                        <EmptyState
                          icon="⭐"
                          title="No new members yet"
                          description="New channel members will appear here when they join."
                          small
                        />
                      ) : (
                        newMembers.map((msg) => (
                          <MemberItem
                            key={msg.id}
                            message={msg}
                            isSelected={selection?.id === msg.id}
                            onSelect={() => handleSelect(msg)}
                            densityStyles={densityStyles}
                            showAvatars={settings.showAvatars}
                            showTimestamps={settings.showTimestamps}
                          />
                        ))
                      )}
                    </div>
                  </section>
                </div>
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
