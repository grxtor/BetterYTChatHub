/**
 * Dinamik Veri Sözlüğü - BetterYTChatHub
 * 
 * shared/settings.ts'deki AppSettings arayüzü için meta veri sağlar.
 * Pure TypeScript - React/Next.js bağımsız, Electron uyumlu.
 */

import { 
  AppSettings, 
  OverlayTheme, 
  DashboardDensity, 
  WorkspaceFrame,
  OverlayPosition,
  OverlayPositionOverride 
} from './settings';

// =============================================================================
// Type Definitions
// =============================================================================

export type SettingCategory = 
  | 'general' 
  | 'appearance' 
  | 'display' 
  | 'superchat' 
  | 'members' 
  | 'overlay' 
  | 'advanced';

export type SettingType = 
  | 'number' 
  | 'boolean' 
  | 'string' 
  | 'color' 
  | 'select' 
  | 'range';

export interface SettingOption {
  value: string | number | boolean;
  labelKey: string;
}

export interface ConditionalRequirement {
  key: keyof AppSettings;
  value: any;
}

export interface SettingDefinition {
  key: keyof AppSettings;
  category: SettingCategory;
  type: SettingType;
  defaultValue: any;
  
  // UI için i18n anahtarları
  labelKey: string;
  descriptionKey: string;
  
  // Validation
  min?: number;
  max?: number;
  step?: number;
  options?: SettingOption[];
  
  // Koşullu görünüm
  requires?: ConditionalRequirement[];
}

export interface CategoryGroup {
  id: string;
  labelKey: string;
  icon: string;
  settings: string[];
}

// =============================================================================
// Dil Dosyaları (i18n)
// =============================================================================

