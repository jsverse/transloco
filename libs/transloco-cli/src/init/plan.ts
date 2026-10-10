import { inspect } from 'node:util';

import { addScripts, parseManifest } from './manifest.js';

export const configFileName = 'transloco.config.ts';
export const manifestFileName = 'package.json';
export const defaultLangs = ['en'];
export const defaultTranslationsPath = 'src/assets/i18n';

/** The scripts to add, the way the keys manager schematic adds them. */
export const scripts = {
  'i18n:extract': 'transloco extract',
  'i18n:find': 'transloco find',
};

export interface InitAnswers {
  langs: string[];
  translationsPath: string;
  createTranslationFiles: boolean;
  addScripts: boolean;
}

/** What is on disk, as far as the plan depends on it. */
export interface InitState {
  /** Tells whether a file, given relative to the working directory, is there. */
  exists: (file: string) => boolean;
  /** The text of the `package.json`, when there is one. */
  manifest?: string;
}

/** One thing init does: what it tells the user, along with the file it writes when it does write. */
export interface InitStep {
  message: string;
  write?: { file: string; content: string };
  /** The step found its work done, and left it as it was. */
  kept?: true;
}

/** The file of the language in the folder, written with forward slashes. */
export const translationFile = (folder: string, lang: string) =>
  `${folder.replace(/[\\/]+$/, '')}/${lang}.json`;

/**
 * The config file the way `ng add @jsverse/transloco` generates it, which has
 * no line break at its end.
 */
export function generateConfigFile(config: {
  rootTranslationsPath: string;
  langs: string[];
  keysManager: Record<string, never>;
}) {
  return `import type { TranslocoGlobalConfig } from '@jsverse/transloco';

const config: TranslocoGlobalConfig = ${inspect(config)};

export default config;`;
}

/**
 * Works out what init does for the answers and what is already there, without
 * touching anything. A `package.json` that cannot take the scripts is an error,
 * which is why the plan is complete before the first file is written.
 */
export function planInit(answers: InitAnswers, state: InitState): InitStep[] {
  const steps: InitStep[] = [];

  steps.push({
    message: `${state.exists(configFileName) ? 'Overwrote' : 'Created'} ${configFileName}`,
    write: {
      file: configFileName,
      content: generateConfigFile({
        rootTranslationsPath: answers.translationsPath,
        langs: answers.langs,
        keysManager: {},
      }),
    },
  });

  if (answers.createTranslationFiles) {
    for (const lang of answers.langs) {
      const file = translationFile(answers.translationsPath, lang);

      steps.push(
        state.exists(file)
          ? { message: `Kept ${file}, it already exists`, kept: true }
          : { message: `Created ${file}`, write: { file, content: '{}\n' } },
      );
    }
  }

  if (answers.addScripts && state.manifest !== undefined) {
    steps.push(...planScripts(state.manifest));
  }

  return steps;
}

function planScripts(manifest: string): InitStep[] {
  const { scripts: existing } = parseManifest(manifest);
  const steps: InitStep[] = [];
  const missing: Record<string, string> = {};
  let firstAdded: InitStep | undefined;

  for (const [name, command] of Object.entries(scripts)) {
    if (Object.hasOwn(existing, name)) {
      steps.push({
        message: `Kept the script ${name}, ${manifestFileName} already defines it`,
        kept: true,
      });
    } else {
      const step = {
        message: `Added the script ${name} to ${manifestFileName}`,
      };

      missing[name] = command;
      firstAdded ??= step;
      steps.push(step);
    }
  }

  // The file is written once, along with the first script that is added
  if (firstAdded) {
    firstAdded.write = {
      file: manifestFileName,
      content: addScripts(manifest, missing),
    };
  }

  return steps;
}
