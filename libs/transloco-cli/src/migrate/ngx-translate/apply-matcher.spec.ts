import { describe, expect, it } from 'vitest';

import { applyMatcher } from './apply-matcher.js';
import { generateMatchers } from './migration-matchers.js';

describe('applyMatcher', () => {
  it(`GIVEN a replacement function
      WHEN the matcher is applied
      THEN every match is replaced with what it returns, given the match and its groups`, () => {
    const calls: string[][] = [];
    const result = applyMatcher('a1 b22 c', {
      files: '.ts',
      from: /([a-z])(\d+)/g,
      to: (match, letter, digits) => {
        calls.push([match, letter, digits]);

        return `${digits}${letter}`;
      },
    });

    expect(result).toBe('1a 22b c');
    expect(calls).toEqual([
      ['a1', 'a', '1'],
      ['b22', 'b', '22'],
    ]);
  });

  it(`GIVEN a replacement string with the patterns of String.replace in it
      WHEN the matcher is applied
      THEN it is inserted as it is`, () => {
    expect(
      applyMatcher('x', { files: '.ts', from: /x/g, to: '$& $1 $$ $`' }),
    ).toBe('$& $1 $$ $`');
  });

  it(`GIVEN a content without a match
      WHEN the matcher is applied
      THEN it comes back as it was`, () => {
    expect(
      applyMatcher('nothing\r\nhere\n', { files: '.ts', from: /x/g, to: 'y' }),
    ).toBe('nothing\r\nhere\n');
  });

  it(`GIVEN a matcher that was applied before
      WHEN it is applied to another content
      THEN it starts from the beginning of it`, () => {
    const matcher = { files: '.ts', from: /a/g, to: 'b' };

    applyMatcher('aaa', matcher);
    // The position of a previous run, as an interrupted one leaves it
    matcher.from.lastIndex = 2;

    expect(applyMatcher('aaa', matcher)).toBe('bbb');
  });
});

describe('generateMatchers', () => {
  const describeSteps = (
    steps: ReturnType<typeof generateMatchers>['tsReplacements'],
  ) =>
    steps.map(({ step, matchers }) => [
      step,
      matchers.map(({ files }) => files),
    ]);

  it(`GIVEN the matchers of the migration
      WHEN they are generated
      THEN the HTML steps come as directives and pipes, in the files ending with .html`, () => {
    const { htmlReplacements } = generateMatchers();

    expect(describeSteps(htmlReplacements)).toEqual([
      ['directives', ['.html']],
      ['pipes', ['.html', '.html']],
    ]);
  });

  it(`GIVEN the matchers of the migration
      WHEN they are generated
      THEN the steps of the sources keep their order and every one but the last takes all .ts files, the specs included`, () => {
    const { tsReplacements } = generateMatchers();

    expect(describeSteps(tsReplacements)).toEqual([
      ['modules', ['.ts', '.ts', '.ts']],
      ['service imports', ['.ts', '.ts', '.ts']],
      ['constructor injections', ['.ts']],
      ['service usage', ['.ts']],
      ['specs', ['spec.ts']],
    ]);
  });
});
