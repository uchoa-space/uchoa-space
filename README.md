# uchoa.space

A landing page — a wordmark on a starfield, and links to LinkedIn and GitHub —
plus a small blog under `/articles/`.

The site is built with [Astro](https://astro.build), static output only. The
landing itself is still plain HTML with its own inline stylesheet — Astro
renders it, it does not restyle it.

```
src/pages/index.astro    the landing
src/content/posts/       one MDX file per post; the filename stem is the slug
src/components/          ShareMeta, Callout, PostList, Starfield
src/layouts/Post.astro   the article layout
public/                  copied into the build verbatim: CNAME and assets/
tools/                   checkers, run by hand against dist/
dist/                    build output, the only thing published
```

```
npm install
npm run build     # -> dist/
npm run preview   # serve dist/ locally
```

## Publishing

Pushing to `main` runs `.github/workflows/pages.yml`, which runs `npm ci`,
`npm run build`, and publishes `dist/` to GitHub Pages under the domain in
`public/CNAME`. `dist/` contains only the built pages and the contents of
`public/`, so nothing else in the repository reaches the domain.

## Share cards

Every page ships `og:` and `twitter:` tags from one component,
`src/components/ShareMeta.astro`. It emits `<meta>` elements and nothing else,
which is what makes it safe to drop into the landing's hash-pinned head — see
Security below. Nothing about the cards is generated at build time; the PNGs
are drawn by hand and committed, and their source HTML lives in `tools/og/`.

**Adding a card for a new post costs no code change.** Drop a 1200x630 PNG at
`public/assets/og/<mdx-stem>.png`, where the stem is the post's MDX filename,
which is also its route slug. Optionally add an `imageAlt` line to the post's
frontmatter describing what that card shows, for a reader who cannot see it —
the card's text is pixels.

A post with neither still unfurls correctly. `src/lib/og-image.ts` falls back
to `public/assets/og/default.png`, and to the alt written for *that* card. The
two are resolved together on purpose: a post's own alt is used only when the
post's own PNG was found, so a post that describes a card it never shipped
cannot end up announcing an image nobody is looking at. Publishing a post stays
one file, and forgetting the artwork is safe.

**Settle a page's card before its link is circulated.** Platforms cache a card
hard once they have scraped it; fixing it afterwards means asking each platform
to re-scrape, and it does nothing about the copies already sent.

## Checks

Three checkers, no dependency. They all read `dist/`, so **run `npm run build`
first, every time**. `dist/` is gitignored: it is what the browser receives
and it is not what `git diff` shows you.

```
npm run build
npm run check:csp     # every inline block's hash is declared in the page's CSP
npm run check:og      # the share tags, and that the card PNGs are really there
npm run check:motion  # the hero animates, and stops when asked to, in 3 modes
```

`check:csp` hashes every inline `<style>` and `<script>` in `dist/index.html`
and fails if any block is not covered by the page's own CSP meta tag. Run it
after touching the landing's head or either inline block.

`check:og` walks `dist/index.html` and every `dist/articles/*/index.html` and
asserts the tags are present, that `og:url`, `og:image` and `twitter:image` are
absolute, that `twitter:card` is `summary_large_image`, and that the alt text
is not just a copy of the title. Its most useful assertion is the one no `grep`
can make: that the PNG each page points at actually exists inside `dist/`. A
card whose image 404s unfurls as a bare URL while the markup looks perfect.

`check:motion` asks a browser what the hero's CSS actually resolves to. It
copies the built page somewhere throwaway, strips the CSP so a probe script
can run, and reads back `animation-name` for the wordmark, the lede, the
intro, a plain link and the CTA, in the hero's three motion modes: a first
visit, a reader under `prefers-reduced-motion`, and a repeat visit, the
state `data-hero-seen` puts the page in on every load after the first and on
every return from an article. It asserts every element animates on the first
visit and that the CTA's list still contains the `hero-rise` entrance and not
only its own fill, and that every element including the CTA reports `none` in
the other two. Each mode is governed by its own selector list, and all three
lists have to reach the CTA. It needs headless Chrome, the same binary
`tools/og/render.sh` uses. Unlike the other two it is a browser check, not a
text check: the bug it exists for was a specificity accident that was
invisible in the CSS source and only appeared once a browser had resolved
the cascade.

Both of those want a local Chrome or Chromium, and neither bundles one. Each
reads `CHROME_PATH` (or `CHROME`) first; with neither set it takes the first
of the macOS application path, `/usr/bin/google-chrome`,
`google-chrome-stable`, `chromium-browser` and `chromium` that exists, which
is what lets `check:motion` run on Linux and on a CI runner. Point the
variable at a binary if yours lives anywhere else:

```
CHROME_PATH=/path/to/chrome npm run check:motion
```

`tools/og/render.sh` stays macOS-only even so: it verifies every card is
exactly 1200x630 with `sips`, which ships with macOS and nowhere else. It is
needed only to redraw a card's PNG, so nothing in the build, the three
checkers, or the card preview is blocked by it.

No checker replaces the one check no command can do — pasting the real
URLs into a real client after a deploy and looking at what unfurls.

### Looking at the cards

```
npm run build
npm run preview:cards   # -> .preview/card-preview.html
open .preview/card-preview.html
```

Builds one self-contained page showing every card, with its real PNG, under
four client geometries — Slack/Discord, LinkedIn, X, WhatsApp/iMessage — and
marks in red where each is likely to cut the title and description. Each
card's `og:image:alt` is there too, behind a disclosure. It needs a build
first: it reads `dist/`, and it exits non-zero naming the file if a card's
PNG is missing from the build rather than rendering a broken image. Output
goes to `.preview/`, which is gitignored and outside `dist/` so it is never
published.

The client layouts and the cut points are **approximations** that drift as
clients change. They show where copy gets cut, not what any client will do.
Like the checkers, this does not replace pasting the real URLs into a real
client once the site is deployed.

## Security

The page ships a strict `Content-Security-Policy` meta tag: `script-src` and
`style-src` are locked to `'self'` plus a hash of the page's inline scripts and
its inline stylesheet, so no third-party script can execute even if a CDN it
once depended on were compromised. The analytics script (`assets/count.js`) is
vendored locally rather than loaded from GoatCounter's CDN, for the same
reason.

Both inline blocks carry `is:inline` so Astro passes them through byte for
byte. Without it the build would scope the CSS into an external file and
rewrite the inline JS, and the hashes in the CSP would stop matching — which
blocks the page's own stylesheet in the browser. Editing either block by so
much as one whitespace character changes its hash. If you do edit one:

```
npm run build
npm run check:csp   # prints the computed hash of each block
```

then copy the failing block's hash into the `csp` array at the top of
`src/pages/index.astro` and rebuild until it passes.

Verify against `npm run preview`, never `npm run dev`. The dev server
deliberately adds `'unsafe-inline'` to `style-src` so Astro's own tooling can
work, which means a stale style hash cannot fail there: the page looks correct
in dev and arrives unstyled in production. A broken hash shows up as plain
serif text with no wordmark and no buttons.

## Analytics

GoatCounter, self-hosted at `assets/count.js`, reporting to GoatCounter's
collector. It sets no cookies and stores no personal data, so the page
carries no consent banner. The `data-goatcounter` attribute holds the
account endpoint.
