import * as cli from '@jsverse/transloco-cli/internal/optimize';
import { describe, expect, it } from 'vitest';

import * as main from './lib/transloco-optimize';

describe('transloco-optimize main', () => {
  it(`GIVEN the package's main module
      WHEN it is imported
      THEN it exports exactly the CLI's optimize functions`, () => {
    expect(Object.keys(main).sort()).toEqual([
      'getTranslationFiles',
      'getTranslationsFolder',
      'optimizeFiles',
    ]);
    expect(main.getTranslationFiles).toBe(cli.getTranslationFiles);
    expect(main.getTranslationsFolder).toBe(cli.getTranslationsFolder);
    expect(main.optimizeFiles).toBe(cli.optimizeFiles);
    expect(main.optimizeFiles).toBeTypeOf('function');
  });
});