export const i18n = {
  tr: {
    // Genel Ayarlar
    'settings.autoSelectSuperChats.label': 'Otomatik SuperChat Seçimi',
    'settings.autoSelectSuperChats.desc': 'Yeni SuperChat geldiğinde otomatik olarak seçilir',
    'settings.autoSelectMembers.label': 'Otomatik Üye Mesajı Seçimi',
    'settings.autoSelectMembers.desc': 'Yeni üye mesajı geldiğinde otomatik olarak seçilir',
    'settings.serverPort.label': 'Sunucu Portu',
    'settings.serverPort.desc': 'Yerel sunucu için port numarası',

    // Görünüm Ayarları
    'settings.accentColor.label': 'Akcent Rengi',
    'settings.accentColor.desc': 'Vurgulanmış öğeler için kullanılacak renk',
    'settings.overlayTheme.label': 'Overlay Teması',
    'settings.overlayTheme.desc': 'Overlay için koyu veya açık tema seçin',
    'settings.workspaceFrame.label': 'Çalışma Alanı Çerçevesi',
    'settings.workspaceFrame.desc': 'Tam ekran veya çerçeveli görünüm',
    'settings.dashboardDensity.label': 'Panel Yoğunluğu',
    'settings.dashboardDensity.desc': 'Mesaj panelinin sıkılık düzeyi',

    // Görüntüleme Ayarları
    'settings.showAmbientGlow.label': 'Ortam Parlaklığı',
    'settings.showAmbientGlow.desc': 'Mesajlar için hafif arka plan efekti',
    'settings.showBadges.label': 'Rozetleri Göster',
    'settings.showBadges.desc': 'Moderatör veya sahip rozetlerini göster',
    'settings.showTimestamps.label': 'Zaman Damgası',
    'settings.showTimestamps.desc': 'Mesaj zamanını göster',
    'settings.showAvatars.label': 'Avatar Göster',
    'settings.showAvatars.desc': 'Kullanıcı avatarını göster',
    'settings.messageFontSize.label': 'Mesaj Yazı Boyutu',
    'settings.messageFontSize.desc': 'Mesaj metninin yazı boyutu (px)',
    'settings.messageMaxWidth.label': 'Maksimum Mesaj Genişliği',
    'settings.messageMaxWidth.desc': 'Mesaj kutusunun maksimum genişliği (px)',
    'settings.maxMessages.label': 'Maksimum Mesaj Sayısı',
    'settings.maxMessages.desc': 'Saklanacak maksimum mesaj sayısı',
    'settings.showSelectionPreview.label': 'Seçim Önizlemesi',
    'settings.showSelectionPreview.desc': 'Seçili mesajları önizleme panelinde göster',
    'settings.dashboardPanelWidth.label': 'Panel Genişliği',
    'settings.dashboardPanelWidth.desc': 'Yan panelin genişliği (px)',

    // SuperChat Ayarları
    'settings.superChatPopup.label': 'SuperChat Popup',
    'settings.superChatPopup.desc': 'Yeni SuperChat için popup göster',
    'settings.superChatDuration.label': 'SuperChat Süresi',
    'settings.superChatDuration.desc': 'SuperChat\'in ekranda kalma süresi (saniye)',
    'settings.superChatCss.label': 'SuperChat CSS',
    'settings.superChatCss.desc': 'SuperChat için özel CSS kodları',
    'settings.superChatOverlayScale.label': 'SuperChat Overlay Ölçeği',
    'settings.superChatOverlayScale.desc': 'Overlay boyutlandırma oranı',
    'settings.superChatFontSize.label': 'SuperChat Yazı Boyutu',
    'settings.superChatFontSize.desc': 'SuperChat metin yazı boyutu (px)',
    'settings.superChatOverlayBgColor.label': 'SuperChat Arka Plan Rengi',
    'settings.superChatOverlayBgColor.desc': 'Overlay arka plan rengi',
    'settings.superChatOverlayTxColor.label': 'SuperChat Yazı Rengi',
    'settings.superChatOverlayTxColor.desc': 'Overlay metin rengi',
    'settings.superChatOverlayPosition.label': 'SuperChat Konumu',
    'settings.superChatOverlayPosition.desc': 'SuperChat overlay pozisyonu',
    'settings.superChatHeaderColor.label': 'SuperChat Başlık Rengi',
    'settings.superChatHeaderColor.desc': 'SuperChat başlık çubuğu rengi',
    'settings.includeSuperChatsInOverlay.label': 'Overlay\'de SuperChat Göster',
    'settings.includeSuperChats.desc': 'SuperChat\'leri overlay\'de göster',

    // Üye Ayarları
    'settings.membersCss.label': 'Üye CSS',
    'settings.membersCss.desc': 'Üye mesajları için özel CSS kodları',
    'settings.membersDuration.label': 'Üye Mesajı Süresi',
    'settings.membersDuration.desc': 'Üye mesajının ekranda kalma süresi (saniye)',
    'settings.membersOverlayScale.label': 'Üye Overlay Ölçeği',
    'settings.membersOverlayScale.desc': 'Üye overlay boyutlandırma oranı',
    'settings.membersFontSize.label': 'Üye Yazı Boyutu',
    'settings.membersFontSize.desc': 'Üye mesajı yazı boyutu (px)',
    'settings.membersOverlayBgColor.label': 'Üye Arka Plan Rengi',
    'settings.membersOverlayBgColor.desc': 'Üye overlay arka plan rengi',
    'settings.membersOverlayTxColor.label': 'Üye Yazı Rengi',
    'settings.membersOverlayTxColor.desc': 'Üye overlay metin rengi',
    'settings.membersOverlayPosition.label': 'Üye Konumu',
    'settings.membersOverlayPosition.desc': 'Üye overlay pozisyonu',
    'settings.membersGradientColor1.label': 'Üye Gradyan Rengi 1',
    'settings.membersGradientColor1.desc': 'Gradyan arka plan için başlangıç rengi',
    'settings.membersGradientColor2.label': 'Üye Gradyan Rengi 2',
    'settings.membersGradientColor2.desc': 'Gradyan arka plan için bitiş rengi',
    'settings.useSpecialMemberStyling.label': 'Özel Üye Stili',
    'settings.useSpecialMemberStyling.desc': 'Üye mesajları için özel stil kullan',
    'settings.includeMembersInOverlay.label': 'Overlay\'de Üye Göster',
    'settings.includeMembers.desc': 'Üye mesajlarını overlay\'de göster',

    // Overlay Ayarları
    'settings.overlayScale.label': 'Overlay Ölçeği',
    'settings.overlayScale.desc': 'Genel overlay boyutlandırma oranı',
    'settings.overlayPosition.label': 'Overlay Konumu',
    'settings.overlayPosition.desc': 'Overlay\'in ekrandaki pozisyonu',
    'settings.overlayTxColor.label': 'Overlay Yazı Rengi',
    'settings.overlayTxColor.desc': 'Overlay metin rengi',
    'settings.overlayBgColor.label': 'Overlay Arka Plan Rengi',
    'settings.overlayBgColor.desc': 'Overlay arka plan rengi (rgba destekli)',
    'settings.customCss.label': 'Özel CSS',
    'settings.customCss.desc': 'Tüm overlay için özel CSS kodları',

    // Seçenek Etiketleri
    'options.dark': 'Koyu',
    'options.light': 'Açık',
    'options.compact': 'Sıkı',
    'options.comfortable': 'Rahat',
    'options.immersive': 'Immersif',
    'options.full': 'Tam Ekran',
    'options.framed': 'Çerçeveli',
    'options.bottom-left': 'Sol Alt',
    'options.bottom-right': 'Sağ Alt',
    'options.top-left': 'Sol Üst',
    'options.top-right': 'Sağ Üst',
    'options.center': 'Merkez',

    // Kategori Etiketleri
    'category.general': 'Genel',
    'category.appearance': 'Görünüm',
    'category.display': 'Görüntüleme',
    'category.superchat': 'SuperChat',
    'category.members': 'Üyeler',
    'category.overlay': 'Overlay',
    'category.advanced': 'Gelişmiş',
  },
  en: {
    // Genel Ayarlar
    'settings.autoSelectSuperChats.label': 'Auto SuperChat Selection',
    'settings.autoSelectSuperChats.desc': 'Automatically select new SuperChats',
    'settings.autoSelectMembers.label': 'Auto Member Message Selection',
    'settings.autoSelectMembers.desc': 'Automatically select new member messages',
    'settings.serverPort.label': 'Server Port',
    'settings.serverPort.desc': 'Port number for local server',

    // Görünüm Ayarları
    'settings.accentColor.label': 'Accent Color',
    'settings.accentColor.desc': 'Color used for highlighted elements',
    'settings.overlayTheme.label': 'Overlay Theme',
    'settings.overlayTheme.desc': 'Choose dark or light theme for overlay',
    'settings.workspaceFrame.label': 'Workspace Frame',
    'settings.workspaceFrame.desc': 'Full screen or framed view',
    'settings.dashboardDensity.label': 'Dashboard Density',
    'settings.dashboardDensity.desc': 'Message panel density level',

    // Görüntüleme Ayarları
    'settings.showAmbientGlow.label': 'Ambient Glow',
    'settings.showAmbientGlow.desc': 'Subtle background effect for messages',
    'settings.showBadges.label': 'Show Badges',
    'settings.showBadges.desc': 'Show moderator or owner badges',
    'settings.showTimestamps.label': 'Timestamp',
    'settings.showTimestamps.desc': 'Show message timestamp',
    'settings.showAvatars.label': 'Show Avatar',
    'settings.showAvatars.desc': 'Show user avatar',
    'settings.messageFontSize.label': 'Message Font Size',
    'settings.messageFontSize.desc': 'Message text font size (px)',
    'settings.messageMaxWidth.label': 'Max Message Width',
    'settings.messageMaxWidth.desc': 'Maximum message box width (px)',
    'settings.maxMessages.label': 'Max Messages',
    'settings.maxMessages.desc': 'Maximum number of messages to keep',
    'settings.showSelectionPreview.label': 'Selection Preview',
    'settings.showSelectionPreview.desc': 'Show selected messages in preview panel',
    'settings.dashboardPanelWidth.label': 'Panel Width',
    'settings.dashboardPanelWidth.desc': 'Side panel width (px)',

    // SuperChat Ayarları
    'settings.superChatPopup.label': 'SuperChat Popup',
    'settings.superChatPopup.desc': 'Show popup for new SuperChats',
    'settings.superChatDuration.label': 'SuperChat Duration',
    'settings.superChatDuration.desc': 'How long SuperChat stays on screen (seconds)',
    'settings.superChatCss.label': 'SuperChat CSS',
    'settings.superChatCss.desc': 'Custom CSS for SuperChat',
    'settings.superChatOverlayScale.label': 'SuperChat Overlay Scale',
    'settings.superChatOverlayScale.desc': 'Overlay scaling factor',
    'settings.superChatFontSize.label': 'SuperChat Font Size',
    'settings.superChatFontSize.desc': 'SuperChat text font size (px)',
    'settings.superChatOverlayBgColor.label': 'SuperChat Background Color',
    'settings.superChatOverlayBgColor.desc': 'Overlay background color',
    'settings.superChatOverlayTxColor.label': 'SuperChat Text Color',
    'settings.superChatOverlayTxColor.desc': 'Overlay text color',
    'settings.superChatOverlayPosition.label': 'SuperChat Position',
    'settings.superChatOverlayPosition.desc': 'SuperChat overlay position',
    'settings.superChatHeaderColor.label': 'SuperChat Header Color',
    'settings.superChatHeaderColor.desc': 'SuperChat header bar color',
    'settings.includeSuperChatsInOverlay.label': 'Show SuperChats in Overlay',
    'settings.includeSuperChats.desc': 'Show SuperChats in overlay',

    // Üye Ayarları
    'settings.membersCss.label': 'Members CSS',
    'settings.membersCss.desc': 'Custom CSS for member messages',
    'settings.membersDuration.label': 'Member Message Duration',
    'settings.membersDuration.desc': 'How long member message stays on screen (seconds)',
    'settings.membersOverlayScale.label': 'Members Overlay Scale',
    'settings.membersOverlayScale.desc': 'Members overlay scaling factor',
    'settings.membersFontSize.label': 'Members Font Size',
    'settings.membersFontSize.desc': 'Member message font size (px)',
    'settings.membersOverlayBgColor.label': 'Members Background Color',
    'settings.membersOverlayBgColor.desc': 'Members overlay background color',
    'settings.membersOverlayTxColor.label': 'Members Text Color',
    'settings.membersOverlayTxColor.desc': 'Members overlay text color',
    'settings.membersOverlayPosition.label': 'Members Position',
    'settings.membersOverlayPosition.desc': 'Members overlay position',
    'settings.membersGradientColor1.label': 'Members Gradient Color 1',
    'settings.membersGradientColor1.desc': 'Gradient background start color',
    'settings.membersGradientColor2.label': 'Members Gradient Color 2',
    'settings.membersGradientColor2.desc': 'Gradient background end color',
    'settings.useSpecialMemberStyling.label': 'Special Member Styling',
    'settings.useSpecialMemberStyling.desc': 'Use special styling for member messages',
    'settings.includeMembersInOverlay.label': 'Show Members in Overlay',
    'settings.includeMembers.desc': 'Show member messages in overlay',

    // Overlay Ayarları
    'settings.overlayScale.label': 'Overlay Scale',
    'settings.overlayScale.desc': 'General overlay scaling factor',
    'settings.overlayPosition.label': 'Overlay Position',
    'settings.overlayPosition.desc': 'Position of overlay on screen',
    'settings.overlayTxColor.label': 'Overlay Text Color',
    'settings.overlayTxColor.desc': 'Overlay text color',
    'settings.overlayBgColor.label': 'Overlay Background Color',
    'settings.overlayBgColor.desc': 'Overlay background color (supports rgba)',
    'settings.customCss.label': 'Custom CSS',
    'settings.customCss.desc': 'Custom CSS for all overlays',

    // Seçenek Etiketleri
    'options.dark': 'Dark',
    'options.light': 'Light',
    'options.compact': 'Compact',
    'options.comfortable': 'Comfortable',
    'options.immersive': 'Immersive',
    'options.full': 'Full Screen',
    'options.framed': 'Framed',
    'options.bottom-left': 'Bottom Left',
    'options.bottom-right': 'Bottom Right',
    'options.top-left': 'Top Left',
    'options.top-right': 'Top Right',
    'options.center': 'Center',

    // Kategori Etiketleri
    'category.general': 'General',
    'category.appearance': 'Appearance',
    'category.display': 'Display',
    'category.superchat': 'SuperChat',
    'category.members': 'Members',
    'category.overlay': 'Overlay',
    'category.advanced': 'Advanced',
  }
} as const;

