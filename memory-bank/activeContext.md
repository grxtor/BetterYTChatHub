# Active Context

## Current Focus
- **Live YouTube integration active**: Backend connects to real YouTube Live chat via Innertube
- **Dark minimalist UI redesign**: Clean dashboard with dark theme (#0a0a0a background), tab-based navigation, grid layout, and minimal spacing
- **Broadcast console redesign**: Dashboard feed, super chat rail, and members rail are being repositioned around a denser operator-facing control-room layout.
- **Desktop workspace shell**: The UI is shifting toward an Electron-style multi-panel shell with a framed/full-width workspace mode, configurable rail width, density presets, and accent-driven theming.
- **Live settings persistence**: Settings UI now aims to auto-save instantly, keep overlays in sync across tabs/pages, and avoid stale local-only state.
- **Connection flow**: Shows connection prompt on startup, disappears after connecting to YouTube Live stream
- **Rich message parsing**: Full support for superchats, memberships, badges (moderator, member, verified)
- **Timezone-aware timestamps**: All message timestamps display in user's local timezone with proper browser detection
- **Visual selection feedback**: Previously selected messages show dimmed state for better user experience
- **Image proxy implemented**: Backend proxies all YouTube CDN images with caching to prevent 429 rate limit errors

## Recent Decisions
- Introduced a shared `AppSettings` model in `shared/settings.ts` and moved all settings consumers to the same defaults + normalization pipeline.
- Added a client-side settings sync layer backed by `localStorage`, `BroadcastChannel`, and a custom browser event so settings apply live across dashboard/settings/overlay routes.
- Migrated the settings page to live auto-save with explicit state badges (`Saved locally`, `Synced`, `Sync failed`) and replaced non-accessible toggle `div`s with real switch controls.
- Added Tailwind CSS v4 to the client while keeping existing design tokens in `globals.css`, enabling a hybrid utility + token-driven UI system.
- Fixed a Tailwind cascade regression by moving legacy global styles into explicit CSS layers and defining a fixed Tailwind spacing token. Without this, unlayered reset/component rules were silently overriding `px-*`, `py-*`, and `mx-auto` utilities in the dashboard/settings layouts.
- Rebuilt the settings preview color controls so stored `rgba(...)` values remain supported without feeding invalid values into `input[type=color]`.
- Added a dedicated Workspace tab in settings with app-shell controls for workspace frame, density, rail width, accent color, ambient glow, badge visibility, and selection preview behavior.
- Rebuilt the dashboard into a command-deck layout with summary cards, live feed search, pinned selection preview, and a settings-driven right rail that better matches an Electron/multi-platform control room.
- Added responsive settings layout behavior so sidebar/content/preview collapse gracefully on narrower screens instead of assuming a fixed 3-column desktop-only layout.
- Reworked dashboard message/event cards so avatar/timestamp visibility settings now apply consistently to normal chat rows, super chats, and member panels.
- Rewrote the README to match the actual current codebase: Next.js 15 + Fastify web app, shared settings system, command-deck dashboard, overlay routes, and real troubleshooting steps for port conflicts / `.next` corruption. Removed inaccurate claims about a committed Electron wrapper.
- Rewrote the README again in fully English product-documentation form and verified that user-facing strings across `client`, `backend`, `shared`, and `README.md` no longer contain Turkish text.
- Fixed backend startup regression by invoking `startBackend()` from `backend/src/index.ts`; previously the dev command exited immediately without binding port 4100, causing frontend `ERR_CONNECTION_REFUSED` errors for `/chat/*`, `/overlay/*`, and `/health`.
- Hardened dashboard connection flow so the UI treats the backend being offline as a normal state: `/health` failures now set `backendAvailable=false`, message polling and SSE subscription are paused until the backend is reachable again, and the empty state explains that the backend must be started on port 4100.
- Fixed CORS issues by setting headers on raw response object after `reply.hijack()` for SSE endpoint
- Added `.env` loading via `tsx --env-file=.env` for YouTube Live ID configuration
- Enhanced `ChatMessage` type to include badges, author photos, superchat info, and membership status
- Redesigned dashboard with gradient backgrounds, centered layout, and modern glass-morphism effects
- Separated overlay preview into its own highlighted section that only appears when a message is selected
- Centered overlay message card content so live chat, superchat, and membership boxes align for OBS
- **UI Layout Fixed**: Adjusted the dashboard grid to eliminate unnecessary space and properly align content. The Super Chat card is now left-aligned for better visual consistency.
- **Currency Parsing**: Improved the backend logic to correctly parse Super Chat amounts and currencies, including for non-standard formats like TRY. The hardcoded 'USD' fallback has been removed.
- **Conditional Auto-Scroll**: Implemented intelligent auto-scrolling that only activates when the user is at the bottom of the chat, preventing interruptions when reading older messages.
- **Overlay Redesign**: The overlay has been completely restyled to match the dashboard's compact, dark theme with optimized spacing (30-40% more compact).
- **Overlay Timestamps Removed**: Removed timestamps from overlay for cleaner OBS display while keeping them in dashboard.
- **Gifted Memberships**: The 'Memberships & Milestones' panel now correctly displays the user who purchased the gift, not the recipient.
- **Timestamp Resolution Fixed**: Resolved critical issue where timestamps showed 1970 epoch time. Now uses `timestamp_usec` (microseconds) from YouTube data and converts properly to user's local timezone.
- **Timezone Support**: Implemented browser timezone detection and proper timestamp formatting across dashboard using `Intl.DateTimeFormat` with GMT+3 fallback.
- **Visual Selection States**: Added three-tier visual feedback system - active (selected), normal, and previously-selected (dimmed) states for better user experience.
- **UI Polish**: Fixed pulse animations on initial load, hidden N/A messages.
- **Image Proxy**: Added `/proxy/image` endpoint in backend with in-memory caching (24hr TTL, max 1000 images) to prevent YouTube CDN 429 rate limit errors. All avatars, badges, and emojis now route through proxy with stale-on-error fallback.
- **Message Switching Animation**: Added smooth fade-out/fade-in transitions when switching between selected messages in overlay (300ms duration).
- **Smart Message Preservation**: Implemented intelligent message trimming - regular chat messages limited to 200, but superchats and memberships preserved for entire session. Trimming happens on every message to prevent loss of special messages.
- **Super Sticker Support**: Added full support for super sticker image display. Backend parser extracts sticker URL and accessibility label from `item.sticker` array in YouTube data. Added `stickerUrl` and `stickerAlt` fields to `SuperChatInfo` type. Image proxy whitelist updated to include `lh3.googleusercontent.com` domain. Dashboard and overlay both render super stickers with 144x144px max dimensions, centered layout, and graceful error handling that hides broken images. Protocol-relative URLs (`//domain.com`) are automatically converted to HTTPS.
- **Leaderboard Badge Support**: Implemented YouTube leaderboard rank display (Top Chatter feature). Backend parser extracts rank from `before_content_buttons` array with CROWN icon, parsing rank number from title field (e.g., "#3"). Added `leaderboardRank` field to `ChatMessage` type. Dashboard and overlay render leaderboard badge with crown emoji (👑) and rank number, styled with golden background (rgba(251, 191, 36, 0.2)) and yellow text (#fcd34d) for prominence.
- **Task Master AI Integration**: Initialized Task Master AI with OpenRouter's x-ai/grok-code-fast-1 (main), google/gemini-2.5-pro (research), and google/gemini-2.5-flash (fallback) models. Successfully completed Task 2 (Super Sticker Display), Task 3 (Leaderboard Badge), and Task 4 (Live Poll Indicator).
- **Live Poll Indicator**: Added simple poll detection that shows a pulsing "📊 Active Poll" indicator in the dashboard header when a YouTube poll is active. Backend listens for `UpdateLiveChatPollAction` and `CloseLiveChatActionPanelAction`/`RemoveBannerForLiveChatCommand` events. Indicator automatically appears/disappears based on poll state. Note: YouTube's API does not provide live vote percentages, so the feature only indicates poll presence without showing results.

## Immediate Next Steps
1. Regression-test the expanded workspace settings flow against real YouTube traffic, not only mock mode
2. Decide whether to add preset/export-import support for workspace themes now that app-level customization exists
3. Implement user authentication via YouTube OAuth 2.0 (Task 5)
4. Add persistent image cache with SQLite (Task 6)
5. Add error recovery and reconnection logic for stream interruptions

## Open Questions
- Whether to add message search/filtering UI controls
- Whether workspace themes should support named presets or JSON import/export
- Whether to persist Innertube visitor data between runs
- Should image cache be persistent across restarts?
