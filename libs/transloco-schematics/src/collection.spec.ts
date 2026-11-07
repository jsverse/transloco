import { readFileSync } from 'node:fs';
import * as path from 'node:path';

const readJson = (file: string) =>
  JSON.parse(readFileSync(path.join(__dirname, file), 'utf-8'));

const collection = readJson('collection.json');

const deprecated = [
  ['join', 'transloco join'],
  ['split', 'transloco split'],
  ['ngx-migrate', 'transloco migrate ngx-translate'],
  ['ng-migrate', 'transloco migrate angular-i18n'],
];

describe('collection', () => {
  it.each(deprecated)(
    `GIVEN the superseded %s schematic
      WHEN its description in the collection is read
      THEN it starts with the command that replaces it`,
    (name, command) => {
      expect(collection.schematics[name].description).toMatch(
        new RegExp(
          `^Superseded by \`${command}\`, to be deprecated in Transloco v10\\. \\S`,
        ),
      );
    },
  );

  it.each(deprecated)(
    `GIVEN the superseded %s schematic
      WHEN its description in the schema is read
      THEN it starts with the command that replaces it`,
    (name, command) => {
      expect(readJson(`${name}/schema.json`).description).toMatch(
        new RegExp(
          `^Superseded by \`${command}\`, to be deprecated in Transloco v10\\. \\S`,
        ),
      );
    },
  );

  it.each(['scope', 'keys-manager'])(
    `GIVEN the %s schematic that is not superseded
      WHEN its description in the collection is read
      THEN it does not say it is superseded or deprecated`,
    (name) => {
      expect(collection.schematics[name].description).not.toMatch(
        /superseded|deprecated/i,
      );
    },
  );
});
