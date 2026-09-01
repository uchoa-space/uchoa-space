import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One MDX file per post, so adding a post costs a file and no registration.
// The entry id comes from the filename and becomes the /articles/<slug>/ route.
const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    // Written as YYYY-MM-DD in frontmatter; coerced so the layout and the
    // landing's sort both get a real Date.
    date: z.coerce.date(),
    description: z.string(),
    // What that post's share card shows, in words, for a reader who cannot see
    // it. Required, and required because it is not verifiable later:
    // `ogImageAlt` falls back to the default card's description whenever this is
    // absent, so a post shipping its own artwork without it would tell a
    // screen-reader user they are looking at the site wordmark — a wrong
    // description, which reads as handled in a way a generic one does not. The
    // build is the only place that can still refuse it.
    //
    // `.min(1)` is not decoration. `z.string()` alone admits "", and "" is falsy
    // in `ogImageAlt`, so a blank alt takes the same fallback a missing one
    // does. Observed: with `imageAlt: ""` the build exited 0 and `check:og`
    // reported 0 failed, while the article shipped `og:image` pointing at its
    // own card and `og:image:alt` describing the landing's wordmark.
    imageAlt: z.string().min(1),
  }),
});

export const collections = { posts };
