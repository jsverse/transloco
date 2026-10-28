import { createRequire } from 'node:module';
import * as path from 'node:path';

import { SchematicTestRunner } from '@angular-devkit/schematics/testing';

// See the spec of ngx-migrate for why the stub goes into the Node cache.
const nodeRequire = createRequire(__filename);
const migratePath = nodeRequire.resolve(
  '../../../transloco-cli/src/migrate/index',
);
nodeRequire(migratePath);
const migrateAngularI18n = vi.fn();
nodeRequire.cache[migratePath]!.exports = {
  ...nodeRequire.cache[migratePath]!.exports,
  __esModule: true,
  migrateAngularI18n,
};

const collectionPath = path.join(__dirname, '../collection.json');

describe('ng-migrate', () => {
  const schematicRunner = new SchematicTestRunner('schematics', collectionPath);
  const warnings: string[] = [];
  let logging: { unsubscribe(): void };
  let exit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnings.length = 0;
    migrateAngularI18n.mockClear();
    // The schematic ends the process so that the Angular CLI doesn't report
    // that nothing was done, which would end the test run.
    exit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    logging = schematicRunner.logger.subscribe(({ level, message }) => {
      if (level === 'warn') warnings.push(message);
    });
  });

  afterEach(() => {
    exit.mockRestore();
    logging.unsubscribe();
  });

  it(`GIVEN the options of the schematic
      WHEN it runs
      THEN the migration of the CLI runs with the input, the output and the languages split on their commas`, async () => {
    await schematicRunner.runSchematic('ng-migrate', {
      path: './projects/app/src',
      translationFilesPath: 'projects/app/public/i18n',
      langs: 'en, es,fr ,  de',
    });

    expect(migrateAngularI18n).toHaveBeenCalledExactlyOnceWith({
      input: './projects/app/src',
      output: 'projects/app/public/i18n',
      langs: ['en', 'es', 'fr', 'de'],
    });
  });

  it(`GIVEN no options
      WHEN the schematic runs
      THEN the migration of the CLI runs with the defaults of the schematic`, async () => {
    await schematicRunner.runSchematic('ng-migrate', {});

    expect(migrateAngularI18n).toHaveBeenCalledExactlyOnceWith({
      input: './src/app',
      output: 'src/assets/i18n',
      langs: ['en', 'es'],
    });
  });

  it(`GIVEN the schematic runs
      WHEN its work is done
      THEN it warned once that it is deprecated in favour of the command, and ended the process after it`, async () => {
    await schematicRunner.runSchematic('ng-migrate', {});

    expect(warnings).toEqual([
      'The "ng-migrate" schematic is deprecated and will be removed in Transloco v10. Run "transloco migrate angular-i18n" from @jsverse/transloco-cli instead.',
    ]);
    expect(exit).toHaveBeenCalledOnce();
    expect(exit.mock.invocationCallOrder[0]).toBeGreaterThan(
      migrateAngularI18n.mock.invocationCallOrder[0],
    );
  });

  it(`GIVEN the migration of the CLI fails
      WHEN the schematic runs
      THEN the process is not ended, so the failure reaches the Angular CLI`, async () => {
    migrateAngularI18n.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    await expect(
      schematicRunner.runSchematic('ng-migrate', {}),
    ).rejects.toThrow('boom');
    expect(exit).not.toHaveBeenCalled();
  });
});
