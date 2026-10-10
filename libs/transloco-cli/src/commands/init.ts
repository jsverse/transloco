import fs from 'node:fs';
import path from 'node:path';

import { findGlobalConfigFile } from '../config/index.js';
import { CliError } from '../errors.js';
import { parseManifest } from '../init/manifest.js';
import {
  configFileName,
  defaultLangs,
  defaultTranslationsPath,
  type InitStep,
  manifestFileName,
  planInit,
  translationFile,
} from '../init/plan.js';
import {
  languageProblem,
  translationsPathProblem,
} from '../init/validation.js';
import { outputFile } from '../utils/file-system.js';
import { lstat } from '../utils/real-path.js';

const name = 'Init';
const cancelledExitCode = 130;

export interface InitCommandOptions {
  langs?: string[];
  translationsPath?: string;
  /** `false` for `--no-scripts` */
  scripts: boolean;
  yes?: boolean;
  force?: boolean;
}

export async function runInit({
  langs,
  translationsPath,
  scripts,
  yes = false,
  force = false,
}: InitCommandOptions) {
  const given = {
    langs: langs === undefined ? undefined : assertLangs(langs),
    translationsPath:
      translationsPath === undefined
        ? undefined
        : assertTranslationsPath(translationsPath),
  };
  const interactive =
    !yes && Boolean(process.stdin.isTTY && process.stdout.isTTY);

  if (!yes && !interactive) {
    throw new CliError(
      `Transloco ${name}: transloco init needs a terminal to ask its questions. Pass --yes to accept the defaults, together with --langs and --translations-path as needed.`,
    );
  }

  const manifest = readManifest();

  // A `package.json` that can't take the scripts is found before anything is
  // asked, and before the search for a config reads it as well.
  if (scripts && manifest !== undefined) {
    parseManifest(manifest);
  }

  assertConfigCanBeWritten(force);

  const exists = (file: string) => lstat(path.resolve(file)) !== undefined;
  const state = { exists, manifest };

  if (!interactive) {
    const steps = planInit(
      {
        langs: given.langs ?? defaultLangs,
        translationsPath: given.translationsPath ?? defaultTranslationsPath,
        createTranslationFiles: true,
        addScripts: scripts,
      },
      state,
    );

    for (const step of steps) {
      console.log(apply(step));
    }

    console.log(nextStep);

    return;
  }

  // Only now is the library loaded, as nothing before this asks anything
  const ui = await import('../init/prompts.js');

  ui.startPrompts();

  const answers = await ui.askInit({
    given,
    askScripts: scripts && manifest !== undefined,
    findMissing: (langs, folder) =>
      langs
        .map((lang) => translationFile(folder, lang))
        .filter((file) => !exists(file)),
  });

  if (!answers) {
    process.exitCode = cancelledExitCode;

    return;
  }

  const planned = planInit(
    {
      ...answers,
      translationsPath: relativeToCwd(answers.translationsPath),
    },
    state,
  );

  for (const step of planned) {
    apply(step);
    ui.reportStep(step);
  }

  ui.endPrompts(nextStep);
}

const nextStep =
  'Done. Run `transloco extract` to collect the keys of your project into the translation files.';

/** Does what the step is about and tells what it was. */
function apply({ message, write }: InitStep) {
  if (write) {
    outputFile(path.resolve(write.file), write.content);
  }

  return message;
}

function assertLangs(langs: string[]) {
  // A language is the name of the file written for it, the several languages
  // are separate arguments, as they are for `migrate angular-i18n`.
  const joined = langs.find((lang) => lang.includes(','));

  if (joined !== undefined) {
    throw new CliError(
      `Transloco ${name}: The languages are separate arguments, not a comma separated list: '${joined}'. Run with --langs ${joined.split(',').join(' ')}`,
    );
  }

  for (const lang of langs) {
    const problem = languageProblem(lang);

    if (problem) throw new CliError(`Transloco ${name}: ${problem}`);
  }

  return [...new Set(langs)];
}

function assertTranslationsPath(translationsPath: string) {
  const problem = translationsPathProblem(translationsPath);

  if (problem) throw new CliError(`Transloco ${name}: ${problem}`);

  return relativeToCwd(translationsPath.trim());
}

/** The config is committed, which an absolute path in it would tie to one machine. */
const relativeToCwd = (folder: string) =>
  path.isAbsolute(folder)
    ? path.relative('', folder).split(path.sep).join('/') || '.'
    : folder;

/**
 * A second config next to the one that is found would leave it open which one
 * applies, so init writes `transloco.config.ts` only where there is none, or
 * where it is the one that's there and `--force` says to replace it.
 */
function assertConfigCanBeWritten(force: boolean) {
  const target = path.resolve(configFileName);
  const targetExists = lstat(target) !== undefined;
  let found: string | undefined;

  try {
    found = findGlobalConfigFile();
  } catch (error) {
    // A config that can't be loaded still stands where it is
    if (!targetExists) throw error;
  }

  if (found !== undefined && path.resolve(found) !== target) {
    throw new CliError(
      `Transloco ${name}: A Transloco config was found in ${path.relative('', found)}, and a second one would make it ambiguous which applies. Remove it first, or keep using it.`,
    );
  }

  if (targetExists && !force) {
    throw new CliError(
      `Transloco ${name}: ${configFileName} already exists. Pass --force to overwrite it.`,
    );
  }
}

function readManifest() {
  const file = path.resolve(manifestFileName);

  return lstat(file)?.isFile() ? fs.readFileSync(file, 'utf8') : undefined;
}