export type Language = keyof typeof i18n;
export type TranslationKey = keyof typeof i18n['tr'];

// =============================================================================
// Setting Definitions - Ana Sözlük
// =============================================================================

export const SETTINGS_DICTIONARY: SettingDefinition[] = [
  // =====================
  // GENERAL - Genel
  // =====================
  {
    key: 'autoSelectSuperChats',
    category: 'general',
    type: 'boolean',
    defaultValue: true,
    labelKey: 'settings.autoSelectSuperChats.label',
    descriptionKey: 'settings.autoSelectSuperChats.desc',
  },
  {
    key: 'autoSelectMembers',
    category: 'general',
    type: 'boolean',
    defaultValue: true,
    labelKey: 'settings.autoSelectMembers.label',
    descriptionKey: 'settings.autoSelectMembers.desc',
  },
  {
    key: 'serverPort',
    category: 'general',
    type: 'number',
    defaultValue: 4100,
    labelKey: 'settings.serverPort.label',
    descriptionKey: 'settings.serverPort.desc',
    min: 1024,
    max: 65535,
    step: 1,
  },

  // =====================
  // APPEARANCE - Görünüm
  // =====================
  {
    key: 'accentColor',
    category: 'appearance',
    type: 'color',
    defaultValue: '#818cf8',
    labelKey: 'settings.accentColor.label',
    descriptionKey: 'settings.accentColor.desc',
  },
  {
    key: 'overlayTheme',
    category: 'appearance',
    type: 'select',
    defaultValue: 'dark',
    labelKey: 'settings.overlayTheme.label',
    descriptionKey: 'settings.overlayTheme.desc',
    options: [
      { value: 'dark', labelKey: 'options.dark' },
      { value: 'light', labelKey: 'options.light' },
    ],
  },
  {
    key: 'workspaceFrame',
    category: 'appearance',
    type: 'select',
    defaultValue: 'full',
    labelKey: 'settings.workspaceFrame.label',
    descriptionKey: 'settings.workspaceFrame.desc',
    options: [
      { value: 'full', labelKey: 'options.full' },
      { value: 'framed', labelKey: 'options.framed' },
    ],
  },
  {
    key: 'dashboardDensity',
    category: 'appearance',
    type: 'select',
    defaultValue: 'comfortable',
    labelKey: 'settings.dashboardDensity.label',
    descriptionKey: 'settings.dashboardDensity.desc',
    options: [
      { value: 'compact', labelKey: 'options.compact' },
      { value: 'comfortable', labelKey: 'options.comfortable' },
      { value: 'immersive', labelKey: 'options.immersive' },
    ],
  },

  // =====================
  // DISPLAY - Görüntüleme
  // =====================
  {
    key: 'showAmbientGlow',
    category: 'display',
    type: 'boolean',
    defaultValue: true,
    labelKey: 'settings.showAmbientGlow.label',
    descriptionKey: 'settings.showAmbientGlow.desc',
  },
  {
    key: 'showBadges',
    category: 'display',
    type: 'boolean',
    defaultValue: true,
    labelKey: 'settings.showBadges.label',
    descriptionKey: 'settings.showBadges.desc',
  },
  {
    key: 'showTimestamps',
    category: 'display',
    type: 'boolean',
    defaultValue: true,
    labelKey: 'settings.showTimestamps.label',
    descriptionKey: 'settings.showTimestamps.desc',
  },
  {
    key: 'showAvatars',
    category: 'display',
    type: 'boolean',
    defaultValue: true,
    labelKey: 'settings.showAvatars.label',
    descriptionKey: 'settings.showAvatars.desc',
  },
  {
    key: 'messageFontSize',
    category: 'display',
    type: 'number',
    defaultValue: 16,
    labelKey: 'settings.messageFontSize.label',
    descriptionKey: 'settings.messageFontSize.desc',
    min: 10,
    max: 32,
    step: 1,
  },
  {
    key: 'messageMaxWidth',
    category: 'display',
    type: 'number',
    defaultValue: 400,
    labelKey: 'settings.messageMaxWidth.label',
    descriptionKey: 'settings.messageMaxWidth.desc',
    min: 200,
    max: 800,
    step: 10,
  },
  {
    key: 'maxMessages',
    category: 'display',
    type: 'number',
    defaultValue: 50,
    labelKey: 'settings.maxMessages.label',
    descriptionKey: 'settings.maxMessages.desc',
    min: 10,
    max: 500,
    step: 10,
  },
  {
    key: 'showSelectionPreview',
    category: 'display',
    type: 'boolean',
    defaultValue: true,
    labelKey: 'settings.showSelectionPreview.label',
    descriptionKey: 'settings.showSelectionPreview.desc',
  },
  {
    key: 'dashboardPanelWidth',
    category: 'display',
    type: 'number',
    defaultValue: 360,
    labelKey: 'settings.dashboardPanelWidth.label',
    descriptionKey: 'settings.dashboardPanelWidth.desc',
    min: 200,
    max: 600,
    step: 10,
  },

  // =====================
  // SUPERCHAT
  // =====================
  {
    key: 'superChatPopup',
    category: 'superchat',
    type: 'boolean',
    defaultValue: true,
    labelKey: 'settings.superChatPopup.label',
    descriptionKey: 'settings.superChatPopup.desc',
  },
  {
    key: 'superChatDuration',
    category: 'superchat',
    type: 'number',
    defaultValue: 10,
    labelKey: 'settings.superChatDuration.label',
    descriptionKey: 'settings.superChatDuration.desc',
    min: 1,
    max: 60,
    step: 1,
  },
  {
    key: 'superChatCss',
    category: 'superchat',
    type: 'string',
    defaultValue: '',
    labelKey: 'settings.superChatCss.label',
    descriptionKey: 'settings.superChatCss.desc',
  },
  {
    key: 'superChatOverlayScale',
    category: 'superchat',
    type: 'range',
    defaultValue: 1,
    labelKey: 'settings.superChatOverlayScale.label',
    descriptionKey: 'settings.superChatOverlayScale.desc',
    min: 0.5,
    max: 2,
    step: 0.1,
  },
  {
    key: 'superChatFontSize',
    category: 'superchat',
    type: 'number',
    defaultValue: 14,
    labelKey: 'settings.superChatFontSize.label',
    descriptionKey: 'settings.superChatFontSize.desc',
    min: 10,
    max: 24,
    step: 1,
  },
  {
    key: 'superChatOverlayBgColor',
    category: 'superchat',
    type: 'color',
    defaultValue: '',
    labelKey: 'settings.superChatOverlayBgColor.label',
    descriptionKey: 'settings.superChatOverlayBgColor.desc',
  },
  {
    key: 'superChatOverlayTxColor',
    category: 'superchat',
    type: 'color',
    defaultValue: '',
    labelKey: 'settings.superChatOverlayTxColor.label',
    descriptionKey: 'settings.superChatOverlayTxColor.desc',
  },
  {
    key: 'superChatOverlayPosition',
    category: 'superchat',
    type: 'select',
    defaultValue: '',
    labelKey: 'settings.superChatOverlayPosition.label',
    descriptionKey: 'settings.superChatOverlayPosition.desc',
    options: [
      { value: '', labelKey: 'options.default' },
      { value: 'bottom-left', labelKey: 'options.bottom-left' },
      { value: 'bottom-right', labelKey: 'options.bottom-right' },
      { value: 'top-left', labelKey: 'options.top-left' },
      { value: 'top-right', labelKey: 'options.top-right' },
      { value: 'center', labelKey: 'options.center' },
    ],
  },
  {
    key: 'superChatHeaderColor',
    category: 'superchat',
    type: 'color',
    defaultValue: '#E62117',
    labelKey: 'settings.superChatHeaderColor.label',
    descriptionKey: 'settings.superChatHeaderColor.desc',
  },
  {
    key: 'includeSuperChatsInOverlay',
    category: 'superchat',
    type: 'boolean',
    defaultValue: true,
    labelKey: 'settings.includeSuperChatsInOverlay.label',
    descriptionKey: 'settings.includeSuperChats.desc',
  },

  // =====================
  // MEMBERS - Üyeler
  // =====================
  {
    key: 'membersCss',
    category: 'members',
    type: 'string',
    defaultValue: '',
    labelKey: 'settings.membersCss.label',
    descriptionKey: 'settings.membersCss.desc',
  },
  {
    key: 'membersDuration',
    category: 'members',
    type: 'number',
    defaultValue: 5,
    labelKey: 'settings.membersDuration.label',
    descriptionKey: 'settings.membersDuration.desc',
    min: 1,
    max: 60,
    step: 1,
  },
  {
    key: 'membersOverlayScale',
    category: 'members',
    type: 'range',
    defaultValue: 1,
    labelKey: 'settings.membersOverlayScale.label',
    descriptionKey: 'settings.membersOverlayScale.desc',
    min: 0.5,
    max: 2,
    step: 0.1,
  },
  {
    key: 'membersFontSize',
    category: 'members',
    type: 'number',
    defaultValue: 14,
    labelKey: 'settings.membersFontSize.label',
    descriptionKey: 'settings.membersFontSize.desc',
    min: 10,
    max: 24,
    step: 1,
  },
  {
    key: 'membersOverlayBgColor',
    category: 'members',
    type: 'color',
    defaultValue: '',
    labelKey: 'settings.membersOverlayBgColor.label',
    descriptionKey: 'settings.membersOverlayBgColor.desc',
  },
  {
    key: 'membersOverlayTxColor',
    category: 'members',
    type: 'color',
    defaultValue: '',
    labelKey: 'settings.membersOverlayTxColor.label',
    descriptionKey: 'settings.membersOverlayTxColor.desc',
  },
  {
    key: 'membersOverlayPosition',
    category: 'members',
    type: 'select',
    defaultValue: '',
    labelKey: 'settings.membersOverlayPosition.label',
    descriptionKey: 'settings.membersOverlayPosition.desc',
    options: [
      { value: '', labelKey: 'options.default' },
      { value: 'bottom-left', labelKey: 'options.bottom-left' },
      { value: 'bottom-right', labelKey: 'options.bottom-right' },
      { value: 'top-left', labelKey: 'options.top-left' },
      { value: 'top-right', labelKey: 'options.top-right' },
      { value: 'center', labelKey: 'options.center' },
    ],
  },
  {
    key: 'membersGradientColor1',
    category: 'members',
    type: 'color',
    defaultValue: '#1a1a1e',
    labelKey: 'settings.membersGradientColor1.label',
    descriptionKey: 'settings.membersGradientColor1.desc',
  },
  {
    key: 'membersGradientColor2',
    category: 'members',
    type: 'color',
    defaultValue: '#1a1a1e',
    labelKey: 'settings.membersGradientColor2.label',
    descriptionKey: 'settings.membersGradientColor2.desc',
  },
  {
    key: 'useSpecialMemberStyling',
    category: 'members',
    type: 'boolean',
    defaultValue: true,
    labelKey: 'settings.useSpecialMemberStyling.label',
    descriptionKey: 'settings.useSpecialMemberStyling.desc',
  },
  {
    key: 'includeMembersInOverlay',
    category: 'members',
    type: 'boolean',
    defaultValue: true,
    labelKey: 'settings.includeMembersInOverlay.label',
    descriptionKey: 'settings.includeMembers.desc',
  },

  // =====================
  // OVERLAY
  // =====================
  {
    key: 'overlayScale',
    category: 'overlay',
    type: 'range',
    defaultValue: 1,
    labelKey: 'settings.overlayScale.label',
    descriptionKey: 'settings.overlayScale.desc',
    min: 0.5,
    max: 2,
    step: 0.1,
  },
  {
    key: 'overlayPosition',
    category: 'overlay',
    type: 'select',
    defaultValue: 'bottom-right',
    labelKey: 'settings.overlayPosition.label',
    descriptionKey: 'settings.overlayPosition.desc',
    options: [
      { value: 'bottom-left', labelKey: 'options.bottom-left' },
      { value: 'bottom-right', labelKey: 'options.bottom-right' },
      { value: 'top-left', labelKey: 'options.top-left' },
      { value: 'top-right', labelKey: 'options.top-right' },
      { value: 'center', labelKey: 'options.center' },
    ],
  },
  {
    key: 'overlayTxColor',
    category: 'overlay',
    type: 'color',
    defaultValue: '#ffffff',
    labelKey: 'settings.overlayTxColor.label',
    descriptionKey: 'settings.overlayTxColor.desc',
  },
  {
    key: 'overlayBgColor',
    category: 'overlay',
    type: 'string',
    defaultValue: 'rgba(20, 20, 22, 0.95)',
    labelKey: 'settings.overlayBgColor.label',
    descriptionKey: 'settings.overlayBgColor.desc',
  },
  {
    key: 'customCss',
    category: 'overlay',
    type: 'string',
    defaultValue: '',
    labelKey: 'settings.customCss.label',
    descriptionKey: 'settings.customCss.desc',
  },
];

