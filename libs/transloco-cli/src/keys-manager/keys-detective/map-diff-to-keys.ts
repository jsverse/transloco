import type { Diff, DiffEdit } from 'deep-diff';

import { buildPath } from '../utils/path.utils';
import { isObject } from '../utils/validators.utils';

export function mapDiffToKeys(
  diffArr: Diff<any>[],
  side: 'lhs' | 'rhs',
): string {
  const keys = diffArr.reduce((acc, diff) => {
    const base = diff.path!.join('.');
    const keys = !isObject((diff as DiffEdit<any>)[side])
      ? [`'${base}'`]
      : buildPath((diff as DiffEdit<any>)[side]).map(
          (inner) => `'${base}.${inner}'`,
        );

    acc.push(...keys);

    return acc;
  }, [] as string[]);

  return keys.join('\n');
}
