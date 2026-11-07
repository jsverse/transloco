export interface DiffNew<T = unknown> {
  kind: 'N';
  path: [string];
  rhs: T;
}

export interface DiffDeleted<T = unknown> {
  kind: 'D';
  path: [string];
  lhs: T;
}

export type Diff<T = unknown> = DiffNew<T> | DiffDeleted<T>;

/**
 * Compares two flat maps by their top-level keys: a key only in `rhs` is new,
 * a key only in `lhs` is deleted. Values of shared keys are not compared.
 */
export function flatDiff(
  lhs: Record<string, any>,
  rhs: Record<string, any>,
): { missing: DiffNew[]; extra: DiffDeleted[] } {
  return {
    missing: Object.keys(rhs)
      .filter((key) => !Object.hasOwn(lhs, key))
      .map((key) => ({ kind: 'N', path: [key], rhs: rhs[key] })),
    extra: Object.keys(lhs)
      .filter((key) => !Object.hasOwn(rhs, key))
      .map((key) => ({ kind: 'D', path: [key], lhs: lhs[key] })),
  };
}
