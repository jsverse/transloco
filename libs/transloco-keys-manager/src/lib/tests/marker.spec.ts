import { describe, expect, it } from 'vitest';

import { marker } from '../marker';

describe('marker', () => {
  it('given a key, when marked, then it should be returned as is', () => {
    const key = 'some.key';

    const result = marker(key);

    expect(result).toBe('some.key');
  });

  it('given an array of keys, when marked, then it should be returned as is', () => {
    const keys = ['a.key', 'b.key'];

    const result = marker(keys);

    expect(result).toEqual(['a.key', 'b.key']);
  });

  /**
   * `params` is ignored, it only exists so a `translate()` call can be
   * swapped for a `marker()` one without changing the call site.
   */
  it('given compatibility params, when marked, then they should be ignored', () => {
    const key = 'some.key';
    const params = { name: 'Transloco' };

    const result = marker(key, params);

    expect(result).toBe('some.key');
  });

  it('given compatibility params and a scope, when marked, then both should be ignored', () => {
    const key = 'some.key';
    const params = { name: 'Transloco' };
    const scope = 'admin';

    const result = marker(key, params, scope);

    expect(result).toBe('some.key');
  });

  it('given an undefined params placeholder and a scope, when marked, then the key should be returned', () => {
    const key = 'some.key';
    const scope = 'admin';

    const result = marker(key, undefined, scope);

    expect(result).toBe('some.key');
  });
});
