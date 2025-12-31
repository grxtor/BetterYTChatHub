'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SettingsView from '../components/SettingsView';
import TopBar from '../components/TopBar';

// Default settings fallback
const defaultSettings = {
    autoSelectSuperChats: true,
    autoSelectMembers: true,
    overlayScale: 100,
    overlayTheme: 'dark' as const,
    serverPort: 4100,
    overlayPosition: 'bottom-right' as const,
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
    // Member Overrides
    membersOverlayScale: 1,
    membersFontSize: 14,
    membersOverlayBgColor: '',
    membersOverlayTxColor: '',
    // Super Chat Overrides
    superChatOverlayScale: 1,
    superChatFontSize: 14,
    superChatOverlayBgColor: '',
    superChatOverlayTxColor: '',
    membersOverlayPosition: 'bottom-right' as const,
    superChatOverlayPosition: 'bottom-right' as const,
    superChatHeaderColor: '#E62117',
    membersGradientColor1: '#1a1a1e',
    membersGradientColor2: '#1a1a1e',
    useSpecialMemberStyling: true,
};

export default function SettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState(defaultSettings);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // Load settings from localStorage
        const saved = localStorage.getItem('better_yt_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings({ ...defaultSettings, ...parsed });
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
        setLoaded(true);
    }, []);

    const handleUpdate = (newSettings: any) => {
        setSettings(newSettings);
        localStorage.setItem('better_yt_settings', JSON.stringify(newSettings));

        // Sync with backend for overlay (cross-process sync)
        fetch('http://localhost:4100/settings/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSettings)
        }).catch(err => console.error('Failed to sync settings', err));
    };

    if (!loaded) return <div style={{ background: 'var(--bg-1)', height: '100vh', width: '100vw' }} />;

    return (
        <div style={{ height: '100vh', width: '100vw', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column' }}>
            <TopBar isSettings />

            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <SettingsView
                    settings={settings}
                    onUpdate={handleUpdate}
                    overlayUrl="http://localhost:3000/overlay"
                    onClose={undefined}
                />
            </div>
        </div>
    );
}
