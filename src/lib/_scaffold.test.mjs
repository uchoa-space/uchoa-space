// Throwaway. Its only job is to prove `npm test` discovers and executes a test
// colocated in this directory, rather than matching zero files and exiting 0 —
// which is what a scoped glob does when it is silently wrong, and is
// indistinguishable from a green suite. Delete this file once a real test
// lands here.
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('the runner discovers a colocated test in src/lib', () => {
  assert.equal(1, 1);
});
