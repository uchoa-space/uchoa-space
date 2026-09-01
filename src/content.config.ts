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
    // it. Optional: a post with no card of its own falls back to the default
    // card and to the description that matches it, so publishing a post still
    // costs one file and no artwork.
    imageAlt: z.string().optional(),
  }),
});

export const collections = { posts };
