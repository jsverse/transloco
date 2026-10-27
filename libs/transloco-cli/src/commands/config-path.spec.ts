import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getDefaultSearchPlacesSync } from 'cosmiconfig';

import { assertConfigPathExists, configSearchPlaces } from './config-path.js';

describe('assertConfigPathExists', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-config-path-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const write = (file: string, content = '') => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  };

  it(`GIVEN the places the check looks at
      WHEN they are compared with the ones cosmiconfig searches
      THEN they are the same, in the same order`, () => {
    expect(configSearchPlaces).toEqual(getDefaultSearchPlacesSync('transloco'));
  });

  it(`GIVEN a folder holding only a config with another name
      WHEN it is the --config path
      THEN it fails, as a search of the folder finds nothing`, () => {
    write('custom.config.js', 'export default {};');

    expect(() => assertConfigPathExists(dir)).toThrow(
      `error: the --config folder holds no Transloco config: ${dir}`,
    );
  });

  it(`GIVEN a folder whose package.json has no transloco key
      WHEN it is the --config path
      THEN it fails`, () => {
    write('package.json', '{ "name": "app" }');

    expect(() => assertConfigPathExists(dir)).toThrow(
      'holds no Transloco config',
    );
  });

  it.each([
    ['transloco.config.ts', 'export default {};'],
    ['transloco.config.js', 'export default {};'],
    ['.translocorc.json', '{}'],
    ['.config/translocorc.json', '{}'],
    ['package.json', '{ "transloco": {} }'],
  ])(
    `GIVEN a folder holding %s
     WHEN it is the --config path
     THEN it passes, the file is not loaded`,
    (file, content) => {
      write(file, content);

      expect(() => assertConfigPathExists(dir)).not.toThrow();
    },
  );

  it(`GIVEN a file of any name
      WHEN it is the --config path
      THEN it passes`, () => {
    write('custom.config.js', 'export default {};');

    expect(() =>
      assertConfigPathExists(path.join(dir, 'custom.config.js')),
    ).not.toThrow();
  });

  it(`GIVEN a path that does not exist
      WHEN it is the --config path
      THEN it fails naming the path`, () => {
    const missing = path.join(dir, 'nope.js');

    expect(() => assertConfigPathExists(missing)).toThrow(
      `error: the --config path does not exist: ${missing}`,
    );
  });
});
