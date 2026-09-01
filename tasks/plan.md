# Implementation Plan: Astro blog on the live landing

## Overview

Turn the single static `index.html` into an Astro site that keeps the current landing as its hero,
adds a post list below it, and publishes two long-form technical articles as MDX with the article
furniture they need (prose typography, tables, syntax-highlighted code, an inline SVG diagram, a
callout component for caveats, reading time). The site stays static and stays on GitHub Pages at
`uchoa.space`. All work happens on a feature branch and lands through a PR.

## Architecture Decisions

- **Astro, not Next.** The frozen Next app (`~/Documents/refrigerator/uchoa-space/uchoa-space.bundle`)
  is built with `output: 'standalone'`, a server build aimed at the Kamal/Hetzner path that ADR 0009
  reversed three days after it was taken. Restoring it would mean either adopting the whole Tailwind
  Plus "Spotlight" template (discarding the landing chosen in ADR 0010) or extracting its article
  layer surgically. Astro is static by default, ships Shiki syntax highlighting without a plugin, and
  treats MDX as a first-class content type. **The bundle stays in cold storage.** The only thing taken
  from it is the *values* in its `typography.ts` as a reference for prose styling, transcribed by
  hand, not imported.

- **The landing is preserved, not redesigned.** `index.html` was Figma-derived and chosen over a
  hand-written competitor (ADR 0010); it is live and serving. It becomes `src/pages/index.astro` with
  its markup, inline `<style>` and inline `<script>` carried across unchanged. Redesigning it is out
  of scope for this branch.

- **The CSP hash lock is a hard constraint, not a detail.** `index.html:15` pins `style-src` and
  `script-src` to SHA-256 hashes of the two inline blocks (ADR 0013). If the build rewrites either
  block by so much as a whitespace character, the browser blocks the page's own stylesheet. Task 2
  proves the hashes survive before anything else is built on top.

- **Posts are a content collection, one MDX file per post**, so adding post three costs a file and
  no registration. The two drafts came from another tree outside this repository; per that tree's
  own rule ("post drafts do not live here"), publishing moves them into this repo and that tree
  keeps none of the text.

- **No charts, no Mermaid.** Charts were rejected on the merits: the data behind post 1 is 27 answers
  with 2 at the top rung, and a chart would lend visual weight to a sample the post itself says is too
  small. Mermaid would need a build-time renderer or a client-side bundle; the one diagram needed is a
  four-box flow, hand-written as inline SVG.

- **Deploy stays GitHub Pages**, same workflow file, with a build step added. `CNAME` moves to
  `public/` so it survives into `dist/`.

## Task List

### Phase 1: Foundation — Astro builds the current site, byte-faithfully

- [x] Task 1: Feature branch and minimal Astro scaffold
- [x] Task 2: Port the landing to `src/pages/index.astro` with the CSP hashes intact

### Checkpoint: Foundation
- [x] `npm run build` succeeds
- [x] The SHA-256 of the built page's inline `<style>` and `<script>` match the two hashes in the CSP
- [x] `dist/` contains `CNAME` and the three asset files
- [x] Rendered landing is visually identical to the live one

### Phase 2: Deploy path

- [x] Task 3: Rewrite the Pages workflow to build Astro and publish `dist/`

### Checkpoint: Deploy
- [x] A local run of the workflow's exact build commands produces a `dist/` that could be uploaded as-is
- [x] Nothing outside the site (drafts, notes, `tasks/`) is reachable in `dist/`

### Phase 3: Article layer

- [x] Task 4: Posts content collection plus article layout, prose typography and reading time
- [x] Task 5: `Callout` component
- [x] Task 6: Post list below the hero on the landing

### Checkpoint: Article layer
- [x] A throwaway post renders with styled headings, body measure, table, code block, blockquote and callout
- [x] Reading time is computed from the post body, not hand-written
- [x] The landing lists the post and links to it; the CSP hashes still match

### Phase 4: The two posts

- [ ] Task 7: Publish post 1, with the eval table, the config code block and callouts on the caveat
- [x] Task 8: Publish post 2, with the `FAMILY` code block, the inline SVG gate diagram and callouts on the two open gaps

### Checkpoint: Content
- [ ] Both posts render end to end, links resolve, code blocks highlight
- [ ] Zero em dashes in either published post
- [ ] Every number, model id and caveat survived the move from Markdown to MDX
- [ ] Neither post mentions an ADR, a decision record, or a private project codename

### Phase 5: Ship

- [ ] Task 9: Record the stack decision as an ADR in the corpus
- [ ] Task 10: Open the PR

### Checkpoint: Complete
- [ ] PR open against `main`, build green
- [ ] Live site unchanged until merge

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Astro rewrites the inline `<style>`/`<script>`, breaking the CSP hash lock and blocking the page's own CSS | High | Task 2 verifies by recomputing both hashes against the built output. If the build cannot leave them byte-identical, move the blocks to files under `public/` and switch the CSP to `'self'` for those directives, recording the change |
| A broken build takes down a live site that currently serves with zero build steps | High | Feature branch and PR only; never push to `main`. Compare built `dist/index.html` against the current live `index.html` before merging |
| `CNAME` is lost in the build, dropping the custom domain and the HTTPS certificate issued in ADR 0015 | High | `public/CNAME`, asserted present in `dist/` at the Phase 1 checkpoint |
| Scope creeps into redesigning the landing | Medium | Out of scope, stated above. Any design change is a separate branch |
| CI Node version drifts from local (v26.7.0) | Medium | Pin the Node version in the workflow and commit the lockfile; install with `npm ci` |
| The humanization work (zero em dashes, no ADR references, hedges intact) is silently undone during the Markdown-to-MDX move | Medium | Phase 4 checkpoint greps for em dashes and ADR mentions and re-checks every number |

## Open Questions

- **The two posts have not been formally approved.** Tasks 7 and 8 assume the current text is final.
  If the text is still moving, those two tasks should wait while Phases 1 to 3 proceed, since nothing
  in them depends on the prose.
- **What happens to the frozen blog bundle** now that its article layer is not being restored. It stays
  in cold storage either way; the question is whether its POSTMORTEM's stated revival trigger ("the
  first drafted post") is considered met by this plan or permanently retired.
- **Whether the landing's hero should change at all** once a post list sits under it. Assumed no.
