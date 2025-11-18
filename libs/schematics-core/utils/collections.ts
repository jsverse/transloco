export function stringifyList<T>(list: T[], separator = ', '): string {
  return list.map((item) => `'${item}'`).join(separator);
}

export function coerceArray<T>(value: T | T[]): T[];
export function coerceArray<T>(value: T | readonly T[]): readonly T[];
export function coerceArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}
