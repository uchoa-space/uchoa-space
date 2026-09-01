// Verifies that every inline <style>/<script> block in dist/index.html is
// covered by a sha256- hash present in the page's own CSP meta tag.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const html = readFileSync('dist/index.html', 'utf8');
const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/)?.[1] ?? '';
const declared = new Set([...csp.matchAll(/'(sha256-[^']+)'/g)].map((m) => m[1]));

let fail = 0;
for (const tag of ['style', 'script']) {
  const re = new RegExp(`<${tag}(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)</${tag}>`, 'g');
  for (const m of html.matchAll(re)) {
    const hash = 'sha256-' + createHash('sha256').update(m[1], 'utf8').digest('base64');
    const ok = declared.has(hash);
    if (!ok) fail++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${tag} ${hash}`);
  }
}
console.log(`declared in CSP: ${[...declared].join(' ')}`);
process.exit(fail ? 1 : 0);
