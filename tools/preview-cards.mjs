// Renders every page's share card as it will look in a handful of clients, into
// one self-contained HTML file. Run after `npm run build`.
//
// This is a looking tool, not a checker: `check:og` proves the tags are right,
// this shows what the copy does once a client truncates it. Nothing here
// asserts anything, with one exception — that a card's PNG is really in the
// build. A preview that silently renders a broken image is the exact failure
// the share cards exist to prevent, so that case exits non-zero instead.
//
// It reads `dist/` from disk rather than fetching from a running server:
// `astro preview` serves `dist/` verbatim, so a server and a port would buy
// nothing, and both checkers already read the build the same way.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SITE = 'https://uchoa.space/';
const DIST = 'dist';
// Deliberately not inside `dist/`: that directory is uploaded to GitHub Pages
// wholesale, so an internal tool written there would be published on the live
// site. `.preview/` is gitignored.
const OUT = join('.preview', 'card-preview.html');

const meta = (html, key) => {
  const attr = key.startsWith('og:') || key.startsWith('article:') ? 'property' : 'name';
  const re = new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`);
  return (html.match(re)?.[1] ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clip = (s, n) => (s.length <= n ? esc(s) : esc(s.slice(0, n)) + '<i class="cut">…</i>');

// Discovered, not hard-coded, so a new post shows up here without editing this
// file — the same rule tools/check-og-tags.mjs follows.
const pages = [join(DIST, 'index.html')];
const articlesDir = join(DIST, 'articles');
if (existsSync(articlesDir)) {
  for (const slug of readdirSync(articlesDir).sort()) {
    const file = join(articlesDir, slug, 'index.html');
    if (existsSync(file)) pages.push(file);
  }
}

const cards = [];
const problems = [];
for (const page of pages) {
  if (!existsSync(page)) {
    problems.push(`${page} — not built`);
    continue;
  }
  const html = readFileSync(page, 'utf8');
  const image = meta(html, 'og:image');
  // The tag is absolute; the bytes live under the same path inside the build.
  const local = image.startsWith(SITE) ? join(DIST, image.slice(SITE.length)) : '';
  if (!local || !existsSync(local)) {
    problems.push(`${page} — og:image file is not in the build: ${local || image || '(no og:image)'}`);
    continue;
  }
  cards.push({
    path: '/' + page.slice(DIST.length + 1).replace(/index\.html$/, ''),
    title: meta(html, 'og:title'),
    desc: meta(html, 'og:description'),
    url: meta(html, 'og:url'),
    card: meta(html, 'twitter:card'),
    alt: meta(html, 'og:image:alt'),
    imgSrc: 'data:image/png;base64,' + readFileSync(local).toString('base64'),
  });
}

if (problems.length) {
  for (const problem of problems) console.log(`FAIL ${problem}`);
  console.log(`${problems.length} of ${pages.length} pages could not be previewed, nothing written`);
  process.exit(1);
}

const host = (u) => {
  try {
    return new URL(u).host;
  } catch {
    return u;
  }
};

// Truncation budgets below are APPROXIMATE and drift between clients and surfaces.
// They exist to show WHERE copy gets cut, not to certify a number.
const client = (name, note, body) => `
  <div class="client"><h3>${name} <span>${note}</span></h3>${body}</div>`;

const render = (c) => `
<section>
  <h2>${esc(c.path)}</h2>
  <p class="url">${esc(c.url)} &middot; twitter:card = <code>${esc(c.card)}</code></p>
  <div class="row">
    ${client('Slack / Discord', 'shows most of the description', `
      <div class="slack"><div class="bar"></div><div class="body">
        <div class="site">${esc(host(c.url))}</div>
        <div class="t">${clip(c.title, 120)}</div>
        <div class="d">${clip(c.desc, 300)}</div>
        <img src="${c.imgSrc}" alt="">
      </div></div>`)}
    ${client('LinkedIn feed', 'description usually NOT shown', `
      <div class="li"><img src="${c.imgSrc}" alt="">
        <div class="meta"><div class="t">${clip(c.title, 100)}</div>
        <div class="site">${esc(host(c.url))}</div></div></div>`)}
    ${client('X / Twitter', 'title ~1 line over the image', `
      <div class="tw"><img src="${c.imgSrc}" alt="">
        <div class="meta"><div class="site">${esc(host(c.url))}</div>
        <div class="t">${clip(c.title, 70)}</div>
        <div class="d">${clip(c.desc, 125)}</div></div></div>`)}
    ${client('WhatsApp / iMessage', 'tight description', `
      <div class="wa"><img src="${c.imgSrc}" alt="">
        <div class="meta"><div class="t">${clip(c.title, 65)}</div>
        <div class="d">${clip(c.desc, 90)}</div>
        <div class="site">${esc(host(c.url))}</div></div></div>`)}
  </div>
  <details><summary>og:image:alt — what a screen reader gets</summary><p>${esc(c.alt)}</p></details>
</section>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  `<!doctype html><meta charset="utf-8">
<title>Share card preview</title>
<style>
 :root{--bg:#0d0e14;--fg:#e8e9ee;--dim:#8b8fa3;--line:#262838;--gold:#f5c451}
 body{margin:0;padding:28px;background:var(--bg);color:var(--fg);
   font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
 h1{font-size:20px;margin:0 0 4px}
 .lede{color:var(--dim);max-width:80ch;margin:0 0 28px}
 .lede b{color:var(--gold)}
 section{border-top:1px solid var(--line);padding:22px 0}
 h2{font-size:15px;margin:0 0 2px;color:var(--gold);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
 .url{color:var(--dim);margin:0 0 16px;font-size:12px}
 code{background:#1a1c28;padding:1px 5px;border-radius:3px}
 .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:18px}
 .client h3{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--dim);
   margin:0 0 8px;font-weight:600}
 .client h3 span{text-transform:none;letter-spacing:0;font-weight:400;opacity:.7}
 img{display:block;width:100%;height:auto}
 .cut{color:#ff6b6b;font-style:normal;font-weight:700}
 .site{color:var(--dim);font-size:12px}
 .t{font-weight:600;margin:2px 0}
 .d{color:#b9bcca;font-size:13px}
 .slack{display:flex;background:#1a1d29;border-radius:6px;overflow:hidden}
 .slack .bar{width:4px;background:var(--dim);flex:none}
 .slack .body{padding:10px 12px;min-width:0}
 .slack img{margin-top:8px;border-radius:6px}
 .li,.tw,.wa{background:#1a1d29;border:1px solid var(--line);border-radius:8px;overflow:hidden}
 .li .meta,.tw .meta,.wa .meta{padding:10px 12px}
 .tw .meta{order:2}
 details{margin-top:14px;color:var(--dim);font-size:13px}
 summary{cursor:pointer}
 details p{max-width:90ch;color:#b9bcca}
</style>
<h1>Share card preview</h1>
<p class="lede">Rendered from the tags in the built output under <code>dist/</code>, with each card's real
PNG inlined. The layouts are <b>approximations</b> of each client and the cut points drift &mdash;
a red <b class="cut">…</b> marks where that client is likely to truncate. This shows what your copy does under
truncation. It does not prove a crawler can fetch the page: <code>og:image</code> is absolute to
<code>uchoa.space</code>, which returns 404 for these files until the branch is deployed.</p>
${cards.map(render).join('\n')}`,
);
console.log(`${cards.length} pages rendered -> ${OUT}`);
