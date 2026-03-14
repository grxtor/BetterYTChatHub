import { memo } from 'react';
import type { MouseEvent } from 'react';
import type { ChatMessage } from '@shared/chat';
import { proxyImageUrl } from '../../../lib/imageProxy';
import { useTimezone } from '../../../lib/TimezoneContext';
import { formatTimestamp } from '../../../lib/timezone';
import { DashboardIcons } from '../../components/Icons';

export type DensityStyles = {
  row: string;
  avatar: string;
  fallbackAvatar: string;
  body: string;
  author: string;
  timestamp: string;
  action: string;
};

export const DENSITY_STYLES: Record<string, DensityStyles> = {
  compact: {
    row: 'gap-2.5 px-4 py-3',
    avatar: 'h-10 w-10 rounded-xl',
    fallbackAvatar: 'h-10 w-10 rounded-xl text-xs',
    body: 'mt-1 text-[13px] leading-5',
    author: 'text-[14px]',
    timestamp: 'text-[10px]',
    action: 'h-8 w-8 rounded-lg',
  },
  comfortable: {
    row: 'gap-3 px-4 py-3.5',
    avatar: 'h-11 w-11 rounded-2xl',
    fallbackAvatar: 'h-11 w-11 rounded-2xl text-sm',
    body: 'mt-1.5 text-[14px] leading-6',
    author: 'text-[15px]',
    timestamp: 'text-[11px]',
    action: 'h-9 w-9 rounded-xl',
  },
  immersive: {
    row: 'gap-4 px-5 py-4',
    avatar: 'h-12 w-12 rounded-[18px]',
    fallbackAvatar: 'h-12 w-12 rounded-[18px] text-sm',
    body: 'mt-2 text-[15px] leading-7',
    author: 'text-[16px]',
    timestamp: 'text-xs',
    action: 'h-10 w-10 rounded-xl',
  },
};

export function getDensityStyles(density: string): DensityStyles {
  return DENSITY_STYLES[density] || DENSITY_STYLES['comfortable'];
}

import { MessageBadges, MessageContent } from '../../components/MessageElements';

export const MessageRow = memo(function MessageRow({
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
      className={`group relative grid cursor-pointer border-b border-white/6 transition ${densityStyles.row} ${
        showAvatars ? 'grid-cols-[auto_minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,1fr)_auto]'
      } ${
        isSelected
          ? 'bg-app-accent/[0.08] after:absolute after:bottom-3 after:left-0 after:top-3 after:w-[2px] after:rounded-full after:bg-app-accent'
          : 'hover:bg-white/[0.035]'
      }`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '100px' }}
      onClick={onSelect}
      onContextMenu={onContextMenu}
    >
      {showAvatars && message.authorPhoto && (
        <img
          src={proxyImageUrl(message.authorPhoto)}
          alt=""
          className={`${densityStyles.avatar} border border-white/6 object-cover`}
        />
      )}
      {showAvatars && !message.authorPhoto && (
        <div className={`grid place-items-center border border-white/6 bg-surface-3 font-semibold text-app-text-muted ${densityStyles.fallbackAvatar}`}>
          {message.author.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
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
            <span className={`ml-auto shrink-0 font-medium text-app-text-subtle/80 ${densityStyles.timestamp}`}>
              {formatTimestamp(message.publishedAt, timezone)}
            </span>
          )}
        </div>
        <MessageContent
          message={message}
          className={`${densityStyles.body} pr-4 text-app-text-secondary`}
        />
      </div>

      <div className="flex items-start gap-1.5 self-start opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
        <button
          type="button"
          className={`grid place-items-center text-app-text-muted transition hover:bg-white/8 hover:text-app-text ${densityStyles.action}`}
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          title="Pin to overlay"
        >
          <DashboardIcons.Pin />
        </button>
        <button
          type="button"
          className={`grid place-items-center text-app-text-muted transition hover:bg-white/8 hover:text-app-text ${densityStyles.action}`}
          onClick={(e) => { e.stopPropagation(); onCopy(message.text); }}
          title="Copy"
        >
          <DashboardIcons.Copy />
        </button>
      </div>
    </div>
  );
});
