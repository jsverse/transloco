import { describe, expect, it } from 'vitest';

import { parseTsSource } from '../../utils/ts-ast.utils.js';

import { markerExtractor } from './marker.extractor.js';
import { scanSourceFile } from './scan-source-file.js';

function extract(content: string) {
  return markerExtractor(scanSourceFile(parseTsSource(content)));
}

const keysOf = (content: string) => extract(content).map(({ key }) => key);

describe('markerExtractor', () => {
  it.each([
    '@jsverse/transloco-cli/marker',
    '@jsverse/transloco-keys-manager/marker',
    '@jsverse/transloco-keys-manager',
  ])(
    `GIVEN marker imported from '%s'
      WHEN the keys are extracted
      THEN the marked key is extracted`,
    (specifier) => {
      const keys = keysOf(`
        import { marker } from '${specifier}';
        const key = marker('some.key');
      `);

      expect(keys).toEqual(['some.key']);
    },
  );

  it.each([
    '@jsverse/transloco-cli/marker',
    '@jsverse/transloco-keys-manager/marker',
    '@jsverse/transloco-keys-manager',
  ])(
    `GIVEN marker imported under an alias from '%s'
      WHEN the keys are extracted
      THEN only the calls of the alias are extracted`,
    (specifier) => {
      const keys = keysOf(`
        import { marker as _ } from '${specifier}';
        const keys = [_('aliased.key'), marker('plain.key')];
      `);

      expect(keys).toEqual(['aliased.key']);
    },
  );

  it(`GIVEN a scope and a list of keys passed to marker from the CLI
      WHEN the keys are extracted
      THEN the scope is read as the language slot and every key is extracted`, () => {
    const result = extract(`
      import { marker } from '@jsverse/transloco-cli/marker';
      marker(['a', 'b'], undefined, 'scope');
    `);

    expect(result).toEqual([
      { key: 'a', lang: 'scope', params: [] },
      { key: 'b', lang: 'scope', params: [] },
    ]);
  });

  it(`GIVEN a local marker function next to an import of something else from the CLI root
      WHEN the keys are extracted
      THEN nothing is extracted`, () => {
    const keys = keysOf(`
      import { getGlobalConfig } from '@jsverse/transloco-cli';

      function marker(key: string) {
        return key;
      }

      getGlobalConfig();
      marker('not.a.key');
    `);

    expect(keys).toEqual([]);
  });

  it(`GIVEN marker imported from the CLI root, which does not export it
      WHEN the keys are extracted
      THEN nothing is extracted`, () => {
    const keys = keysOf(`
      import { marker } from '@jsverse/transloco-cli';
      marker('not.a.key');
    `);

    expect(keys).toEqual([]);
  });

  it(`GIVEN marker imported from another subpath of the CLI
      WHEN the keys are extracted
      THEN nothing is extracted`, () => {
    const keys = keysOf(`
      import { marker } from '@jsverse/transloco-cli/internal/keys-manager';
      marker('not.a.key');
    `);

    expect(keys).toEqual([]);
  });
});
