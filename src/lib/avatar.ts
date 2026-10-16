/**
 * Utility functions for handling and normalizing user avatars
 */

/**
 * Normalizes Discord avatar URLs.
 * Discord CDN returns 404 for .png avatars for many modern accounts,
 * but reliably returns 200 for .webp format.
 */
export function normalizeDiscordAvatar(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.includes('cdn.discordapp.com/avatars/')) {
    try {
      const parsed = new URL(trimmed);
      parsed.pathname = parsed.pathname.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      return parsed.toString();
    } catch {
      return trimmed.replace(/\.(png|jpg|jpeg)(\?.*)?$/i, (_match, _ext, query) => `.webp${query || ''}`);
    }
  }

  return trimmed;
}

/**
 * Normalizes Twitter / X avatar URLs.
 * Twitter returns low-resolution 48x48 '_normal.jpg' avatars by default.
 * Replacing '_normal.' with '_400x400.' loads the high-resolution 400x400 avatar.
 */
export function normalizeTwitterAvatar(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.includes('twimg.com') || trimmed.includes('twitter.com')) {
    return trimmed.replace(/_normal\.(jpg|jpeg|png|webp)$/i, '_400x400.$1');
  }

  return trimmed;
}

/**
 * Universal avatar normalizer handling both Discord and Twitter / X CDNs.
 */
export function normalizeAvatar(url?: string | null): string {
  if (!url) return '';
  let result = normalizeDiscordAvatar(url);
  result = normalizeTwitterAvatar(result);
  return result;
}
