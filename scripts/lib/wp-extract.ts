/**
 * Pure extraction helpers that turn the WordPress REST export into the
 * content model used by the new site. Every extractor throws when the
 * expected content is missing so that nothing is silently dropped.
 */

export interface WpRendered {
  rendered: string;
}

export interface WpEntity {
  id: number;
  slug: string;
  date?: string;
  modified?: string;
  link: string;
  status: string;
  title: WpRendered;
  content: WpRendered;
  featured_media?: number;
}

export interface WpMedia {
  id: number;
  date: string;
  source_url: string;
  mime_type: string;
  alt_text: string;
  title: WpRendered;
  media_details?: { width?: number; height?: number; filesize?: number };
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&#038;": "&",
  "&#8217;": "’",
  "&#8216;": "‘",
  "&#8220;": "“",
  "&#8221;": "”",
  "&#8211;": "–",
  "&#8212;": "—",
  "&nbsp;": " ",
  "&#160;": " ",
  "&quot;": '"',
  "&#039;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

export function decodeEntities(input: string): string {
  return input.replace(/&[#a-z0-9]+;/gi, (m) => ENTITIES[m] ?? m);
}

export function textOf(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export interface Block {
  tag: string;
  text: string;
}

/** Flattens rendered HTML into an ordered list of headings, paragraphs and list items. */
export function blocksOf(html: string): Block[] {
  const cleaned = html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "");
  const re = /<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const out: Block[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned))) {
    const text = textOf(m[2]);
    if (text) out.push({ tag: m[1].toLowerCase(), text });
  }
  return out;
}

function required<T>(value: T | undefined | null, what: string): T {
  if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
    throw new Error(`Migration: missing ${what}`);
  }
  return value;
}

function after(blocks: Block[], text: string, what: string): number {
  const i = blocks.findIndex((b) => b.text === text);
  if (i < 0) throw new Error(`Migration: anchor "${text}" not found (${what})`);
  return i;
}

/** Removes the duplicated heading Elementor renders for flip boxes ("X", "X", description). */
function dedupeAdjacent(blocks: Block[]): Block[] {
  return blocks.filter((b, i) => !(i > 0 && blocks[i - 1].text === b.text && blocks[i - 1].tag === b.tag));
}

export interface CourseContent {
  legacyWpId: number | null;
  slug: string;
  legacySlug: string | null;
  title: string;
  audience: string;
  highlights: string[];
  marketGap: string | null;
  imageLegacyId: number | null;
  sortOrder: number;
}

/** Course post bodies are a list: first item = target audience, then highlights, then "Market Gap: ...". */
export function parseCourse(entity: WpEntity): Omit<CourseContent, "slug" | "legacySlug" | "title" | "sortOrder"> {
  const items = blocksOf(entity.content.rendered).map((b) => b.text);
  required(items[0], `course audience for ${entity.slug}`);
  const [audience, ...rest] = items;
  const gapIndex = rest.findIndex((t) => /^market gap\s*:/i.test(t));
  const marketGap = gapIndex >= 0 ? rest[gapIndex].replace(/^market gap\s*:\s*/i, "").trim() : null;
  const highlights = rest.filter((_, i) => i !== gapIndex);
  return {
    legacyWpId: entity.id,
    audience,
    highlights,
    marketGap,
    imageLegacyId: entity.featured_media || null,
  };
}

export interface HomeContent {
  heroTitle: string;
  heroSubtitle: string;
  aboutHeading: string;
  aboutText: string;
  serviceTitles: string[];
  whyChoose: { title: string; description: string }[];
  homeCourses: { title: string; audience: string }[];
  offerings: { title: string; description: string }[];
  testimonials: { quote: string; name: string }[];
  webinarTitle: string;
  webinarText: string;
}

