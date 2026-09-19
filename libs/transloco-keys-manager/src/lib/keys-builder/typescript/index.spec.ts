import { tsquery, ScriptKind } from '@phenomnomnominal/tsquery';
import { describe, expect, it } from 'vitest';

import { isTitleStrategyProviderCalled } from './index';

function parse(content: string) {
  return tsquery.ast(content, undefined, ScriptKind.TS);
}

describe('isTitleStrategyProviderCalled', () => {
  it('detects a plain named import call', () => {
    const ast = parse(`
      import { provideTranslocoTitleStrategy } from '@jsverse/transloco/router';

      export const appConfig = {
        providers: [provideTranslocoTitleStrategy()],
      };
    `);

    expect(isTitleStrategyProviderCalled(ast)).toBe(true);
  });

  it('detects an aliased named import call', () => {
    const ast = parse(`
      import { provideTranslocoTitleStrategy as provideTitle } from '@jsverse/transloco/router';

      export const appConfig = {
        providers: [provideTitle()],
      };
    `);

    expect(isTitleStrategyProviderCalled(ast)).toBe(true);
  });

  it('detects a namespace import call', () => {
    const ast = parse(`
      import * as router from '@jsverse/transloco/router';

      export const appConfig = {
        providers: [router.provideTranslocoTitleStrategy()],
      };
    `);

    expect(isTitleStrategyProviderCalled(ast)).toBe(true);
  });

  it('does not match an unrelated local function that shares the same name (no import at all)', () => {
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

  it('does not match a call shadowed by a nested local declaration with the same name, even when the import exists', () => {
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

  it('does not match a reference passed as an argument without being called', () => {
    const ast = parse(`
      import { provideTranslocoTitleStrategy } from '@jsverse/transloco/router';

      export const appConfig = {
        providers: [maybeProvide(provideTranslocoTitleStrategy)],
      };
    `);

    expect(isTitleStrategyProviderCalled(ast)).toBe(false);
  });

  it('does not match a bare import with no call at all', () => {
    const ast = parse(`
      import { provideTranslocoTitleStrategy } from '@jsverse/transloco/router';

      export const appConfig = {
        providers: [],
      };
    `);

    expect(isTitleStrategyProviderCalled(ast)).toBe(false);
  });
});
