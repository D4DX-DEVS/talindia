import { Marked, type Tokens } from "marked";

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i;

/**
 * Markdown for CMS bodies. Raw HTML is escaped (never passed through), and links/images only
 * accept http(s), mailto, tel or site-relative URLs, so admin content cannot inject script.
 */
const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html({ text }: Tokens.HTML | Tokens.Tag): string {
      return escapeHtml(text);
    },
    link({ href, title, tokens }: Tokens.Link): string {
      const text = this.parser.parseInline(tokens);
      if (!SAFE_URL.test(href)) return text;
      const external = /^https?:/i.test(href);
      const t = title ? ` title="${escapeHtml(title)}"` : "";
      const rel = external ? ' rel="noopener noreferrer" target="_blank"' : "";
      return `<a href="${escapeHtml(href)}"${t}${rel}>${text}</a>`;
    },
    image({ href, text }: Tokens.Image): string {
      if (!SAFE_URL.test(href)) return escapeHtml(text);
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}" loading="lazy" decoding="async" />`;
    },
  },
});

export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false });
}
