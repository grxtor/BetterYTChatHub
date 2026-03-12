# BetterYTChatHub

Desktop-style YouTube Live chat control room for streamers.

BetterYTChatHub gives you a faster operator dashboard than the default YouTube chat, plus OBS-ready overlay routes for pinned messages, super chats, and member alerts.

## What It Does

- Connects to a single YouTube Live stream through `youtubei.js`
- Mirrors live chat into a dedicated moderation dashboard
- Lets you pin any message to an overlay with one click
- Exposes separate overlay routes for:
  - standard pinned messages
  - super chats
  - member events
- Includes live settings sync across dashboard, settings, and overlay pages
- Supports workspace-level customization for a more desktop-app-like shell

## Current Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 15 + React 19 + TypeScript |
| Backend | Fastify + `youtubei.js` + SSE |
| Shared types | TypeScript via `@shared/*` |
| Styling | Tailwind CSS v4 + project CSS tokens/components |

## Important Note

This repository is currently a web app, not a packaged Electron app yet.

The UI is being shaped toward an Electron-style multi-panel workspace, but there is no Electron wrapper committed in the current codebase.

## Main Routes

When the app is running locally:

- Dashboard: `http://localhost:3000/dashboard`
- Settings: `http://localhost:3000/settings`
- Main overlay: `http://localhost:3000/overlay`
- Super chat overlay: `http://localhost:3000/superchat`
- Members overlay: `http://localhost:3000/members`
- Backend health: `http://localhost:4100/health`

## Features

### Operator Dashboard

- Searchable live feed
- One-click pinning to overlay
- Super chat rail
- Member event rail
- Live connection state
- Auto-scroll behavior that stops when the operator scrolls up
- Selection preview panel

### Overlay System

- OBS-friendly routes
- Separate message, super chat, and member presentations
- Live updates over Server-Sent Events
- Smooth selection transitions
- Independent scale, position, and visual settings

### Settings System

- Live auto-save
- Shared settings model across pages
- Local persistence with `localStorage`
- Cross-tab sync with `BroadcastChannel`
- Workspace shell controls:
  - frame mode
  - density
  - rail width
  - accent color
  - ambient glow
  - badge visibility
  - selection preview visibility

### Message Support

- Standard chat messages
- Super chats
- Super stickers
- Membership events
- Gift memberships
- Moderator / member / verified badges
- Leaderboard rank badge
- Live poll presence indicator

## Screenshots

Existing screenshots live in `ScreenShots/`.

## Getting Started

### Requirements

- Node.js 20+
- `pnpm` recommended

### Install

```bash
pnpm install
```

### Run In Development

```bash
pnpm dev
```

This starts:

- frontend on `3000`
- backend on `4100`

If `3000` or `4100` is already in use, the process may fail or Next may move to another port.

### Production Build

```bash
pnpm build
```

### Run Production

```bash
pnpm start
```

## YouTube Live Configuration

To connect directly to a real stream on startup, provide `YOUTUBE_LIVE_ID`.

Example `.env`:

```bash
YOUTUBE_LIVE_ID=YOUR_VIDEO_ID
```

If `YOUTUBE_LIVE_ID` is missing, the backend falls back to mock mode.

## Project Structure

```text
backend/   Fastify API + chat ingestion
client/    Next.js app router UI and overlay routes
shared/    shared TypeScript models
memory-bank/ project context and engineering notes
```

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm build:client
pnpm build:backend
pnpm start
```

## Troubleshooting

### Port Already In Use

If you see `EADDRINUSE`:

```bash
lsof -i :3000
lsof -i :4100
kill -9 <PID>
```

Then restart:

```bash
pnpm dev
```

### `.next` ENOENT / Missing Page Files

If you see errors like:

- `client/.next/server/app/settings/page.js`
- `routes-manifest.json`
- `pages-manifest.json`

your Next dev cache is likely in a bad state.

Fix:

```bash
rm -rf client/.next
pnpm dev
```

Do not run `next build client` and `next dev client` against the same worktree at the same time.

### `youtubei.js` Parser Noise

You may occasionally see upstream parser warnings from YouTube response changes. Some of them are noisy but non-fatal if chat connection still succeeds.

## Architecture Summary

1. Backend connects to YouTube Live chat through `youtubei.js`
2. Messages are normalized into shared types
3. Dashboard polls message state and posts overlay selection changes
4. Overlay pages consume live state over SSE
5. Settings persist locally and sync across routes/pages

## Contribution Notes

- Keep changes type-safe across `client`, `backend`, and `shared`
- Prefer `pnpm`
- If you change UI behavior, verify both dashboard and overlay routes
- If you touch settings, keep the shared `AppSettings` contract aligned

## License

MIT
