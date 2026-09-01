# Intent: share cards

- **Status:** Accepted
- **Date:** 2026-09-01
- **Scope:** every page the site publishes — the landing and each article.

## What a card is for

A link to this site is rarely opened by the person it was given to. It gets pasted into a chat, a
mail, a message — and the next reader decides whether to click based on whatever unfurls there.
That unfurled card is the first thing anyone reads about a page, before its own headline. It is a
reading surface, not decoration, and it should be designed as one.

Today nothing unfurls. The site publishes no `og:` or `twitter:` tags at all, so every link
renders as a bare URL: no title, no description, no image.

## Decisions

**1. Tags ship before images.** Title and description alone already produce a usable card;
an image with no tags produces nothing. Do the meta tags first and treat the artwork as the
second, separable step.

**2. The landing's card is the wordmark, not a portrait.** The wordmark is the one piece of this
site's identity that was actually designed, and it is what the page itself opens with — a card
that matches the page it links to is a promise kept rather than a bait. A portrait would also be
the same image every profile card on the internet already is. This decision has a written reversal
condition; see below.

**3. Each article gets its own card, carrying the article's claim.** The card is the article's
first deck, so it carries what the deck carries: the title, and where the piece rests on a
measured number, that number. One card per article, in the site's own palette — gold on the near
black, over the starfield.

The reason this is per-article and not one shared image: several articles sharing one card are
indistinguishable in a thread or a feed. A card that cannot tell you which article it belongs to
has spent the reader's only glance on nothing.

**4. Cards are drawn by hand and committed as PNGs**, 1200×630, under `public/assets/og/`.
Generating them at build time (satori, resvg and friends) means a native-binary dependency chain
in a project whose whole shape is a static build with almost no dependencies and a CSP that is
audited. At three articles that trade is clearly bad. Revisit it around ten, when drawing each one
by hand is the thing that hurts.

**5. A default card covers any page that has none yet.** A new article with no artwork should
still unfurl as a proper card, never as a bare URL. The default is the landing's card.

## Success

A link pasted into a chat client renders title, description and the right image; the same URL run
through LinkedIn's Post Inspector renders the same. Checked, not assumed — both are one-minute
checks and neither can be inferred from the markup being present.

## Constraints

- **The CSP does not change.** The images are same-origin PNGs and `img-src 'self'` already covers
  them; the crawler that renders a card fetches the image directly and is not subject to the page's
  policy at all.
- **The landing's inline hashes must survive.** Its CSP pins SHA-256 hashes of the inline `<style>`
  and `<script>` blocks. Meta tags added to the head do not touch either block, so the hashes hold —
  but this is the failure mode this repository has, and any head edit is checked against it.
- **Absolute URLs.** `og:image` and `og:url` must be absolute. `site` is set in
  `astro.config.mjs`, so they derive from it rather than being written by hand.
- **`summary_large_image`.** Without it the card renders small even when the image is 1200×630.
- **Cards are cached hard by the platforms that scrape them.** Once a URL has been scraped the card
  sticks; changing it later means asking the platform to re-scrape. Get a page's card right before
  its link is circulated, not after.

## Reversal condition

Decision 2 flips if the site's main arrival path ever becomes a social feed rather than a link
handed to someone directly. A face earns attention in a feed, where nobody asked for the link; it
earns nothing in a message, where somebody already did. The decision follows the arrival path, and
the day the arrival path changes is the day to revisit it — not before.

## Out of scope

- Build-time card generation (see decision 4).
- Photography of any kind in an article card.
- Platform-specific tuning beyond `summary_large_image`.
- The favicon, which is settled and stays as it is.
