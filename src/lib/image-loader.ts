import { STATIC_WIDTHS } from "./static-images";

interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

/**
 * - `/media/...`  R2 objects, resized at the edge by the media route (Cloudflare Images binding).
 * - `/images/<name>.webp`  pre-built responsive set (scripts/optimize-static.ts) -> nearest `<name>-<w>.webp`.
 * - anything else is served as-is.
 */
export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  if (src.startsWith("/media/")) {
    if (src.endsWith(".svg")) return src;
    const params = new URLSearchParams({ w: String(width), q: String(quality ?? 75) });
    return `${src}?${params.toString()}`;
  }
  const match = src.match(/^\/images\/([a-z0-9-]+)\.webp$/);
  if (match) {
    const w = STATIC_WIDTHS.find((s) => s >= width) ?? STATIC_WIDTHS[STATIC_WIDTHS.length - 1];
    return `/images/${match[1]}-${w}.webp`;
  }
  return src;
}
