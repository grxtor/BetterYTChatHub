import { memo } from 'react';
import type { ChatMessage } from '@shared/chat';
import type { AppSettings } from '@shared/settings';
import { OverlayCard } from '../../components/OverlayCard';
import { EmptyStateCard } from './EmptyStateCard';

function getMessageKind(message: ChatMessage) {
  if (message.superChat) return 'Super Chat';
  if (message.membershipGift || message.membershipGiftPurchase || message.membershipLevel) return 'Üyelik';
  return 'Mesaj';
}

export const SelectionPreviewCard = memo(function SelectionPreviewCard({
  selection,
  settings,
  onClear,
}: {
  selection: ChatMessage | null;
  settings: AppSettings;
  onClear: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-white/6 bg-surface-2">
      <div className="flex items-center gap-3 border-b border-white/6 px-4 py-3">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-app-text-subtle">
            OBS Overlay
          </span>
          <h3 className="mt-0.5 text-sm font-semibold text-app-text">
            {selection ? getMessageKind(selection) : 'Seçili Mesaj'}
          </h3>
        </div>
        <div className="flex-1" />
        {selection ? (
          <button
            type="button"
            className="rounded-md border border-white/8 bg-white/5 px-2.5 py-1 text-xs text-app-text-secondary transition hover:bg-white/10 hover:text-app-text"
            onClick={onClear}
          >
            Kaldır
          </button>
        ) : null}
      </div>
      <div className="p-3">
        {selection ? (
          <div
            className="relative overflow-hidden rounded-xl p-4"
            style={{
              backgroundImage:
                'linear-gradient(45deg, rgba(255,255,255,0.025) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.025) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.025) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.025) 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
              backgroundColor: '#05050a',
            }}
          >
            <OverlayCard message={selection} settings={settings} />
          </div>
        ) : (
          <EmptyStateCard
            icon="📌"
            title="Henüz seçili mesaj yok"
            description="Feed'den veya listeden bir mesaj seçin. OBS overlay'e tam olarak bu kart gönderilir."
            small
          />
        )}
      </div>
    </section>
  );
});
