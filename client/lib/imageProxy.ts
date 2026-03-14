import { BACKEND_URL } from './runtime';

const YOUTUBE_CDN_DOMAINS = new Set([
  'yt3.ggpht.com',
  'yt4.ggpht.com',
  'i.ytimg.com',
  'lh3.googleusercontent.com',
]);
const PROXY_URL_CACHE_LIMIT = 500;
const proxyUrlCache = new Map<string, string>();

function rememberProxyUrl(originalUrl: string, proxiedUrl: string) {
  if (proxyUrlCache.has(originalUrl)) {
    proxyUrlCache.delete(originalUrl);
  }

  proxyUrlCache.set(originalUrl, proxiedUrl);

  if (proxyUrlCache.size <= PROXY_URL_CACHE_LIMIT) {
    return;
  }

  const oldestKey = proxyUrlCache.keys().next().value;
  if (oldestKey) {
    proxyUrlCache.delete(oldestKey);
  }
}

/**
 * Converts a YouTube CDN image URL to use our backend proxy
 * This prevents 429 rate limit errors from YouTube's CDN
 */
export function proxyImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  const cached = proxyUrlCache.get(url);
  if (cached) {
    rememberProxyUrl(url, cached);
    return cached;
  }

  try {
    const urlObj = new URL(url);
    if (YOUTUBE_CDN_DOMAINS.has(urlObj.hostname)) {
      const proxiedUrl = `${BACKEND_URL}/proxy/image?url=${encodeURIComponent(url)}`;
      rememberProxyUrl(url, proxiedUrl);
      return proxiedUrl;
    }
  } catch {
    // If URL parsing fails, return as-is
    return url;
  }

  // Return non-YouTube URLs as-is
  return url;
}
