/**
 * Runs the built JavaScript binary with a module hook recording everything it
 * loads, and holds each light command to an allowlist: the files of the CLI
 * and the packages it may load, and nothing else. A new eager import, of a
 * command or of a dependency, fails here until it's a deliberate addition.
 *
 * Unlike the golden suite this is about how the JavaScript build is put
 * together, so it doesn't apply to a binary given through `TRANSLOCO_BIN`.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const packageDir = path.resolve(
  import.meta.dirname,
  '../../../../dist/libs/transloco-cli',
);
const bin = path.join(packageDir, 'src', 'bin.js');
const hook = path.join(import.meta.dirname, 'record-loaded-modules.mjs');

interface Allowed {
  /** Files of the CLI itself, relative to its package directory. */
  files: string[];
  packages: string[];
}

/** What it takes to parse the arguments, print the help or the version and report an error. */
const program: Allowed = {
  files: [
    'src/bin.js',
    'src/errors.js',
    'src/package-info.js',
    'src/program.js',
  ],
  packages: ['@commander-js/extra-typings', 'commander'],
};
const validate: Allowed = {
  files: [
    ...program.files,
    'src/commands/validate.js',
    'src/validator/index.js',
    'src/validator/transloco-validator.js',
  ],
  packages: [...program.packages, 'find-duplicated-property-keys'],
};
const optimize: Allowed = {
  files: [
    ...program.files,
    'src/commands/optimize.js',
    'src/optimize/index.js',
    'src/optimize/transloco-optimize.js',
  ],
  packages: [...program.packages, 'flat', 'glob'],
};
const translationFolders: Allowed = {
  files: [
    ...program.files,
    'src/commands/config-path.js',
    'src/commands/translation-folders.js',
    'src/config/index.js',
    'src/config/transloco-utils.js',
    'src/translation-files/index.js',
    'src/translation-files/join.js',
    'src/translation-files/node-file-reader.js',
    'src/translation-files/shared.js',
    'src/translation-files/split.js',
    'src/utils/file-system.js',
  ],
  packages: [...program.packages, 'cosmiconfig', 'env-paths'],
};
const join: Allowed = {
  ...translationFolders,
  files: [
    ...translationFolders.files,
    'src/commands/join.js',
    'src/utils/real-path.js',
  ],
};
const split: Allowed = {
  ...translationFolders,
  files: [...translationFolders.files, 'src/commands/split.js'],
};

const migrate: Allowed = {
  files: [
    ...program.files,
    'src/commands/translation-folders.js',
    'src/migrate/find-files.js',
    'src/translation-files/index.js',
    'src/translation-files/join.js',
    'src/translation-files/shared.js',
    'src/translation-files/split.js',
  ],
  packages: [...program.packages, 'glob'],
};
const migrateNgxTranslate: Allowed = {
  ...migrate,
  files: [
    ...migrate.files,
    'src/commands/migrate-ngx-translate.js',
    'src/migrate/ngx-translate/apply-matcher.js',
    'src/migrate/ngx-translate/migrate-ngx-translate.js',
    'src/migrate/ngx-translate/migration-matchers.js',
    'src/utils/style.js',
  ],
};
const migrateAngularI18n: Allowed = {
  ...migrate,
  files: [
    ...migrate.files,
    'src/commands/migrate-angular-i18n.js',
    'src/commands/config-path.js',
    'src/config/index.js',
    'src/config/transloco-utils.js',
    'src/migrate/angular-i18n/dasherize.js',
    'src/migrate/angular-i18n/migrate-angular-i18n.js',
    'src/migrate/angular-i18n/template.js',
    'src/utils/file-system.js',
  ],
  packages: [...migrate.packages, 'cosmiconfig', 'env-paths'],
};

/** Everything `init` loads to decide and to write. The questions are not in it: `@clack/prompts` is loaded when one is asked. */
const init: Allowed = {
  files: [
    ...program.files,
    'src/commands/init.js',
    'src/config/index.js',
    'src/config/transloco-utils.js',
    'src/init/manifest.js',
    'src/init/plan.js',
    'src/init/validation.js',
    'src/utils/file-system.js',
    'src/utils/real-path.js',
  ],
  packages: [...program.packages, 'cosmiconfig', 'env-paths', 'jsonc-parser'],
};

/** `.../node_modules/@scope/name/lib/a.js` => `@scope/name`, for a pnpm store path as well. */
function packageName(file: string) {
  const [, inPackage] = file.split(/.*[\\/]node_modules[\\/]/);
  const [first, second] = inPackage.split(/[\\/]/);

  return first.startsWith('@') ? `${first}/${second}` : first;
}

// Every test starts a process or two, which takes its time on a busy machine.
// The same allowance as a golden case gets.
vi.setConfig({ testTimeout: 60_000 });

