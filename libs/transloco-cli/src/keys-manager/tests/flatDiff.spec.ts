import { describe, expect, it } from 'vitest';

import { flatDiff } from '../keys-detective/flat-diff.js';

describe('flatDiff', () => {
  it('should report nothing when both maps have the same keys', () => {
    // given
    const lhs = { a: '1', 'b.c': '2' };
    const rhs = { a: 'changed', 'b.c': '' };

    // when
    const result = flatDiff(lhs, rhs);

    // then
    expect(result).toEqual({ missing: [], extra: [] });
  });

  it('should report keys that exist only in the extracted keys as missing', () => {
    // given
    const lhs = { a: '1' };
    const rhs = { a: '1', 'b.c': 'x', d: 'y' };

    // when
    const { missing, extra } = flatDiff(lhs, rhs);

    // then
    expect(missing).toEqual([
      { kind: 'N', path: ['b.c'], rhs: 'x' },
      { kind: 'N', path: ['d'], rhs: 'y' },
    ]);
    expect(extra).toEqual([]);
  });

  it('should report keys that exist only in the file as extra', () => {
    // given
    const lhs = { a: '1', 'b.c': { d: 1 } };
    const rhs = { a: '1' };

    // when
    const { missing, extra } = flatDiff(lhs, rhs);

    // then
    expect(missing).toEqual([]);
    expect(extra).toEqual([{ kind: 'D', path: ['b.c'], lhs: { d: 1 } }]);
  });

  it('should not treat inherited properties as existing keys', () => {
    // when
    const { missing } = flatDiff({}, { toString: 'x' });

    // then
    expect(missing).toHaveLength(1);
  });
});
