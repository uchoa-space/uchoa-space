/**
 * Wrap every markdown table in a horizontally scrollable region.
 *
 * A wide table has to scroll inside its own container instead of pushing the
 * article column sideways. CSS alone cannot do that without turning the table
 * into a block box and losing its column sizing, so the wrapper is added here,
 * at build time. `tabindex` plus `role`/`aria-label` are what make a scroll
 * container reachable by keyboard and announced as a region; a scrollable box
 * with no focusable content inside is otherwise unreachable without a mouse.
 *
 * This is a Sätteri hast plugin (Astro 7's default Markdown processor), not a
 * rehype one: `markdown.rehypePlugins` now needs the unified processor
 * installed alongside, which is a heavier swap than this one wrapper is worth.
 */
export default {
  name: 'table-scroll',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      ctx.wrapNode(node, {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['table-scroll'],
          tabIndex: 0,
          role: 'region',
          'aria-label': 'Table, scrollable horizontally',
        },
        children: [],
      });
    },
  },
};
