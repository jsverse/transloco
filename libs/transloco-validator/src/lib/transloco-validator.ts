import findDuplicatedPropertyKeys from 'find-duplicated-property-keys';
import fs from 'fs';

export default function (translationFilePaths: string[]) {
  translationFilePaths.forEach((path) => {
    const translation = fs.readFileSync(path, 'utf-8');

    // Verify that we can parse the JSON
    JSON.parse(translation);

    // Verify that we don't have any duplicate keys
    const result = findDuplicatedPropertyKeys(translation);
    if (result.length) {
      throw new Error(
        `Found duplicate keys: ${result.map(({ key }) => key)} (${path})`
      );
    }
  });
}
