import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cancelled = vi.hoisted(() => Symbol('cancelled'));
const clack = vi.hoisted(() => ({
  text: vi.fn(),
  confirm: vi.fn(),
  cancel: vi.fn(),
  intro: vi.fn(),
  outro: vi.fn(),
  log: { success: vi.fn(), info: vi.fn() },
  isCancel: (value: unknown) => value === cancelled,
}));

vi.mock('@clack/prompts', () => clack);

import {
  type AskContext,
  askInit,
  endPrompts,
  reportStep,
  startPrompts,
} from './prompts.js';

describe('askInit', () => {
  const context = (overrides: Partial<AskContext> = {}): AskContext => ({
    given: {},
    askScripts: true,
    findMissing: (langs, folder) =>
      langs.map((lang) => `${folder}/${lang}.json`),
    ...overrides,
  });

  /** The options a prompt was opened with, by the order they were asked in. */
  const asked = (prompt: typeof clack.text | typeof clack.confirm) =>
    prompt.mock.calls.map(([options]) => options);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it(`GIVEN no option
      WHEN the questions are asked
      THEN all four are, in order, and the answers are handed back`, async () => {
    clack.text.mockResolvedValueOnce('en es').mockResolvedValueOnce('i18n');
    clack.confirm.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const answers = await askInit(context());

    expect(answers).toEqual({
      langs: ['en', 'es'],
      translationsPath: 'i18n',
      createTranslationFiles: true,
      addScripts: false,
    });
    expect(asked(clack.text).map(({ message }) => message)).toEqual([
      expect.stringContaining('languages'),
      expect.stringContaining('translation files live'),
    ]);
    expect(asked(clack.confirm).map(({ message }) => message)).toEqual([
      'Create the missing translation files (i18n/en.json, i18n/es.json)?',
      'Add the i18n:extract and i18n:find scripts to package.json?',
    ]);
  });

  it(`GIVEN the defaults are accepted
      WHEN the questions are asked
      THEN the prompts carry the defaults and both confirmations start on yes`, async () => {
    clack.text
      .mockResolvedValueOnce('en')
      .mockResolvedValueOnce('src/assets/i18n');
    clack.confirm.mockResolvedValue(true);

    await askInit(context());

    const [langs, folder] = asked(clack.text);

    expect(langs).toMatchObject({ defaultValue: 'en', placeholder: 'en' });
    expect(folder).toMatchObject({
      defaultValue: 'src/assets/i18n',
      placeholder: 'src/assets/i18n',
    });
    expect(asked(clack.confirm)).toEqual([
      expect.objectContaining({ initialValue: true }),
      expect.objectContaining({ initialValue: true }),
    ]);
  });

  it.each([
    ['spaces', 'en es fr'],
    ['commas', 'en,es,fr'],
    ['commas and spaces', ' en, es ,fr '],
  ])(
    `GIVEN the languages are separated by %s
     WHEN the questions are asked
     THEN they are three languages`,
    async (_, answer) => {
      clack.text.mockResolvedValueOnce(answer).mockResolvedValueOnce('i18n');
      clack.confirm.mockResolvedValue(true);

      expect((await askInit(context()))?.langs).toEqual(['en', 'es', 'fr']);
    },
  );

  it(`GIVEN the languages and the path came with the options
      WHEN the questions are asked
      THEN only the confirmations are`, async () => {
    clack.confirm.mockResolvedValue(true);

    const answers = await askInit(
      context({ given: { langs: ['en'], translationsPath: 'i18n' } }),
    );

    expect(clack.text).not.toHaveBeenCalled();
    expect(clack.confirm).toHaveBeenCalledTimes(2);
    expect(answers).toEqual({
      langs: ['en'],
      translationsPath: 'i18n',
      createTranslationFiles: true,
      addScripts: true,
    });
  });

  it(`GIVEN only the languages came with the options
      WHEN the questions are asked
      THEN the path is asked for, and the languages are not`, async () => {
    clack.text.mockResolvedValueOnce('  i18n  ');
    clack.confirm.mockResolvedValue(true);

    const answers = await askInit(context({ given: { langs: ['en', 'es'] } }));

    expect(clack.text).toHaveBeenCalledTimes(1);
    expect(answers?.translationsPath).toBe('i18n');
    expect(answers?.langs).toEqual(['en', 'es']);
  });

  it(`GIVEN every translation file exists
      WHEN the questions are asked
      THEN there is no question about creating them`, async () => {
    clack.confirm.mockResolvedValue(true);

    const answers = await askInit(
      context({
        given: { langs: ['en'], translationsPath: 'i18n' },
        findMissing: () => [],
      }),
    );

    expect(asked(clack.confirm)).toHaveLength(1);
    expect(asked(clack.confirm)[0].message).toContain('scripts');
    expect(answers?.createTranslationFiles).toBe(false);
  });

  it(`GIVEN scripts are not to be asked about
      WHEN the questions are asked
      THEN there is no question about them and none are added`, async () => {
    clack.confirm.mockResolvedValue(true);

    const answers = await askInit(
      context({
        given: { langs: ['en'], translationsPath: 'i18n' },
        askScripts: false,
      }),
    );

    expect(asked(clack.confirm)).toHaveLength(1);
    expect(asked(clack.confirm)[0].message).toContain('translation files');
    expect(answers?.addScripts).toBe(false);
  });

  it(`GIVEN the folder of the files depends on the answer
      WHEN the missing files are looked for
      THEN they are looked for in the folder that was answered`, async () => {
    const findMissing = vi.fn().mockReturnValue([]);

    clack.text.mockResolvedValueOnce('en es').mockResolvedValueOnce('i18n');
    clack.confirm.mockResolvedValue(true);

    await askInit(context({ findMissing }));

    expect(findMissing).toHaveBeenCalledWith(['en', 'es'], 'i18n');
  });

  describe('validation', () => {
    const originalCwd = process.cwd();
    let dir: string;

    // The folder is judged against what is on disk
    beforeEach(() => {
      dir = fs.realpathSync(
        fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-init-prompt-')),
      );
      process.chdir(dir);
    });

    afterEach(() => {
      process.chdir(originalCwd);
      fs.rmSync(dir, { recursive: true, force: true });
    });

    const validatorOf = async (index: 0 | 1) => {
      clack.text.mockResolvedValue('x');
      clack.confirm.mockResolvedValue(true);

      await askInit(context());

      return asked(clack.text)[index].validate as (
        value: string | undefined,
      ) => string | undefined;
    };

    it.each([[undefined], ['']])(
      `GIVEN nothing is typed (%j)
       WHEN the languages are validated
       THEN the default applies and there is no problem`,
      async (value) => {
        expect((await validatorOf(0))(value)).toBeUndefined();
      },
    );

    it.each([['en es'], ['en,es'], ['pt-BR']])(
      `GIVEN the languages %j
       WHEN they are validated
       THEN there is no problem`,
      async (value) => {
        expect((await validatorOf(0))(value)).toBeUndefined();
      },
    );

    it.each([[' '], [','], [' , , ']])(
      `GIVEN only separators (%j)
       WHEN the languages are validated
       THEN at least one language is asked for`,
      async (value) => {
        expect((await validatorOf(0))(value)).toBe(
          'Enter at least one language',
        );
      },
    );

    it.each([['en ../es'], ['en/es'], ['a:b']])(
      `GIVEN the language that is no file name in %j
       WHEN the languages are validated
       THEN the message says it can't be used`,
      async (value) => {
        expect((await validatorOf(0))(value)).toContain(
          'cannot be used as a language',
        );
      },
    );

    it.each([[undefined], ['']])(
      `GIVEN nothing is typed (%j)
       WHEN the folder is validated
       THEN the default applies and there is no problem`,
      async (value) => {
        expect((await validatorOf(1))(value)).toBeUndefined();
      },
    );

    it(`GIVEN a blank folder
        WHEN it is validated
        THEN the message says it can't be empty`, async () => {
      expect((await validatorOf(1))('   ')).toBe(
        'The translations path cannot be empty',
      );
    });

    it(`GIVEN a folder outside the working directory
        WHEN it is validated
        THEN the message says it must be inside it`, async () => {
      expect((await validatorOf(1))('../elsewhere')).toContain(
        'must be inside the current directory',
      );
    });

    it(`GIVEN a folder inside the working directory
        WHEN it is validated
        THEN there is no problem`, async () => {
      expect((await validatorOf(1))('src/i18n')).toBeUndefined();
    });

    it.each([['src'], ['src/assets'], ['src/assets/i18n']])(
      `GIVEN a folder that has the file %s in its way
       WHEN it is validated
       THEN the message says so, which makes the prompt ask again`,
      async (file) => {
        fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
        fs.writeFileSync(path.join(dir, file), '');

        expect((await validatorOf(1))('src/assets/i18n')).toBe(
          'The translations path src/assets/i18n is, or lies inside, a file',
        );
      },
    );

    it.each([[undefined], ['']])(
      `GIVEN nothing is typed (%j) and the default folder has a file in its way
       WHEN the folder is validated
       THEN the problem of the default is the message`,
      async (value) => {
        fs.mkdirSync(path.join(dir, 'src'));
        fs.writeFileSync(path.join(dir, 'src', 'assets'), '');

        expect((await validatorOf(1))(value)).toBe(
          'The translations path src/assets/i18n is, or lies inside, a file',
        );
      },
    );
  });

  describe('cancelling', () => {
    it.each([
      ['the languages', [cancelled], 1],
      ['the folder', ['en', cancelled], 2],
    ])(
      `GIVEN %s is cancelled
       WHEN the questions are asked
       THEN the library's message is shown and no answers come back`,
      async (_, texts, textCalls) => {
        for (const answer of texts) clack.text.mockResolvedValueOnce(answer);

        expect(await askInit(context())).toBeUndefined();
        expect(clack.cancel).toHaveBeenCalledExactlyOnceWith(
          'Operation cancelled.',
        );
        expect(clack.text).toHaveBeenCalledTimes(textCalls);
        expect(clack.confirm).not.toHaveBeenCalled();
      },
    );

    it(`GIVEN the creation of the files is cancelled
        WHEN the questions are asked
        THEN the question about the scripts is not asked`, async () => {
      clack.text.mockResolvedValueOnce('en').mockResolvedValueOnce('i18n');
      clack.confirm.mockResolvedValueOnce(cancelled);

      expect(await askInit(context())).toBeUndefined();
      expect(clack.cancel).toHaveBeenCalledTimes(1);
      expect(clack.confirm).toHaveBeenCalledTimes(1);
    });

    it(`GIVEN the scripts question is cancelled
        WHEN the questions are asked
        THEN no answers come back`, async () => {
      clack.text.mockResolvedValueOnce('en').mockResolvedValueOnce('i18n');
      clack.confirm
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(cancelled);

      expect(await askInit(context())).toBeUndefined();
      expect(clack.cancel).toHaveBeenCalledExactlyOnceWith(
        'Operation cancelled.',
      );
    });

    it(`GIVEN the only question left is cancelled
        WHEN the other answers came with the options
        THEN no answers come back`, async () => {
      clack.confirm.mockResolvedValueOnce(cancelled);

      expect(
        await askInit(
          context({
            given: { langs: ['en'], translationsPath: 'i18n' },
            askScripts: false,
          }),
        ),
      ).toBeUndefined();
    });
  });
});

describe('the framing', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it(`GIVEN the prompts start
      WHEN the intro is shown
      THEN it names the command`, () => {
    startPrompts();

    expect(clack.intro).toHaveBeenCalledExactlyOnceWith('transloco init');
  });

  it(`GIVEN steps that wrote something and steps that kept something
      WHEN they are reported
      THEN the first are successes and the others notes`, () => {
    reportStep({ message: 'Created a', write: { file: 'a', content: '' } });
    reportStep({ message: 'Kept b', kept: true });

    expect(clack.log.success).toHaveBeenCalledExactlyOnceWith('Created a');
    expect(clack.log.info).toHaveBeenCalledExactlyOnceWith('Kept b');
  });

  it(`GIVEN a step that is done along with the write of another
      WHEN it is reported
      THEN it is a success all the same`, () => {
    reportStep({ message: 'Added c' });

    expect(clack.log.success).toHaveBeenCalledExactlyOnceWith('Added c');
    expect(clack.log.info).not.toHaveBeenCalled();
  });

  it(`GIVEN the prompts end
      WHEN the outro is shown
      THEN it carries the message`, () => {
    endPrompts('Done');

    expect(clack.outro).toHaveBeenCalledExactlyOnceWith('Done');
  });
});
