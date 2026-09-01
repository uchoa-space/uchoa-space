// Asserts the landing hero's entrance animations are actually applied, and are
// actually switched off when the reader has asked for reduced motion. Run after
// `npm run build`.
//
// This exists because of a specificity bug that no grep could have found and
// that reading the CSS did not reveal either. `.links .cta` is (0,2,0) and the
// entrance rule `.links > *` is (0,1,0), so the CTA's own rule won the cascade
// whatever the source order — and `animation` is a shorthand, so its
// declaration replaced the entrance instead of adding to it. The button was
// fully present in the first painted frame while its neighbours rose in, and,
// worse, it kept animating under prefers-reduced-motion because that rule was
// (0,1,0) too. Both faces of that bug are invisible in the markup and visible
// only to a browser that has resolved the cascade, which is why this asks one.
//
// The technique: copy the built page somewhere throwaway, strip its CSP meta
// tag, append a probe script that writes each selector's computed
// animation-name into the DOM, and read it back with Chrome's --dump-dom.
// Stripping the CSP is what lets the probe run at all, so it must happen on the
// copy and never on dist/index.html itself.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE = join('dist', 'index.html');
// Under the gitignored preview directory, never inside dist/: dist/ is uploaded
// to GitHub Pages wholesale, and this copy has had its CSP removed.
const WORK = join('.preview', 'motion');
const PROBE = join(WORK, 'probe.html');

// Every element the hero animates, plus a non-CTA link as the control: the bug
// showed up as one member of `.links > *` behaving differently from the other.
const TARGETS = [
  ['.wordmark', '.wordmark'],
  ['.lede', '.lede'],
  ['.intro', '.intro'],
  ['.links a:not(.cta)', 'a non-CTA link'],
  ['.links .cta', '.cta'],
];

if (!existsSync(PAGE)) {
  console.log(`FAIL ${PAGE} — not built, run npm run build first`);
  process.exit(1);
}
if (!existsSync(CHROME)) {
  console.log(`FAIL headless Chrome not found at ${CHROME}`);
  process.exit(1);
}

const html = readFileSync(PAGE, 'utf8');
// The page's own policy allows no inline script but the two it pins by hash, so
// the probe cannot run until the meta tag is gone.
const stripped = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, '');
if (stripped === html) {
  console.log('FAIL could not find the CSP meta tag to strip; refusing to probe');
  process.exit(1);
}

const probeScript = `<script>
  var out = [];
  ${JSON.stringify(TARGETS.map(([sel]) => sel))}.forEach(function (sel) {
    var el = document.querySelector(sel);
    out.push(sel + ' :: ' + (el ? getComputedStyle(el).animationName : 'NO-MATCH'));
  });
  var pre = document.createElement('pre');
  pre.id = 'motion-probe';
  pre.textContent = out.join('\\n');
  document.body.appendChild(pre);
</script>`;

mkdirSync(WORK, { recursive: true });
writeFileSync(PROBE, stripped.replace('</body>', probeScript + '</body>'));

function probe(reducedMotion) {
  const args = [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--virtual-time-budget=4000',
    '--dump-dom',
  ];
  if (reducedMotion) args.push('--force-prefers-reduced-motion');
  args.push('file://' + resolve(PROBE));
  // Chrome writes harmless task_policy_set noise to stderr; ignore it.
  const dom = execFileSync(CHROME, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const block = dom.match(/<pre id="motion-probe">([\s\S]*?)<\/pre>/)?.[1] ?? '';
  const seen = new Map();
  for (const line of block.split('\n')) {
    const [sel, name] = line.split(' :: ');
    if (sel && name) seen.set(sel.trim(), name.trim());
  }
  return seen;
}

const problems = [];

// 1. Plain: everything animates, and the CTA's list carries the entrance as
//    well as the fill.
const plain = probe(false);
console.log('motion (default):');
for (const [sel, label] of TARGETS) {
  const name = plain.get(sel) ?? 'NOT-REPORTED';
  console.log(`  ${label.padEnd(18)} animation-name = ${name}`);
  if (name === 'NO-MATCH') problems.push(`${label} (${sel}) matched no element`);
  else if (name === 'NOT-REPORTED') problems.push(`${label} (${sel}) was not reported by the probe`);
  else if (name === 'none') problems.push(`${label} has no entrance animation`);
}
const ctaPlain = plain.get('.links .cta') ?? '';
if (!ctaPlain.split(',').map((n) => n.trim()).includes('hero-rise')) {
  problems.push(
    `.cta animation-name is "${ctaPlain}" and does not include hero-rise — ` +
      'the fill has replaced the entrance instead of composing with it',
  );
}

// 2. Reduced motion: nothing animates, the CTA included.
const reduced = probe(true);
console.log('motion (prefers-reduced-motion: reduce):');
for (const [sel, label] of TARGETS) {
  const name = reduced.get(sel) ?? 'NOT-REPORTED';
  console.log(`  ${label.padEnd(18)} animation-name = ${name}`);
  if (name !== 'none') {
    problems.push(`${label} still animates (${name}) under prefers-reduced-motion`);
  }
}

rmSync(WORK, { recursive: true, force: true });

if (problems.length) {
  for (const problem of problems) console.log(`FAIL ${problem}`);
  console.log(`${problems.length} problems`);
  process.exit(1);
}
console.log(`${TARGETS.length} elements checked in 2 motion modes, 0 problems`);
