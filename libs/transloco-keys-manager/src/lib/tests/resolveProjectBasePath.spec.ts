import os from 'os';
import path from 'path';

import fs from 'fs-extra';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { resolveProjectBasePath } from '../utils/resolve-project-base-path';
import { isString } from '../utils/validators.utils';

import { spyOnConsole } from './spec-utils';

// `resolveProjectBasePath` (and the fixture helpers below) resolve paths
// against `process.cwd()`. Under `nx test` that's the workspace root, so
// running these fs read/write/remove calls against the *real* cwd would read
// and delete real repository files/folders (e.g. a project path fixture of
// 'apps/myProject' would `fs.removeSync` the real `apps/` directory). Sandbox
// everything in an isolated temp dir instead.
const TEST_DIR = path.join(
  os.tmpdir(),
  'transloco-keys-manager-resolve-base-path',
);

const supportedConfigs = ['angular', 'workspace', 'project'] as const;
const myProjectConfig = { projectType: 'library', sourceRoot: 'myRoot' };
const defaultConfig = {
  defaultProject: 'defaultProject',
  projects: {
    defaultProject: { projectType: 'application', sourceRoot: 'testDir' },
    myProject: myProjectConfig,
  },
};

describe('resolveProjectBasePath', () => {
  beforeAll(() => {
    fs.ensureDirSync(TEST_DIR);
    vi.spyOn(process, 'cwd').mockReturnValue(TEST_DIR);
  });

  afterAll(() => {
    vi.restoreAllMocks();
    fs.removeSync(TEST_DIR);
  });

  it('should return the default "src"', () => {
    const spy = spyOnConsole('log');
    expect(resolveProjectBasePath().projectBasePath).toBe('src');
    spy.mockRestore();
  });

  it('should work when having both Angular and Workspace config', () => {
    addRootConfig({ configType: 'angular' });
    addRootConfig({ configType: 'workspace', config: { otherStuff: true } });
    assertDefaultProject();
    removeRootConfigs();
    addRootConfig({ configType: 'workspace' });
    addRootConfig({ configType: 'angular', config: { otherStuff: true } });
    assertDefaultProject();
    removeRootConfigs();
  });

  it('should throw when having config in invalid JSON format', () => {
    addInvalidRootAngularConfig();
    expect(() => resolveProjectBasePath()).toThrow('Failed to parse');
    removeRootConfigs();
  });

  describe('Root and Project level config', () => {
    const projectPath = 'packages/myProject';

    beforeAll(() => {
      addRootConfig({
        configType: 'angular',
        config: { projects: { myProject: projectPath } },
      });
      addProjectConfig({ path: projectPath });
    });

    afterAll(() => {
      removeRootConfigs();
      removeProjectConfig(projectPath);
    });

    it('should take the first project if no default project', () => {
      const { projectBasePath, projectType } = resolveProjectBasePath();
      expect(projectBasePath).toBe('myRoot');
      expect(projectType).toBe('library');
    });

    it('should resolve my project paths', () => {
      const { projectBasePath, projectType } =
        resolveProjectBasePath('myProject');
      expect(projectBasePath).toBe('myRoot');
      expect(projectType).toBe('library');
    });
  });

  describe('Project level config', () => {
    const projectPath = 'apps/myProject';

    beforeEach(() => {
      addProjectConfig({
        path: projectPath,
        config: {
          ...myProjectConfig,
          projectType: 'application',
        },
      });
    });

    afterEach(() => {
      removeProjectConfig(projectPath);
    });

    it('should resolve a project level config without a root config', () => {
      const { projectBasePath, projectType } =
        resolveProjectBasePath('myProject');
      expect(projectBasePath).toBe('myRoot');
      expect(projectType).toBe('application');
    });
  });

  describe('Project level config with a name', () => {
    const bookingButton = 'libs/booking/ui/button';
    const invoicingButton = 'libs/invoicing/ui/button';
    const sharedUtils = 'libs/shared/utils';

    beforeEach(() => {
      addProjectConfig({
        path: bookingButton,
        config: { ...myProjectConfig, name: 'booking-ui-button' },
      });
      addProjectConfig({
        path: invoicingButton,
        config: {
          name: 'invoicing-ui-button',
          projectType: 'application',
          sourceRoot: 'invoicingRoot',
        },
      });
      // relies on the project name being inferred from the directory
      addProjectConfig({
        path: sharedUtils,
        config: { projectType: 'library', sourceRoot: 'sharedRoot' },
      });
    });

    afterEach(() => {
      // all three projects live under `libs`, which is removed as a whole
      removeProjectConfig(bookingButton);
    });

    it('should resolve a project whose name differs from its directory', () => {
      const { projectBasePath, projectType } =
        resolveProjectBasePath('booking-ui-button');
      expect(projectBasePath).toBe('myRoot');
      expect(projectType).toBe('library');
    });

    it('should tell apart projects sharing the same directory name', () => {
      const { projectBasePath, projectType } = resolveProjectBasePath(
        'invoicing-ui-button',
      );
      expect(projectBasePath).toBe('invoicingRoot');
      expect(projectType).toBe('application');
    });

    it('should fall back to the directory name when the config has none', () => {
      const { projectBasePath, projectType } = resolveProjectBasePath('utils');
      expect(projectBasePath).toBe('sharedRoot');
      expect(projectType).toBe('library');
    });

    it('should match a name regardless of how the config is formatted', () => {
      addProjectConfig({
        path: 'libs/pretty',
        config: `{
  "name" : "pretty-printed-lib",
  "projectType": "library",
  "sourceRoot": "prettyRoot"
}`,
      });

      expect(resolveProjectBasePath('pretty-printed-lib').projectBasePath).toBe(
        'prettyRoot',
      );
    });
  });

  describe('Directory name matches', () => {
    afterEach(() => {
      // every fixture below lives under `libs`, which is removed as a whole
      removeProjectConfig('libs/a');
    });

    it('should match on the directory even when the config is named otherwise', () => {
      addProjectConfig({
        path: 'libs/a/button',
        config: { ...myProjectConfig, name: 'booking-ui-button' },
      });

      // the directory is all we have to go on, same as before the name lookup
      expect(resolveProjectBasePath('button').projectBasePath).toBe('myRoot');
    });

    // covered from both sides so the ranking is what resolves the tie, rather
    // than the nameless config merely happening to be looked at first
    it.each([
      ['libs/a/button', 'libs/b/button'],
      ['libs/b/button', 'libs/a/button'],
    ])(
      'should prefer a nameless config over one named otherwise (%s)',
      (namelessPath, namedPath) => {
        addProjectConfig({
          path: namedPath,
          config: { name: 'named-otherwise', sourceRoot: 'namedRoot' },
        });
        addProjectConfig({
          path: namelessPath,
          config: { ...myProjectConfig, sourceRoot: 'namelessRoot' },
        });

        expect(resolveProjectBasePath('button').projectBasePath).toBe(
          'namelessRoot',
        );
      },
    );

    // nothing distinguishes two renamed configs sharing a directory, so the only
    // thing to guarantee is that the same one wins on every machine
    it.each([
      ['libs/a/button', 'libs/b/button'],
      ['libs/b/button', 'libs/a/button'],
    ])(
      'should break a tie between renamed configs the same way (%s first)',
      (first, second) => {
        for (const projectPath of [first, second]) {
          addProjectConfig({
            path: projectPath,
            config: { name: `${projectPath}-name`, sourceRoot: projectPath },
          });
        }

        expect(resolveProjectBasePath('button').projectBasePath).toBe(
          'libs/a/button',
        );
      },
    );
  });

  describe('Modern Nx project.json without sourceRoot', () => {
    afterEach(() => {
      removeProjectConfig('libs/modern');
    });

    it('derives the source root from the project directory', () => {
      addProjectConfig({
        path: 'libs/modern',
        config: { name: 'modern-lib', projectType: 'library' },
      });

      const { projectBasePath, projectType } =
        resolveProjectBasePath('modern-lib');
      expect(projectBasePath).toBe('libs/modern/src');
      expect(projectType).toBe('library');
    });

    it('honors an explicit root field over the directory', () => {
      addProjectConfig({
        path: 'libs/modern',
        config: {
          name: 'modern-lib',
          projectType: 'library',
          root: 'libs/xyz',
        },
      });

      expect(resolveProjectBasePath('modern-lib').projectBasePath).toBe(
        'libs/xyz/src',
      );
    });
  });

  describe('Malformed configs', () => {
    const healthy = 'libs/healthy';
    const broken = 'libs/broken';

    afterEach(() => {
      removeProjectConfig(healthy);
    });

    it('should skip a malformed config belonging to another project', () => {
      // resolved through the directory fallback, which visits every config,
      // so the malformed one below is reached no matter the traversal order
      addProjectConfig({ path: healthy, config: myProjectConfig });
      // mentions the name we are after, so it is never filtered out before parsing
      addProjectConfig({ path: broken, config: '{ "name": "healthy" oops' });
      const spy = spyOnConsole('warn');

      const { projectBasePath, projectType } =
        resolveProjectBasePath('healthy');
      expect(projectBasePath).toBe('myRoot');
      expect(projectType).toBe('library');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should warn instead of throwing when the config is malformed', () => {
      addProjectConfig({ path: healthy, config: '{ "name": oops' });
      const warn = spyOnConsole('warn');
      const log = spyOnConsole('log');

      expect(resolveProjectBasePath('healthy').projectBasePath).toBe('src');
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping the config at'),
        expect.stringContaining('project.json'),
        expect.stringContaining('Failed to parse'),
      );
      warn.mockRestore();
      log.mockRestore();
    });
  });

  describe('Resolving from within a project directory', () => {
    const projectPath = 'libs/foo';
    // captured lazily: the outer `beforeAll` mocks `process.cwd()` to the
    // sandboxed `TEST_DIR`, but that only runs after this describe body
    // (and its `process.cwd()` at module-eval time would be the real cwd)
    let cwd: string;

    beforeEach(() => {
      cwd = process.cwd();
      addProjectConfig({
        path: projectPath,
        config: { projectType: 'library', sourceRoot: 'fooRoot' },
      });
      process.chdir(path.resolve(cwd, projectPath));
    });

    afterEach(() => {
      process.chdir(cwd);
      removeProjectConfig(projectPath);
    });

    it('should resolve a nameless config sitting at the cwd by its directory', () => {
      const { projectBasePath, projectType } = resolveProjectBasePath('foo');
      expect(projectBasePath).toBe('fooRoot');
      expect(projectType).toBe('library');
    });

    it('should not resolve an unknown project to the nearest config', () => {
      const spy = spyOnConsole('log');
      expect(resolveProjectBasePath('unknown').projectBasePath).toBe('src');
      spy.mockRestore();
    });
  });

  supportedConfigs.forEach((configType) => {
    describe(`${configType} config`, () => {
      beforeAll(() => {
        addRootConfig({ configType });
      });

      afterAll(() => {
        removeRootConfigs();
      });

      it('should return the source root of the default project', () => {
        assertDefaultProject();
      });

      it('should return the source root of the given project', () => {
        const { projectBasePath, projectType } =
          resolveProjectBasePath('myProject');
        expect(projectBasePath).toBe('myRoot');
        expect(projectType).toBe('library');
      });
    });
  });
});

