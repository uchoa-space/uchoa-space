// Guards the failure this module is most likely to have and least likely to
// show: `ogImagePath` locates a post's card by `existsSync`, so a typo in
// `OG_DIR`, a lost leading slash, or a changed extension does not throw — it
// silently returns the generic wordmark card for every post. The build stays
// clean and `check:og` stays green, because that checker only proves the file
// the function returned is present in `dist/`, never that it is the right file
// for that post. Every share card on the site would quietly revert to the
// wordmark and nothing would say so. These assertions are what notices.
//
// CWD DEPENDENCE, deliberate and load-bearing: `OG_DIR` is the relative path
// `public/assets/og`, which `node:fs` resolves against `process.cwd()` — the
// module's own comment explains why `import.meta.url` cannot be used instead
// (Vite bundles it into a build chunk whose location is not `src/lib/`). So
// both `astro build` and `npm test` must run from the repository root, and
// running this suite from a subdirectory would fail every per-post assertion
// below for a reason that has nothing to do with the code under test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { DEFAULT_OG_IMAGE_ALT, ogImageAlt, ogImagePath } from './og-image.ts';

// The real published slugs, not invented ones. Each is an MDX filename stem in
// `src/content/posts/` with matching artwork in `public/assets/og/`. Using the
// real pair is the point: if a post's PNG is ever deleted, this test is
// supposed to go red rather than quietly keep asserting about a fiction.
const PUBLISHED = ['table-decides-not-taste', 'judge-must-not-share-ancestry'];

const DEFAULT_CARD = '/assets/og/default.png';

test('ogImagePath resolves a published post to its own card', () => {
  for (const slug of PUBLISHED) {
    // Separates the two ways this test can fail: artwork removed from the repo
    // (this line) versus resolution logic broken (the next one).
    assert.ok(
      existsSync(`public/assets/og/${slug}.png`),
      `fixture gone: public/assets/og/${slug}.png is no longer in the repository`,
    );
    assert.equal(ogImagePath(slug), `/assets/og/${slug}.png`);
  }
});

test('ogImagePath falls back to the default card for a post with no artwork', () => {
  assert.equal(ogImagePath('no-such-post-has-ever-been-published'), DEFAULT_CARD);
});

test('ogImagePath falls back to the default card when given no slug', () => {
  // The landing page passes nothing at all.
  assert.equal(ogImagePath(), DEFAULT_CARD);
});

// --- A1: a post must never announce the card it is not showing --------------
//
// `ogImageAlt` returns `DEFAULT_OG_IMAGE_ALT` — a description of the *landing's*
// wordmark card — whenever `postAlt` is falsy, even when `ogImagePath` just
// resolved that post to its own artwork. A screen-reader user is then told they
// are looking at the site wordmark while the card on screen is the post's. That
// is worse than a generic description, because it reads as handled.
//
// This is asserted end-to-end, against the real frontmatter rather than an
// invented string: the schema in `src/content.config.ts` is what guarantees the
// field is authored, and a unit test that passed its own literal in would prove
// nothing about the posts that actually ship. Wiring real content into the real
// function is the only version of this assertion that can go red for the reason
// it exists.

// A deliberately tiny reader for one double-quoted YAML scalar in the
// frontmatter block — the only form this repository uses. Anything else returns
// undefined, which the assertions below report as a missing alt rather than
// silently passing. A YAML dependency would buy generality this needs nowhere.
function frontmatterImageAlt(slug: string): string | undefined {
  const source = readFileSync(`src/content/posts/${slug}.mdx`, 'utf8');
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  if (block === undefined) return undefined;
  const raw = block.match(/^imageAlt:[ \t]*"((?:[^"\\]|\\.)*)"[ \t]*$/m)?.[1];
  return raw?.replace(/\\(["\\])/g, '$1');
}

test('a published post never announces the default wordmark card', () => {
  for (const slug of PUBLISHED) {
    const alt = frontmatterImageAlt(slug);

    // Separated so the failure names the cause. A missing field is the A1 bug
    // the required schema now prevents; a blank one is the hole the schema does
    // not close, because `z.string()` admits "" and "" is falsy in `ogImageAlt`.
    assert.ok(
      alt !== undefined,
      `${slug}.mdx has no imageAlt in its frontmatter — its card would be described as the landing's wordmark`,
    );
    assert.ok(
      alt.trim() !== '',
      `${slug}.mdx has a blank imageAlt — a blank alt is falsy, so its card would be described as the landing's wordmark`,
    );

    // The post resolves to its own artwork, so it must not be described by the
    // default card's words.
    assert.notEqual(ogImagePath(slug), DEFAULT_CARD);
    assert.notEqual(
      ogImageAlt(slug, alt),
      DEFAULT_OG_IMAGE_ALT,
      `${slug} resolves to its own card but is described with the default wordmark alt`,
    );
  }
});
