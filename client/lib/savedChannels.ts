import type { SavedChannel } from '@shared/settings';

const KEY = 'better_yt_saved_channels';

export function loadSavedChannels(): SavedChannel[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(channels: SavedChannel[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(channels));
  } catch { /* ignore */ }
}

export function addSavedChannel(channel: SavedChannel): SavedChannel[] {
  const current = loadSavedChannels();
  const existing = current.findIndex(c => c.videoId === channel.videoId);
  if (existing !== -1) {
    current[existing] = channel; // update label if already saved
  } else {
    current.unshift(channel); // add to top
  }
  persist(current);
  return current;
}

export function removeSavedChannel(videoId: string): SavedChannel[] {
  const updated = loadSavedChannels().filter(c => c.videoId !== videoId);
  persist(updated);
  return updated;
}
