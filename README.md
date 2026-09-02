# https://uchoa.space

A landing page (a wordmark on a starfield, and links to LinkedIn and GitHub)
plus a small blog under `/articles/`.

<img width="1159" height="1061" alt="home" src="https://github.com/user-attachments/assets/aa0cb7d3-1afa-48c8-a490-8ca5d1dd34a8" />
<img width="1159" height="1061" alt="an-article" src="https://github.com/user-attachments/assets/e5311872-f9e1-4559-a5ba-bf9d3de2128a" />


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

<img width="1159" height="1061" alt="lighthouse-metrics-01" src="https://github.com/user-attachments/assets/9daf3acb-fdaa-4129-a860-ed9706e96086" />
<img width="1159" height="1061" alt="lighthouse-metrics-02" src="https://github.com/user-attachments/assets/e3269b8c-d763-4ff2-a1f7-f7f893c1746a" />


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

<img width="3000" height="3500" alt="share-cards-preview" src="https://github.com/user-attachments/assets/c6623d0d-a286-4903-9043-22bde242e52b" />


## Checks

Two checkers, no dependency. They both read `dist/`, so **run `npm run build`
first, every time**. `dist/` is gitignored: it is what the browser receives
and it is not what `git diff` shows you.

```
npm run build
npm run check:csp     # every inline block's hash is declared in the page's CSP
npm run check:og      # the share tags, and that the card PNGs are really there
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

Neither checker needs a browser. `tools/og/render.sh` does, and does not
bundle one: it reads `CHROME_PATH` (or `CHROME`) first, and with neither set
takes the first of the macOS application path, `/usr/bin/google-chrome`,
`google-chrome-stable`, `chromium-browser` and `chromium` that exists. Point
the variable at a binary if yours lives anywhere else:

```
CHROME_PATH=/path/to/chrome sh tools/og/render.sh default
```

`tools/og/render.sh` stays macOS-only even so: it verifies every card is
exactly 1200x630 with `sips`, which ships with macOS and nowhere else. It is
needed only to redraw a card's PNG, so nothing in the build, the two
checkers, or the card preview is blocked by it.

No checker replaces the one check no command can do — pasting the real
URLs into a real client after a deploy and looking at what unfurls.

### The build behind a pull request

`.github/workflows/ci.yml` runs this same sequence — `npm ci`, the build, the
two checkers, `npm test` — on every pull request, and only if all of it
passes attaches the built `dist/` to the run as an artifact named
`pr-<number>-<short-sha>-dist`, kept for seven days. A failing run has no
artifact at all, so what you download has already passed its own gates.

Take it from the run's summary page, or from a terminal:

```
gh run download --repo uchoa-space/uchoa-space -n pr-12-a1b2c3d-dist -D review
python3 -m http.server --directory review
```

Serve it; do not open the files. The pages reference `/assets/...` from the
root, so `file://` gets an unstyled page and a wall of 404s. Any plain static
server is enough — the CSP arrives in a meta tag, not a response header, so
there is nothing to configure to see what a reader would see.

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
