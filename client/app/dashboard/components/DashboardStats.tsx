import { memo } from 'react';

export type DashboardMetrics = {
  superChats: number;
  members: number;
  messages: number;
};

export const DashboardStats = memo(function DashboardStats({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="flex items-center gap-1 border-b border-white/6 bg-surface-1 px-4 py-2 lg:px-6">
      <StatPill
        color="text-amber-400"
        value={metrics.superChats}
        label="Super Chat"
        icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
      />
      <span className="mx-2 text-white/10">·</span>
      <StatPill
        color="text-emerald-400"
        value={metrics.members}
        label="Üye"
        icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
      />
      <span className="mx-2 text-white/10">·</span>
      <StatPill
        color="text-sky-400"
        value={metrics.messages}
        label="Mesaj"
        icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        }
      />
    </div>
  );
});

function StatPill({ color, value, label, icon }: { color: string; value: number; label: string; icon: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-1.5 ${color}`}>
      <span className="opacity-70">{icon}</span>
      <span className="text-sm font-bold text-app-text">{value}</span>
      <span className="text-xs text-app-text-muted">{label}</span>
    </div>
  );
}
