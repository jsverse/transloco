import { describe, expect, it } from 'vitest';

import { marker } from '../marker';

describe('marker', () => {
  describe('when called with a key', () => {
    it('should return the key as is', () => {
      expect(marker('some.key')).toBe('some.key');
    });

    it('should return an array of keys as is', () => {
      expect(marker(['a.key', 'b.key'])).toEqual(['a.key', 'b.key']);
    });
  });

  /**
   * `params` is ignored, it only exists so a `translate()` call can be
   * swapped for a `marker()` one without changing the call site.
   */
  describe('when called with the compatibility params', () => {
    it('should ignore them and return the key', () => {
      expect(marker('some.key', { name: 'Transloco' })).toBe('some.key');
    });

    it('should ignore them when a scope is passed as well', () => {
      expect(marker('some.key', { name: 'Transloco' }, 'admin')).toBe(
        'some.key',
      );
    });

    it('should still accept an undefined placeholder before the scope', () => {
      expect(marker('some.key', undefined, 'admin')).toBe('some.key');
    });
  });
});
