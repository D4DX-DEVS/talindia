/**
 * Pure, dependency-free sniffing of file type and image dimensions from the first bytes.
 * Runs in Workers (no sharp). Every function is unit-testable with plain Uint8Arrays.
 */

export type SniffedType =
  | "image/png"
  | "image/jpeg"
  | "image/gif"
  | "image/webp"
  | "image/avif"
  | "image/svg+xml"
  | "application/pdf";

export interface Dimensions {
  width: number;
  height: number;
}

const ascii = (b: Uint8Array, start: number, len: number): string => String.fromCharCode(...b.subarray(start, start + len));

/** Detects the real type from magic bytes; SVG is detected from its text prologue. */
export function sniffType(bytes: Uint8Array): SniffedType | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG" && bytes[4] === 0x0d && bytes[5] === 0x0a) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 6 && (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a")) return "image/gif";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }
  if (bytes.length >= 5 && ascii(bytes, 0, 5) === "%PDF-") return "application/pdf";
  if (looksLikeSvg(bytes)) return "image/svg+xml";
  return null;
}

function looksLikeSvg(bytes: Uint8Array): boolean {
  let head = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, 2048));
  head = head.replace(/^﻿/, "").trimStart();
  // Allow an XML declaration, comments and a doctype before the root element.
  head = head.replace(/^<\?xml[\s\S]*?\?>\s*/i, "").replace(/^(?:<!--[\s\S]*?-->\s*)+/, "").replace(/^<!DOCTYPE[^>]*>\s*/i, "");
  return /^<svg[\s>]/i.test(head);
}

export function pngSize(b: Uint8Array): Dimensions | null {
  if (b.length < 24 || ascii(b, 12, 4) !== "IHDR") return null;
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return { width: v.getUint32(16), height: v.getUint32(20) };
}

export function gifSize(b: Uint8Array): Dimensions | null {
  if (b.length < 10) return null;
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return { width: v.getUint16(6, true), height: v.getUint16(8, true) };
}

export function jpegSize(b: Uint8Array): Dimensions | null {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = b[i + 1];
    // Standalone markers without a length.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0xff) {
      i += marker === 0xff ? 1 : 2;
      continue;
    }
    const len = v.getUint16(i + 2);
    // SOF0..SOF15 except DHT (C4), JPG (C8), DAC (CC)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: v.getUint16(i + 5), width: v.getUint16(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

export function webpSize(b: Uint8Array): Dimensions | null {
  if (b.length < 30) return null;
  const chunk = ascii(b, 12, 4);
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (chunk === "VP8 ") {
    // Frame header: 3 bytes tag, then start code 9d 01 2a, then 14-bit width/height.
    if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
    return { width: v.getUint16(26, true) & 0x3fff, height: v.getUint16(28, true) & 0x3fff };
  }
  if (chunk === "VP8L") {
    if (b[20] !== 0x2f) return null;
    const bits = v.getUint32(21, true);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    const w = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    const h = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    return { width: w, height: h };
  }
  return null;
}

/** Reads width/height from the SVG root's width/height or viewBox. */
export function svgSize(text: string): Dimensions | null {
  const root = text.match(/<svg\b[^>]*>/i)?.[0];
  if (!root) return null;
  const num = (name: string): number | null => {
    const m = root.match(new RegExp(`\\s${name}\\s*=\\s*["']\\s*([\\d.]+)(px)?\\s*["']`, "i"));
    return m ? Math.round(Number(m[1])) : null;
  };
  const w = num("width");
  const h = num("height");
  if (w && h) return { width: w, height: h };
  const vb = root.match(/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i);
  if (vb) return { width: Math.round(Number(vb[1])), height: Math.round(Number(vb[2])) };
  return null;
}

export function imageSize(type: SniffedType, bytes: Uint8Array): Dimensions | null {
  switch (type) {
    case "image/png":
      return pngSize(bytes);
    case "image/jpeg":
      return jpegSize(bytes);
    case "image/gif":
      return gifSize(bytes);
    case "image/webp":
      return webpSize(bytes);
    case "image/svg+xml":
      return svgSize(new TextDecoder().decode(bytes));
    default:
      return null;
  }
}
