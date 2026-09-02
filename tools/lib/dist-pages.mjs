// The two share-card tools — `check-og-tags.mjs` and `preview-cards.mjs` —
// both walk the built output and both pull values out of its `<meta>` tags.
// They used to carry a copy of each routine apiece, and the copies had already
// drifted: one decoded HTML entities only when comparing alt text, the other
// always did. A tool that reports on the build should not disagree with the
// tool that renders it, so the pair lives here once.
//
// Deliberately not shared with `check-csp-hashes.mjs`: that one hashes raw
// inline blocks rather than parsing static tags, so folding it in would buy a
// shared import and no shared meaning.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// The landing plus every article, discovered rather than hard-coded, so a new
// post is covered without editing a tool.
export function discoverPages(dist) {
  const pages = [join(dist, 'index.html')];
  const articlesDir = join(dist, 'articles');
  if (existsSync(articlesDir)) {
    for (const slug of readdirSync(articlesDir).sort()) {
      const file = join(articlesDir, slug, 'index.html');
      if (existsSync(file)) pages.push(file);
    }
  }
  return pages;
}

// Attribute values arrive HTML-escaped. Decoding is unconditional: it is a
// no-op on a value with no entities, and making it conditional is precisely
// how the two copies drifted apart.
function decode(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

// Astro's compressHTML puts the whole head on one line, so this matches
// against the file's text and never against a line.
export function readMeta(html, name, attr) {
  const re = new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`);
  const value = html.match(re)?.[1];
  return value === undefined ? undefined : decode(value);
}
