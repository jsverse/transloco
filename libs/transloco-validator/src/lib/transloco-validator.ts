import fs from 'fs';

import findDuplicatedPropertyKeys from 'find-duplicated-property-keys';

export default function (translationFilePaths: string[]) {
  translationFilePaths.forEach((path) => {
    // Strip a leading BOM - some editors add one and it breaks JSON.parse.
    const translation = fs.readFileSync(path, 'utf-8').replace(/^\uFEFF/, '');

    // Verify that we can parse the JSON
    const parsed = JSON.parse(translation);

    // Verify that we don't have any duplicate keys
    const result = findDuplicatedPropertyKeys(translation);
    if (result.length) {
      throw new Error(
        `Found duplicate keys: ${result.map(({ key }) => key)} (${path})`,
      );
    }

    // Catch a missing/extra interpolation brace before it fails at runtime with
    // an opaque parser error.
    const unbalanced = findUnbalancedBraces(parsed);
    if (unbalanced.length) {
      throw new Error(
        `Found unbalanced interpolation braces (${path}):\n${unbalanced.join(
          '\n',
        )}`,
      );
    }
  });
}

/**
 * Returns one `keyPath: "value"` line per string whose `{` / `}` counts differ,
 * ready to drop into the error message.
 *
 * Counting is enough: valid `{{ }}` and ICU `{ }` are both balanced, so a
 * mismatch means a dropped or doubled brace. It won't catch transposed braces
 * that still balance, and a deliberate lone brace in copy is a false positive.
 */
function findUnbalancedBraces(value: unknown, keyPath = ''): string[] {
  if (typeof value === 'string') {
    const open = (value.match(/{/g) ?? []).length;
    const close = (value.match(/}/g) ?? []).length;
    return open === close ? [] : [`  ${keyPath}: ${JSON.stringify(value)}`];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, i) =>
      findUnbalancedBraces(item, `${keyPath}[${i}]`),
    );
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      findUnbalancedBraces(item, keyPath ? `${keyPath}.${key}` : key),
    );
  }

  return [];
}
