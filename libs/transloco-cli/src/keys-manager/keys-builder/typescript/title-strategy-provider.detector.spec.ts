import { describe, expect, it } from 'vitest';

import { parseTsSource } from '../../utils/ts-ast.utils';

import {
  importsTitleStrategyProvider,
  mentionsTitleStrategyProvider,
} from './title-strategy-provider.detector';

function parse(content: string) {
  return parseTsSource(content);
}

describe('importsTitleStrategyProvider', () => {
  it(`GIVEN a named import of the provider from the router entry point
      WHEN checking for the provider import
      THEN it is detected`, () => {
    const ast = parse(
      `import { provideTranslocoTitleStrategy } from '@jsverse/transloco/router';`,
    );

    expect(importsTitleStrategyProvider(ast)).toBe(true);
  });

  it(`GIVEN an aliased import of the provider
      WHEN checking for the provider import
      THEN it is detected`, () => {
    const ast = parse(
      `import { provideTranslocoTitleStrategy as provideTitle } from '@jsverse/transloco/router';`,
    );

    expect(importsTitleStrategyProvider(ast)).toBe(true);
  });

  it(`GIVEN a multi-line import of the provider next to other imports
      WHEN checking for the provider import
      THEN it is detected`, () => {
    const ast = parse(`
      import {
        provideTranslocoTitleStrategy,
        somethingElse,
      } from "@jsverse/transloco/router";
    `);

    expect(importsTitleStrategyProvider(ast)).toBe(true);
  });

  it(`GIVEN a namespace import whose provider member is used
      WHEN checking for the provider import
      THEN it is detected`, () => {
    const ast = parse(`
      import * as router from '@jsverse/transloco/router';

      export const providers = [router.provideTranslocoTitleStrategy()];
    `);

    expect(importsTitleStrategyProvider(ast)).toBe(true);
  });

  it(`GIVEN the strategy class registered manually with useClass
      WHEN checking for the provider import
      THEN it is detected`, () => {
    const ast = parse(`
      import { TitleStrategy } from '@angular/router';
      import { TranslocoTitleStrategy } from '@jsverse/transloco/router';

      export const providers = [
        { provide: TitleStrategy, useClass: TranslocoTitleStrategy },
      ];
    `);

    expect(importsTitleStrategyProvider(ast)).toBe(true);
  });

  it(`GIVEN the provider destructured from a dynamic import of the router entry point
      WHEN checking for the provider import
      THEN it is detected`, () => {
    const ast = parse(`
      async function setup() {
        const { provideTranslocoTitleStrategy } = await import('@jsverse/transloco/router');

        return [provideTranslocoTitleStrategy()];
      }
    `);

    expect(importsTitleStrategyProvider(ast)).toBe(true);
  });

  it(`GIVEN an import of the provider name from another module
      WHEN checking for the provider import
      THEN it is not detected`, () => {
    const ast = parse(
      `import { provideTranslocoTitleStrategy } from './my-title-strategy';`,
    );

    expect(importsTitleStrategyProvider(ast)).toBe(false);
  });

  it(`GIVEN a router import that only appears in a comment
      WHEN checking for the provider import
      THEN it is not detected`, () => {
    const ast = parse(`
      // import { provideTranslocoTitleStrategy } from '@jsverse/transloco/router';
      export const providers = [];
    `);

    expect(importsTitleStrategyProvider(ast)).toBe(false);
  });

  it(`GIVEN an import of other members from the router entry point
      WHEN checking for the provider import
      THEN it is not detected`, () => {
    const ast = parse(
      `import { somethingElse } from '@jsverse/transloco/router';`,
    );

    expect(importsTitleStrategyProvider(ast)).toBe(false);
  });
});

describe('mentionsTitleStrategyProvider', () => {
  it(`GIVEN a file that mentions the provider
      WHEN pre-filtering by text
      THEN it matches`, () => {
    expect(
      mentionsTitleStrategyProvider('x = provideTranslocoTitleStrategy()'),
    ).toBe(true);
  });

  it(`GIVEN a file that never mentions the title strategy
      WHEN pre-filtering by text
      THEN it does not match`, () => {
    expect(mentionsTitleStrategyProvider('export const a = 1;')).toBe(false);
  });
});
