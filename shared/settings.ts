export type OverlayTheme = 'dark' | 'light';
export type DashboardDensity = 'compact' | 'comfortable' | 'immersive';
export type WorkspaceFrame = 'full' | 'framed';

export type OverlayPosition =
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right'
  | 'center';

export type OverlayPositionOverride = OverlayPosition | '';

export interface AppSettings {
  autoSelectSuperChats: boolean;
  autoSelectMembers: boolean;
  accentColor: string;
  overlayScale: number;
  overlayTheme: OverlayTheme;
  serverPort: number;
  overlayPosition: OverlayPosition;
  dashboardDensity: DashboardDensity;
  dashboardPanelWidth: number;
  workspaceFrame: WorkspaceFrame;
  showAmbientGlow: boolean;
  showBadges: boolean;
  showSelectionPreview: boolean;
  showTimestamps: boolean;
  showAvatars: boolean;
  messageFontSize: number;
  maxMessages: number;
  superChatPopup: boolean;
  superChatDuration: number;
  customCss: string;
  superChatCss: string;
  membersCss: string;
  messageMaxWidth: number;
  includeSuperChatsInOverlay: boolean;
  includeMembersInOverlay: boolean;
  membersDuration: number;
  overlayTxColor: string;
  overlayBgColor: string;
  membersOverlayScale: number;
  membersFontSize: number;
  membersOverlayBgColor: string;
  membersOverlayTxColor: string;
  superChatOverlayScale: number;
  superChatFontSize: number;
  superChatOverlayBgColor: string;
  superChatOverlayTxColor: string;
  membersOverlayPosition: OverlayPositionOverride;
  superChatOverlayPosition: OverlayPositionOverride;
  superChatHeaderColor: string;
  membersGradientColor1: string;
  membersGradientColor2: string;
  useSpecialMemberStyling: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  autoSelectSuperChats: true,
  autoSelectMembers: true,
  accentColor: '#818cf8',
  overlayScale: 1,
  overlayTheme: 'dark',
  serverPort: 4100,
  overlayPosition: 'bottom-right',
  dashboardDensity: 'comfortable',
  dashboardPanelWidth: 360,
  workspaceFrame: 'full',
  showAmbientGlow: true,
  showBadges: true,
  showSelectionPreview: true,
  showTimestamps: true,
  showAvatars: true,
  messageFontSize: 16,
  maxMessages: 50,
  superChatPopup: true,
  superChatDuration: 10,
  customCss: '',
  superChatCss: '',
  membersCss: '',
  messageMaxWidth: 400,
  includeSuperChatsInOverlay: true,
  includeMembersInOverlay: true,
  membersDuration: 5,
  overlayTxColor: '#ffffff',
  overlayBgColor: 'rgba(20, 20, 22, 0.95)',
  membersOverlayScale: 1,
  membersFontSize: 14,
  membersOverlayBgColor: '',
  membersOverlayTxColor: '',
  superChatOverlayScale: 1,
  superChatFontSize: 14,
  superChatOverlayBgColor: '',
  superChatOverlayTxColor: '',
  membersOverlayPosition: '',
  superChatOverlayPosition: '',
  superChatHeaderColor: '#E62117',
  membersGradientColor1: '#1a1a1e',
  membersGradientColor2: '#1a1a1e',
  useSpecialMemberStyling: true,
};
