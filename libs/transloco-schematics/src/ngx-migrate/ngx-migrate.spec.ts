import { createRequire } from 'node:module';
import * as path from 'node:path';

import { SchematicTestRunner } from '@angular-devkit/schematics/testing';

// SchematicTestRunner loads schematic factories with @angular-devkit's own raw
// Node `require`, i.e. OUTSIDE Vitest's module registry, so `vi.mock(...)`
// cannot reach the `@jsverse/transloco-cli/internal/migrate` the schematic
// calls. The way around it is the one of the join spec: swap the `exports` of
// the module in the Node cache, which the schematic requires when it loads, for
// a writable copy holding the stub.
const nodeRequire = createRequire(__filename);
const migratePath = nodeRequire.resolve(
  '../../../transloco-cli/src/migrate/index',
);
// Ensure the real module is loaded & cached before we swap its exports.
nodeRequire(migratePath);
const migrateNgxTranslate = vi.fn();
nodeRequire.cache[migratePath]!.exports = {
  ...nodeRequire.cache[migratePath]!.exports,
  __esModule: true,
  migrateNgxTranslate,
};

const collectionPath = path.join(__dirname, '../collection.json');

describe('ngx-migrate', () => {
  const schematicRunner = new SchematicTestRunner('schematics', collectionPath);
  const warnings: string[] = [];
  let logging: { unsubscribe(): void };

  beforeEach(() => {
    warnings.length = 0;
    migrateNgxTranslate.mockClear();
    logging = schematicRunner.logger.subscribe(({ level, message }) => {
      if (level === 'warn') warnings.push(message);
    });
  });

  afterEach(() => {
    logging.unsubscribe();
  });

  it(`GIVEN the path option
      WHEN the schematic runs
      THEN the migration of the CLI runs on it as its input`, async () => {
    await schematicRunner.runSchematic('ngx-migrate', {
      path: './projects/app',
    });

    expect(migrateNgxTranslate).toHaveBeenCalledTimes(1);
    expect(migrateNgxTranslate).toHaveBeenCalledWith({
      input: './projects/app',
    });
  });

  it(`GIVEN no options
      WHEN the schematic runs
      THEN the migration of the CLI runs on the default source folder`, async () => {
    await schematicRunner.runSchematic('ngx-migrate', {});

    expect(migrateNgxTranslate).toHaveBeenCalledExactlyOnceWith({
      input: './src/app',
    });
  });

  it(`GIVEN the schematic runs
      WHEN its work is done
      THEN it warned once that it is deprecated in favour of the command`, async () => {
    await schematicRunner.runSchematic('ngx-migrate', {});

    expect(warnings).toEqual([
      'The "ngx-migrate" schematic is deprecated and will be removed in Transloco v10. Run "transloco migrate ngx-translate" from @jsverse/transloco-cli instead.',
    ]);
  });

  it(`GIVEN the migration of the CLI fails
      WHEN the schematic runs
      THEN the failure is the failure of the schematic, after the warning`, async () => {
    migrateNgxTranslate.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    await expect(
      schematicRunner.runSchematic('ngx-migrate', {}),
    ).rejects.toThrow('boom');
    expect(warnings).toHaveLength(1);
  });
});
