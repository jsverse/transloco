import { isObject } from '../../utils/validators.utils';
import { Translation } from '../../types';

export function removeExtraKeys(
  currentTranslation: Translation,
  extractedTranslation: Translation,
): Translation {
  const resolved: Translation = {};

  for (const key in currentTranslation) {
    if (!Object.prototype.hasOwnProperty.call(extractedTranslation, key)) {
      continue;
    }

    if (isObject(currentTranslation[key])) {
      resolved[key] = removeExtraKeys(
        currentTranslation[key],
        extractedTranslation[key],
      );
    } else {
      resolved[key] = currentTranslation[key];
    }
  }

  return resolved;
}
