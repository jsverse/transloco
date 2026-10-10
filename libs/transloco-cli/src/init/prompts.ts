import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  outro,
  text,
} from '@clack/prompts';

import {
  defaultLangs,
  defaultTranslationsPath,
  type InitAnswers,
  type InitStep,
  manifestFileName,
  scripts,
} from './plan.js';
import {
  languageProblem,
  parseLanguages,
  translationsPathProblem,
} from './validation.js';

export interface AskContext {
  /** What the options already gave, which is not asked again. */
  given: { langs?: string[]; translationsPath?: string };
  /** Whether the scripts are to be asked about: there is a `package.json`, and `--no-scripts` was not passed. */
  askScripts: boolean;
  /** The translation files of the languages that are not there yet, for the folder. */
  findMissing: (langs: string[], translationsPath: string) => string[];
}

export const startPrompts = () => intro('transloco init');

export const reportStep = ({ message, kept }: InitStep) =>
  kept ? log.info(message) : log.success(message);

export const endPrompts = (message: string) => outro(message);

/**
 * Asks for what the options did not give. Nothing is asked about twice and
 * nothing is done with the answers here.
 *
 * @returns the answers, or `undefined` when a question was cancelled
 */
export async function askInit({
  given,
  askScripts,
  findMissing,
}: AskContext): Promise<InitAnswers | undefined> {
  const langs = given.langs ?? (await askLangs());

  if (!langs) return cancelled();

  const translationsPath =
    given.translationsPath ?? (await askTranslationsPath())?.trim();

  if (translationsPath === undefined) return cancelled();

  const missing = findMissing(langs, translationsPath);
  const createTranslationFiles = missing.length
    ? await ask(
        confirm({
          message: `Create the missing translation files (${missing.join(', ')})?`,
          initialValue: true,
        }),
      )
    : false;

  if (createTranslationFiles === undefined) return cancelled();

  const addScripts = askScripts
    ? await ask(
        confirm({
          message: `Add the ${Object.keys(scripts).join(' and ')} scripts to ${manifestFileName}?`,
          initialValue: true,
        }),
      )
    : false;

  if (addScripts === undefined) return cancelled();

  return { langs, translationsPath, createTranslationFiles, addScripts };
}

async function askLangs() {
  const answer = await ask(
    text({
      message:
        'Which languages does the app support? Separate them with spaces or commas',
      placeholder: defaultLangs.join(' '),
      defaultValue: defaultLangs.join(' '),
      validate: (value) => {
        // Nothing typed is the default
        if (!value) return undefined;

        const langs = parseLanguages(value);

        return langs.length
          ? langs.map(languageProblem).find(Boolean)
          : 'Enter at least one language';
      },
    }),
  );

  return answer === undefined ? undefined : parseLanguages(answer);
}

function askTranslationsPath() {
  return ask(
    text({
      message: 'Where do the translation files live?',
      placeholder: defaultTranslationsPath,
      defaultValue: defaultTranslationsPath,
      // Nothing typed is the default, which has to be usable as well
      validate: (value) =>
        translationsPathProblem(value || defaultTranslationsPath),
    }),
  );
}

/** The answer of a prompt, `undefined` when the prompt was cancelled. */
async function ask<T>(prompt: Promise<T>) {
  const answer = await prompt;

  return isCancel(answer) ? undefined : (answer as Exclude<T, symbol>);
}

function cancelled() {
  cancel('Operation cancelled.');

  return undefined;
}
