/**
 * Appends `.npmignore` overrides so the schematics and schematics-core
 * `package.json` files (needed for `ng add`/`ng generate`) are not stripped
 * from the published `transloco` package.
 */
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

const npmignorePath = join(
  'dist',
  'libs',
  'transloco',
  '.npmignore',
);

appendFileSync(
  npmignorePath,
  '\n!schematics/package.json\n!schematics-core/package.json\n',
);
