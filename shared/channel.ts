export function extractChannelHandleFromUrl(input: string | undefined): string {
  if (!input) {
    return '';
  }

  const trimmed = input.trim();
  const handleMatch = trimmed.match(/(?:youtube\.com\/)?@([a-zA-Z0-9._-]+)/i);

  if (handleMatch?.[1]) {
    return handleMatch[1];
  }

  return '';
}

export function normalizeChannelHandle(input: string): string {
  if (!input) {
    return '';
  }

  const trimmed = input.trim();
  const fromUrl = extractChannelHandleFromUrl(trimmed);

  if (fromUrl) {
    return fromUrl;
  }

  return trimmed.replace(/^@+/, '').trim();
}
