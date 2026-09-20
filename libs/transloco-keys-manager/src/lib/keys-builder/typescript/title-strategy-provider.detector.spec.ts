import { tsquery, ScriptKind } from '@phenomnomnominal/tsquery';
import { describe, expect, it } from 'vitest';

import { isTitleStrategyProviderCalled } from './title-strategy-provider.detector';

function parse(content: string) {
  return tsquery.ast(content, undefined, ScriptKind.TS);
}

describe('isTitleStrategyProviderCalled', () => {
  it(`GIVEN a named import of the provider that is called
      WHEN checking for a provider call
      THEN it is detected`, () => {
    const ast = parse(`
      import { provideTranslocoTitleStrategy } from '@jsverse/transloco/router';

      export const appConfig = {
        providers: [provideTranslocoTitleStrategy()],
      };
    `);

    expect(isTitleStrategyProviderCalled(ast)).toBe(true);
  });

  it(`GIVEN an aliased named import of the provider that is called
      WHEN checking for a provider call
      THEN it is detected`, () => {
    const ast = parse(`
      import { provideTranslocoTitleStrategy as provideTitle } from '@jsverse/transloco/router';

      export const appConfig = {
        providers: [provideTitle()],
      };
    `);

    expect(isTitleStrategyProviderCalled(ast)).toBe(true);
  });

  it(`GIVEN a namespace import whose provider member is called
      WHEN checking for a provider call
      THEN it is detected`, () => {
    const ast = parse(`
      import * as router from '@jsverse/transloco/router';

      export const appConfig = {
        providers: [router.provideTranslocoTitleStrategy()],
      };
    `);

    expect(isTitleStrategyProviderCalled(ast)).toBe(true);
  });

  it(`GIVEN a local function that shares the provider name and no import
      WHEN checking for a provider call
      THEN it is not detected`, () => {
    const ast = parse(`
      function provideTranslocoTitleStrategy() {
        return {};
      }

      export const appConfig = {
        providers: [provideTranslocoTitleStrategy()],
      };
    `);

    expect(isTitleStrategyProviderCalled(ast)).toBe(false);
  });

  it(`GIVEN the import and a nested local function shadowing the provider name that is called
      WHEN checking for a provider call
      THEN it is not detected`, () => {
    const ast = parse(`
      import { provideTranslocoTitleStrategy } from '@jsverse/transloco/router';

      function buildProviders() {
        function provideTranslocoTitleStrategy() {
          return {};
        }

        return [provideTranslocoTitleStrategy()];
      }

      export const appConfig = {
        providers: buildProviders(),
      };
    `);

    expect(isTitleStrategyProviderCalled(ast)).toBe(false);
  });

  it(`GIVEN the imported provider passed as an argument without being called
      WHEN checking for a provider call
      THEN it is not detected`, () => {
    const ast = parse(`
      import { provideTranslocoTitleStrategy } from '@jsverse/transloco/router';

      export const appConfig = {
        providers: [maybeProvide(provideTranslocoTitleStrategy)],
      };
    `);

    expect(isTitleStrategyProviderCalled(ast)).toBe(false);
  });

  it(`GIVEN a bare import of the provider with no call
      WHEN checking for a provider call
      THEN it is not detected`, () => {
    const ast = parse(`
      import { provideTranslocoTitleStrategy } from '@jsverse/transloco/router';

      export const appConfig = {
        providers: [],
      };
    `);

    expect(isTitleStrategyProviderCalled(ast)).toBe(false);
  });
});
