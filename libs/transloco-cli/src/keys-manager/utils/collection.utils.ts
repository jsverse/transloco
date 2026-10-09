import { isUndefined } from './validators.utils.js';

export function coerceArray<T>(value: T | T[]): NonNullable<T>[];
export function coerceArray<T>(
  value: T | readonly T[],
): readonly NonNullable<T>[];
export function coerceArray<T>(value: T | T[]): NonNullable<T>[] {
  if (isUndefined(value)) return [];

  return (Array.isArray(value) ? value : [value]) as NonNullable<T>[];
}
