import { describe, expect, it } from 'vitest';

import { importsTitleStrategyProvider } from './title-strategy-provider.detector';

describe('importsTitleStrategyProvider', () => {
  it(`GIVEN a named import of the provider from the router entry point
      WHEN checking for the provider import
      THEN it is detected`, () => {
    const content = `import { provideTranslocoTitleStrategy } from '@jsverse/transloco/router';`;

    expect(importsTitleStrategyProvider(content)).toBe(true);
  });

  it(`GIVEN an aliased import of the provider
      WHEN checking for the provider import
      THEN it is detected`, () => {
    const content = `import { provideTranslocoTitleStrategy as provideTitle } from '@jsverse/transloco/router';`;

    expect(importsTitleStrategyProvider(content)).toBe(true);
  });

  it(`GIVEN a multi-line import of the provider next to other imports
      WHEN checking for the provider import
      THEN it is detected`, () => {
    const content = `
      import {
        TranslocoTitleStrategy,
        provideTranslocoTitleStrategy,
      } from "@jsverse/transloco/router";
    `;

    expect(importsTitleStrategyProvider(content)).toBe(true);
  });

  it(`GIVEN an import of the provider name from another module
      WHEN checking for the provider import
      THEN it is not detected`, () => {
    const content = `import { provideTranslocoTitleStrategy } from './my-title-strategy';`;

    expect(importsTitleStrategyProvider(content)).toBe(false);
  });

  it(`GIVEN an import of other members from the router entry point
      WHEN checking for the provider import
      THEN it is not detected`, () => {
    const content = `import { TranslocoTitleStrategy } from '@jsverse/transloco/router';`;

    expect(importsTitleStrategyProvider(content)).toBe(false);
  });

  it(`GIVEN a file that never mentions the provider
      WHEN checking for the provider import
      THEN it is not detected`, () => {
    const content = `export const appConfig = { providers: [] };`;

    expect(importsTitleStrategyProvider(content)).toBe(false);
  });
});
