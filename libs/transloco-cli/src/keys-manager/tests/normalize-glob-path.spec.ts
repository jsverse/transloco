import { describe, it, expect, vi } from 'vitest';
import { sync as globSync } from 'glob';

import { normalizedGlob } from '../utils/normalize-glob-path.js';

vi.mock('glob', () => ({ sync: vi.fn() }));

describe('normalizedGlob', () => {
  it('should return the matches sorted regardless of the order glob yields them', () => {
    // given
    vi.mocked(globSync).mockReturnValue([
      'src/zeta/en.json',
      'src/Alpha/en.json',
      'src/beta/en.json',
      'src/alpha-2/en.json',
      'src/alpha/en.json',
    ]);

    // when
    const result = normalizedGlob('src/**/en.json');

    // then
    expect(result).toEqual([
      'src/Alpha/en.json',
      'src/alpha-2/en.json',
      'src/alpha/en.json',
      'src/beta/en.json',
      'src/zeta/en.json',
    ]);
  });
});
