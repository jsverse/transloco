import { flatten } from 'flat';

import { isObject } from '../../utils/validators.utils';
import { Translation } from '../../types';

/**
 * The current translation is read from disk as-is, while the extracted keys are
 * flat unless `unflat` is on, so the two can disagree on shape. Comparing the
 * flattened key paths keeps the check independent of both shapes, the same way
 * the keys detective does it.
 */
export function removeExtraKeys(
  currentTranslation: Translation,
  extractedTranslation: Translation,
): Translation {
  const extractedPaths = new Set(
    Object.keys(
      flatten<Translation, Record<string, string>>(extractedTranslation, {
        safe: true,
      }),
    ),
  );

  return resolveUsedKeys(currentTranslation, extractedPaths);
}

function resolveUsedKeys(
  currentTranslation: Translation,
  extractedPaths: Set<string>,
  prefix = '',
): Translation {
  const resolved: Translation = {};

  for (const key in currentTranslation) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = currentTranslation[key];

    if (isObject(value)) {
      const nested = resolveUsedKeys(value, extractedPaths, path);

      if (Object.keys(nested).length > 0) {
        resolved[key] = nested;
      }
    } else if (extractedPaths.has(path)) {
      resolved[key] = value;
    }
  }

  return resolved;
}
