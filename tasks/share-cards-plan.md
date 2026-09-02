# Implementation Plan: share cards

Intent record: `docs/intent/share-cards.md` (Accepted, 2026-09-01).
Cross-stream interface contract: held by the controller; authoritative on file paths,
image spec, card copy, meta tag list and constraints. This plan does not re-decide any
of it.

Task list: `tasks/todo.md` (merged in by the controller from this stream's fragment).
This plan is the *share cards* plan only. `tasks/plan.md` is a different, still-open
plan (the blog build) and is untouched.

## Overview

Every page this site publishes — the landing and each article — must unfurl as a proper
card when its link is pasted into a chat, a mail or a feed. Today the site emits no `og:`
or `twitter:` tags at all, so every link renders as a bare URL.

The work splits along the seam the intent doc draws in decision 1: **tags ship before
images**. This plan owns the tags, the fallback rule, the guardrail that protects the
landing's pinned CSP hashes, and the verification. The artwork (three 1200x630 PNGs under
`public/assets/og/`, plus their HTML authoring sources under `tools/og/`) is **already in
flight in a parallel stream** and appears here only as sequenced, non-owned tasks so the
dependency order and the checkpoints are honest.

## Architecture decisions

**A1. One `ShareMeta.astro` component, used by both page shells.**
The landing (`src/pages/index.astro`) and the article layout (`src/layouts/Post.astro`)
are two independent, hand-written heads. Two copies of a twelve-tag block drift; the
article footer comment in `Post.astro` already records that exact failure mode about the
tagline. One component with props (`title`, `description`, `type`, `slug`) makes the tag
set a single artifact and makes "does the landing carry the same tags as a post" a
question about one file.

**A2. The component emits `<meta>` elements and nothing else.**
No inline `<style>`, no inline `<script>`, no imported stylesheet. This is the property
that keeps the landing's CSP intact: the landing pins SHA-256 hashes of one inline
`<style is:inline>` block and two inline `<script is:inline>` blocks, and a component that
can never emit a fourth inline block can never invalidate a hash. It is also why the
component can be dropped into the landing's head at all.

**A3. Absolute URLs are derived, never written.**
`og:url` and `og:image` are built from `Astro.site` (`https://uchoa.space`, set in
`astro.config.mjs`) plus `Astro.url.pathname`, exactly as `Post.astro` already builds
`<link rel="canonical">`. `og:url` is therefore always the canonical, clean URL — a
`?ref=` channel tag on a hand-delivered link cannot fork the page into several cached
cards. `trailingSlash: 'always'` means the derived paths already end in a slash.

**A4. The image fallback is resolved from the filesystem at build, not from frontmatter.**
Intent decision 5 wants a new article with no artwork to still unfurl as a proper card.
Making that an opt-in frontmatter field means the fallback fires only when the author
remembers, which is the case where they forgot. So a tiny helper (`src/lib/og-image.ts`)
does one `existsSync` against `public/assets/og/<slug>.png` and returns `default.png` when
it misses. `node:fs` is a builtin: no new dependency. This runs during the static build
only; nothing is *generated* at build time, which is the thing intent decision 4 forbids.
See Open Question 4 — this is the mechanism the contract leaves unspecified.

**A5. The CSP hash checker becomes a committed tool, not a README paragraph.**
`README.md` currently documents a manual procedure: build, extract the bytes between the
tags by hand, pipe them through `openssl dgst`. That procedure is why this failure mode
keeps coming back — it is three careful steps performed by a human who has just finished
thinking about something else. `tools/check-csp-hashes.mjs` reduces it to one command with
an exit code, and it is the first task in the plan so that every later head edit has a
guard already in place.

**A6. A second checker asserts the built markup.**
`tools/check-og-tags.mjs` walks `dist/index.html` and every `dist/articles/*/index.html`
and asserts: the full tag set is present, every URL is absolute and starts with
`https://uchoa.space/`, `twitter:card` is `summary_large_image`, and the PNG each page
points at actually exists on disk in `dist/`. The last assertion is the one a `grep`
cannot make and the one that catches a typo'd slug — a card that 404s its own image
unfurls as a bare URL, which is exactly the state this feature exists to leave.

## Ownership and parallel streams

| Tasks | Stream | Touches |
|---|---|---|
| 1, 2, 3, 4, 8, 9, 10 | this plan | `tools/`, `src/lib/`, `src/components/`, `src/pages/index.astro`, `src/layouts/Post.astro`, `README.md` |
| 5, 6, 7 | **artwork stream, already executing** | `public/assets/og/`, `tools/og/` |

Tasks in this plan must not touch `public/assets/og/` or `tools/og/`. The seam is clean:
this plan only ever *references* the PNG paths the contract fixes, and only Task 8's
checker ever *reads* them.

## Dependency graph

```
T1  tools/check-csp-hashes.mjs  (guardrail, no dependants but everything after it uses it)
      │
T2  src/lib/og-image.ts + src/components/ShareMeta.astro   (the contract, in code)
      ├── T3  wire into src/layouts/Post.astro      → both articles unfurl
      └── T4  wire into src/pages/index.astro       → landing unfurls   [highest risk]
                │
        ┌───────┴───────────────────────────┐
        │                                   │
   T5/T6/T7 artwork (other stream)     T8  tools/check-og-tags.mjs
        └───────────────┬───────────────────┘
                        │
                   T9  README
                        │
                  T10  human unfurl check  [HUMAN-RUN, cannot be automated]
```

Order: T1 → T2 → T3 → T4 → (T5, T6, T7 in parallel, other stream) → T8 → T9 → T10.

T3 and T4 are independently landable after T2 and could run in parallel; they are
sequenced T3-then-T4 on purpose, because T3 exercises the component on the head that
carries no pinned hashes before T4 puts it in the head that does.

