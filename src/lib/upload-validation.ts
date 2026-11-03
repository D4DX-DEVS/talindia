import { imageSize, sniffType, type Dimensions, type SniffedType } from "./image-meta";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_TYPES: readonly SniffedType[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "application/pdf",
];

const EXT: Record<SniffedType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

export type UploadCheck =
  | { ok: true; type: SniffedType; ext: string; dimensions: Dimensions | null }
  | { ok: false; reason: string };

/** Rejects active content in SVG. The media route also serves SVG with a sandboxing CSP. */
export function unsafeSvgReason(text: string): string | null {
  if (/<script[\s>/]/i.test(text)) return "SVG contains a <script> element";
  if (/<foreignObject[\s>/]/i.test(text)) return "SVG contains <foreignObject>";
  if (/\son[a-z]+\s*=/i.test(text)) return "SVG contains event handler attributes";
  if (/javascript\s*:/i.test(text)) return "SVG contains a javascript: URL";
  if (/<!ENTITY/i.test(text)) return "SVG declares XML entities";
  return null;
}

/** Validates bytes by content (magic numbers), never by browser-supplied mime or extension. */
export function checkUpload(bytes: Uint8Array, size: number): UploadCheck {
  if (size === 0) return { ok: false, reason: "File is empty" };
  if (size > MAX_UPLOAD_BYTES) return { ok: false, reason: `File is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB` };
  const type = sniffType(bytes);
  if (!type || !ALLOWED_TYPES.includes(type)) {
    return { ok: false, reason: "Unsupported file type. Allowed: PNG, JPEG, WebP, GIF, AVIF, SVG, PDF" };
  }
  if (type === "image/svg+xml") {
    const reason = unsafeSvgReason(new TextDecoder().decode(bytes));
    if (reason) return { ok: false, reason };
  }
  return { ok: true, type, ext: EXT[type], dimensions: imageSize(type, bytes) };
}

/** "My Photo (1).JPG" -> "my-photo-1" (extension replaced by the sniffed one). */
export function safeBaseName(name: string): string {
  const base = name.replace(/\.[^.]*$/, "");
  const slug = base
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "file";
}
