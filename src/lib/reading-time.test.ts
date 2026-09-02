// The number this feeds is rendered to a reader as "N min read", so a strip
// regex that quietly widens until it eats prose does not fail loudly — it
// publishes a wrong number that still looks plausible. Both halves are
// asserted for that reason: the scaffolding must go, and the words around it
// must survive. A test for only the first half would pass just as happily on a
// countWords that returned 0 for everything.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countWords, readingTimeMinutes } from './reading-time.ts';

const SCAFFOLD = 'import Foo from "bar";\nexport const x = 1;';
const PROSE = 'The table decides, not taste.';

test('countWords ignores MDX import and export lines', () => {
  assert.equal(countWords(SCAFFOLD), 0);
});

test('countWords still counts the prose around the scaffolding', () => {
  assert.equal(countWords(PROSE), 5);
  assert.equal(countWords(`${SCAFFOLD}\n\n${PROSE}`), 5);
});

// 200 words per minute, so the interesting arithmetic is at the half-minute.
// `words(500)` is deliberately the fixture that carries the rounding claim:
// 2.5 minutes rounds to 3 but floors to 2, so an implementation that switched
// to Math.floor fails here. `words(200)` cannot make that distinction — round
// and floor both give 1 — so it is present to pin the ordinary case, not to
// prove the rounding.
const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

test('readingTimeMinutes rounds rather than floors', () => {
  // Guards the fixture itself: if the generator stopped producing countable
  // words the assertions below would be measuring the wrong number.
  assert.equal(countWords(words(500)), 500);

  assert.equal(readingTimeMinutes(words(200)), 1);
  assert.equal(readingTimeMinutes(words(500)), 3);
});

test('readingTimeMinutes floors at one minute for an empty body', () => {
  assert.equal(readingTimeMinutes(''), 1);
});
