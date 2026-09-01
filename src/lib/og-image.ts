import { existsSync } from 'node:fs';

// A path relative to the process working directory, which `node:fs` resolves
// against `process.cwd()`. `astro build` runs from the project root, so this
// lands on the repo's own `public/`.
//
// It cannot be resolved from `import.meta.url` instead: Vite bundles this
// module into a build chunk, so `import.meta.url` points at the chunk's
// location rather than at `src/lib/`, and every lookup silently misses and
// returns the default card. That was observed, not assumed — see the throwaway
// check recorded with this file's task.
//
// It points at `public/`, not `dist/`: this runs at build time, while `dist/`
// is still being written, and never in the browser. Astro copies
// `public/assets/og/x.png` verbatim to `dist/assets/og/x.png`, so existence in
// one is existence in the other.
const OG_DIR = 'public/assets/og';

const DEFAULT_OG_IMAGE = '/assets/og/default.png';

/**
 * Maps a post slug to the site-relative path of its share card.
 *
 * A card is opt-in by file: drop `public/assets/og/<slug>.png` and that post
 * gets its own card, with no code change. A post with no PNG — and the landing,
 * which passes no slug — falls back to the default card, so every page unfurls
 * as a proper card whether or not anyone drew artwork for it.
 *
 * The slug is a content-collection entry id, which is the MDX filename stem, so
 * it is repository-authored and never user input.
 */
export function ogImagePath(slug?: string): string {
  if (slug && existsSync(`${OG_DIR}/${slug}.png`)) {
    return `/assets/og/${slug}.png`;
  }
  return DEFAULT_OG_IMAGE;
}

/** Written from looking at `public/assets/og/default.png`, not from its name. */
export const DEFAULT_OG_IMAGE_ALT =
  'The Rafael Uchoa wordmark in outlined gold capitals, glowing over a near-black starfield, above the line: I build AI features where measurement decides what ships.';

/**
 * The alt text for the card `ogImagePath(slug)` actually resolves to.
 *
 * A post's own alt is used only when its own PNG was found. The pair has to be
 * decided together: a post that describes its card but never ships one would
 * otherwise announce a card nobody is looking at, and a wrong description is
 * worse than a generic one because it reads as handled.
 */
export function ogImageAlt(slug?: string, postAlt?: string): string {
  if (postAlt && ogImagePath(slug) !== DEFAULT_OG_IMAGE) return postAlt;
  return DEFAULT_OG_IMAGE_ALT;
}
