import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockConfig: any = {};

vi.mock('../config', () => ({
  getConfig: () => mockConfig,
  setConfig: vi.fn(),
}));

const mockLog = vi.fn();
vi.mock('../utils/logger', () => ({
  getLogger: () => ({
    log: mockLog,
    success: vi.fn(),
    startSpinner: vi.fn(),
  }),
}));

describe('collection.utils', () => {
  describe('coerceArray', () => {
    it('should return empty array for undefined', async () => {
      const { coerceArray } = await import('../utils/collection.utils');
      expect(coerceArray(undefined)).toEqual([]);
    });

    it('should wrap a single value in an array', async () => {
      const { coerceArray } = await import('../utils/collection.utils');
      expect(coerceArray('hello')).toEqual(['hello']);
    });

    it('should return the array as-is if already an array', async () => {
      const { coerceArray } = await import('../utils/collection.utils');
      expect(coerceArray(['a', 'b'])).toEqual(['a', 'b']);
    });

    it('should wrap a number in an array', async () => {
      const { coerceArray } = await import('../utils/collection.utils');
      expect(coerceArray(42)).toEqual([42]);
    });
  });
});

describe('keys.utils', () => {
  describe('countKeys', () => {
    it('should count flat keys', async () => {
      const { countKeys } = await import('../utils/keys.utils');
      expect(countKeys({ a: 'v1', b: 'v2' })).toBe(2);
    });

    it('should count nested keys recursively', async () => {
      const { countKeys } = await import('../utils/keys.utils');
      expect(countKeys({ a: { b: 'v1', c: 'v2' }, d: 'v3' })).toBe(3);
    });

    it('should count deeply nested keys', async () => {
      const { countKeys } = await import('../utils/keys.utils');
      expect(countKeys({ a: { b: { c: 'v1' } } })).toBe(1);
    });
  });

  describe('checkForProblematicUnflatKeys', () => {
    it('should log a warning when problematic keys are found', async () => {
      mockLog.mockClear();
      const { checkForProblematicUnflatKeys } =
        await import('../utils/keys.utils');

      checkForProblematicUnflatKeys({
        'a.b': 'value1',
        'a.b.c': 'value2',
      });

      expect(mockLog).toHaveBeenCalled();
    });

    it('should not log when no problematic keys exist', async () => {
      mockLog.mockClear();
      const { checkForProblematicUnflatKeys } =
        await import('../utils/keys.utils');

      checkForProblematicUnflatKeys({
        'a.b': 'value1',
        'c.d': 'value2',
      });

      expect(mockLog).not.toHaveBeenCalled();
    });
  });
});

describe('object.utils', () => {
  describe('mergeDeep', () => {
    it('should merge flat objects', async () => {
      const { mergeDeep } = await import('../utils/object.utils');
      const result = mergeDeep({ a: 1 }, { b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should merge deeply nested objects', async () => {
      const { mergeDeep } = await import('../utils/object.utils');
      const target = { a: { b: 1, c: 2 } };
      const source = { a: { d: 3 } };
      const result = mergeDeep(target, source);
      expect(result).toEqual({ a: { b: 1, c: 2, d: 3 } });
    });

    it('should overwrite non-object values', async () => {
      const { mergeDeep } = await import('../utils/object.utils');
      const result = mergeDeep({ a: 1 }, { a: 2 });
      expect(result).toEqual({ a: 2 });
    });

    it('should handle multiple sources', async () => {
      const { mergeDeep } = await import('../utils/object.utils');
      const result = mergeDeep({ a: 1 }, { b: 2 }, { c: 3 });
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should create nested objects when target key does not exist', async () => {
      const { mergeDeep } = await import('../utils/object.utils');
      const result = mergeDeep({}, { a: { b: { c: 1 } } });
      expect(result).toEqual({ a: { b: { c: 1 } } });
    });

    it('should return target when no sources provided', async () => {
      const { mergeDeep } = await import('../utils/object.utils');
      const target = { a: 1 };
      const result = mergeDeep(target);
      expect(result).toBe(target);
    });
  });

  describe('stringify', () => {
    beforeEach(() => {
      mockConfig = { sort: false };
    });

    it('should stringify without sorting when sort is false', async () => {
      mockConfig = { sort: false };
      const { stringify } = await import('../utils/object.utils');
      const result = stringify({ b: 2, a: 1 });
      const parsed = JSON.parse(result);
      expect(Object.keys(parsed)).toEqual(['b', 'a']);
    });

    it('should stringify with sorted keys when sort is true', async () => {
      mockConfig = { sort: true };
      const { stringify } = await import('../utils/object.utils');
      const result = stringify({ b: 2, a: 1 });
      const parsed = JSON.parse(result);
      expect(Object.keys(parsed)).toEqual(['a', 'b']);
    });
  });
});
