import { getEnv } from "@/db/client";

const RESIZABLE = new Set(["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"]);
const MAX_WIDTH = 2400;
const IMMUTABLE = "public, max-age=31536000, immutable";

interface EdgeCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

/** The Workers edge cache; absent under `next dev`. */
function edgeCache(): EdgeCache | null {
  const c = (globalThis as { caches?: { default?: EdgeCache } }).caches;
  return c?.default ?? null;
}

function pickFormat(accept: string): "image/avif" | "image/webp" | null {
  if (accept.includes("image/avif")) return "image/avif";
  if (accept.includes("image/webp")) return "image/webp";
  return null;
}

export async function GET(request: Request, ctx: RouteContext<"/media/[...key]">): Promise<Response> {
  const { key: parts } = await ctx.params;
  const key = parts.map(decodeURIComponent).join("/");
  if (!key || key.includes("..")) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const width = Math.min(Number(url.searchParams.get("w")) || 0, MAX_WIDTH);
  const quality = Math.min(Math.max(Number(url.searchParams.get("q")) || 75, 30), 95);
  const format = width ? pickFormat(request.headers.get("accept") ?? "") : null;

  // Normalise the cache key so equivalent requests share one entry.
  const cacheKey = new Request(`${url.origin}/media/${key}?w=${width}&q=${quality}&f=${format ?? "orig"}`);
  const cache = edgeCache();
  const hit = await cache?.match(cacheKey);
  if (hit) return hit;

  const env = await getEnv();
  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });

  const contentType = object.httpMetadata?.contentType ?? "application/octet-stream";
  const baseHeaders: Record<string, string> = {
    "Cache-Control": IMMUTABLE,
    "X-Content-Type-Options": "nosniff",
    Vary: "Accept",
  };
  // SVG is served as a download-safe image with a locked-down CSP (no script execution).
  if (contentType === "image/svg+xml") baseHeaders["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";

  let response: Response;
  if (width && format && RESIZABLE.has(contentType) && env.IMAGES) {
    try {
      const transformed = await env.IMAGES.input(object.body)
        .transform({ width, fit: "scale-down" })
        .output({ format, quality });
      const r = transformed.response();
      response = new Response(r.body, { headers: { ...baseHeaders, "Content-Type": format } });
    } catch {
      // Images binding unavailable (e.g. local dev without it) — fall back to the original bytes.
      const original = await env.MEDIA.get(key);
      response = new Response(original?.body ?? null, { headers: { ...baseHeaders, "Content-Type": contentType, ETag: object.httpEtag } });
    }
  } else {
    response = new Response(object.body, { headers: { ...baseHeaders, "Content-Type": contentType, ETag: object.httpEtag } });
  }

  if (cache) await cache.put(cacheKey, response.clone());
  return response;
}
