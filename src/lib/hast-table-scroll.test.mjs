// The wrapper this plugin adds is the only thing making a wide table reachable
// without a mouse: a scroll container holding no focusable content cannot be
// scrolled by keyboard unless it is itself focusable and announced. The class
// alone is the visible half and the half that would survive a careless edit —
// `class="table-scroll"` in the built HTML proves a div appeared, and proves
// nothing about `tabIndex`, `role` or `aria-label`. Those three are asserted
// separately below so that losing them fails on its own, rather than hiding
// behind a passing structural check.
//
// The `ctx` stub is read from Sätteri's own type declarations, not inferred
// from behaviour:
//   node_modules/satteri/dist/hast/hast-visitor.d.ts:107
//     HastFilteredVisitor.visit(node, ctx)
//   node_modules/satteri/dist/hast/hast-visitor.d.ts:57
//     HastVisitorContext.wrapNode(node, parentNode): void  — wrapper is 2nd arg
// `wrapNode` is the entire context surface this plugin touches, so the stub
// records its arguments and needs nothing else.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import plugin from './hast-table-scroll.mjs';

const table = () => ({ type: 'element', tagName: 'table', properties: {}, children: [] });

function wrapperFor(node) {
  const calls = [];
  const ctx = { wrapNode: (target, parentNode) => calls.push({ target, parentNode }) };
  plugin.element.visit(node, ctx);
  assert.equal(calls.length, 1, 'expected the visitor to call wrapNode exactly once');
  assert.equal(calls[0].target, node, 'expected the visited table itself to be the wrapped node');
  return calls[0].parentNode;
}

test('the plugin wraps a table in a div carrying the scroll class', () => {
  const wrapper = wrapperFor(table());
  assert.equal(wrapper.type, 'element');
  assert.equal(wrapper.tagName, 'div');
  assert.deepEqual(wrapper.properties.className, ['table-scroll']);
});

test('the table wrapper carries its full accessibility contract', () => {
  const { properties } = wrapperFor(table());
  assert.equal(properties.tabIndex, 0, 'a scroll container must be focusable to be scrolled by keyboard');
  assert.equal(properties.role, 'region', 'the container must be announced as a region');
  assert.equal(
    typeof properties['aria-label'],
    'string',
    'a region with no accessible name is announced as an unlabelled region',
  );
  assert.notEqual(properties['aria-label'].trim(), '');
});
