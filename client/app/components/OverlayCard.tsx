import { memo } from 'react';
import type { ChatMessage } from '@shared/chat';
import type { AppSettings } from '@shared/settings';
import { proxyImageUrl } from '../../lib/imageProxy';
import { MessageBadges, MessageContent } from './MessageElements';

export interface OverlayCardProps {
  message: ChatMessage & { timestamp?: string | number | Date };
  settings: AppSettings;
}

function getAvatarUrl(message: ChatMessage) {
  if (message.authorPhoto) return proxyImageUrl(message.authorPhoto);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(message.author)}&background=111111&color=ffffff&size=64`;
}

export const OverlayCard = memo(function OverlayCard({ message, settings }: OverlayCardProps) {
  const isMemberEvent = !!(message.membershipGift || message.membershipGiftPurchase);
  const isMemberMsg = !!(isMemberEvent || message.isMember || message.membershipLevel);
  const isSuperChatMsg = !!(message.superChat || (message as any).superSticker);
  const useMemberStyling = isMemberMsg && (isMemberEvent || settings.useSpecialMemberStyling !== false);

  const bgColor = useMemberStyling
    ? (settings.membersOverlayBgColor || settings.overlayBgColor)
    : isSuperChatMsg
      ? (settings.superChatOverlayBgColor || settings.overlayBgColor)
      : settings.overlayBgColor;

  const txColor = useMemberStyling
    ? (settings.membersOverlayTxColor || settings.overlayTxColor)
    : isSuperChatMsg
      ? (settings.superChatOverlayTxColor || settings.overlayTxColor)
      : settings.overlayTxColor;

  const fontSize = useMemberStyling
    ? (settings.membersFontSize || settings.messageFontSize || 14)
    : isSuperChatMsg
      ? (settings.superChatFontSize || settings.messageFontSize || 14)
      : (settings.messageFontSize || 14);

  const avatarUrl = getAvatarUrl(message);
  const maxWidth = settings.messageMaxWidth || 400;

  // ─── Super Chat ──────────────────────────────────────────────────
  if (isSuperChatMsg) {
    const accentColor = settings.superChatHeaderColor || message.superChat?.color || '#f59e0b';
    return (
      <div
        className="overlay__card overflow-hidden rounded-2xl"
        style={{ maxWidth, width: '100%', backgroundColor: bgColor, color: txColor, borderLeft: `4px solid ${accentColor}` }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {settings.showAvatars !== false && (
            <img
              src={avatarUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover"
              style={{ border: `2px solid ${accentColor}40` }}
            />
          )}
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="truncate font-semibold" style={{ fontSize: `${fontSize}px` }}>
              {message.author}
            </span>
            <span
              className="shrink-0 rounded-full px-2.5 py-0.5 text-sm font-bold"
              style={{ backgroundColor: accentColor, color: '#000' }}
            >
              {message.superChat?.amount}
            </span>
          </div>
        </div>

        {(message.text || message.runs?.length) && (
          <div className="px-4 pb-3.5" style={{ paddingLeft: settings.showAvatars !== false ? '3.75rem' : '1rem' }}>
            <MessageContent
              message={message}
              className=""
              style={{ fontSize: `${fontSize}px`, color: txColor, opacity: 0.9 }}
            />
          </div>
        )}

        {message.superChat?.stickerUrl && (
          <div className="flex px-4 pb-3.5" style={{ paddingLeft: settings.showAvatars !== false ? '3.75rem' : '1rem' }}>
            <img
              src={proxyImageUrl(message.superChat.stickerUrl)}
              alt={message.superChat.stickerAlt || 'Sticker'}
              className="max-h-16 w-auto object-contain"
            />
          </div>
        )}
      </div>
    );
  }

  // ─── Member Event ─────────────────────────────────────────────────
  if (isMemberEvent && useMemberStyling) {
    const memberBadge = message.membershipGiftPurchase && message.giftCount
      ? `${message.giftCount} Sub Gifted`
      : (message.membershipLevel || 'New Member');

    const gradient = (settings.membersGradientColor1 && settings.membersGradientColor2)
      ? `linear-gradient(135deg, ${settings.membersGradientColor1}, ${settings.membersGradientColor2})`
      : undefined;

    return (
      <div
        className="overlay__card overflow-hidden rounded-2xl border-l-4 border-emerald-400"
        style={{ maxWidth, width: '100%', ...(gradient ? { background: gradient } : { backgroundColor: bgColor }), color: txColor }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {settings.showAvatars !== false && (
            <img
              src={avatarUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-emerald-400/40"
            />
          )}
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="truncate font-semibold text-emerald-300" style={{ fontSize: `${fontSize}px` }}>
              {message.author}
            </span>
            <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              {memberBadge}
            </span>
          </div>
        </div>

        {(message.text || message.runs?.length) && (
          <div className="px-4 pb-3.5" style={{ paddingLeft: settings.showAvatars !== false ? '3.75rem' : '1rem' }}>
            <MessageContent
              message={message}
              className=""
              style={{ fontSize: `${fontSize}px`, color: txColor, opacity: 0.85 }}
            />
          </div>
        )}
      </div>
    );
  }

  // ─── Regular Chat ─────────────────────────────────────────────────
  return (
    <div
      className="overlay__card overflow-hidden rounded-2xl"
      style={{ maxWidth, width: '100%', backgroundColor: bgColor, color: txColor }}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        {settings.showAvatars !== false && (
          <img
            src={avatarUrl}
            alt=""
            className="mt-0.5 h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-semibold leading-tight" style={{ fontSize: `${fontSize}px` }}>
              {message.author}
            </span>
            <MessageBadges message={message} enabled={settings.showBadges !== false} />
            {settings.showTimestamps !== false && message.timestamp && (
              <span className="ml-auto text-[11px] opacity-50">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <MessageContent
            message={message}
            className=""
            style={{ fontSize: `${fontSize}px`, color: txColor, opacity: 0.92 }}
          />
        </div>
      </div>
    </div>
  );
});
