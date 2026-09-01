// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import tableScroll from './src/lib/hast-table-scroll.mjs';

// Static output, published to GitHub Pages at the apex domain. The landing's
// CSP pins SHA-256 hashes of its inline <style> and <script>, so the build must
// not touch either block: they carry `is:inline` in src/pages/index.astro,
// which keeps Astro from scoping, bundling or reformatting them.
export default defineConfig({
  site: 'https://uchoa.space',
  trailingSlash: 'always',
  integrations: [mdx()],
  // The dev toolbar injects its own stylesheets and fetches page assets to run
  // its audits. Against this page's CSP both are denied, so it produced dozens
  // of "Refused to apply a stylesheet" errors and a failed audit on every load,
  // burying real console output. It ships in no build, so turning it off costs
  // nothing and makes the dev console usable.
  devToolbar: { enabled: false },
  build: {
    // A guard, not a workaround for anything present today. Astro's default
    // ('auto') inlines any stylesheet under 4kB into a style element in the
    // head; on the landing that would add an inline block the CSP does not
    // hash, and the browser would drop it. The site's own CSS is served from
    // public/assets/ for the same reason, so nothing currently depends on this.
    inlineStylesheets: 'never',
  },
  markdown: {
    shikiConfig: { theme: 'github-dark-dimmed' },
    // Sätteri is Astro 7's default Markdown processor; naming it explicitly is
    // what lets a hast plugin into the pipeline. `tableScroll` wraps every
    // table in a scrollable region, and @astrojs/mdx reuses this markdown
    // config by default, so MDX posts get it too.
    processor: satteri({ hastPlugins: [tableScroll] }),
  },
});
