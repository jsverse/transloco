import { basename } from 'node:path';

const quote = (files) => files.map((file) => JSON.stringify(file)).join(' ');

// lint-staged runs different globs concurrently, so every file must match
// exactly one glob; commands inside one glob run in order.
export default {
  '*.{ts,js}': ['eslint --fix', 'prettier --write'],
  '*.json': (files) => {
    const manifests = files.filter((file) => basename(file) === 'package.json');
    return [
      ...(manifests.length
        ? [
            `eslint -c eslint.package-json.config.mjs --no-warn-ignored --fix ${quote(manifests)}`,
          ]
        : []),
      `prettier --write ${quote(files)}`,
    ];
  },
  '*.{mts,css,scss,less,md,html}': ['prettier --write'],
};
