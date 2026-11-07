import { describe, expect, it } from 'vitest';

import { parseTsSource } from '../../utils/ts-ast.utils';

import { markerExtractor } from './marker.extractor';
import { scanSourceFile } from './scan-source-file';

function extract(content: string) {
  return markerExtractor(scanSourceFile(parseTsSource(content)));
}

const keysOf = (content: string) => extract(content).map(({ key }) => key);

describe('markerExtractor', () => {
  it(`GIVEN marker imported from @jsverse/transloco
      WHEN the keys are extracted
      THEN the marked key is extracted`, () => {
    const keys = keysOf(`
      import { marker } from '@jsverse/transloco';
      const key = marker('some.key');
    `);

    expect(keys).toEqual(['some.key']);
  });

  it(`GIVEN marker imported under an alias
      WHEN the keys are extracted
      THEN only the calls of the alias are extracted`, () => {
    const keys = keysOf(`
      import { marker as _ } from '@jsverse/transloco';
      const keys = [_('aliased.key'), marker('plain.key')];
    `);

    expect(keys).toEqual(['aliased.key']);
  });

  it.each([
    `import { TranslocoModule, marker } from '@jsverse/transloco';`,
    `import { TranslocoModule, marker as m } from '@jsverse/transloco';`,
    `import { marker as m, provideTranslocoScope, translate } from '@jsverse/transloco';`,
  ])(
    `GIVEN marker imported next to other names: %s
      WHEN the keys are extracted
      THEN the calls of marker are extracted`,
    (declaration) => {
      const name = declaration.includes('marker as m') ? 'm' : 'marker';
      const keys = keysOf(`
        ${declaration}
        const keys = [${name}('a.key'), ${name}('b.key')];
      `);

      expect(keys).toEqual(['a.key', 'b.key']);
    },
  );

  it(`GIVEN marker imported twice, once under an alias
      WHEN the keys are extracted
      THEN the calls of both bindings are extracted`, () => {
    const keys = keysOf(`
      import { marker } from '@jsverse/transloco';
      import { TranslocoService, marker as m } from '@jsverse/transloco';
      const keys = [marker('plain.key'), m('aliased.key')];
    `);

    expect(keys).toEqual(['plain.key', 'aliased.key']);
  });

  it(`GIVEN a scope and a list of keys passed to marker
      WHEN the keys are extracted
      THEN the scope is read as the language slot and every key is extracted`, () => {
    const result = extract(`
      import { marker } from '@jsverse/transloco';
      marker(['a', 'b'], undefined, 'scope');
    `);

    expect(result).toEqual([
      { key: 'a', lang: 'scope', params: [] },
      { key: 'b', lang: 'scope', params: [] },
    ]);
  });

  it(`GIVEN a local marker function next to an import of something else from @jsverse/transloco
      WHEN the keys are extracted
      THEN nothing is extracted`, () => {
    const keys = keysOf(`
      import { TranslocoModule } from '@jsverse/transloco';

      function marker(key: string) {
        return key;
      }

      export const imports = [TranslocoModule];
      marker('not.a.key');
    `);

    expect(keys).toEqual([]);
  });

  it.each([
    '@jsverse/transloco-keys-manager/marker',
    '@jsverse/transloco-keys-manager',
    '@jsverse/transloco-cli/marker',
    '@jsverse/transloco-cli',
    '@jsverse/transloco/router',
  ])(
    `GIVEN marker imported from '%s', which does not export it
      WHEN the keys are extracted
      THEN nothing is extracted`,
    (specifier) => {
      const keys = keysOf(`
        import { marker } from '${specifier}';
        marker('not.a.key');
      `);

      expect(keys).toEqual([]);
    },
  );
});