## Task list

### Phase 1: Guardrail
- [ ] Task 1: Commit the CSP hash checker as `tools/check-csp-hashes.mjs`

### Checkpoint A: guardrail in place

### Phase 2: Tags (intent decision 1 — these ship before any image exists)
- [ ] Task 2: `ShareMeta.astro` component and the `og-image` resolver
- [ ] Task 3: Wire `ShareMeta` into the article layout
- [ ] Task 4: Wire `ShareMeta` into the landing's head

### Checkpoint B: tags ship

### Phase 3: Artwork — OWNED BY THE PARALLEL STREAM, NOT BY THIS PLAN
- [ ] Task 5: `public/assets/og/default.png` *(in flight, other stream)*
- [ ] Task 6: the two article PNGs *(in flight, other stream)*
- [ ] Task 7: `tools/og/` HTML authoring sources *(in flight, other stream)*

### Checkpoint C: artwork landed

### Phase 4: Verification and record
- [ ] Task 8: `tools/check-og-tags.mjs` — assert the built markup
- [ ] Task 9: README — the share-card procedure and the two checkers
- [ ] Task 10: Real unfurl check **(human-run)**

### Checkpoint D: complete

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| A head edit changes the bytes of a pinned inline block, silently blocking the landing's own stylesheet in the browser | High | T1 lands the checker *first*; T4's acceptance criteria include a byte-identity check of both blocks (`git diff` shows no line inside them) as well as `node tools/check-csp-hashes.mjs` exiting 0 |
| A card is scraped and cached before its image is right; platforms cache hard, and fixing it later means asking each platform to re-scrape | High | Intent doc states this explicitly. T10 gates circulation: the human runs the unfurl check *before* any link goes out. This is the whole reason T10 is a checkpoint and not a footnote |
| `og:image` points at a PNG that is not in `dist/` (typo'd slug, artwork stream renamed a file) — the card unfurls as a bare URL and the markup looks perfect | High | T8's checker resolves each referenced image against `dist/` and fails if it is missing |
| A future post ships with no PNG and unfurls as nothing | Medium | A4's filesystem fallback: no artwork resolves to `default.png` automatically, with no author action |
| A `?ref=` tagged link forks the page into multiple cached cards | Medium | A3: `og:url` is always derived canonical, query string dropped |
| Astro bundles or rewrites something as a side effect of a new import in `index.astro`'s frontmatter | Medium | A2: the component emits only `<meta>` elements, so there is nothing to bundle. `inlineStylesheets: 'never'` in `astro.config.mjs` already guards the adjacent case. Verified by T1's checker at T4 |
| The two streams collide on `tools/` | Low | Disjoint paths: this plan writes `tools/*.mjs`, the artwork stream writes `tools/og/**` |

## Open questions

These are recorded, not resolved by this stream. Where a default was needed to write a
task, the default is stated and marked **[decided by this plan]** — a reversal costs one
line in one component.

1. **`og:site_name` has no value in the contract.** Default taken: `Rafael Uchoa`.
   **[decided by this plan]**
2. **`og:title` has no value in the contract for either page.** The landing's `<title>` is
   `Rafael Uchoa - I build AI features where measurement decides what ships.` (79 chars),
   and the article `<title>` appends ` — Rafael Uchoa`. Both are page titles, not card
   titles. Defaults taken: landing `og:title` = `Rafael Uchoa`; article `og:title` = the
   frontmatter `title` with no site suffix, since `og:site_name` already carries it.
   **[decided by this plan]**
3. **The landing `og:description` the contract fixes verbatim is 173 characters.** Most
   clients truncate a card description well before that; the credential half ("Full-stack
   engineer since 2008; 2026 spent on RAG, agent runtimes and LLM evaluation") is the half
   at risk. The contract says use it verbatim, so it is used verbatim. Flagged, not
   changed.
4. **Neither document specifies *how* the fallback in intent decision 5 is implemented.**
   A4 chooses a build-time `existsSync`. The alternatives were an explicit slug allowlist
   (drifts) and an opt-in frontmatter field (fires only when remembered). If a build-time
   filesystem read is unwanted, the allowlist is the fallback position.
5. **`og:image:alt` / `twitter:image:alt` are absent from the contract's tag list.** A card
   image carrying the article's title as pixels is unreadable to a screen reader without
   one. Left out, because the contract is authoritative on the tag list. Recommended as a
   follow-up.
6. **`og:locale` and `article:published_time` are likewise absent.** The posts carry a real
   `date` in frontmatter, so `article:published_time` would cost nothing. Left out for the
   same reason.
7. **The intent doc reasons at "three articles"; the repository has two.** The contract
   lists two article PNGs plus the default. Not a contradiction — noting it because
   decision 4's "revisit around ten" is counted from a number that is currently two.
8. **The landing carries no `<link rel="canonical">`** while `Post.astro` does. This plan
   gives the landing a canonical `og:url` but does not add the `<link>`, which is outside
   the intent's scope. Flagged as an inconsistency, not fixed here.

## Out of scope (deliberately)

- Build-time card generation of any kind — intent decision 4.
- Any new npm dependency.
- Any change to either page's CSP.
- The artwork itself, its authoring sources, and its copy decisions — the parallel stream
  owns `public/assets/og/` and `tools/og/`.
- Platform-specific tuning beyond `summary_large_image` — intent, Out of scope.
- The favicon.
- Adding `<link rel="canonical">` to the landing (Open Question 8).
- `og:image:alt`, `og:locale`, `article:published_time` (Open Questions 5 and 6).
- A `sitemap.xml` or `robots.txt`, neither of which the intent doc raises.
