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
} from 'vitest';

import { resolveProjectBasePath } from '../utils/resolve-project-base-path';

import { spyOnConsole } from './spec-utils';

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
    '// comment\n' + JSON.stringify(config),
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
