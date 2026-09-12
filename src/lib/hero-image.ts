import { existsSync } from 'node:fs';

// Resolved the same way and for the same reason as the share card's path — see
// the note at the top of og-image.ts: a path relative to the process working
// directory, because `astro build` runs from the project root, and never from
// `import.meta.url`, which Vite rewrites to the build chunk's location.
const HERO_DIR = 'public/assets/hero';

/**
 * Maps a post slug to the site-relative path of its article hero, or null when
 * it has none.
 *
 * Opt-in by file, exactly like the share card: drop
 * `public/assets/hero/<slug>.png` and that post gets a band above its title,
 * with no code change. The difference from `ogImagePath` is that there is no
 * default to fall back to — a post without artwork simply opens on its title,
 * which is what the first three posts do.
 *
 * The slug is a content-collection entry id, which is the MDX filename stem, so
 * it is repository-authored and never user input.
 */
export function heroImagePath(slug?: string): string | null {
  if (slug && existsSync(`${HERO_DIR}/${slug}.png`)) {
    return `/assets/hero/${slug}.png`;
  }
  return null;
}
