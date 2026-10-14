import cliRun from '@jsverse/transloco-cli/internal/scoped-libs';
import { describe, expect, it } from 'vitest';

import * as main from './lib/transloco-scoped-libs.js';

describe('transloco-scoped-libs main', () => {
  it(`GIVEN the package's main module
      WHEN it is imported
      THEN its only export is the CLI's run function as the default`, () => {
    expect(Object.keys(main)).toEqual(['default']);
    expect(main.default).toBe(cliRun);
    expect(main.default).toBeTypeOf('function');
  });
});
