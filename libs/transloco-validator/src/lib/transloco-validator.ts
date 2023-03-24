import fs from 'fs';

import findDuplicatedPropertyKeys from 'find-duplicated-property-keys';

export default function (interpolationForbiddenChars: string, translationFilePaths: string[]) {
  translationFilePaths.forEach((path) => {
    const translation = fs.readFileSync(path, 'utf-8');

    // Verify that we can parse the JSON
    let parsedTranslation;
    try {
      parsedTranslation = JSON.parse(translation);
    } catch(error) {
      throw new SyntaxError(
        `${error.message} (${path})`
      );
    }

    // Verify that we don't have any duplicate keys
    const duplicatedKeys = findDuplicatedPropertyKeys(translation);
    if (duplicatedKeys.length) {
      throw new Error(
        `Found duplicate keys: ${duplicatedKeys.map(dupl => dupl.toString())} (${path})`
      );
    }

    const forbiddenKeys = findPropertyKeysContaining(parsedTranslation, interpolationForbiddenChars);
    if (forbiddenKeys.length) {
      throw new Error(
        `Found forbidden characters [${interpolationForbiddenChars}] in keys: ${forbiddenKeys} (${path})`
      );
    }
  });
}

function findPropertyKeysContaining(object: unknown, chars: string, parent = '<instance>') {
  const found = [];
  if (Array.isArray(object)) {
    for(let i = 0; i < object.length; i++) {
      const value = object[i];
      found.push(...findPropertyKeysContaining(value, chars, `${parent}[${i}]`));
    }
  } else if (typeof object === 'object') {
    for(const key in object) {
      const value = object[key];
      for (const char of chars) {
        if (key.includes(char)) {
          found.push(parent + '.' + key);
          break;
        }
      }
      found.push(...findPropertyKeysContaining(value, chars, `${parent}.${key}`));
    }
  }
  return found;
}