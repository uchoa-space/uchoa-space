# Tasks

One list, two plans. Everything below runs on `feat/blog`.

- Blog plan: `tasks/plan.md` — the Astro port, the article layer, the two posts. Nearly done.
- Share cards plan: `tasks/share-cards-plan.md` — `og:`/`twitter:` tags and the card artwork.
  Intent: `docs/intent/share-cards.md`.

The completed blog tasks are condensed to one line each with the evidence that closed them;
their full text is in this file's git history and their reasoning is in `tasks/plan.md`.
Everything still open is written out in full.

**Execution order is the numbering below.** It is not the order either plan was written in:
the CSP guardrail was pulled to the front because two later tasks edit the head of a page
whose inline blocks are hash-pinned, and the pre-push cleanup was pulled ahead of the tag
work because it edits the same hashed block and should fail cheap if it is going to fail.

**Standing bar for every task:** `npm run build` succeeds, and after any edit to a page head
or to an inline block, `node tools/check-csp-hashes.mjs` exits 0.

---

# Part I — Blog plan: what is already closed

- [x] **B1** Feature branch and minimal Astro scaffold
- [x] **B2** Landing ported to `src/pages/index.astro`, CSP hashes intact — recomputed against the built output
- [x] **B3** Pages workflow rewritten to build Astro and publish `dist/`
- [x] **B4** Posts collection, article layout, prose typography, reading time
- [x] **B5** `Callout` component
- [x] **B6** Post list under the hero
- [x] **B7** Post 1 published — `table-decides-not-taste.mdx`, closed by task 3: 0 em dashes, 0 ADR mentions
- [x] **B8** Post 2 published — `judge-must-not-share-ancestry.mdx`, 0 em dashes, 0 ADR mentions
- [x] **B9** Stack decision recorded as an ADR — `0016-astro-chosen-over-hand-written-html-and-the-frozen-next-app.md` exists in the corpus

Reconciled against reality on 2026-09-01, not taken on trust:

- B7 was left unchecked but was 95% done. Its file exists with the eval table (14 rows), two
  code fences and two callouts. One acceptance criterion genuinely failed — the last em dash.
  Task 3 closed it; B7 is ticked above on that evidence.
- B9 was left unchecked; the ADR is on disk. Closed on that evidence.
- B7's criterion "the source draft is removed from the drafts tree" is satisfied: that tree
  no longer holds either post's text.
- B10 ("open the PR") is superseded by task 9 below, which opens one PR for both plans.

---

# Part II — Open work, in execution order

## Task 1: Commit the CSP hash checker as `tools/check-csp-hashes.mjs`

**Description:** The landing's CSP pins SHA-256 hashes of its one inline `<style is:inline>`
block and its two inline `<script is:inline>` blocks. Today the only way to check them is the
manual `openssl dgst` procedure in `README.md`, which is why this failure mode keeps coming
back. Commit a script that reads `dist/index.html`, hashes every inline block, compares each
against the hashes declared in the page's own CSP meta tag, prints one line per block and
exits non-zero if any block is uncovered. This lands first so every later head edit — and
task 2, which deliberately changes a hashed block — has a guard already in place. Add an npm
script alias; this adds no dependency.

**Acceptance criteria:**
- [x] `tools/check-csp-hashes.mjs` exists, uses only `node:fs` and `node:crypto`, and resolves `dist/index.html` relative to the current working directory
- [x] `package.json` gains `"check:csp": "node tools/check-csp-hashes.mjs"` under `scripts`, and `dependencies`/`devDependencies` are byte-identical to before
- [x] Running it against the current build prints `OK` for all three blocks and exits 0

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Checker passes: `node tools/check-csp-hashes.mjs; echo "exit=$?"` → three `OK` lines, `exit=0`
- [x] Negative control: append one space inside the `<style is:inline>` block in `src/pages/index.astro`, rebuild, confirm the checker prints `FAIL` and exits 1, then revert the space and confirm `git diff src/pages/index.astro` is empty
- [x] Manual check: `git diff package.json` shows the added `scripts` entry (plus the trailing comma JSON forces on the preceding line) and nothing else; `dependencies`/`devDependencies` are byte-identical

