import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from 'vitest';

import { devlog } from '../../utils/logger.js';
import { resolveConfig } from '../../utils/resolve-config.js';
import { spyOnConsole, spyOnProcess } from '../spec-utils.js';

const project = vi.hoisted(() => ({ sourceRoot: 'apps/web/src' }));

vi.mock('../../utils/resolve-project-base-path.js', () => ({
  resolveProjectBasePath: () => ({ projectBasePath: project.sourceRoot }),
}));

vi.mock('../../utils/logger.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/logger.js')>()),
  devlog: vi.fn(),
}));

describe('resolveConfig config lookup', () => {
  const rc = '.translocorc.json';
  let cwd: string;
  let dir: string;
  let spies: MockInstance[];

  beforeEach(() => {
    cwd = process.cwd();
    // the real path, as the working directory always is one (/var is /private/var on macOS)
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'resolve-config-lookup-')),
    );
    process.chdir(dir);
    project.sourceRoot = 'apps/web/src';
    mkdir(project.sourceRoot, 'app');
    spies = [spyOnConsole('log'), spyOnProcess('exit')];
  });

  afterEach(() => {
    spies.forEach((spy) => spy.mockRestore());
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
    vi.mocked(devlog).mockClear();
  });

  function mkdir(...segments: string[]) {
    fs.mkdirSync(path.resolve(dir, ...segments), { recursive: true });
  }

  function writeConfig(folder: string, config: object, file = rc) {
    mkdir(folder);
    const filePath = path.resolve(dir, folder, file);
    fs.writeFileSync(filePath, JSON.stringify(config));

    return filePath;
  }

  function langs(inline: object = {}) {
    return resolveConfig(inline as any).langs;
  }

  it(`GIVEN configs in the source root and in the working directory
      WHEN the config is resolved without --config
      THEN the config of the source root wins`, () => {
    writeConfig('.', { langs: ['en', 'es'] });
    writeConfig('apps/web/src', { langs: ['fr'] });

    expect(langs()).toEqual(['fr']);
  });

  it(`GIVEN a config in the working directory only
      WHEN the config is resolved without --config
      THEN that config is found`, () => {
    writeConfig('.', { langs: ['en', 'es'] });

    expect(langs()).toEqual(['en', 'es']);
  });

  it(`GIVEN a config in a directory between the source root and the working directory
      WHEN the config is resolved without --config
      THEN the closest config is found`, () => {
    writeConfig('.', { langs: ['en', 'es'] });
    writeConfig('apps/web', { langs: ['de'] });

    expect(langs()).toEqual(['de']);
  });

  it(`GIVEN no config at all
      WHEN the config is resolved without --config
      THEN the defaults are used`, () => {
    expect(langs()).toEqual(['en']);
  });

  it(`GIVEN a config in the working directory and --config pointing at another file
      WHEN the config is resolved
      THEN only that file is read`, () => {
    writeConfig('.', { langs: ['en', 'es'] });
    writeConfig('other', { langs: ['it'] });

    expect(langs({ config: `other/${rc}` })).toEqual(['it']);
  });

  it(`GIVEN a config in the working directory and --config pointing at a directory without one
      WHEN the config is resolved
      THEN the defaults are used and no parent is searched`, () => {
    writeConfig('.', { langs: ['en', 'es'] });
    mkdir('other', 'nested');

    expect(langs({ config: 'other' })).toEqual(['en']);
    expect(langs({ config: 'other/nested' })).toEqual(['en']);
  });

  it(`GIVEN a config in the working directory and --config pointing at a missing path
      WHEN the config is resolved
      THEN the config found by the lookup without --config is used`, () => {
    writeConfig('.', { langs: ['en', 'es'] });

    expect(langs({ config: 'missing' })).toEqual(['en', 'es']);
  });

  it(`GIVEN configs in the source root and in the working directory and --config pointing at a missing path
      WHEN the config is resolved
      THEN the config of the source root wins, as without --config`, () => {
    writeConfig('.', { langs: ['en', 'es'] });
    writeConfig('apps/web/src', { langs: ['fr'] });

    expect(langs({ config: 'missing/transloco.config.js' })).toEqual(['fr']);
  });

  it(`GIVEN no config at all and --config pointing at a missing path
      WHEN the config is resolved
      THEN the defaults are used`, () => {
    expect(langs({ config: 'missing' })).toEqual(['en']);
  });

  it(`GIVEN a config above the working directory
      WHEN the config is resolved without --config
      THEN the config above is not used`, () => {
    writeConfig('.', { langs: ['en', 'es'] });
    fs.writeFileSync(path.resolve(dir, 'apps/package.json'), '{}');
    process.chdir(path.resolve(dir, 'apps'));
    project.sourceRoot = 'web/src';

    expect(langs()).toEqual(['en']);
  });

  it(`GIVEN a config beside the package.json above the working directory
      WHEN the config is resolved without --config
      THEN that config is found`, () => {
    writeConfig('.', { langs: ['en', 'es'] });
    fs.writeFileSync(path.resolve(dir, 'package.json'), '{}');
    process.chdir(path.resolve(dir, 'apps/web'));
    project.sourceRoot = 'src';

    expect(langs()).toEqual(['en', 'es']);
    expect(langs({ config: 'missing' })).toEqual(['en', 'es']);
  });

  it(`GIVEN a source root outside the working directory
      WHEN the config is resolved without --config
      THEN the source root and then the working directory are searched, not the parents of the source root`, () => {
    const outside = path.resolve(dir, 'outside');
    const workspace = path.resolve(dir, 'workspace');
    mkdir('outside/src/app');
    mkdir('workspace');
    writeConfig('outside', { langs: ['fr'] });
    fs.writeFileSync(path.resolve(workspace, 'package.json'), '{}');
    process.chdir(workspace);
    project.sourceRoot = path.join(outside, 'src');

    expect(langs()).toEqual(['en']);

    writeConfig('workspace', { langs: ['en', 'es'] });

    expect(langs()).toEqual(['en', 'es']);

    writeConfig('outside/src', { langs: ['it'] });

    expect(langs()).toEqual(['it']);
  });

  it(`GIVEN a config in the working directory
      WHEN the config is resolved with and without --config pointing at it
      THEN both resolve the same settings and the same paths`, () => {
    const file = writeConfig('.', {
      rootTranslationsPath: 'apps/web/src/assets/i18n',
      langs: ['en', 'es'],
      scopePathMap: { admin: 'apps/web/src/admin/i18n' },
      keysManager: {
        input: ['apps/web/src/app'],
        output: 'apps/web/src/assets/out',
      },
    });

    const found = resolveConfig({} as any);

    // the option itself is echoed back in the resolved config
    expect(resolveConfig({ config: file } as any)).toEqual({
      ...found,
      config: file,
    });
    expect(resolveConfig({ config: rc } as any)).toEqual({
      ...found,
      config: rc,
    });
    expect(found).toMatchObject({
      langs: ['en', 'es'],
      translationsPath: path.resolve(dir, 'apps/web/src/assets/i18n'),
      output: path.resolve(dir, 'apps/web/src/assets/out'),
      input: [path.resolve(dir, 'apps/web/src/app')],
      scopePathMap: { admin: 'apps/web/src/admin/i18n' },
    });
  });

  it(`GIVEN a config in the working directory
      WHEN the config is resolved without --config
      THEN the debug log names the file`, () => {
    const file = writeConfig('.', { langs: ['en', 'es'] });

    resolveConfig({} as any);

    expect(devlog).toHaveBeenCalledWith(
      'config',
      'Config',
      expect.objectContaining({ 'Transloco file path': file }),
    );
  });
});