function jsonFile(name: string, path?: string) {
  const base = path ? `${path}/` : '';

  return resolvePath(base + `${name}.json`);
}

function addProjectConfig({
  path,
  config = myProjectConfig,
}: {
  path: string;
  config?: any;
}) {
  fs.mkdirsSync(resolvePath(path));
  fs.writeFileSync(
    jsonFile('project', path),
    // a raw string lets a spec control the exact formatting written to disk
    '// comment\n' + (isString(config) ? config : JSON.stringify(config)),
  );
}

function removeProjectConfig(path: string) {
  removeConfigFile('project', path);
  fs.removeSync(resolvePath(path.split('/')[0]));
}

function addRootConfig({
  path,
  configType,
  config = defaultConfig,
}: {
  path?: string;
  configType: 'angular' | 'workspace' | 'project';
  config?: any;
}) {
  fs.writeFileSync(
    jsonFile(configType, path),
    '// comment\n' + JSON.stringify(config),
  );
}

function addInvalidRootAngularConfig() {
  fs.writeFileSync(jsonFile('angular'), '{ defaultProject: "defaultProject" }');
}

function removeConfigFile(configType: string, path?: string) {
  fs.removeSync(jsonFile(configType, path));
}

function assertDefaultProject() {
  const { projectBasePath, projectType } = resolveProjectBasePath();
  expect(projectBasePath).toBe('testDir');
  expect(projectType).toBe('application');
}

function removeRootConfigs() {
  supportedConfigs.forEach((config) => removeConfigFile(config));
}

function resolvePath(rest: string) {
  return path.resolve(process.cwd(), rest);
}
