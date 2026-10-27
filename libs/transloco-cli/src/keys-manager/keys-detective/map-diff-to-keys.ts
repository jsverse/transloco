import { buildPath } from '../utils/path.utils.js';
import { isObject } from '../utils/validators.utils.js';

import type { Diff } from './flat-diff.js';

export function mapDiffToKeys(diffArr: Diff[], side: 'lhs' | 'rhs'): string {
  const keys = diffArr.reduce((acc, diff) => {
    const base = diff.path!.join('.');
    const keys = !isObject((diff as Record<string, any>)[side])
      ? [`'${base}'`]
      : buildPath((diff as Record<string, any>)[side]).map(
          (inner) => `'${base}.${inner}'`,
        );

    acc.push(...keys);

    return acc;
  }, [] as string[]);

  return keys.join('\n');
}
