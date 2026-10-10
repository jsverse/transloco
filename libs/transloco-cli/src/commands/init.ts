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
import { findUnreadableConfig } from '../init/unreadable-config.js';
import {
  languageProblem,
  translationsPathProblem,
  writeProblem,
} from '../init/validation.js';
import { outputFile } from '../utils/file-system.js';
import { contains, lstat } from '../utils/real-path.js';

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

  const { text: manifest, skipped } = readManifest();

  // A `package.json` that can't take the scripts is found before anything is
  // asked, and before the search for a config reads it as well.
  if (scripts && manifest !== undefined) {
    parseManifest(manifest);
  }

  assertConfigCanBeWritten(force);

  const exists = (file: string) => lstat(path.resolve(file)) !== undefined;
  const state = {
    exists,
    manifest,
    // Said only when the scripts were wanted
    manifestSkipped: scripts ? skipped : undefined,
  };

  if (!interactive) {
    const steps = planInit(
      {
        langs: given.langs ?? defaultLangs,
        translationsPath:
          given.translationsPath ??
          assertTranslationsPath(defaultTranslationsPath),
        createTranslationFiles: true,
        addScripts: scripts,
      },
      state,
    );

    assertPlanCanBeWritten(steps);
    applySteps(steps, ({ message }) => console.log(message));

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

  // The prompt rejects a folder that can't be used, so this is the same check
  // for the answer that comes from anywhere else.
  const planned = planInit(
    {
      ...answers,
      translationsPath: assertTranslationsPath(answers.translationsPath),
    },
    state,
  );

  assertPlanCanBeWritten(planned);
  applySteps(planned, ui.reportStep);

  ui.endPrompts(nextStep);
}

const nextStep =
  'Done. Run `transloco extract` to collect the keys of your project into the translation files.';

/**
 * Nothing is written unless everything can be: a file system problem found
 * while writing would leave a part of the result behind.
 */
function assertPlanCanBeWritten(steps: InitStep[]) {
  for (const { write } of steps) {
    const problem = write && writeProblem(write.file);

    if (problem) {
      throw new CliError(
        `Transloco ${name}: cannot write ${write.file}, ${problem}. Nothing was written.`,
      );
    }
  }
}

/** Does what each step is about and tells what it was, as it goes. */
function applySteps(steps: InitStep[], report: (step: InitStep) => void) {
  const written: string[] = [];

  for (const step of steps) {
    if (step.write) {
      try {
        outputFile(path.resolve(step.write.file), step.write.content);
      } catch (error) {
        // The check before can't see what happens in between
        throw new CliError(
          `Transloco ${name}: could not write ${step.write.file}: ${(error as Error).message}. ${
            written.length
              ? `Already written: ${written.join(', ')}.`
              : 'Nothing was written.'
          }`,
        );
      }

      written.push(step.write.file);
    }

    report(step);
  }
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
    const { file, reason } = findUnreadableConfig(error);

    // A config that can't be loaded still stands where it is. Any other file
    // might hold the config, which makes it unknown whether there is one.
    if (!targetExists || file === undefined || path.resolve(file) !== target) {
      throw new CliError(
        `Transloco ${name}: could not read ${file === undefined ? 'a config file' : path.relative('', file)} while looking for an existing Transloco config: ${reason}`,
      );
    }
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

/**
 * The text of the `package.json`, when there is a file to put the scripts in.
 * A link is followed when it leads to a file inside the working directory, as
 * writing to it changes that file and leaves the link where it is. Where it
 * leads anywhere else, `skipped` says why it is left alone.
 */
function readManifest(): { text?: string; skipped?: string } {
  const file = path.resolve(manifestFileName);
  const stats = lstat(file);

  if (stats?.isFile()) {
    return { text: fs.readFileSync(file, 'utf8') };
  }

  if (!stats?.isSymbolicLink()) return {};

  let real: string;

  try {
    real = fs.realpathSync(file);
  } catch {
    return { skipped: 'it is a link that leads nowhere' };
  }

  if (!contains(fs.realpathSync(process.cwd()), real)) {
    return { skipped: 'it is a link that leads outside the folder' };
  }

  return fs.statSync(real).isFile()
    ? { text: fs.readFileSync(real, 'utf8') }
    : { skipped: 'it is a link to something that is not a file' };
}
