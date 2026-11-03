/**
 * Builds the responsive WebP set in public/images from the committed originals in assets/.
 * The custom image loader (src/lib/image-loader.ts) maps next/image widths onto these files.
 *   npx tsx scripts/optimize-static.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { STATIC_WIDTHS } from "../src/lib/static-images";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public", "images");

const sources: Record<string, string> = {
  "hero-portrait": "assets/brand/hero-portrait.png",
  "about-illustration": "assets/brand/about-illustration.png",
  "kozhikode-beach": "assets/place/sunset-in-kozhikode-beach.jpg",
  "dubai-skyline": "assets/place/dubai-skyline-burj-khalifa.jpg",
};

async function main(): Promise<void> {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, src] of Object.entries(sources)) {
    const input = sharp(path.join(ROOT, src));
    const { width = 0 } = await input.metadata();
    for (const w of STATIC_WIDTHS) {
      await sharp(path.join(ROOT, src))
        .resize({ width: Math.min(w, width), withoutEnlargement: true })
        .webp({ quality: 78, effort: 5 })
        .toFile(path.join(OUT, `${name}-${w}.webp`));
    }
  }
  const brand = path.join(ROOT, "public", "brand");
  fs.mkdirSync(brand, { recursive: true });
  for (const f of ["logo-dark", "logo-light"]) {
    await sharp(path.join(ROOT, `assets/brand/${f}.png`)).resize({ height: 73 }).webp({ lossless: true }).toFile(path.join(brand, `${f}.webp`));
    fs.copyFileSync(path.join(ROOT, `assets/brand/${f}.png`), path.join(brand, `${f}.png`));
  }
  const app = path.join(ROOT, "src", "app");
  await sharp(path.join(ROOT, "assets/brand/icon.png")).resize(512).png().toFile(path.join(app, "icon.png"));
  await sharp(path.join(ROOT, "assets/brand/icon.png")).resize(180).flatten({ background: "#ffffff" }).png().toFile(path.join(app, "apple-icon.png"));
  await sharp(path.join(ROOT, "assets/brand/icon.png")).resize(32).png().toFile(path.join(ROOT, "public", "favicon-32.png"));
  process.stdout.write("static images written\n");
}

main().catch((e: unknown) => {
  process.stderr.write(String(e));
  process.exit(1);
});
