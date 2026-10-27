import cliValidator from '@jsverse/transloco-cli/internal/validator';
import { describe, expect, it } from 'vitest';

import * as main from './lib/transloco-validator.js';

describe('transloco-validator main', () => {
  it(`GIVEN the package's main module
      WHEN it is imported
      THEN its only export is the CLI's validator as the default`, () => {
    expect(Object.keys(main)).toEqual(['default']);
    expect(main.default).toBe(cliValidator);
    expect(main.default).toBeTypeOf('function');
  });
});