**Dependencies:** None

**Files likely touched:** `tools/check-csp-hashes.mjs`, `package.json`

**Estimated scope:** S

---

## Task 2: Remove the private-path comments before this branch is ever pushed

**Description:** Four comments in this repository name a local directory tree outside it and
the private material in it. This repository is public and this branch has never been pushed,
so nothing has leaked; a public git history keeps what it once held, so editing these files
after a push does not undo it. The window closes at the first push, which is why this task
runs before the feature work rather than after it.

The one that matters most is in `src/pages/index.astro`, inside the hero's `<style is:inline>`
block. That block is emitted verbatim because its SHA-256 is pinned in the CSP, so the comment
ships to the browser and View Source on the live page shows it — no repository access needed.
**Editing it changes the bytes the CSP hashes**, so the style hash must be recomputed and the
CSP meta tag updated in the same commit. That is what task 1's checker is for.

Keep the fact, drop the destination: the hero's bio being a trimmed version of a longer written
summary is worth recording; where that summary lives is not.

**Acceptance criteria:**
- [x] `src/pages/index.astro` comment rewritten to state the fact without naming any path or any external party
- [x] The `style-src` hash in the CSP meta tag is recomputed and updated to match the edited block
- [x] The two `script-src` hashes are unchanged — that block was not touched
- [x] `tasks/plan.md` lines naming the drafts' original location rewritten to say only that the drafts came from another tree
- [x] No remaining occurrence anywhere in `src/`, `tasks/`, `docs/`, `README.md`

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] CSP intact with the new hash: `node tools/check-csp-hashes.mjs; echo "exit=$?"` → three `OK` lines, `exit=0`
- [x] Source clean: run the private-path grep recorded in `CLAUDE.local.md` (gitignored, which is where the search terms stay — writing them here would reintroduce in this file exactly what the task removes from the others) over `src/`, `tasks/`, `docs/` and `README.md`. It returns nothing
- [x] Built output clean: after a fresh `npm run build`, the same grep over `dist/` returns nothing. `dist/` is gitignored and is not what `git diff` shows you, so it is checked separately
- [x] Manual check: `npm run preview`, load `/`, the hero renders styled with no CSP violation — a stale hash presents as an unstyled page. Verified against the previewed build rather than in `npm run dev`, and by screenshot in headless Chrome rather than by a human at a browser: the wordmark glow, the lede, the intro's gold underline and all three buttons render. `preview`, not `dev`, is the correct server here: in DEV the page appends `'unsafe-inline'` to `style-src`, so a stale style hash cannot present there and the check could not fail

**Dependencies:** Task 1

**Files likely touched:** `src/pages/index.astro`, `tasks/plan.md`

**Estimated scope:** S

---

## Task 3: Close blog task B7 — the last em dash in post 1

**Description:** `src/content/posts/table-decides-not-taste.mdx` meets every acceptance
criterion B7 set except one: it still carries a single em dash, at line 73, in the sentence
about the golden set's size. Every other criterion is verified met. Rewrite that one sentence
so the punctuation carries the same pause without the character. Change nothing else in the
post: the numbers, the caveat and the hedge are the point of that paragraph.

**Acceptance criteria:**
- [x] `grep -c '—' src/content/posts/table-decides-not-taste.mdx` returns 0
- [x] The sentence still says the same thing: twenty-seven answers, two reaching rung 3, both grounded 0.0, and that two data points is not a comparison
- [x] `git diff` touches one paragraph and no number

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] `grep -c '—' src/content/posts/*.mdx` returns 0 for both files
- [x] `grep -ci 'adr' src/content/posts/*.mdx` returns 0 for both files
- [x] Manual check: read the rewritten sentence aloud; if it needs the dash to parse, it is not done

**Dependencies:** None

**Files likely touched:** `src/content/posts/table-decides-not-taste.mdx`

**Estimated scope:** XS

---

