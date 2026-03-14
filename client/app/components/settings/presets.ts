import { DEFAULT_APP_SETTINGS, type AppSettings } from '@shared/settings';

export type Preset = {
  id: string;
  name: string;
  description: string;
  values: Partial<AppSettings>;
};

export const PRESETS: Preset[] = [
  {
    id: 'default',
    name: 'Varsayılan',
    description: 'Varsayılan BetterYTChatHub ayarları.',
    values: DEFAULT_APP_SETTINGS,
  },
  {
    id: 'streamer-pro',
    name: 'Streamer Pro (Sade & Şık)',
    description: 'Büyük yazılar, okunaklı mesajlar ve gizli avatarlar ile yayıncılar için ideal.',
    values: {
      dashboardDensity: 'immersive',
      showAvatars: false,
      showTimestamps: false,
      showBadges: true,
      messageFontSize: 18,
      membersFontSize: 20,
      superChatFontSize: 20,
      overlayScale: 1.1,
      messageMaxWidth: 480,
      useSpecialMemberStyling: true,
      overlayBgColor: 'rgba(15, 15, 15, 0.95)',
      superChatOverlayBgColor: 'rgba(15, 15, 15, 0.95)',
      membersOverlayBgColor: 'rgba(15, 15, 15, 0.95)',
    },
  },
  {
    id: 'compact',
    name: 'Kompakt Alan',
    description: 'Ekranda az yer kaplayan, küçük yazılı ve daha dar kartlar.',
    values: {
      dashboardDensity: 'compact',
      showAvatars: true,
      showTimestamps: true,
      overlayScale: 0.85,
      messageMaxWidth: 340,
      messageFontSize: 13,
      membersFontSize: 14,
      superChatFontSize: 14,
      useSpecialMemberStyling: false,
    },
  },
  {
    id: 'light-minimal',
    name: 'Açık Tema (Minimalistik)',
    description: 'Açık renkli, modern ve temiz tasarım.',
    values: {
      overlayTheme: 'light',
      overlayBgColor: 'rgba(255, 255, 255, 0.95)',
      overlayTxColor: '#1a1a1a',
      superChatOverlayBgColor: 'rgba(255, 255, 255, 0.95)',
      superChatOverlayTxColor: '#1a1a1a',
      membersOverlayBgColor: 'rgba(255, 255, 255, 0.95)',
      membersOverlayTxColor: '#1a1a1a',
      useSpecialMemberStyling: true,
      membersGradientColor1: '#e8f5e9',
      membersGradientColor2: '#c8e6c9',
    },
  }
];