export function parseHome(entity: WpEntity): HomeContent {
  const blocks = dedupeAdjacent(blocksOf(entity.content.rendered));
  const hero = blocks.findIndex((b) => /upskill/i.test(b.text) && b.tag.startsWith("h"));
  const heroTitle = required(blocks[hero]?.text, "hero title");
  const heroSubtitle = required(blocks[hero + 1]?.text, "hero subtitle");

  const aboutAt = after(blocks, "About Us", "home about");
  const aboutHeading = required(blocks[aboutAt + 1]?.text, "home about heading");
  const aboutText = required(blocks[aboutAt + 2]?.text, "home about text");
  const serviceTitles: string[] = [];
  for (let i = aboutAt + 3; blocks[i]?.tag === "li"; i++) serviceTitles.push(blocks[i].text);
  if (serviceTitles.length !== 4) throw new Error(`Migration: expected 4 home services, got ${serviceTitles.length}`);

  const whyAt = after(blocks, "Why Choose Talindia", "why choose");
  const whyChoose: HomeContent["whyChoose"] = [];
  for (let i = whyAt + 1; blocks[i]?.tag.startsWith("h") && blocks[i + 1]?.tag === "p"; i += 2) {
    whyChoose.push({ title: blocks[i].text, description: blocks[i + 1].text });
  }
  if (whyChoose.length !== 3) throw new Error(`Migration: expected 3 why-choose cards, got ${whyChoose.length}`);

  const coursesAt = after(blocks, "Courses Coming Soon", "home courses");
  const homeCourses: HomeContent["homeCourses"] = [];
  for (let i = coursesAt + 1; blocks[i]?.tag === "h3"; i += 2) {
    homeCourses.push({ title: blocks[i].text, audience: required(blocks[i + 1]?.text, "course audience") });
  }
  if (homeCourses.length !== 4) throw new Error(`Migration: expected 4 home courses, got ${homeCourses.length}`);

  const offersAt = after(blocks, "We Offer Services", "offerings");
  const offerings: HomeContent["offerings"] = [];
  for (let i = offersAt + 1; blocks[i]?.tag === "h3" && blocks[i + 1]?.tag === "p"; i += 2) {
    offerings.push({ title: blocks[i].text, description: blocks[i + 1].text });
  }
  if (offerings.length !== 6) throw new Error(`Migration: expected 6 offerings, got ${offerings.length}`);

  const storiesAt = after(blocks, "Success Stories from Our Community", "testimonials");
  const testimonials: HomeContent["testimonials"] = [];
  for (let i = storiesAt + 1; blocks[i]?.tag === "p" && blocks[i + 1]?.tag === "h3"; i += 2) {
    testimonials.push({ quote: blocks[i].text, name: blocks[i + 1].text });
  }
  if (testimonials.length !== 3) throw new Error(`Migration: expected 3 testimonials, got ${testimonials.length}`);

  const webinar = blocks.findIndex((b) => /webinar/i.test(b.text));
  const webinarTitle = required(blocks[webinar]?.text, "webinar title").replace(/"+$/, "").trim();
  const webinarText = required(blocks[webinar + 1]?.text, "webinar text");

  return {
    heroTitle,
    heroSubtitle,
    aboutHeading,
    aboutText,
    serviceTitles,
    whyChoose,
    homeCourses,
    offerings,
    testimonials,
    webinarTitle,
    webinarText,
  };
}

export interface AboutContent {
  heading: string;
  paragraphs: string[];
}

export function parseAbout(entity: WpEntity): AboutContent {
  const blocks = blocksOf(entity.content.rendered);
  const at = after(blocks, "About Talindia", "about heading");
  const paragraphs: string[] = [];
  for (let i = at + 1; blocks[i]?.tag === "p"; i++) paragraphs.push(blocks[i].text);
  if (paragraphs.length < 4) throw new Error(`Migration: expected 4 about paragraphs, got ${paragraphs.length}`);
  return { heading: blocks[at].text, paragraphs };
}

/** Testimonial roles sit in <span>/<div> elements next to the name, so pull them from the rendered page HTML. */
export function testimonialRoles(pageHtml: string, names: string[]): Record<string, string> {
  const text = textOf(pageHtml);
  const roles: Record<string, string> = {};
  for (const name of names) {
    const m = text.match(new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+([A-Z][A-Za-z ]{2,40}?)\\s+(?:TALINDIA|From|The|Tired|Testimonials|$)`));
    roles[name] = m?.[1].trim() ?? "";
  }
  return roles;
}

/** Cloudflare email obfuscation: first byte is the XOR key. */
export function decodeCfEmail(hex: string): string {
  const key = parseInt(hex.slice(0, 2), 16);
  let out = "";
  for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
  return out;
}

export function sqlString(value: string | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

export function sqlValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "string") return sqlString(value);
  return sqlString(JSON.stringify(value));
}

export function insertSql(table: string, row: Record<string, unknown>): string {
  const cols = Object.keys(row);
  return `INSERT INTO ${table} (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${cols.map((c) => sqlValue(row[c])).join(", ")});`;
}

export function uploadKey(sourceUrl: string): string {
  const rel = decodeURIComponent(sourceUrl.split("/wp-content/uploads/")[1] ?? "");
  if (!rel) throw new Error(`Migration: not an uploads URL: ${sourceUrl}`);
  return `uploads/${rel}`;
}