// =============================================================================
// Kategori Grupları
// =============================================================================

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'general',
    labelKey: 'category.general',
    icon: 'settings',
    settings: ['autoSelectSuperChats', 'autoSelectMembers', 'serverPort'],
  },
  {
    id: 'appearance',
    labelKey: 'category.appearance',
    icon: 'palette',
    settings: ['accentColor', 'overlayTheme', 'workspaceFrame', 'dashboardDensity'],
  },
  {
    id: 'display',
    labelKey: 'category.display',
    icon: 'display',
    settings: [
      'showAmbientGlow', 
      'showBadges', 
      'showTimestamps', 
      'showAvatars',
      'messageFontSize',
      'messageMaxWidth',
      'maxMessages',
      'showSelectionPreview',
      'dashboardPanelWidth'
    ],
  },
  {
    id: 'superchat',
    labelKey: 'category.superchat',
    icon: 'superchat',
    settings: [
      'superChatPopup',
      'superChatDuration',
      'superChatCss',
      'superChatOverlayScale',
      'superChatFontSize',
      'superChatOverlayBgColor',
      'superChatOverlayTxColor',
      'superChatOverlayPosition',
      'superChatHeaderColor',
      'includeSuperChatsInOverlay'
    ],
  },
  {
    id: 'members',
    labelKey: 'category.members',
    icon: 'members',
    settings: [
      'membersCss',
      'membersDuration',
      'membersOverlayScale',
      'membersFontSize',
      'membersOverlayBgColor',
      'membersOverlayTxColor',
      'membersOverlayPosition',
      'membersGradientColor1',
      'membersGradientColor2',
      'useSpecialMemberStyling',
      'includeMembersInOverlay'
    ],
  },
  {
    id: 'overlay',
    labelKey: 'category.overlay',
    icon: 'layers',
    settings: ['overlayScale', 'overlayPosition', 'overlayTxColor', 'overlayBgColor', 'customCss'],
  },
];

