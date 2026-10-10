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
