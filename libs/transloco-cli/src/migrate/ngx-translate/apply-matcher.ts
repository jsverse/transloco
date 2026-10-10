import type { MatcherDef } from './migration-matchers.js';

/** Replaces every match of the matcher in the content. */
export function applyMatcher(content: string, { from, to }: MatcherDef) {
  let lastIndex = 0;
  let result: RegExpExecArray | null;
  let newContent = '';

  from.lastIndex = 0;

  while ((result = from.exec(content)) !== null) {
    // Add the text from last match to current match
    newContent += content.slice(lastIndex, result.index);

    // Generate replacement text
    const replacement =
      typeof to === 'function' ? to(result[0], ...result.slice(1)) : to;

    newContent += replacement;
    lastIndex = from.lastIndex;
  }

  // Add remaining content after last match
  return newContent + content.slice(lastIndex);
}
