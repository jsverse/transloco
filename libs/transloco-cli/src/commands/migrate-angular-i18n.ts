import fs from 'node:fs';
import path from 'node:path';

import { getGlobalConfig } from '../config/index.js';
import { CliError } from '../errors.js';
import { findFiles } from '../migrate/find-files.js';
import { assertPeers } from '../peers.js';

import { assertConfigPathExists } from './config-path.js';
import { assertFolderExists } from './translation-folders.js';

const name = 'Migrate';

export interface MigrateAngularI18nCommandOptions {
  input: string;
  translationsPath?: string;
  langs: string[];
  config?: string;
}

export async function runMigrateAngularI18n({
  input,
  translationsPath,
  langs,
  config,
}: MigrateAngularI18nCommandOptions) {
  assertConfigPathExists(config);
  assertFolderExists(name, 'input folder', input);

  // The files are written to, so the option must not lead out of the project.
  // The folder of the config is the project's own choice.
  if (translationsPath !== undefined) assertInsideCwd(translationsPath);

  // The option and the config are two ways to the same folder, the config is
  // only read when the option doesn't give it.
  const configured =
    translationsPath ?? getGlobalConfig(config).rootTranslationsPath;
  const output = configured ?? (await defaultTranslationsPath(input));

  // The folder of the config is trusted, the one found by looking around is
  // not, as it can be a link to a folder outside of the project.
  if (configured === undefined) assertInsideCwd(output);

  // A language is the name of the file written for it, the several languages
  // are separate arguments. A comma is how the schematic took them, and would
  // write one file named after all of them.
  const joined = langs.find((lang) => lang.includes(','));

  if (joined !== undefined) {
    throw new CliError(
      `Transloco ${name}: The languages are separate arguments, not a comma separated list: '${joined}'. Run with --langs ${joined.split(',').join(' ')}`,
    );
  }

  if (!findFiles(path.resolve(input), '.html').length) {
    throw new CliError(`Transloco ${name}: No .html files found in ${input}`);
  }

  // The templates are read with the parser of the Angular compiler.
  assertPeers(`migrate angular-i18n`, ['@angular/compiler']);

  const { migrateAngularI18n } =
    await import('../migrate/angular-i18n/migrate-angular-i18n.js');

  migrateAngularI18n({ input, output, langs });
}

/** The folder `transloco init` and `ng add` pick, so that the texts land where the app loads them from. */
async function defaultTranslationsPath(input: string) {
  // Only loaded when nothing else names the folder
  const { detectTranslationsPath } =
    await import('../init/translations-path.js');
  const { resolveProjectBasePath, listProjects } =
    await import('../keys-manager/utils/resolve-project-base-path.js');
  let sourceRoot = 'src';

  try {
    // The project owning the templates, else the default one
    sourceRoot = resolveProjectBasePath(
      projectOwning(input, listProjects(), resolveProjectBasePath),
      { quiet: true },
    ).projectBasePath;
  } catch {
    // No project to ask, the default source root it is
  }

  const manifest = path.resolve('package.json');

  return detectTranslationsPath(
    sourceRoot,
    fs.existsSync(manifest) ? fs.readFileSync(manifest, 'utf8') : undefined,
  );
}

/** The project whose folder is the closest one holding the input, `undefined` when none does. */
function projectOwning(
  input: string,
  projects: string[],
  resolve: (
    project: string,
    options: { quiet: true },
  ) => { projectRoot?: string },
) {
  const target = path.resolve(input);
  let owner: string | undefined;
  let ownerDepth = -1;

  for (const project of projects) {
    try {
      const { projectRoot } = resolve(project, { quiet: true });
      const root = path.resolve(projectRoot ?? '.');
      const relative = path.relative(root, target);

      if (
        relative !== '..' &&
        !relative.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relative) &&
        root.length > ownerDepth
      ) {
        owner = project;
        ownerDepth = root.length;
      }
    } catch {
      // A project that can't be resolved owns nothing
    }
  }

  return owner;
}

function assertInsideCwd(target: string) {
  if (!isInsideCwd(target)) {
    throw new CliError(
      `Transloco ${name}: The translations path is not inside the current directory: ${target}`,
    );
  }
}

/** Whether the path, through the links of the part of it that exists, lies inside the working directory. */
function isInsideCwd(target: string) {
  let existing = path.resolve(target);
  const rest: string[] = [];

  while (!fs.existsSync(existing) && path.dirname(existing) !== existing) {
    rest.unshift(path.basename(existing));
    existing = path.dirname(existing);
  }

  const real = path.join(fs.realpathSync(existing), ...rest);
  const relative = path.relative(fs.realpathSync(process.cwd()), real);

  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}
