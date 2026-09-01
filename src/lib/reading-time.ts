/**
 * Reading time, computed at build from the post body. Never authored by hand.
 *
 * The input is the raw MDX body as it sits on disk (frontmatter already
 * stripped by the content loader). Markup is removed before counting so that
 * JSX component tags, import lines and code-fence markers do not inflate the
 * number; the prose and the code inside fences do count, because a reader
 * reads both.
 *
 * 200 wpm is the conventional figure for technical prose read on screen.
 */
const WORDS_PER_MINUTE = 200;

export function countWords(body: string): number {
  const text = body
    // MDX import/export statements
    .replace(/^\s*(import|export)\s.*$/gm, ' ')
    // fence markers, keeping the code they wrap
    .replace(/^\s*(```|~~~).*$/gm, ' ')
    // JSX and HTML tags, keeping their children
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    // markdown link/image targets, keeping the anchor text
    .replace(/\]\([^)]*\)/g, '] ')
    // leftover markdown punctuation
    .replace(/[#*_`>|\-]+/g, ' ');

  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

export function readingTimeMinutes(body: string): number {
  return Math.max(1, Math.round(countWords(body) / WORDS_PER_MINUTE));
}

export function readingTime(body: string): string {
  return `${readingTimeMinutes(body)} min read`;
}
