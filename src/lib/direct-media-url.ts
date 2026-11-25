const DIRECT_VIDEO_EXTENSIONS = [".mp4", ".m4v", ".mov", ".m3u8"];

/**
 * PRO 4.0 accepts actual media resources only. Web pages, embed viewers,
 * watch pages and URLs without a known playable media extension are excluded.
 */
export function isDirectMediaUrl(value: string | null | undefined): value is string {
  if (!value || typeof value !== "string") return false;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const path = decodeURIComponent(url.pathname).toLowerCase();
    if (path.includes("/embed/") || path.includes("/watch/") || path.endsWith("/embed")) return false;
    return DIRECT_VIDEO_EXTENSIONS.some((extension) => path.endsWith(extension));
  } catch {
    return false;
  }
}
