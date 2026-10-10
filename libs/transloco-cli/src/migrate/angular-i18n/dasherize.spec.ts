import { describe, expect, it } from 'vitest';

import { dasherize } from './dasherize.js';

/**
 * The results of `dasherize` of `@angular-devkit/core`, the function the keys
 * were made with before it was written out here.
 */
describe('dasherize', () => {
  it.each([
    ['hello', 'hello'],
    ['helloWorld', 'hello-world'],
    ['HelloWorld', 'hello-world'],
    ['hello world', 'hello-world'],
    ['hello_world', 'hello-world'],
    ['Hello World', 'hello-world'],
    ['ABCDef', 'abcdef'],
    ['abcDEF', 'abc-def'],
    ['some-camel-case', 'some-camel-case'],
    ['a1B', 'a1-b'],
    ['1A', '1-a'],
    ['foo.bar', 'foo.bar'],
    ['', ''],
    ['x y_z', 'x-y-z'],
    ['CamelCASEWord', 'camel-caseword'],
    ['éÉa', 'ééa'],
    ['ÄB', 'äb'],
    ['snake_case_Word', 'snake-case-word'],
    ['kebab-case', 'kebab-case'],
    ['  lead', '--lead'],
    ['trail  ', 'trail--'],
    ['tabs\tand', 'tabs\tand'],
    ['multi\nline', 'multi\nline'],
    ['$a', '$a'],
    ['A', 'a'],
    ['aB', 'a-b'],
  ])(
    `GIVEN %j
     WHEN it is dasherized
     THEN the result is %j`,
    (input, expected) => {
      expect(dasherize(input)).toBe(expected);
    },
  );

  it(`GIVEN something that is no string
      WHEN it is dasherized
      THEN it throws as the original does`, () => {
    expect(() => dasherize(undefined as unknown as string)).toThrow(
      new TypeError("Cannot read properties of undefined (reading 'replace')"),
    );
  });
});
