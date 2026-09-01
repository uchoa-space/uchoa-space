// The number this feeds is rendered to a reader as "N min read", so a strip
// regex that quietly widens until it eats prose does not fail loudly — it
// publishes a wrong number that still looks plausible. Both halves are
// asserted for that reason: the scaffolding must go, and the words around it
// must survive. A test for only the first half would pass just as happily on a
// countWords that returned 0 for everything.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countWords } from './reading-time.ts';

const SCAFFOLD = 'import Foo from "bar";\nexport const x = 1;';
const PROSE = 'The table decides, not taste.';

test('countWords ignores MDX import and export lines', () => {
  assert.equal(countWords(SCAFFOLD), 0);
});

test('countWords still counts the prose around the scaffolding', () => {
  assert.equal(countWords(PROSE), 5);
  assert.equal(countWords(`${SCAFFOLD}\n\n${PROSE}`), 5);
});
