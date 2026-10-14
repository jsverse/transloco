import { createRequire } from 'node:module';
import * as path from 'node:path';

import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import type { TranslocoGlobalConfig } from '@jsverse/transloco-cli';

import { createWorkspace } from '../../schematics-core/testing';

// SchematicTestRunner loads the schematic with a raw Node `require`, outside of
// Vitest's module registry, so `vi.mock` can't reach what the schematic imports
// (see `tools/vitest/setup-schematics.ts`). The two modules it calls out to are
// stubbed on the instances Node caches instead: the config it reads, as
// `join.spec.ts` does, and the package manager it asks Angular for. The
// install itself goes through `execSync`, which is replaced on the module
// object the schematic gets.
const nodeRequire = createRequire(__filename);

function stubModule(request: string, stubs: Record<string, unknown>) {
  const resolved = nodeRequire.resolve(request);

  nodeRequire(resolved);

  const cached = nodeRequire.cache[resolved]!;

  cached.exports = { ...cached.exports, __esModule: true, ...stubs };
}

let mockedConfig: Partial<TranslocoGlobalConfig> = {};
let packageManager = 'npm';

stubModule('../../schematics-core/utils/transloco', {
  getGlobalConfig: () => mockedConfig,
});
stubModule('@angular/cli/src/utilities/config', {
  getConfiguredPackageManager: async () => packageManager,
});

const commands: string[] = [];
const nodeChildProcess = nodeRequire('node:child_process');
const realExecSync = nodeChildProcess.execSync;

const collectionPath = path.join(__dirname, '../collection.json');

describe('keys-manager', () => {
  const schematicRunner = new SchematicTestRunner('schematics', collectionPath);
  const options = { translationPath: 'src/assets/i18n/', langs: 'en, es' };
  let appTree: UnitTestTree;

  beforeAll(() => {
    nodeChildProcess.execSync = (command: string) => {
      commands.push(command);
    };
  });

  afterAll(() => {
    nodeChildProcess.execSync = realExecSync;
  });

  beforeEach(async () => {
    commands.length = 0;
    mockedConfig = {};
    packageManager = 'npm';
    appTree = await createWorkspace(schematicRunner);
  });

  it(`GIVEN a project using npm
      WHEN the schematic runs
      THEN it installs the CLI as a dev dependency and nothing else`, async () => {
    await schematicRunner.runSchematic('keys-manager', options, appTree);

    expect(commands).toEqual(['npm install --save-dev @jsverse/transloco-cli']);
  });

  it(`GIVEN a project using yarn
      WHEN the schematic runs
      THEN it adds the CLI with yarn`, async () => {
    packageManager = 'yarn';

    await schematicRunner.runSchematic('keys-manager', options, appTree);

    expect(commands).toEqual(['yarn add --dev @jsverse/transloco-cli']);
  });

  it(`GIVEN a project
      WHEN the schematic runs
      THEN the scripts that extract and find keys run the transloco bin`, async () => {
    const tree = await schematicRunner.runSchematic(
      'keys-manager',
      options,
      appTree,
    );
    const { scripts } = JSON.parse(tree.readContent('/package.json'));

    expect(scripts).toMatchObject({
      'i18n:extract': 'transloco extract',
      'i18n:find': 'transloco find',
    });
    expect(JSON.stringify(scripts)).not.toContain('transloco-keys-manager');
  });

  it(`GIVEN a project that has no Transloco config
      WHEN the schematic runs without the languages
      THEN it asks for them`, async () => {
    await expect(
      schematicRunner.runSchematic(
        'keys-manager',
        { translationPath: 'src/assets/i18n/' },
        appTree,
      ),
    ).rejects.toThrow(/Please provide the available languages/);
  });

  it(`GIVEN a collection
      WHEN the keys-manager schematic is described
      THEN it speaks of the CLI`, () => {
    const description =
      schematicRunner.engine.createCollection('schematics').description
        .schematics['keys-manager'];

    expect(description.description).toContain('Transloco CLI');
    expect(description.description).not.toMatch(/TKM|Keys Manager/);
  });
});