describe.skipIf(Boolean(process.env['TRANSLOCO_BIN']))(
  'lazy loading of the built bin',
  () => {
    let dir: string;

    beforeAll(() => {
      if (!fs.existsSync(bin)) {
        throw new Error(
          `The built bin does not exist: ${bin}\nBuild it first (nx build transloco-cli).`,
        );
      }

      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-lazy-bin-'));
      fs.mkdirSync(path.join(dir, 'src'));
      fs.mkdirSync(path.join(dir, 'dist'));
      fs.writeFileSync(
        path.join(dir, 'src', 'app.html'),
        `<p>{{ 'title' | transloco }}</p>`,
      );
      fs.writeFileSync(path.join(dir, 'en.json'), '{"a": {"b": "c"}}');
      fs.writeFileSync(path.join(dir, 'dist', 'en.json'), '{"a": {"b": "c"}}');
      fs.mkdirSync(path.join(dir, 'i18n', 'scope'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'i18n', 'es.json'), '{"a": "b"}');
      fs.writeFileSync(
        path.join(dir, 'i18n', 'scope', 'es.json'),
        '{"c": "d"}',
      );
      fs.mkdirSync(path.join(dir, 'split-i18n', 'scope'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'split-i18n', 'es.json'), '');
      fs.writeFileSync(path.join(dir, 'split-i18n', 'scope', 'es.json'), '');
      fs.mkdirSync(path.join(dir, 'migrate-ngx'));
      fs.writeFileSync(
        path.join(dir, 'migrate-ngx', 'a.html'),
        `<p>{{ 'a' | translate }}</p>`,
      );
      fs.writeFileSync(
        path.join(dir, 'migrate-ngx', 'a.ts'),
        `import { TranslateService } from '@ngx-translate/core';`,
      );
      fs.mkdirSync(path.join(dir, 'migrate-ng'));
      fs.writeFileSync(
        path.join(dir, 'migrate-ng', 'a.html'),
        `<p i18n>One</p>`,
      );
      fs.mkdirSync(path.join(dir, 'joined'));
      fs.writeFileSync(
        path.join(dir, 'joined', 'es.json'),
        '{"a": "b", "scope": {"c": "d"}}',
      );
    });

    afterAll(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    /** Runs the bin and sorts what it loaded into its own files, packages and anything else. */
    function run(...args: string[]) {
      const record = path.join(dir, `loaded-${Date.now()}-${Math.random()}`);
      const env = { ...process.env };
      delete env['FORCE_COLOR'];

      const { status, stderr } = spawnSync(
        process.execPath,
        ['--import', hook, bin, ...args],
        {
          cwd: dir,
          encoding: 'utf-8',
          env: {
            ...env,
            NO_COLOR: '1',
            NODE_NO_WARNINGS: '1',
            TRANSLOCO_LOADED_MODULES: record,
          },
        },
      );

      const files = new Set<string>();
      const packages = new Set<string>();
      const other = new Set<string>();

      for (const url of fs.readFileSync(record, 'utf-8').split('\n')) {
        if (!url || url.startsWith('node:')) continue;

        const file = url.startsWith('file:') ? fileURLToPath(url) : url;

        if (/[\\/]node_modules[\\/]/.test(file)) {
          packages.add(packageName(file));
        } else if (file.startsWith(packageDir + path.sep)) {
          files.add(path.relative(packageDir, file).split(path.sep).join('/'));
        } else {
          other.add(url);
        }
      }

      return {
        status,
        stderr,
        files: [...files].sort(),
        packages: [...packages].sort(),
        other: [...other].sort(),
      };
    }

    /** What was loaded on top of the allowlist. */
    function unexpected(loaded: ReturnType<typeof run>, allowed: Allowed) {
      return {
        files: loaded.files.filter((file) => !allowed.files.includes(file)),
        packages: loaded.packages.filter(
          (name) => !allowed.packages.includes(name),
        ),
        other: loaded.other,
      };
    }

    const nothing = { files: [], packages: [], other: [] };

    it.each(
      [
        ['--help'],
        ['--version'],
        ['help', 'extract'],
        ['extract', '--help'],
        ['find', '--help'],
        ['validate', '--help'],
        ['optimize', '--help'],
        ['scoped-libs', '--help'],
        ['join', '--help'],
        ['split', '--help'],
        ['migrate', '--help'],
        ['migrate', 'ngx-translate', '--help'],
        ['migrate', 'angular-i18n', '--help'],
        ['init', '--help'],
        ['help', 'init'],
        ['help', 'migrate', 'ngx-translate'],
      ].map((args) => [args.join(' '), args] as const),
    )(
      `GIVEN the arguments "%s"
       WHEN the built bin runs
       THEN it loads the program and its argument parser, and nothing else`,
      (_, args) => {
        const loaded = run(...args);

        expect(unexpected(loaded, program)).toEqual(nothing);
        expect(loaded.files).toEqual(program.files);
        expect(loaded.status).toBe(0);
      },
    );

    it.each(
      [
        ['extract', '--add-missing-keys'],
        ['find', '--input', 'a', '--input', 'b'],
        ['extract', '-R', '-c', '-s'],
        ['extract', '-c=transloco.config.js'],
        ['optimize', ''],
        ['translate'],
        ['migrate', 'translate'],
        ['migrate', 'angular-i18n'],
        ['migrate', 'ngx-translate', '--langs', 'en'],
        ['init', '--config', 'a'],
        ['init', '--translations-path', ''],
      ].map((args) => [JSON.stringify(args), args] as const),
    )(
      `GIVEN the rejected arguments %s
       WHEN the built bin runs
       THEN it fails having loaded the program and its argument parser, and nothing else`,
      (_, args) => {
        const loaded = run(...args);

        expect(unexpected(loaded, program)).toEqual(nothing);
        expect(loaded.stderr).toContain('error: ');
        expect(loaded.status).toBe(1);
      },
    );

    it(`GIVEN a translation file
        WHEN the built bin validates it
        THEN it loads the validator on top of the program, and nothing else`, () => {
      const loaded = run('validate', 'en.json');

      expect(unexpected(loaded, validate)).toEqual(nothing);
      expect(loaded.files).toEqual([...validate.files].sort());
      expect(loaded.status).toBe(0);
    });

    it(`GIVEN a directory of translation files
        WHEN the built bin optimizes it
        THEN it loads the optimizer on top of the program, and nothing else`, () => {
      const loaded = run('optimize', 'dist');

      expect(unexpected(loaded, optimize)).toEqual(nothing);
      expect(loaded.files).toEqual([...optimize.files].sort());
      expect(loaded.status).toBe(0);
    });

    it(`GIVEN a folder of translation files
        WHEN the built bin joins them
        THEN it loads the core on top of the program, and nothing else`, () => {
      const loaded = run('join', '--translations-path', 'i18n');

      expect(unexpected(loaded, join)).toEqual(nothing);
      expect(loaded.files).toEqual([...join.files].sort());
      expect(loaded.status).toBe(0);
    });

    it(`GIVEN joined translation files
        WHEN the built bin splits them
        THEN it loads the core on top of the program, and nothing else`, () => {
      const loaded = run(
        'split',
        '--translations-path',
        'split-i18n',
        '--source',
        'joined',
      );

      expect(unexpected(loaded, split)).toEqual(nothing);
      expect(loaded.files).toEqual([...split.files].sort());
      expect(loaded.status).toBe(0);
    });

    it(`GIVEN a folder of sources
        WHEN the built bin migrates it from ngx-translate
        THEN it loads the migration on top of the program, and nothing else`, () => {
      const loaded = run('migrate', 'ngx-translate', '--input', 'migrate-ngx');

      expect(unexpected(loaded, migrateNgxTranslate)).toEqual(nothing);
      expect(loaded.files).toEqual([...migrateNgxTranslate.files].sort());
      expect(loaded.status).toBe(0);
    });

    it(`GIVEN a folder of templates
        WHEN the built bin migrates it from the Angular i18n
        THEN it loads the migration on top of the program, and nothing else`, () => {
      const loaded = run(
        'migrate',
        'angular-i18n',
        '--input',
        'migrate-ng',
        '--translations-path',
        'migrate-i18n',
        '--langs',
        'en',
      );

      expect(unexpected(loaded, migrateAngularI18n)).toEqual(nothing);
      expect(loaded.files).toEqual([...migrateAngularI18n.files].sort());
      expect(loaded.status).toBe(0);
    });

    it(`GIVEN a folder
        WHEN the built bin runs init with --yes
        THEN it loads what init decides and writes with on top of the program, and no questions`, () => {
      fs.mkdirSync(path.join(dir, 'init-yes'));

      const loaded = run('--cwd', 'init-yes', 'init', '--yes');

      expect(unexpected(loaded, init)).toEqual(nothing);
      expect(loaded.files).toEqual([...init.files].sort());
      expect(loaded.status).toBe(0);
      expect(
        fs.existsSync(path.join(dir, 'init-yes', 'src/assets/i18n/en.json')),
      ).toBe(true);
    });

    it(`GIVEN no terminal
        WHEN the built bin runs init without --yes
        THEN it is refused without loading the questions`, () => {
      fs.mkdirSync(path.join(dir, 'init-no-tty'));

      const loaded = run('--cwd', 'init-no-tty', 'init');

      expect(unexpected(loaded, init)).toEqual(nothing);
      expect(loaded.stderr).toContain('needs a terminal');
      expect(loaded.status).toBe(1);
    });

    it(`GIVEN the extract command
        WHEN the built bin runs
        THEN the record holds the keys manager and its heavy packages, which proves the hook sees every module`, () => {
      const loaded = run('extract', '--input', 'src', '--output', 'i18n');

      expect(loaded.status).toBe(0);
      expect(loaded.files).toContain('src/commands/extract.js');
      expect(loaded.files).toContain('src/keys-manager/keys-builder/index.js');
      expect(loaded.packages).toEqual(
        expect.arrayContaining([
          '@angular/compiler',
          '@jsverse/angular-utils',
          'typescript',
        ]),
      );
      expect(unexpected(loaded, program).packages.length).toBeGreaterThan(3);
    });
  },
);
