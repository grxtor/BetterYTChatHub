import { memo } from 'react';
import type { AppSettings } from '@shared/settings';
import type { ChatMessage } from '@shared/chat';
import { SectionCard, cn } from './SettingsUI';
import { OverlayCard } from '../OverlayCard';
import { AnimatePresence, motion } from 'framer-motion';

import { MessageRow, getDensityStyles } from '../../dashboard/components/MessageRow';

export type PreviewMode = 'message' | 'superchat' | 'members' | 'dashboard';

const SAMPLE_MESSAGE: ChatMessage = {
  id: 'settings-preview-selected',
  author: 'Selected Viewer',
  text: 'This is the highlighted message that will appear in OBS. Keep it readable and clean.',
  runs: [{ text: 'This is the highlighted message that will appear in OBS. Keep it readable and clean.' }],
  publishedAt: new Date().toISOString(),
  isModerator: true,
  badges: [{ type: 'moderator', label: 'Mod' }],
};

const SAMPLE_SUPERCHAT: ChatMessage = {
  id: 'settings-preview-superchat',
  author: 'Supporter',
  text: 'Super Chats should stay simple and match the same card language.',
  runs: [{ text: 'Super Chats should stay simple and match the same card language.' }],
  publishedAt: new Date().toISOString(),
  superChat: { amount: '$10.00', currency: 'USD', color: '#f59e0b' },
};

const SAMPLE_MEMBER: ChatMessage = {
  id: 'settings-preview-member',
  author: 'New Member',
  text: 'Joined the channel and unlocked member-only badges.',
  runs: [{ text: 'Joined the channel and unlocked member-only badges.' }],
  publishedAt: new Date().toISOString(),
  membershipGift: true,
  membershipLevel: 'Gold Tier',
  badges: [{ type: 'member', label: 'Member' }],
};

export const DashboardPreview = memo(function DashboardPreview({ settings }: { settings: AppSettings }) {
  const densityStyles = getDensityStyles(settings.dashboardDensity);
  return (
    <div className="flex w-full flex-col">
      <MessageRow
        message={SAMPLE_MESSAGE}
        isSelected={false}
        onSelect={() => {}}
        onCopy={() => {}}
        onFilterUser={() => {}}
        onContextMenu={() => {}}
        densityStyles={densityStyles}
        showBadges={settings.showBadges}
        showAvatars={settings.showAvatars}
        showTimestamps={settings.showTimestamps}
      />
      <MessageRow
        message={SAMPLE_SUPERCHAT}
        isSelected={true}
        onSelect={() => {}}
        onCopy={() => {}}
        onFilterUser={() => {}}
        onContextMenu={() => {}}
        densityStyles={densityStyles}
        showBadges={settings.showBadges}
        showAvatars={settings.showAvatars}
        showTimestamps={settings.showTimestamps}
      />
    </div>
  );
});

interface OverlayPreviewProps {
  settings: AppSettings;
  previewMode: PreviewMode;
}

export const OverlayPreview = memo(function OverlayPreview({ settings, previewMode }: OverlayPreviewProps) {
  const message =
    previewMode === 'superchat'
      ? SAMPLE_SUPERCHAT
      : previewMode === 'members'
        ? SAMPLE_MEMBER
        : SAMPLE_MESSAGE;
  const cardWidth = Math.min(settings.messageMaxWidth, 520);
  const isSuperChat = previewMode === 'superchat';
  const isMembers = previewMode === 'members';
  const scale = isSuperChat
    ? settings.superChatOverlayScale
    : isMembers
      ? settings.membersOverlayScale
      : settings.overlayScale;

  if (previewMode === 'dashboard') {
    return (
      <div className="overflow-hidden rounded-[22px] border border-white/6 bg-surface-2">
        <div className="border-b border-white/6 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-app-text">Dashboard Önizleme</h2>
              <p className="mt-1 text-sm text-app-text-muted">Görüntü ayarlarının canlı yansıması.</p>
            </div>
            <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-app-text-secondary">
              Mesaj Akışı
            </span>
          </div>
        </div>
        <div className="p-3">
          <div className="overflow-hidden rounded-xl border border-white/6 bg-app-bg text-left">
            <DashboardPreview settings={settings} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-white/6 bg-surface-2">
      <div className="border-b border-white/6 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-app-text">Canlı Önizleme</h2>
            <p className="mt-1 text-sm text-app-text-muted">OBS tarafı şeffaf kalır. Sadece seçilen mesaj kartı görünür.</p>
          </div>
          <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-app-text-secondary">
            {previewMode === 'superchat' ? 'Super Chat' : previewMode === 'members' ? 'Üyelik' : 'Seçili Mesaj'}
          </span>
        </div>
      </div>
      <div className="p-5">
        <div
          className="relative overflow-hidden rounded-[20px] border border-dashed border-white/10"
          style={{
            backgroundImage:
              'linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%)',
            backgroundSize: '22px 22px',
            backgroundPosition: '0 0, 0 11px, 11px -11px, -11px 0',
          }}
        >
          <div className="flex min-h-[320px] items-end justify-start p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={previewMode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              >
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'bottom left' }}>
                  <OverlayCard message={message} settings={settings} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
});

interface PreviewSettingsProps {
  settings: AppSettings;
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
}

export const PreviewSettings = memo(function PreviewSettings({ settings, previewMode, setPreviewMode }: PreviewSettingsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {(['dashboard', 'message', 'superchat', 'members'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className={cn(
              'flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition',
              previewMode === mode ? 'border-app-accent/30 bg-app-accent/12 text-app-text' : 'border-white/8 bg-white/[0.04] text-app-text-muted hover:text-app-text',
            )}
            onClick={() => setPreviewMode(mode)}
          >
            {mode === 'dashboard' ? 'Akış' : mode === 'message' ? 'Mesaj' : mode === 'superchat' ? 'Super Chat' : 'Üyelik'}
          </button>
        ))}
      </div>

      <OverlayPreview settings={settings} previewMode={previewMode} />

      <SectionCard title="OBS Notları" description="Overlay davranışı hakkında bilgi.">
        <div className="space-y-3 text-sm text-app-text-muted">
          <p>Overlay sayfasının arka planı şeffaf kalır.</p>
          <p>Tarayıcı kaynağını doğrudan OBS içinde taşıyın ve kırpın.</p>
          <p>Super Chat kartları da aynı görsel dili kullanmalıdır.</p>
        </div>
      </SectionCard>
    </div>
  );
});
