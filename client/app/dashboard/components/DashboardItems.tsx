import { memo } from 'react';
import type { ChatMessage } from '@shared/chat';
import { proxyImageUrl } from '../../../lib/imageProxy';
import { useTimezone } from '../../../lib/TimezoneContext';
import { formatTimestamp } from '../../../lib/timezone';
import { MessageContent } from '../../components/MessageElements';

export const SuperChatItem = memo(function SuperChatItem({
  message,
  isSelected,
  onSelect,
  showAvatars = true,
  showTimestamps = true,
}: {
  message: ChatMessage;
  isSelected: boolean;
  onSelect: () => void;
  showAvatars?: boolean;
  showTimestamps?: boolean;
}) {
  const { timezone } = useTimezone();
  return (
    <div
      className={`cursor-pointer rounded-lg border-l-2 px-3 py-2 transition shadow-sm ${
        isSelected
          ? 'border-amber-400 bg-amber-400/10'
          : 'border-transparent hover:bg-white/[0.04]'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        {showAvatars && message.authorPhoto ? (
          <img
            src={proxyImageUrl(message.authorPhoto)}
            alt=""
            className="h-6 w-6 rounded-full border border-white/6 object-cover bg-black/10"
          />
        ) : showAvatars ? (
          <div className="grid h-6 w-6 place-items-center rounded-full bg-surface-3 text-[10px] font-semibold text-app-text-muted">
            {message.author.charAt(0).toUpperCase()}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[11px] font-semibold text-app-text">{message.author}</span>
            {showTimestamps && (
              <span className="text-[10px] text-app-text-subtle">
                {formatTimestamp(message.publishedAt, timezone)}
              </span>
            )}
          </div>
        </div>
        {message.superChat && (
          <span className="shrink-0 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-200 border border-amber-400/20 shadow-sm">
            {message.superChat.amount}
          </span>
        )}
      </div>
      <MessageContent
        message={message}
        className="mt-1.5 text-[11px] leading-[1.4] text-app-text-secondary"
      />
      {message.superChat?.stickerUrl ? (
        <div className="mt-1.5">
          <img
            src={proxyImageUrl(message.superChat.stickerUrl)}
            alt={message.superChat.stickerAlt || 'Super sticker'}
            className="max-h-12 w-auto rounded drop-shadow-md"
          />
        </div>
      ) : null}
    </div>
  );
});

export const MemberItem = memo(function MemberItem({
  message,
  isSelected,
  onSelect,
  showAvatars = true,
  showTimestamps = true,
}: {
  message: ChatMessage;
  isSelected: boolean;
  onSelect: () => void;
  showAvatars?: boolean;
  showTimestamps?: boolean;
}) {
  const { timezone } = useTimezone();
  return (
    <div
      className={`cursor-pointer rounded-lg border-l-2 px-3 py-2 transition shadow-sm ${
        isSelected
          ? 'border-emerald-400 bg-emerald-400/10'
          : 'border-transparent hover:bg-white/[0.04]'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        {showAvatars && message.authorPhoto ? (
          <img
            src={proxyImageUrl(message.authorPhoto)}
            alt=""
            className="h-6 w-6 rounded-full border border-white/6 object-cover bg-black/10 ring-1 ring-emerald-400/20"
          />
        ) : showAvatars ? (
          <div className="grid h-6 w-6 place-items-center rounded-full bg-surface-3 text-[10px] font-semibold text-app-text-muted">
            {message.author.charAt(0).toUpperCase()}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="truncate text-[11px] font-semibold text-app-text">{message.author}</span>
            <span className="rounded bg-emerald-400/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-200 border border-emerald-400/20 shadow-sm uppercase tracking-wider">
              {message.membershipGiftPurchase ? 'Gift' : 'Member'}
            </span>
            {showTimestamps && (
              <span className="text-[10px] text-app-text-subtle ml-auto">
                {formatTimestamp(message.publishedAt, timezone)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-1.5 text-[11px] font-medium text-emerald-300/80">
        {message.membershipGiftPurchase && message.giftCount
          ? `${message.giftCount} gift membership${message.giftCount > 1 ? 's' : ''} sent`
          : message.membershipLevel || 'New member alert'}
      </div>
    </div>
  );
});
