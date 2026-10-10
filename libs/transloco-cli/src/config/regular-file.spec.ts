import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runInit } from '../commands/init.js';
import { CliError } from '../errors.js';
import { resolveConfig } from '../keys-manager/utils/resolve-config.js';
import { refuseToOpenWhatIsNoFile } from '../tests/fifo-guard.js';

import { ConfigLoadError } from './load-error.js';
import { getGlobalConfig, searchGlobalConfig } from './transloco-utils.js';

const notFile = (kind: string) => `it is not a regular file, it is ${kind}`;

describe.skipIf(process.platform === 'win32')(
  'a path that is no regular file where the config or the workspace is looked for',
  () => {
    const originalCwd = process.cwd();
    let dir: string;

    beforeEach(() => {
      // The real path, as that's what `process.cwd()` reports once inside it
      dir = fs.realpathSync(
        fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-no-file-')),
      );
      fs.mkdirSync(path.join(dir, 'src', 'app'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'src', 'assets', 'i18n'), {
        recursive: true,
      });
      fs.writeFileSync(path.join(dir, 'package.json'), '{"name": "app"}');
      process.chdir(dir);
      vi.spyOn(console, 'log').mockImplementation(() => {});
      // A test that would hang fails instead, as the guard throws
      refuseToOpenWhatIsNoFile();
    });

    afterEach(() => {
      process.chdir(originalCwd);
      vi.restoreAllMocks();
      fs.rmSync(dir, { recursive: true, force: true });
    });

    const fifo = (file: string) => {
      const target = path.join(dir, file);

      fs.mkdirSync(path.dirname(target), { recursive: true });
      execFileSync('mkfifo', [target]);
    };
    const failure = (run: () => unknown) => {
      try {
        run();
      } catch (error) {
        return error as Error;
      }

      throw new Error('Nothing was thrown');
    };

    describe.each(['extract', 'find'] as const)('%s', (command) => {
      it.each([
        ['angular.json'],
        ['src/transloco.config.js'],
        ['transloco.config.js'],
        ['.translocorc'],
        ['package.json'],
      ])(
        `GIVEN a FIFO named %s
         WHEN the config is resolved
         THEN it is refused with one line naming it, without being opened`,
        (name) => {
          if (name === 'package.json') {
            fs.rmSync(path.join(dir, name));
          }

          fifo(name);

          const error = failure(() => resolveConfig({ command }));

          expect(error).toBeInstanceOf(ConfigLoadError);
          expect(error.message).toBe(
            `Transloco: could not load the config ${name}: ${notFile('a FIFO')}`,
          );
        },
      );

      it(`GIVEN a FIFO named project.json in the workspace
          WHEN the config of a named project is resolved
          THEN it is refused before the project is looked for in it`, () => {
        fifo('libs/ui/project.json');

        const error = failure(() => resolveConfig({ command, project: 'ui' }));

        expect(error.message).toBe(
          `Transloco: could not load the config ${path.join('libs', 'ui', 'project.json')}: ${notFile('a FIFO')}`,
        );
      });

      it(`GIVEN a FIFO given with --config
          WHEN the config is resolved
          THEN it is refused with one line naming it`, () => {
        fifo('queue');

        expect(
          failure(() => resolveConfig({ command, config: 'queue' })).message,
        ).toBe(
          `Transloco: could not load the config queue: ${notFile('a FIFO')}`,
        );
      });

      it(`GIVEN /dev/zero linked as angular.json
          WHEN the config is resolved
          THEN it is refused saying it is a device, and is never read`, () => {
        fs.symlinkSync('/dev/zero', path.join(dir, 'angular.json'));

        expect(failure(() => resolveConfig({ command })).message).toBe(
          `Transloco: could not load the config angular.json: ${notFile('a device')}`,
        );
      });

      it(`GIVEN folders named like the places of the config and of the workspace
          WHEN the config is resolved
          THEN they are skipped, as they have always been`, () => {
        for (const name of [
          'angular.json',
          'transloco.config.js',
          '.translocorc',
          'src/transloco.config.js',
        ]) {
          fs.mkdirSync(path.join(dir, name), { recursive: true });
        }

        expect(resolveConfig({ command }).langs).toEqual(['en']);
      });
    });

    describe('init', () => {
      const options = { scripts: true, yes: true };

      it.each([
        ['angular.json'],
        ['src/transloco.config.js'],
        ['transloco.config.js'],
        ['.translocorc'],
      ])(
        `GIVEN a FIFO named %s
         WHEN init runs with --yes
         THEN it is refused with one line naming it, and nothing is written`,
        async (name) => {
          fifo(name);

          const before = fs.readdirSync(dir, { recursive: true }).sort();

          await expect(runInit(options)).rejects.toThrow(
            new CliError(
              `Transloco Init: could not read ${name} while looking for an existing Transloco config: ${notFile('a FIFO')}`,
            ),
          );
          expect(fs.readdirSync(dir, { recursive: true }).sort()).toEqual(
            before,
          );
        },
      );

      it(`GIVEN /dev/zero linked as angular.json
          WHEN init runs with --yes
          THEN it is refused saying it is a device, and nothing is written`, async () => {
        fs.symlinkSync('/dev/zero', path.join(dir, 'angular.json'));

        await expect(runInit(options)).rejects.toThrow(
          `Transloco Init: could not read angular.json while looking for an existing Transloco config: ${notFile('a device')}`,
        );
        expect(fs.existsSync(path.join(dir, 'transloco.config.ts'))).toBe(
          false,
        );
      });

      it(`GIVEN folders named like the places of the config
          WHEN init runs with --yes
          THEN they are skipped and the config is written`, async () => {
        for (const name of ['transloco.config.js', 'src/.translocorc']) {
          fs.mkdirSync(path.join(dir, name), { recursive: true });
        }

        await runInit(options);

        expect(fs.existsSync(path.join(dir, 'transloco.config.ts'))).toBe(true);
      });

      it(`GIVEN a translations path with a component that links to a FIFO inside the folder
          WHEN init runs with --yes
          THEN it is refused saying what that is, not with the error of the file system`, async () => {
        fifo('queue');
        fs.rmSync(path.join(dir, 'src'), { recursive: true });
        fs.symlinkSync('queue', path.join(dir, 'src'));

        await expect(runInit(options)).rejects.toThrow(
          new CliError(
            'Transloco Init: The translations path src/assets/i18n is, or lies inside, a FIFO',
          ),
        );
      });
    });

    describe('the readers of a config', () => {
      it.each([
        ['getGlobalConfig of a FIFO', () => getGlobalConfig('queue'), 'queue'],
        [
          'getGlobalConfig of a folder holding one',
          () => getGlobalConfig('conf'),
          path.join('conf', 'transloco.config.js'),
        ],
        [
          'searchGlobalConfig from a folder holding one',
          () => searchGlobalConfig('src'),
          path.join('src', '.translocorc'),
        ],
      ])(
        `GIVEN a FIFO where %s looks
         WHEN it is read
         THEN it is refused naming the FIFO`,
        (_, read, name) => {
          fifo('queue');
          fifo(path.join('conf', 'transloco.config.js'));
          fifo(path.join('src', '.translocorc'));

          expect(failure(read).message).toBe(
            `Transloco: could not load the config ${name}: ${notFile('a FIFO')}`,
          );
        },
      );
    });
  },
);
