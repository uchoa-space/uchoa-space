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
import { existsSync } from 'node:fs';
import { ogImagePath } from './og-image.ts';

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
