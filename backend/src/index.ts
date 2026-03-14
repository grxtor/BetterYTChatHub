import Fastify from 'fastify';
import cors from '@fastify/cors';
import EventEmitter from 'eventemitter3';
import { createHash } from 'node:crypto';
import type { ChatMessage, Poll } from '../../shared/chat';
import type { AppSettings } from '../../shared/settings';
import {
  bootstrapInnertube,
  resolveChannelLiveStatus,
  type IngestionContext
} from './ingestion/youtubei';
import { trimMessages } from './mockData.js';
import { saveMessage, getRecentMessages } from './db';

const MAX_MESSAGES = 500;
const MAX_REGULAR_MESSAGES = 200; // Keep fewer regular messages

// Simple in-memory cache for images
const imageCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
const MAX_CACHE_SIZE = 1000; // Maximum number of cached images

// For request coalescing
const inFlightRequests = new Map<string, Promise<{ buffer: Buffer; contentType: string }>>();

export async function startBackend() {
  const fastify = Fastify({
    logger: {
      level: 'warn', // Only show warnings and errors, not every request
    }
  });

  // Register CORS before any routes
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
  });

  const store: ChatMessage[] = [];
  let currentSelection: ChatMessage | null = null;
  let currentPoll: Poll | null = null;
  const overlayEmitter = new EventEmitter<{ update: (message: ChatMessage | null) => void }>();
  const pollEmitter = new EventEmitter<{ update: (poll: Poll | null) => void }>();
  const settingsEmitter = new EventEmitter<{ update: (settings: AppSettings) => void }>();
  const chatEmitter = new EventEmitter<{ message: (message: ChatMessage) => void }>();
  let currentSettings: AppSettings | null = null;

  const evictOldestCachedImages = (targetSize = MAX_CACHE_SIZE) => {
    if (imageCache.size <= targetSize) {
      return;
    }

    const keys = imageCache.keys();
    let toDelete = imageCache.size - targetSize;
    while (toDelete > 0) {
      const next = keys.next();
      if (next.done) break;
      imageCache.delete(next.value);
      toDelete--;
    }
  };

  const touchCachedImage = (key: string, cached: { buffer: Buffer; contentType: string; timestamp: number }) => {
    const refreshed = {
      ...cached,
      timestamp: Date.now(),
    };
    imageCache.delete(key);
    imageCache.set(key, refreshed);
    return refreshed;
  };

  const rawLiveId = process.env.YOUTUBE_LIVE_ID ?? '';
  const parsedLiveId = extractLiveId(rawLiveId);
  let ingestion: IngestionContext | null = null;
  if (parsedLiveId) {
    try {
      console.log(`[Backend] Connecting to YouTube Live ID: ${parsedLiveId}`);
      ingestion = await bootstrapInnertube(parsedLiveId);
      console.log(`[Backend] ✓ YouTube chat connected successfully`);
      
      // Load recent history
      store.push(...getRecentMessages(parsedLiveId, MAX_MESSAGES));

      ingestion.emitter.on('message', (message) => {
        store.push(message);
        saveMessage(parsedLiveId, message);
        // Trim regularly to keep regular messages under control
        trimMessages(store);
        chatEmitter.emit('message', message);
      });
      ingestion.emitter.on('poll', (poll) => {
        currentPoll = poll;
        pollEmitter.emit('update', poll);
      });
      ingestion.emitter.on('error', (error) => {
        console.error('[Backend] Innertube ingestion error:', error);
      });
    } catch (error) {
      console.error('[Backend] Failed to bootstrap Innertube:', error);
    }
  } else {
    console.log('[Backend] No YOUTUBE_LIVE_ID found. Waiting for manual connection.');
  }

  fastify.get('/health', async () => ({
    status: 'ok',
    messages: store.length,
    selection: currentSelection?.id ?? null,
    mode: ingestion ? 'live' : 'mock',
    connected: !!ingestion,
    liveId: ingestion?.videoId ?? null
  }));

  fastify.get<{ Querystring: { handle?: string } }>('/channels/live-status', async (request, reply) => {
    const handle = request.query?.handle?.trim();

    if (!handle) {
      reply.status(400);
      return { error: 'handle is required' };
    }

    try {
      const status = await resolveChannelLiveStatus(handle);
      return {
        ...status,
        checkedAt: Date.now()
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resolve channel live status';
      const statusCode = message.toLowerCase().includes('not found') ? 404 : 500;

      reply.status(statusCode);
      return { error: message };
    }
  });

  fastify.post<{ Body: { liveId: string } }>('/chat/connect', async (request, reply) => {
    const { liveId } = request.body ?? {};
    if (!liveId) {
      reply.status(400);
      return { error: 'liveId is required' };
    }

    const parsedLiveId = extractLiveId(liveId);
    if (!parsedLiveId) {
      reply.status(400);
      return { error: 'Invalid YouTube Live ID or URL' };
    }

    // Stop existing ingestion if any
    if (ingestion) {
      try {
        ingestion.liveChat?.stop?.();
      } catch (e) {
        console.error('[Backend] Error stopping previous connection:', e);
      }
      ingestion = null;
    }

    // Clear messages
    store.length = 0;

    try {
      console.log(`[Backend] Connecting to YouTube Live ID: ${parsedLiveId}`);
      ingestion = await bootstrapInnertube(parsedLiveId);
      console.log(`[Backend] ✓ YouTube chat connected successfully`);

      // Load recent history for this new liveId
      store.push(...getRecentMessages(parsedLiveId, MAX_MESSAGES));

      ingestion.emitter.on('message', (message) => {
        store.push(message);
        saveMessage(parsedLiveId, message);
        trimMessages(store);
        chatEmitter.emit('message', message);
      });

      ingestion.emitter.on('poll', (poll) => {
        currentPoll = poll;
        pollEmitter.emit('update', poll);
      });

      ingestion.emitter.on('error', (error) => {
        console.error('[Backend] Innertube ingestion error:', error);
      });

      return { ok: true, liveId: parsedLiveId };
    } catch (error) {
      console.error('[Backend] Failed to connect:', error);
      reply.status(500);
      return { error: 'Failed to connect to YouTube Live chat' };
    }
  });

  fastify.post('/chat/disconnect', async () => {
    if (ingestion) {
      try {
        ingestion.liveChat?.stop?.();
        console.log('[Backend] Disconnected from YouTube chat');
      } catch (e) {
        console.error('[Backend] Error disconnecting:', e);
      }
      ingestion = null;
    }

    store.length = 0;
    currentSelection = null;
    currentPoll = null;
    overlayEmitter.emit('update', null);
    pollEmitter.emit('update', null);
    return { ok: true };
  });

  fastify.get('/chat/messages', async () => ({
    messages: store
  }));

  fastify.get('/chat/stream', async (request, reply) => {
    reply.hijack();

    const res = reply.raw;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.writeHead(200);
    res.write(': connected\n\n');

    // Send backlog of existing messages to new client immediately
    if (store.length > 0) {
      const backlog = store.slice(-50);
      res.write(`event: backlog\ndata: ${JSON.stringify({ messages: backlog })}\n\n`);
    }

    const send = (message: ChatMessage) => {
      res.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
    };

    const heartbeat = setInterval(() => {
      res.write('event: heartbeat\ndata: {}\n\n');
    }, 15000);

    chatEmitter.on('message', send);

    request.raw.on('close', () => {
      clearInterval(heartbeat);
      chatEmitter.off('message', send);
    });
  });

  fastify.get('/poll/current', async () => ({
    poll: currentPoll
  }));

  fastify.post<{ Body: { id?: string } }>('/overlay/selection', async (request, reply) => {
    const { id } = request.body ?? {};
    if (!id) {
      reply.status(400);
      return { error: 'id is required' };
    }

    const message = store.find((item) => item.id === id);
    if (!message) {
      reply.status(404);
      return { error: 'message not found' };
    }

    currentSelection = message;
    overlayEmitter.emit('update', currentSelection);

    return { ok: true };
  });

  fastify.delete('/overlay/selection', async () => {
    currentSelection = null;
    overlayEmitter.emit('update', null);
    return { ok: true };
  });

  fastify.get('/poll/stream', async (request, reply) => {
    reply.hijack();

    const res = reply.raw;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.writeHead(200);
    res.write(': connected\n\n');

    const send = (poll: Poll | null) => {
      res.write(`event: poll\ndata: ${JSON.stringify({ poll })}\n\n`);
    };

    const heartbeat = setInterval(() => {
      res.write('event: heartbeat\ndata: {}\n\n');
    }, 15000);

    pollEmitter.on('update', send);

    if (currentPoll) {
      send(currentPoll);
    }

    request.raw.on('close', () => {
      clearInterval(heartbeat);
      pollEmitter.off('update', send);
    });
  });

  fastify.post<{ Body: AppSettings }>('/settings/update', async (request, reply) => {
    const settings = request.body;
    currentSettings = settings;
    settingsEmitter.emit('update', settings);
    return { success: true };
  });

  fastify.get('/overlay/stream', async (request, reply) => {
    reply.hijack();

    const res = reply.raw;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.writeHead(200);
    res.write(': connected\n\n');

    const send = (message: ChatMessage | null) => {
      res.write(`event: selection\ndata: ${JSON.stringify({ message })}\n\n`);
    };

    const sendSettings = (settings: AppSettings) => {
      res.write(`event: settings\ndata: ${JSON.stringify(settings)}\n\n`);
    };

    overlayEmitter.on('update', send);
    settingsEmitter.on('update', sendSettings);

    const heartbeat = setInterval(() => {
      res.write('event: heartbeat\ndata: {}\n\n');
    }, 15000);

    if (currentSettings) {
      sendSettings(currentSettings);
    }

    if (currentSelection) {
      send(currentSelection);
    }

    request.raw.on('close', () => {
      clearInterval(heartbeat);
      overlayEmitter.off('update', send);
      settingsEmitter.off('update', sendSettings);
    });
  });

  // Image proxy endpoint to avoid YouTube CDN rate limits
  fastify.get<{ Querystring: { url: string } }>('/proxy/image', async (request, reply) => {
    const { url } = request.query;

    if (!url || typeof url !== 'string') {
      reply.status(400);
      return { error: 'url parameter is required' };
    }

    // Only allow YouTube CDN and Google User Content domains
    const allowedDomains = [
      'yt3.ggpht.com',
      'yt4.ggpht.com',
      'i.ytimg.com',
      'lh3.googleusercontent.com' // For super stickers
    ];
    try {
      const urlObj = new URL(url);
      if (!allowedDomains.includes(urlObj.hostname)) {
        reply.status(403);
        return { error: 'Only YouTube CDN and Google User Content URLs are allowed' };
      }
    } catch (error) {
      reply.status(400);
      return { error: 'Invalid URL' };
    }

    // Create cache key from URL
    const cacheKey = createHash('md5').update(url).digest('hex');

    // Check cache
    const cached = imageCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      const freshCacheEntry = touchCachedImage(cacheKey, cached);
      reply.header('Content-Type', freshCacheEntry.contentType);
      reply.header('Cache-Control', 'public, max-age=86400'); // 24 hours
      reply.header('Access-Control-Allow-Origin', '*');
      return reply.send(freshCacheEntry.buffer);
    }

    // Check for in-flight requests for coalescing
    let pending = inFlightRequests.get(url);
    if (!pending) {
      // Fetch from YouTube
      pending = (async () => {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              Referer: 'https://www.youtube.com/',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }

          const buffer = Buffer.from(await response.arrayBuffer());
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          return { buffer, contentType };
        } finally {
          inFlightRequests.delete(url);
        }
      })();
      inFlightRequests.set(url, pending);
    }

    try {
      const { buffer, contentType } = await pending;

      // Cache the image
      imageCache.set(cacheKey, {
        buffer,
        contentType,
        timestamp: Date.now(),
      });
      evictOldestCachedImages();

      reply.header('Content-Type', contentType);
      reply.header('Cache-Control', 'public, max-age=86400');
      reply.header('Access-Control-Allow-Origin', '*');
      return reply.send(buffer);
    } catch (error) {
      console.error('[Backend] Failed to proxy image:', error);

      // Try to return stale cache if available
      if (cached) {
        reply.header('Content-Type', cached.contentType);
        reply.header('Cache-Control', 'public, max-age=86400');
        reply.header('Access-Control-Allow-Origin', '*');
        return reply.send(cached.buffer);
      }

      reply.status(500);
      return { error: 'Failed to fetch image' };
    }
  });

  const port = Number(process.env.PORT ?? 4100);

  await fastify.listen({ port, host: '0.0.0.0' });

  console.log(`[Backend] Server listening on http://localhost:${port}`);
}

function extractLiveId(input: string): string {
  if (!input) return '';

  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.searchParams.has('v')) {
      return url.searchParams.get('v') ?? '';
    }
    if (url.pathname.startsWith('/live/')) {
      return url.pathname.split('/live/')[1] ?? '';
    }
  } catch (e) {
    // try other patterns if URL parsing fails
  }

  return '';
}

void startBackend().catch((error) => {
  console.error('[Backend] Failed to start server:', error);
  process.exit(1);
});
