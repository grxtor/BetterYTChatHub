import { memo } from 'react';
import type { ChatMessage } from '@shared/chat';
import { proxyImageUrl } from '../../lib/imageProxy';

export const MessageBadges = memo(function MessageBadges({
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
    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
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
});

export const MessageContent = memo(function MessageContent({
  message,
  className,
  style,
}: {
  message: ChatMessage;
  className: string;
  style?: React.CSSProperties;
}) {
  if (message.runs?.length) {
    return (
      <p className={className} style={style}>
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

  return <p className={className} style={style}>{message.text}</p>;
});
