import type { Diff } from 'deep-diff';
import { describe, expect, it } from 'vitest';

import { mapDiffToKeys } from '../keys-detective/map-diff-to-keys';

describe('mapDiffToKeys', () => {
  it('should pass when no missing or extra keys were found', () => {
    expect(mapDiffToKeys([], 'lhs')).toEqual('');
    expect(mapDiffToKeys([], 'rhs')).toEqual('');
  });

  it('should return the correct keys for added properties', () => {
    const diffArr: Diff<any>[] = [
      { kind: 'N', path: ['a'], rhs: 1 },
      { kind: 'N', path: ['b', 'c'], rhs: 2 },
    ];

    const result = mapDiffToKeys(diffArr, 'rhs');
    expect(result).toBe(["'a'", "'b.c'"].join('\n'));
  });

  it('should return the correct keys for deleted properties', () => {
    const diffArr: Diff<any>[] = [
      { kind: 'D', path: ['a'], lhs: 1 },
      { kind: 'D', path: ['b', 'c'], lhs: 2 },
    ];

    const result = mapDiffToKeys(diffArr, 'lhs');
    expect(result).toBe(["'a'", "'b.c'"].join('\n'));
  });

  it('should handle nested objects correctly', () => {
    const diffArr: Diff<any>[] = [
      { kind: 'N', path: ['a'], rhs: { b: { c: 1 } } },
    ];

    const result = mapDiffToKeys(diffArr, 'rhs');

    expect(result).toBe("'a.b.c'");
  });
});