// =============================================================================
// Yardımcı Fonksiyonlar
// =============================================================================

/**
 * Belirli bir anahtara göre setting tanımını bulur
 */
export function getSettingByKey(key: keyof AppSettings): SettingDefinition | undefined {
  return SETTINGS_DICTIONARY.find(setting => setting.key === key);
}

/**
 * Kategoriye göre ayarları filtreler
 */
export function getSettingsByCategory(category: SettingCategory): SettingDefinition[] {
  return SETTINGS_DICTIONARY.filter(setting => setting.category === category);
}

/**
 * Belirli bir koşulu karşılayan ayarları döndürür
 */
export function getVisibleSettings(conditions: Partial<AppSettings>): SettingDefinition[] {
  return SETTINGS_DICTIONARY.filter(setting => {
    if (!setting.requires) return true;
    
    return setting.requires.every(req => {
      const currentValue = conditions[req.key];
      return currentValue === req.value;
    });
  });
}

/**
 * Çeviri fonksiyonu - verilen dil ve anahtara göre metin döndürür
 */
export function t(key: TranslationKey, lang: Language = 'tr'): string {
  return i18n[lang][key] || i18n['tr'][key] || key;
}

/**
 * Tüm ayar anahtarlarını döndürür (type-safe)
 */
export function getAllSettingKeys(): (keyof AppSettings)[] {
  return SETTINGS_DICTIONARY.map(setting => setting.key);
}

/**
 * Kategori gruplarını döndürür
 */
export function getCategoryGroups(): CategoryGroup[] {
  return CATEGORY_GROUPS;
}

/**
 * SettingDefinition'ı lookup map'e dönüştürür
 */
export function getSettingsMap(): Map<keyof AppSettings, SettingDefinition> {
  const map = new Map<keyof AppSettings, SettingDefinition>();
  SETTINGS_DICTIONARY.forEach(setting => {
    map.set(setting.key, setting);
  });
  return map;
}
