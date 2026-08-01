import path from 'node:path';

import {
  vi,
  MockInstance,
  beforeAll,
  afterAll,
  expect,
  describe,
  it,
} from 'vitest';
import chalk from 'chalk';

import { defaultConfig as _defaultConfig } from '../../config';
import { messages } from '../../messages';
import { spyOnConsole, spyOnProcess } from '../spec-utils';
import { resolveConfig } from '../../utils/resolve-config';
import { resolveProjectBasePath } from '../../utils/resolve-project-base-path';

const sourceRoot = 'libs/transloco-keys-manager/src/lib/tests/resolveConfig';
let mockedGlobalConfig = {};

vi.mock('../../utils/resolve-project-base-path', () => ({
  resolveProjectBasePath: vi.fn().mockReturnValue({
    projectBasePath: 'libs/transloco-keys-manager/src/lib/tests/resolveConfig',
  }),
}));

vi.mock('@jsverse/transloco-utils', () => ({
  getGlobalConfig: () => mockedGlobalConfig,
}));

describe('resolveConfig', () => {
  const inlineConfig = {
    defaultValue: 'test2',
    input: [`${sourceRoot}/somePath`],
    outputFormat: 'pot',
  };
  let spies: MockInstance[];
  const defaultConfig = _defaultConfig({ sourceRoot });
  const validInput = [`${sourceRoot}/src/folder`];

  beforeAll(() => {
    mockedGlobalConfig = {};
    spies = [spyOnProcess('exit'), spyOnConsole('log')];
  });

  afterAll(() => {
    spies.forEach((s) => s.mockRestore());
  });

  function resolvePath(configPath: string[]): string[];
  function resolvePath(configPath: string): string;
  function resolvePath(configPath: string, asArray: true): string[];
  function resolvePath(configPath: string | string[], asArray = false) {
    const resolve = (p: string) => path.resolve(process.cwd(), p);
    if (Array.isArray(configPath)) {
      return configPath.map(resolve);
    }

    return asArray ? [resolve(configPath)] : resolve(configPath);
  }

  function assertConfig<T>(expected: T, inline = {}) {
    const { scopes, __sourceRoot, ...config } = resolveConfig(inline);
    expect(config).toEqual(expected);
    expect(scopes).toBeDefined();
  }

  it('should return the default config', () => {
    const expected = {
      ...defaultConfig,
      input: resolvePath(defaultConfig.input),
      output: resolvePath(defaultConfig.output),
      translationsPath: resolvePath(defaultConfig.translationsPath),
      fileFormat: 'json',
    };
    assertConfig(expected);
  });

  it('should merge the default and inline config ', () => {
    const expected = {
      ...defaultConfig,
      defaultValue: inlineConfig.defaultValue,
      outputFormat: inlineConfig.outputFormat,
      input: resolvePath(inlineConfig.input),
      output: resolvePath(defaultConfig.output),
      translationsPath: resolvePath(defaultConfig.translationsPath),
    };
    assertConfig(expected, inlineConfig);
  });

  describe('with transloco config', () => {
    const translocoConfig = {
      rootTranslationsPath: `${sourceRoot}/1/2`,
      langs: ['en', 'jp'],
      keysManager: {
        defaultValue: 'test',
        input: `${sourceRoot}/src/test`,
        output: `${sourceRoot}/src/assets/override`,
      },
    };

    beforeAll(() => {
      mockedGlobalConfig = translocoConfig;
    });

    afterAll(() => {
      mockedGlobalConfig = {};
    });

    it('should merge the default and the transloco config', () => {
      const expected = {
        ...defaultConfig,
        defaultValue: translocoConfig.keysManager.defaultValue,
        input: resolvePath(translocoConfig.keysManager.input, true),
        output: resolvePath(translocoConfig.keysManager.output),
        translationsPath: resolvePath(translocoConfig.rootTranslationsPath),
        langs: translocoConfig.langs,
      };
      assertConfig(expected);
    });

    it('should merge the default, transloco config and inline config ', () => {
      const expected = {
        ...defaultConfig,
        defaultValue: inlineConfig.defaultValue,
        outputFormat: inlineConfig.outputFormat,
        input: resolvePath(inlineConfig.input),
        output: resolvePath(translocoConfig.keysManager.output),
        translationsPath: resolvePath(translocoConfig.rootTranslationsPath),
        langs: translocoConfig.langs,
      };
      assertConfig(expected, inlineConfig);
    });
  });

  describe('validate directories', () => {
    function shouldFail(prop: string, msg: 'pathDoesntExist' | 'pathIsNotDir') {
      const [processExitSpy, consoleLogSpy] = spies;
      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        chalk.bgRed.black(`${prop} ${messages[msg]}`),
      );
      clearSpies();
    }

    function shouldPass() {
      spies.forEach((s) => expect(s).not.toHaveBeenCalled());
      clearSpies();
    }

    function clearSpies() {
      spies.forEach((s) => s.mockClear());
    }

    it('should fail on invalid input path', () => {
      resolveConfig({ input: ['noFolder'] });
      shouldFail('Input', 'pathDoesntExist');
      resolveConfig({ input: validInput.concat('anotherMissingFolder') });
      shouldFail('Input', 'pathDoesntExist');
      resolveConfig({ input: [`${sourceRoot}/src/1.html`] });
      shouldFail('Input', 'pathIsNotDir');
    });

    it('should pass on invalid translations path in extract mode', () => {
      resolveConfig({
        input: validInput,
        translationsPath: 'noFolder',
        command: 'extract',
      });
      shouldPass();
    });

    it('should fail on invalid translations path in find mode', () => {
      resolveConfig({
        input: validInput,
        translationsPath: 'noFolder',
        command: 'find',
      });
      shouldFail('Translations', 'pathDoesntExist');
      resolveConfig({
        input: validInput,
        translationsPath: `${sourceRoot}/src/1.html`,
        command: 'find',
      });
      shouldFail('Translations', 'pathIsNotDir');
    });

    it('should exit with a non-zero code so CI fails (issue #217)', () => {
      const [processExitSpy] = spies;
      resolveConfig({ input: ['noFolder'] });
      const [exitCode] = processExitSpy.mock.calls.at(-1)!;
      expect(exitCode).not.toBe(0);
      expect(exitCode).toBeDefined();
      clearSpies();
    });
  });

  describe('resolveConfigPaths', () => {
    it('should prefix all the paths in the config with the process cwd', () => {
      const config = resolveConfig({ input: ['folder'] });
      const assertPath = (p: string) =>
        expect(p.startsWith(path.resolve(process.cwd()))).toBe(true);
      config.input.forEach(assertPath);
      assertPath(config.translationsPath);
      assertPath(config.output);
    });
  });

  describe('${sourceRoot} interpolation', () => {
    it('should interpolate ${sourceRoot} in output path', () => {
      const config = resolveConfig({
        input: validInput,
        output: '${sourceRoot}/public/i18n',
      });
      expect(config.output).toBe(resolvePath(`${sourceRoot}/public/i18n`));
    });

    it('should interpolate ${sourceRoot} with relative paths', () => {
      const config = resolveConfig({
        input: validInput,
        output: '${sourceRoot}/../dist/i18n',
      });
      expect(config.output).toBe(resolvePath(`${sourceRoot}/../dist/i18n`));
    });

    it('should interpolate ${sourceRoot} in translationsPath', () => {
      const config = resolveConfig({
        input: validInput,
        translationsPath: '${sourceRoot}/custom/translations',
      });
      expect(config.translationsPath).toBe(
        resolvePath(`${sourceRoot}/custom/translations`),
      );
    });

    it('should interpolate ${sourceRoot} in input paths', () => {
      const config = resolveConfig({
        input: ['${sourceRoot}/src/app'],
      });
      expect(config.input).toEqual(resolvePath([`${sourceRoot}/src/app`]));
    });

    it('should leave paths without ${sourceRoot} unchanged', () => {
      const config = resolveConfig({
        input: validInput,
        output: 'custom/path/i18n',
      });
      expect(config.output).toBe(resolvePath('custom/path/i18n'));
    });

    it('should store sourceRoot in config for scopePathMap interpolation', () => {
      const config = resolveConfig({ input: validInput });
      expect(config.__sourceRoot).toBe(sourceRoot);
    });

    describe('NX workspace scenario (issue #220)', () => {
      afterAll(() => {
        // Reset mock to default behavior
        vi.mocked(resolveProjectBasePath).mockReturnValue({
          projectBasePath:
            'libs/transloco-keys-manager/src/lib/tests/resolveConfig',
        });
      });

      it('should resolve different paths for different projects in NX workspace', () => {
        // Simulate NX workspace with multiple projects
        // Mock resolveProjectBasePath to return different sourceRoots for different projects
        vi.mocked(resolveProjectBasePath).mockImplementation(
          (projectName?: string) => {
            if (projectName === 'my-app') {
              return {
                projectBasePath: 'apps/my-app/src',
                projectType: 'application',
              };
            } else if (projectName === 'my-lib') {
              return {
                projectBasePath: 'libs/my-lib/src',
                projectType: 'library',
              };
            }
            return {
              projectBasePath:
                'libs/transloco-keys-manager/src/lib/tests/resolveConfig',
            };
          },
        );

        // Same config used for both projects (simulating a shared transloco.config.js)
        const sharedConfig = {
          output: '${sourceRoot}/../public/i18n',
          input: ['${sourceRoot}/app'],
        };

        // Run for my-app
        const appConfig = resolveConfig({
          ...sharedConfig,
          project: 'my-app',
        });

        // Run for my-lib
        const libConfig = resolveConfig({
          ...sharedConfig,
          project: 'my-lib',
        });

        // Verify each got their own interpolated paths
        expect(appConfig.output).toBe(
          resolvePath('apps/my-app/src/../public/i18n'),
        );
        expect(appConfig.input).toEqual([resolvePath('apps/my-app/src/app')]);

        expect(libConfig.output).toBe(
          resolvePath('libs/my-lib/src/../public/i18n'),
        );
        expect(libConfig.input).toEqual([resolvePath('libs/my-lib/src/app')]);

        // Paths should be different for each project
        expect(appConfig.output).not.toBe(libConfig.output);
        expect(appConfig.input).not.toEqual(libConfig.input);
      });
    });
  });
});
