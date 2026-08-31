# uchoa.space

A one-page landing: a wordmark on a starfield, and links to LinkedIn and
GitHub.

The page is a single `index.html` with no build step, no dependencies and no
framework. Open it in a browser and it works.

```
index.html        the site
assets/           starfield SVGs and the vendored analytics script
```

## Publishing

Pushing to `main` runs `.github/workflows/pages.yml`, which publishes
`index.html` and `assets/` to GitHub Pages under the domain in `CNAME`.
Nothing else in the repository reaches the domain.

## Security

The page ships a strict `Content-Security-Policy` meta tag: `script-src` and
`style-src` are locked to `'self'` plus a hash of the page's one inline
script and its inline stylesheet, so no third-party script can execute even
if a CDN it once depended on were compromised. The analytics script
(`assets/count.js`) is vendored locally rather than loaded from GoatCounter's
CDN, for the same reason.

## Analytics

GoatCounter, self-hosted at `assets/count.js`, reporting to GoatCounter's
collector. It sets no cookies and stores no personal data, so the page
carries no consent banner. The `data-goatcounter` attribute holds the
account endpoint.
