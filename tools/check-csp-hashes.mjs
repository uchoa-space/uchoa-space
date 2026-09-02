// Verifies that every inline <style>/<script> block in every built page is
// covered by a sha256- hash present in that page's own CSP meta tag, and that
// every hash a page declares is actually matched by a block on that page.
//
// It walks all built pages, not just the landing. Article pages carry no
// inline blocks today, so nothing here fires on them — but an inline block in
// Post.astro is the single most probable next edit to that file, and until
// this checker looked at those pages it would have shipped unnoticed. A page
// with no inline blocks and no declared hashes is a pass, not a failure: that
// is today's article page, and it is the state this must not break.
//
// The rule is stricter than the browser on one point, deliberately. Article
// pages send `style-src 'self' 'unsafe-inline'`, so a browser would in fact
// run an inline style there; this still reports it, because relying on
// 'unsafe-inline' rather than a hash is the thing worth being told about. The
// landing pins hashes and carries no 'unsafe-inline' at all.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { discoverPages } from './lib/dist-pages.mjs';

const DIST = 'dist';

function checkPage(file) {
  const html = readFileSync(file, 'utf8');
  const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/)?.[1] ?? '';
  const declared = new Set([...csp.matchAll(/'(sha256-[^']+)'/g)].map((m) => m[1]));

  const used = new Set();
  const problems = [];
  const found = [];

  for (const tag of ['style', 'script']) {
    // `src=` excluded: an external script is covered by a source expression,
    // never by a hash of its (empty) body.
    const re = new RegExp(`<${tag}(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)</${tag}>`, 'g');
    let n = 0;
    for (const m of html.matchAll(re)) {
      n++;
      const hash = 'sha256-' + createHash('sha256').update(m[1], 'utf8').digest('base64');
      found.push({ tag, hash });
      if (declared.has(hash)) {
        used.add(hash);
      } else {
        problems.push(`inline <${tag}> #${n} hashes to ${hash} — not declared in this page's CSP`);
      }
    }
  }

  // The other direction: a hash left behind after the block it covered was
  // edited or removed is dead policy, and hides the fact that the live block
  // is the one no longer covered.
  for (const hash of declared) {
    if (!used.has(hash)) {
      problems.push(`CSP declares ${hash} but no inline block on this page matches it`);
    }
  }

  return { declared, found, problems };
}

const pages = discoverPages(DIST);

let failed = 0;
for (const page of pages) {
  const { declared, found, problems } = checkPage(page);
  const summary = `${found.length} inline block(s), ${declared.size} hash(es) declared`;
  if (problems.length === 0) {
    console.log(`OK   ${page} — ${summary}`);
  } else {
    failed++;
    console.log(`FAIL ${page} — ${summary}`);
    for (const problem of problems) console.log(`       ${problem}`);
  }
  for (const { tag, hash } of found) console.log(`       ${tag.padEnd(6)} ${hash}`);
}
console.log(`${pages.length} pages checked, ${failed} failed`);
process.exit(failed ? 1 : 0);
