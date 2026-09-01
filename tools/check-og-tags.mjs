// Asserts the share-card markup in the built output. Run after `npm run build`.
//
// A grep can tell you a tag is present. It cannot tell you the PNG that tag
// points at is actually in `dist/` — and a card whose image 404s unfurls as a
// bare URL while the markup looks perfect, which is the exact state this
// feature exists to leave behind. That check is why this is a script.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { discoverPages, readMeta } from './lib/dist-pages.mjs';

const SITE = 'https://uchoa.space/';
const DIST = 'dist';

// Emitted by src/components/ShareMeta.astro. `article:published_time` is
// required only where og:type says article, which is the one difference
// between the landing's fifteen tags and an article's sixteen.
const REQUIRED = [
  ['og:title', 'property'],
  ['og:description', 'property'],
  ['og:type', 'property'],
  ['og:url', 'property'],
  ['og:image', 'property'],
  ['og:image:width', 'property'],
  ['og:image:height', 'property'],
  ['og:image:alt', 'property'],
  ['og:site_name', 'property'],
  ['og:locale', 'property'],
  ['twitter:card', 'name'],
  ['twitter:title', 'name'],
  ['twitter:description', 'name'],
  ['twitter:image', 'name'],
  ['twitter:image:alt', 'name'],
];

function checkPage(file) {
  const html = readFileSync(file, 'utf8');
  // Values arrive already entity-decoded, so every comparison below is against
  // the text a client will actually show.
  const get = (n, a = 'property') => readMeta(html, n, a);
  const problems = [];

  // An empty value is not a present tag. `content=""` renders, passes any
  // presence test, and unfurls as a card with a blank description — the tag is
  // there, so nothing looks wrong until someone shares the link. Empty and
  // absent are reported apart because they have different causes: a tag that
  // never rendered points at the template, a tag that rendered blank points at
  // the content behind it.
  for (const [name, attr] of REQUIRED) {
    const value = get(name, attr);
    if (value === undefined) problems.push(`missing ${name}`);
    else if (value.trim() === '') problems.push(`${name} is empty`);
  }

  const type = get('og:type');
  if (type === 'article' && get('article:published_time') === undefined) {
    problems.push('missing article:published_time on an og:type=article page');
  }

  for (const [name, attr] of [
    ['og:url', 'property'],
    ['og:image', 'property'],
    ['twitter:image', 'name'],
  ]) {
    const value = get(name, attr);
    if (value !== undefined && !value.startsWith(SITE)) {
      problems.push(`${name} is not absolute under ${SITE}: ${value}`);
    }
  }

  const card = get('twitter:card', 'name');
  if (card !== 'summary_large_image') {
    problems.push(`twitter:card is ${card}, expected summary_large_image`);
  }

  const width = get('og:image:width');
  const height = get('og:image:height');
  if (width !== '1200') problems.push(`og:image:width is ${width}, expected 1200`);
  if (height !== '630') problems.push(`og:image:height is ${height}, expected 630`);

  // The assertion no grep can make: the card the page points at is really in
  // the built output.
  const image = get('og:image');
  let localImage;
  if (image !== undefined && image.startsWith(SITE)) {
    localImage = join(DIST, image.slice(SITE.length));
    if (!existsSync(localImage)) {
      problems.push(`og:image file is not in the build: ${localImage}`);
    }
  }

  const twitterImage = get('twitter:image', 'name');
  if (image !== twitterImage) {
    problems.push(`twitter:image (${twitterImage}) differs from og:image (${image})`);
  }

  // An alt that repeats the title passes a presence check while telling a
  // screen-reader user nothing they were not already told. The card's argument
  // lives in its panel, not in its heading.
  const title = get('og:title');
  for (const [name, attr] of [
    ['og:image:alt', 'property'],
    ['twitter:image:alt', 'name'],
  ]) {
    const alt = get(name, attr);
    if (alt !== undefined) {
      if (alt.trim() === '') problems.push(`${name} is empty`);
      else if (alt === (title ?? '')) {
        problems.push(`${name} only repeats og:title`);
      }
    }
  }

  const count = REQUIRED.filter(([n, a]) => get(n, a) !== undefined).length +
    (get('article:published_time') === undefined ? 0 : 1);

  return { file, problems, count, image: localImage ?? image };
}

const pages = discoverPages(DIST);

let failed = 0;
for (const page of pages) {
  if (!existsSync(page)) {
    console.log(`FAIL ${page} — not built`);
    failed++;
    continue;
  }
  const { file, problems, count, image } = checkPage(page);
  if (problems.length === 0) {
    console.log(`OK   ${file} — ${count} tags, ${image}`);
  } else {
    failed++;
    console.log(`FAIL ${file} — ${count} tags`);
    for (const problem of problems) console.log(`       ${problem}`);
  }
}
console.log(`${pages.length} pages checked, ${failed} failed`);
process.exit(failed ? 1 : 0);