## Checkpoint A: guardrail up, branch safe to push
- [x] `npm run build` succeeds
- [x] `node tools/check-csp-hashes.mjs` exits 0
- [x] Task 1's negative control was actually run — the checker is known to fail when it should, not merely known to pass
- [x] Task 2's private-path grep is clean in `src/`/`tasks/`/`docs/`/`README.md` **and** in a freshly built `dist/`
- [x] `git status` shows no modification under `public/assets/og/` or `tools/og/` — a parallel stream owns those

---

## Task 4: `ShareMeta.astro` component and the `og-image` resolver

**Description:** Build the single source of truth for the card markup, with no page wired to
it yet. `src/lib/og-image.ts` exports a resolver that maps a post slug to a site-relative
image path, returning `/assets/og/<slug>.png` when that file exists under `public/` and
`/assets/og/default.png` when it does not — intent decision 5, so a new article with no
artwork still unfurls as a proper card with no author action. `src/components/ShareMeta.astro`
takes `title`, `description`, `type` (`website` | `article`), an optional `slug`, an
`imageAlt`, and an optional `publishedTime`, and emits the full tag set with absolute URLs
derived from `Astro.site` and `Astro.url.pathname`. The component must emit `<meta>` elements
and nothing else — no inline `<style>`, no inline `<script>`, no stylesheet import — because
that property is what makes it safe to drop into the landing's hashed head in task 6.

