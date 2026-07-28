import { describe, expect, it } from 'vitest';

import { removeExtraKeys } from '../keys-builder/utils/remove-extra-keys';

describe('removeExtraKeys', () => {
  describe('when both sides share the same shape', () => {
    it('should keep used keys and drop extra ones from a flat translation', () => {
      const current = { 'a.b': 'translated a.b', 'x.y': 'stale' };
      const extracted = { 'a.b': 'missing' };

      expect(removeExtraKeys(current, extracted)).toEqual({
        'a.b': 'translated a.b',
      });
    });

    it('should keep used keys and drop extra ones from a nested translation', () => {
      const current = {
        a: { b: 'translated a.b' },
        x: { y: 'stale' },
      };
      const extracted = { a: { b: 'missing' } };

      expect(removeExtraKeys(current, extracted)).toEqual({
        a: { b: 'translated a.b' },
      });
    });
  });

  /**
   * `currentTranslation` is read from disk as-is, while the extracted keys are
   * flat unless `unflat` is on. When the two shapes disagree, every key used to
   * look extra and the whole file was wiped.
   */
  describe('when the shapes disagree', () => {
    it('should resolve a nested translation against flat extracted keys', () => {
      const current = {
        used: { key: 'translated value' },
        totally: { extra: 'stale' },
      };
      const extracted = { 'used.key': 'missing' };

      expect(removeExtraKeys(current, extracted)).toEqual({
        used: { key: 'translated value' },
      });
    });

    it('should resolve a flat translation against nested extracted keys', () => {
      const current = {
        'used.key': 'translated value',
        'totally.extra': 'stale',
      };
      const extracted = { used: { key: 'missing' } };

      expect(removeExtraKeys(current, extracted)).toEqual({
        'used.key': 'translated value',
      });
    });

    it('should keep a partially nested translation intact', () => {
      const current = {
        'a.b': 'translated a.b',
        c: { d: 'translated c.d' },
        gone: { away: 'stale' },
      };
      const extracted = { 'a.b': 'missing', 'c.d': 'missing' };

      expect(removeExtraKeys(current, extracted)).toEqual({
        'a.b': 'translated a.b',
        c: { d: 'translated c.d' },
      });
    });
  });
});
