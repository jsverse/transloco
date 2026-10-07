import fs from 'fs';

import findDuplicatedPropertyKeys from 'find-duplicated-property-keys';

export default function (translationFilePaths: string[]) {
  translationFilePaths.forEach((path) => {
    // Strip a leading BOM - some editors add one and it breaks JSON.parse.
    const translation = fs.readFileSync(path, 'utf-8').replace(/^\uFEFF/, '');

    // Verify that we can parse the JSON
    JSON.parse(translation);

    // Verify that we don't have any duplicate keys
    const result = findDuplicatedPropertyKeys(translation);
    if (result.length) {
      throw new Error(
        `Found duplicate keys: ${result.map(({ key }) => key)} (${path})`,
      );
    }
  });
}