**The tag set (15 on the landing, 16 on an article):** `og:title`, `og:description`, `og:type`,
`og:url`, `og:image`, `og:image:width` (1200), `og:image:height` (630), `og:image:alt`,
`og:site_name` (`Rafael Uchoa`), `og:locale` (`en_US`), `twitter:card`
(`summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image`,
`twitter:image:alt` — plus `article:published_time` on articles only, from the post's
frontmatter `date` as an ISO 8601 string.

**Acceptance criteria:**
- [x] `ShareMeta.astro` emits exactly the tags listed above and no other element of any kind
- [x] `og:url`, `og:image` and `twitter:image` are built with `new URL(..., Astro.site)`, never a hand-written string; `og:url` uses `Astro.url.pathname` so it is the canonical path with no query string. Links to this site are hand-delivered and may carry a `?ref=` channel tag; a scraper that follows one must still be told the clean canonical, or the same page caches as several distinct cards
- [x] `og-image.ts` returns `default.png` for a slug with no matching PNG, uses only `node:fs`, and is exercised by a temporary throwaway call with a nonsense slug before the task closes
- [x] `og:image:alt` and `twitter:image:alt` describe the card in words. The card's text is pixels; without this it is silent to a screen reader

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Manual check: `grep -nE "<(script|style|link)" src/components/ShareMeta.astro` returns nothing
- [x] Manual check: `git status --porcelain` lists only the two new files and no modified page. (`git diff --stat` was the original wording and cannot work: both files are untracked, so `git diff` never sees them and would print nothing whatever else changed)
- [x] Manual check: `git status --porcelain public/assets/og tools/og` is empty

**Dependencies:** Task 1

**Files likely touched:** `src/components/ShareMeta.astro`, `src/lib/og-image.ts`

**Estimated scope:** S

---

## Task 5: Wire `ShareMeta` into the article layout

**Description:** Import `ShareMeta` in `src/layouts/Post.astro` and place it in the head,
below `<link rel="canonical">`. Pass the post's frontmatter `title` and `description`
unchanged, `type="article"`, the post slug so the resolver picks that post's PNG, and the
frontmatter `date` as `publishedTime`. The article `og:title` is the bare frontmatter title,
without the ` — Rafael Uchoa` suffix the `<title>` element carries, because `og:site_name`
already says whose site this is. This head carries no pinned hashes, so it is the safe place
to exercise the component first.

**Acceptance criteria:**
- [x] Both `dist/articles/table-decides-not-taste/index.html` and `dist/articles/judge-must-not-share-ancestry/index.html` carry all sixteen tags
- [x] `og:url` on each is `https://uchoa.space/articles/<slug>/` — absolute, trailing slash, no query
- [x] `og:image` on each is `https://uchoa.space/assets/og/<slug>.png`. The artwork stream has already landed all three PNGs, so existence was asserted here rather than deferred to task 7: for each page the referenced file was resolved inside `dist/` with `existsSync` and fetched over HTTP from `astro preview` (200)
- [x] `og:type` is `article`; `twitter:card` is `summary_large_image`; `og:description` is byte-identical to the post's frontmatter `description`
- [x] `article:published_time` matches the post's frontmatter `date`

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Tags present: `grep -o 'property="og:\|property="article:\|name="twitter:' dist/articles/table-decides-not-taste/index.html | wc -l` returns 16, and the same for `judge-must-not-share-ancestry`. Count matches, not lines: `grep -c` was the original wording and returns 1, because Astro's `compressHTML` collapses the whitespace between the tags and the whole head lands on a single line
- [x] No relative URL slipped through: `grep -oE 'og:(url|image)" content="[^"]*"|twitter:image" content="[^"]*"' dist/articles/*/index.html | grep -v 'https://uchoa.space/'` returns nothing. Extract the matches with `-o`, do not filter whole lines: the original wording (`grep -E ... | grep -v`) cannot fail, because `compressHTML` puts the entire head on one line and that line always contains the site URL somewhere. Verified by doctoring a copy of the built page to carry a relative `og:image`: the original command reported clean, this one caught it
- [x] Manual check: both article pages still render. Served the built output with `astro preview` and fetched each: HTTP 200, the title and prose containers present, 16 tags each, and each card PNG itself 200 over HTTP. Checked by request rather than by a human at a browser console; this head pins no hashes, so a meta cannot break its rendering the way it could on the landing

**Dependencies:** Task 4

**Files likely touched:** `src/layouts/Post.astro`

**Estimated scope:** XS

---

## Task 6: Wire `ShareMeta` into the landing's head

**Description:** The highest-risk edit in this list after task 2. Import `ShareMeta` in
`src/pages/index.astro` and place it in the head immediately after
`<meta name="description">`, above the CSP comment block. Pass `og:title` `Rafael Uchoa`,
`type="website"`, no slug (so the resolver returns `default.png`), and this `og:description`:

`I build AI features where measurement decides what ships. Full-stack engineer since 2008; 2026 on RAG, agent runtimes and LLM evaluation.`

Also add the `<link rel="canonical">` the landing currently lacks while `Post.astro` has one,
built the same way. Same reason as `og:url`: a `?ref=`-tagged URL must still resolve to one
canonical page.

The page's `<style is:inline>` and both `<script is:inline>` blocks must not change by a
single byte here — task 2 already changed the style block and recomputed its hash, and this
task must not disturb that. The CSP itself does not change: the PNGs are same-origin and
`img-src 'self'` already covers them, and a card-rendering crawler fetches the image directly
and is not subject to the page's policy at all.

**Acceptance criteria:**
- [x] `dist/index.html` carries all fifteen tags; `og:url` is `https://uchoa.space/`, `og:type` is `website`, `og:image` is `https://uchoa.space/assets/og/default.png`
- [x] `<link rel="canonical" href="https://uchoa.space/">` present
- [x] The CSP meta tag's `content` is unchanged from what task 2 left — the same three hash strings
- [x] `git diff src/pages/index.astro` shows changes only in the frontmatter fence (two imports: the component and the default card's alt) and in the head above the CSP comment; not one line falls inside the `<style is:inline>` block or either `<script is:inline>` block. Proven beyond the diff: every inline block was extracted from the working file and from `HEAD` and compared byte for byte — 4 blocks each side, all identical
- [x] `node tools/check-csp-hashes.mjs` exits 0

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] CSP intact: `node tools/check-csp-hashes.mjs; echo "exit=$?"` → three `OK` lines, `exit=0`
- [x] Hashes untouched by this task: `git diff src/pages/index.astro | grep -c "sha256-"` returns 0
- [x] No relative URL: `grep -oE 'og:(url|image)" content="[^"]*"|twitter:image" content="[^"]*"' dist/index.html | grep -v 'https://uchoa.space/'` returns nothing. Same correction as task 5's: filtering whole lines cannot fail against a `compressHTML`-collapsed head
- [x] Manual check: built, served with `astro preview`, loaded `/` in headless Chrome with `--screenshot`, and looked at the PNG. The hero renders styled: outlined gold wordmark with its glow, the lede, the intro with the gold underline under "100,000+ users, 99.9% uptime", and three buttons with "Read blog" filled gold. Use `preview`, not `dev`: the DEV policy appends `'unsafe-inline'` to `style-src`, so a broken hash cannot present there. Negative control run: the built `dist/index.html` was doctored to declare a wrong style hash and re-shot — the page came back as unstyled serif text with no wordmark and no buttons, so the screenshot check is known to fail when it should. `dist/` was rebuilt afterwards

**Dependencies:** Tasks 2, 4, 5

**Files likely touched:** `src/pages/index.astro`

**Estimated scope:** XS

---

## Checkpoint B: tags ship
- [x] `npm run build` succeeds
- [x] `node tools/check-csp-hashes.mjs` exits 0
- [x] `dist/index.html` and both `dist/articles/*/index.html` carry the full tag set with absolute `https://uchoa.space/` URLs and `twitter:card` = `summary_large_image`
- [x] The landing renders styled in a browser with no CSP violation in the console. Verified with `astro preview` and headless Chrome (`--enable-logging=stderr --v=1`): the good page logs exactly one console line, goatcounter declining to count on localhost, and no CSP message. Negative control: the built `dist/index.html` was doctored to declare a wrong style hash and reloaded, which logged "Applying inline style violates the following Content Security Policy directive" and shrank the screenshot from 88614 to 29383 bytes. Grep the log for "Content Security Policy", not for "Refused to" — Chrome does not use that wording here
- [x] Intent decision 1 is satisfied: a link now unfurls with title and description even if no PNG existed yet
- [x] `git status --porcelain public/assets/og tools/og` is empty — this stream touched nothing the artwork stream owns

---

## Artwork — owned by a parallel stream, listed for dependency order only

No task above or below may touch `public/assets/og/` or `tools/og/`.

- [ ] **A1** `public/assets/og/default.png` — the landing's card and the fallback for any page with none (intent decisions 2 and 5): the wordmark plus the lede, 1200x630, gold on the near black over the starfield
- [ ] **A2** `public/assets/og/table-decides-not-taste.png` and `public/assets/og/judge-must-not-share-ancestry.png` — one card per article carrying that article's claim (intent decision 3). Basenames must equal the MDX filename stems, because that stem is both the route slug and the key the task 4 resolver looks up
- [ ] **A3** `tools/og/` — the hand-authored HTML each PNG was rendered from, committed so the next card is an edit and not an archaeology exercise. Nothing here runs at build time (intent decision 4)

## Checkpoint C: artwork landed
- [ ] All three PNGs exist under `public/assets/og/`, each 1200x630 and under 300 KB
- [ ] `npm run build` succeeds and copies all three into `dist/assets/og/`
- [ ] `node tools/check-csp-hashes.mjs` still exits 0 — adding files under `public/` should not touch the landing's head, and this confirms it
- [ ] No PNG basename drifted from its MDX stem
- [ ] Nothing under `tools/og/` is referenced by `astro.config.mjs` or by any `npm run` script

---

## Task 7: `tools/check-og-tags.mjs` — assert the built markup

**Description:** Commit a checker that walks `dist/index.html` and every
`dist/articles/*/index.html` and asserts, per page: every required tag present; `og:url`,
`og:image` and `twitter:image` absolute and starting `https://uchoa.space/`; `twitter:card`
equal to `summary_large_image`; `og:image:width` 1200 and `og:image:height` 630; and — the
assertion no `grep` can make — that the PNG the page points at actually exists inside `dist/`.
A card whose image 404s unfurls as a bare URL while the markup looks perfect, which is exactly
the state this feature exists to leave. Builtins only, no dependency. Add an npm script alias.

**Acceptance criteria:**
- [x] `tools/check-og-tags.mjs` exists, uses only `node:fs`/`node:path`, discovers article pages by globbing `dist/articles/*/index.html` rather than by a hard-coded list, and exits non-zero on any failed assertion. Discovery exercised for real: a fourth article directory was copied into `dist/articles/`, and the checker picked it up and reported "4 pages checked" with no edit to the script
- [x] It prints one result line per page and a summary line
- [x] `package.json` gains `"check:og": "node tools/check-og-tags.mjs"`; `dependencies`/`devDependencies` unchanged
- [x] It exits 0 against the current build. Beyond the task text it also asserts `og:image:alt` and `twitter:image:alt` are present, non-empty, and not byte-identical to `og:title` — an alt that repeats the title passes a presence check while telling a screen-reader user nothing new

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Passes: `node tools/check-og-tags.mjs; echo "exit=$?"` → three pages checked, `exit=0`
- [x] Negative control: temporarily rename `dist/assets/og/default.png`, rerun, confirm it fails with a message naming the missing file, then rebuild
- [x] Negative control: temporarily change one `twitter:card` value in `dist/` by hand, rerun, confirm it fails, then rebuild

**Dependencies:** Tasks 6, A1, A2

**Files likely touched:** `tools/check-og-tags.mjs`, `package.json`

**Estimated scope:** S

---

## Task 8: README — the share-card procedure and the two checkers

**Description:** Record three things in `README.md`: that every page ships `og:`/`twitter:`
tags from one component; what adding a card for a new post costs (drop a 1200x630 PNG at
`public/assets/og/<mdx-stem>.png` — no code change, and a post with no PNG falls back to
`default.png`); and that the manual `openssl dgst` procedure is superseded by
`npm run check:csp`, with `npm run check:og` alongside it. Keep the existing explanation of
*why* the hashes are pinned — replace the procedure, not the reasoning.

**Acceptance criteria:**
- [x] README documents the tag set's single source of truth and the `<mdx-stem>.png` naming rule, plus the optional `imageAlt` frontmatter field that goes with it, and the property that makes the pair safe to forget: a post with neither still unfurls on the default card, with the alt written for that card
- [x] README documents both `npm run check:csp` and `npm run check:og` and states when each is run
- [x] The manual `openssl` block is replaced by the script invocation; the surrounding paragraph explaining why the inline blocks are hash-pinned survives
- [x] README states that platforms cache cards hard, so a page's card is settled before its link is circulated

**Verification:**
- [x] Manual check: both documented commands, copied verbatim out of the README into a shell at the repo root after `npm run build`, exit 0. All four `npm run` invocations the README names were run verbatim from the repo root: `build`, `check:csp`, `check:og` and `preview`, each exit 0. Every path the README names was also confirmed to exist on disk
- [x] Manual check: `grep -n "openssl" README.md` returns nothing — checked case-insensitively, and for `dgst` and `block.txt` too, since the original procedure named all three. The grep was confirmed to match when the word is present, so a clean result means absence, not a broken pattern

**Dependencies:** Task 7

**Files likely touched:** `README.md`

**Estimated scope:** XS

---

## Checkpoint D: everything local is green

**Left deliberately unticked.** Task 9 requires this checkpoint re-verified against the working
tree at the moment of the push, in the same shell session as the push — not remembered from
earlier. Ticking it here would be exactly the staleness that criterion guards against, so the
boxes stay open for whoever runs task 9. Every item was run green on a fresh build at the close
of task 8; two of them need a correction first:

- `git diff package.json` must be read against `89a88ab^`, not against `main`. `main` predates
  the Astro port and has no `package.json` at all, so diffing against it prints the whole file
  and proves nothing. Against `89a88ab^` it shows two added `scripts` lines and nothing else,
  with `dependencies` byte-identical.
- "Neither page's CSP is weaker than before" holds for the landing: same eight directives as
  `main`, same shape, no `'unsafe-inline'` and no wildcard, with `script-src` now pinning two
  hashes instead of one because the port added a second inline block. The article pages have no
  "before" — they are new — and their `style-src` does carry `'unsafe-inline'`, which is a
  documented necessity for Shiki's per-token style attributes, not a relaxation of anything that
  existed.
- [ ] `npm run build` succeeds
- [ ] `node tools/check-csp-hashes.mjs` exits 0
- [ ] `node tools/check-og-tags.mjs` exits 0
- [ ] Task 2's private-path grep is clean in `src/`, `tasks/`, `docs/`, `README.md` and in a freshly built `dist/`
- [ ] Both posts: 0 em dashes, 0 ADR mentions
- [ ] Every intent decision accounted for: tags before images (1), the landing's card is the wordmark (2), one card per article (3), hand-drawn committed PNGs with no build-time generation (4), a default card for any page with none (5)
- [ ] No new npm dependency; `git diff package.json` shows only added `scripts` entries
- [ ] Neither page's CSP is weaker than before

---

## Task 9: Push the branch and open the PR — **HUMAN GATE, ASK BEFORE RUNNING**

**Description:** One PR against `main` covering both plans. This is the irreversible step:
`main` is currently the only branch on the remote, and a public git history keeps whatever a
push puts in it. Checkpoint D is what makes this safe, and it is checked immediately before
the push, not remembered from earlier.

**Do not run this task autonomously.** Present the Checkpoint D evidence and wait for an
explicit go.

**Acceptance criteria:**
- [ ] Checkpoint D re-verified against the working tree at the moment of the push, not earlier
- [ ] Branch pushed to `origin`, PR open against `main`
- [ ] PR description covers: the Astro port and its CSP hash result, the deploy change, the two posts, the share cards, and the two committed checkers
- [ ] `main` untouched until merge; the live site still serves the old landing

**Verification:**
- [ ] `node tools/check-csp-hashes.mjs` and `node tools/check-og-tags.mjs` both exit 0 on a fresh build, run in the same shell session as the push
- [ ] The private-path grep from `CLAUDE.local.md` returns nothing over `src/`, `tasks/`, `docs/`, `README.md` and `dist/`, run in that same session
- [ ] Manual check: PR checks green
- [ ] Manual check: `https://uchoa.space/` still serves the pre-merge landing

**Dependencies:** Checkpoint D

**Files likely touched:** none

**Estimated scope:** XS

---

## Task 10: Real unfurl check — **HUMAN-RUN, GATED ON A DEPLOY**

**Description:** The intent doc's success criterion, verbatim: "Checked, not assumed — both
are one-minute checks and neither can be inferred from the markup being present." Correct
markup is necessary and not sufficient: a crawler can be blocked by the host, served a
different response, reject the image, or truncate the copy, and none of that is visible in
`dist/`. The site must be deployed for this to run at all. It must happen **before any link is
circulated**, because platforms cache a card hard once scraped and changing it afterwards
means asking each platform to re-scrape.

**Acceptance criteria:**
- [ ] All three URLs are publicly reachable
- [ ] LinkedIn Post Inspector (`https://www.linkedin.com/post-inspector/`) run against `https://uchoa.space/`, `https://uchoa.space/articles/table-decides-not-taste/` and `https://uchoa.space/articles/judge-must-not-share-ancestry/`. Each renders title, description and the correct large image
- [ ] The same three URLs pasted into one real chat client each unfurl with the large card, not the small one and not a bare URL
- [ ] Each article shows *its own* image, not the default — the failure this catches is a slug typo, and it looks fine in the markup
- [ ] The landing's description is read as it renders, not as it was written: it is 137 characters and some clients truncate earlier. If the credential half is cut everywhere it matters, that is a copy decision to revisit, not a bug to patch
- [ ] Any card found wrong is fixed and re-scraped before the link is shared with anyone

**Verification:**
- [ ] Manual check, by the human: the two runs above. No command produces this result

**Dependencies:** Task 9, and a deploy

**Files likely touched:** none

**Estimated scope:** XS (human time, ~5 minutes)
