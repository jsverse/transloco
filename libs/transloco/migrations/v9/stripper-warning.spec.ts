import { execFileSync } from 'node:child_process';
import * as nodePath from 'node:path';

import { withoutStripperWarning } from './config-type-import';

const collectionPath = nodePath.join(__dirname, '../migration.json');
const workspaceTesting = nodePath.join(
  __dirname,
  '../../schematics-core/testing',
);
const workspaceRoot = nodePath.join(__dirname, '../../../..');

/**
 * Node prints the warning of its type stripper once per process, on the first
 * use, and the test runner has used it by the time a test runs. So the migration
 * runs in a process of its own, which captures the warnings it emits.
 */
const CHILD = `
  const nodeModule = require('node:module');
  const warnings = [];
  process.on('warning', (warning) =>
    warnings.push({ name: warning.name, message: warning.message }),
  );

  // an unrelated warning, emitted while the type stripper runs
  const strip = nodeModule.stripTypeScriptTypes;
  nodeModule.stripTypeScriptTypes = (code) => {
    process.emitWarning('another warning during the run', 'CustomWarning');

    return strip(code);
  };

  (async () => {
    const { SchematicTestRunner } = require('@angular-devkit/schematics/testing');
    const { createWorkspace } = require(process.env.WORKSPACE_TESTING);
    const runner = new SchematicTestRunner('migrations', process.env.COLLECTION);
    const tree = await createWorkspace(runner);

    tree.create('/transloco.config.ts', "export default { langs: ['en'] };");

    await runner.runSchematic('migration-v9', {}, tree);
    await new Promise((resolve) => setImmediate(resolve));
    process.stdout.write('WARNINGS:' + JSON.stringify(warnings));
  })();
`;

describe('the warning of the type stripper', () => {
  it(`GIVEN a workspace with a TS Transloco config
      WHEN the migration runs in a fresh process
      THEN it emits no ExperimentalWarning and other warnings still come through`, () => {
    const output = execFileSync(
      process.execPath,
      ['--require', require.resolve('@swc-node/register'), '--eval', CHILD],
      {
        cwd: workspaceRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          SWC_NODE_PROJECT: nodePath.join(workspaceRoot, 'tsconfig.base.json'),
          COLLECTION: collectionPath,
          WORKSPACE_TESTING: workspaceTesting,
        },
      },
    );
    const warnings: Array<{ name: string; message: string }> = JSON.parse(
      output.slice(output.indexOf('WARNINGS:') + 'WARNINGS:'.length),
    );

    expect(warnings.map((warning) => warning.name)).not.toContain(
      'ExperimentalWarning',
    );
    expect(warnings).toEqual([
      { name: 'CustomWarning', message: 'another warning during the run' },
    ]);
  }, 60_000);

  describe('withoutStripperWarning', () => {
    const warnings: Error[] = [];
    const collect = (warning: Error) => warnings.push(warning);
    /** Warnings are delivered on the next tick. */
    const delivered = () => new Promise((resolve) => setImmediate(resolve));

    beforeEach(() => {
      warnings.length = 0;
      process.on('warning', collect);
    });

    afterEach(() => {
      process.off('warning', collect);
    });

    it(`GIVEN several warnings emitted while the stripper runs
        WHEN its own warning is suppressed
        THEN the other warnings are still delivered`, async () => {
      withoutStripperWarning(() => {
        process.emitWarning(
          'stripTypeScriptTypes is an experimental feature',
          'ExperimentalWarning',
        );
        process.emitWarning('another feature is experimental', {
          type: 'ExperimentalWarning',
        });
        process.emitWarning('something is deprecated', 'DeprecationWarning');
        process.emitWarning(new Error('plain'));
      });
      await delivered();

      expect(warnings.map((warning) => warning.message)).toEqual([
        'another feature is experimental',
        'something is deprecated',
        'plain',
      ]);
    });

    it(`GIVEN the stripper throws
        WHEN it runs without its warning
        THEN emitWarning is put back`, () => {
      const { emitWarning } = process;

      expect(() =>
        withoutStripperWarning(() => {
          throw new Error('rejected');
        }),
      ).toThrow('rejected');
      expect(process.emitWarning).toBe(emitWarning);
    });
  });
});
