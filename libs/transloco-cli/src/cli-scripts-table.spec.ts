import { readFileSync } from 'node:fs';
import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createProgram } from './program.js';
import { collectOutput } from './tests/program-harness.js';

/**
 * Holds the table `ng update` rewrites npm scripts with to the real program.
 *
 * The table lives in the core library, which must not depend on the CLI and
 * the other way round, so it is read here as data: the file is found on disk
 * and its JSON literal parsed. For every option it keeps or respells, the
 * rewritten command line has to run, with the value handed to the command. For
 * every option it drops or leaves, the new bin has to still refuse the option,
 * which is the reason it is not kept. Rename a flag of the CLI and this fails
 * until the table follows.
 */
const runners = vi.hoisted(() => ({
  runExtract: vi.fn(),
  runFind: vi.fn(),
  runValidate: vi.fn(),
  runOptimize: vi.fn(),
  runScopedLibs: vi.fn(),
}));

vi.mock('./commands/extract.js', () => ({ runExtract: runners.runExtract }));
vi.mock('./commands/find.js', () => ({ runFind: runners.runFind }));
vi.mock('./commands/validate.js', () => ({
  runValidate: runners.runValidate,
}));
vi.mock('./commands/optimize.js', () => ({
  runOptimize: runners.runOptimize,
}));
vi.mock('./commands/scoped-libs.js', () => ({
  runScopedLibs: runners.runScopedLibs,
}));

interface TableOption {
  name: string;
  spellings: Record<string, string | null>;
  outcome: 'same' | 'respelled' | 'dropped' | 'leave';
  takesValue?: boolean;
  variadic?: boolean;
  choices?: string[];
  allowEmpty?: boolean;
  list?: boolean;
  noComma?: boolean;
}

interface TableInvocation {
  bin: string;
  command?: string;
  to: string;
  positionals: 'none' | 'files' | 'dist';
  options: TableOption[];
}

const tablePath = path.resolve(
  import.meta.dirname,
  '../../transloco/migrations/v9/cli-scripts-table.ts',
);

function readTable(): { invocations: TableInvocation[] } {
  const source = readFileSync(tablePath, 'utf8');
  const literal =
    /export const CLI_SCRIPTS_TABLE[^=]*=\s*(\{[\s\S]*\});\s*$/.exec(
      source,
    )?.[1];

  if (!literal) throw new Error(`No table literal found in ${tablePath}`);

  return JSON.parse(literal);
}

const { invocations } = readTable();

const commandOf = ({ command, to }: TableInvocation) =>
  command ?? to.split(' ').at(-1)!;
const runnerOf: Record<string, ReturnType<typeof vi.fn>> = {
  extract: runners.runExtract,
  find: runners.runFind,
  validate: runners.runValidate,
  optimize: runners.runOptimize,
  'scoped-libs': runners.runScopedLibs,
};
/** The name of the property the command is handed the option under. */
const camelCase = (name: string) =>
  name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

/** What a command line without the option needs to run: the argument the command can't do without. */
const operandsOf = (invocation: TableInvocation, option?: TableOption) => {
  if (invocation.positionals === 'files') return ['a.json'];
  if (invocation.positionals === 'dist' && option?.name !== 'dist') {
    return ['dist-folder'];
  }

  return [];
};

const sampleOf = (option: TableOption) =>
  option.choices?.[0] ?? (option.list ? 'alpha,beta' : 'alpha');

async function parse(args: string[]) {
  const program = createProgram();
  const output = collectOutput(program);

  Object.values(runners).forEach((runner) => runner.mockClear());

  try {
    await program.parseAsync(args, { from: 'user' });
  } catch (error) {
    return { error: String(error), output };
  }

  return { error: undefined, output };
}

beforeEach(() => {
  Object.values(runners).forEach((runner) => runner.mockReset());
});

describe('the table of the script migration', () => {
  it(`GIVEN the table on disk
      WHEN it is read
      THEN it holds the four bins and the two commands of the keys manager`, () => {
    expect(
      invocations.map(({ bin, command }) => [bin, command].join(' ').trim()),
    ).toEqual([
      'transloco-keys-manager extract',
      'transloco-keys-manager find',
      'transloco-validator',
      'transloco-optimize',
      'transloco-scoped-libs',
    ]);
  });

  describe.each(
    invocations.map(
      (invocation) =>
        [
          [invocation.bin, invocation.command].filter(Boolean).join(' '),
          invocation,
        ] as const,
    ),
  )('%s', (_label, invocation) => {
    const command = commandOf(invocation);
    const kept = invocation.options.filter(({ outcome }) =>
      ['same', 'respelled'].includes(outcome),
    );

    it(`GIVEN the replacement ${invocation.to}
        WHEN it is run without options
        THEN the command runs`, async () => {
      const operands = operandsOf(invocation);
      const { error } = await parse([command, ...operands]);

      expect(error).toBeUndefined();
      expect(invocation.to.startsWith('transloco')).toBe(true);
      expect(runnerOf[command]).toHaveBeenCalledTimes(1);
    });

    it.each(
      kept.flatMap((option) =>
        Object.entries(option.spellings).map(
          ([legacy, target]) => [option.name, legacy, target!] as const,
        ),
      ),
    )(
      `GIVEN the option %s written %s by the legacy bin
        WHEN the script is migrated and the new bin gets %s
        THEN it runs and the command is handed the value`,
      async (name, _legacy, target) => {
        const option = invocation.options.find((entry) => entry.name === name)!;
        const values = option.variadic
          ? ['alpha', 'beta']
          : option.takesValue
            ? [sampleOf(option)]
            : [];
        const { error } = await parse([
          command,
          ...operandsOf(invocation, option),
          target,
          ...values,
        ]);

        expect(error).toBeUndefined();
        expect(runnerOf[command]).toHaveBeenCalledTimes(1);

        const expected = option.variadic
          ? values
          : option.list
            ? values[0].split(',')
            : option.takesValue
              ? values[0]
              : true;
        const [first] = runnerOf[command].mock.calls[0];

        expect(first).toEqual(
          expect.objectContaining({ [camelCase(name)]: expected }),
        );
      },
    );

    it.each(kept.filter(({ takesValue }) => takesValue).map((o) => [o.name]))(
      `GIVEN the option %s with the value attached by an equals sign
        WHEN the new bin gets it
        THEN it runs, as it does on the legacy bin`,
      async (name) => {
        const option = invocation.options.find((entry) => entry.name === name)!;
        const long = Object.values(option.spellings).find((target) =>
          target?.startsWith('--'),
        )!;
        const { error } = await parse([
          command,
          ...operandsOf(invocation, option),
          `${long}=${sampleOf(option)}`,
        ]);

        expect(error).toBeUndefined();
      },
    );

    it.each(
      invocation.options
        .filter(({ outcome }) => outcome === 'dropped')
        .flatMap((option) =>
          Object.keys(option.spellings).map(
            (spelling) =>
              [
                option.name,
                spelling,
                option.takesValue ? ['alpha'] : [],
              ] as const,
          ),
        ),
    )(
      `GIVEN the option %s that the legacy command ignored, written %s
        WHEN the new bin gets it
        THEN it refuses it, which is why the migration leaves it out`,
      async (_name, spelling, values) => {
        const { error } = await parse([
          command,
          ...operandsOf(invocation),
          spelling,
          ...values,
        ]);

        expect(error).toMatch(/unknown option/);
        expect(runnerOf[command]).not.toHaveBeenCalled();
      },
    );

    it.each(
      invocation.options
        .filter(({ outcome }) => outcome === 'respelled')
        .flatMap((option) =>
          Object.entries(option.spellings)
            .filter(([legacy, target]) => legacy !== target)
            .map(
              ([legacy]) =>
                [
                  option.name,
                  legacy,
                  option.takesValue ? ['alpha'] : [],
                ] as const,
            ),
        ),
    )(
      `GIVEN the option %s that the legacy bin spelled %s
        WHEN the new bin gets that spelling
        THEN it refuses it, which is why the migration respells it`,
      async (_name, legacy, values) => {
        const { error } = await parse([
          command,
          ...operandsOf(invocation),
          legacy,
          ...values,
        ]);

        expect(error).toMatch(/unknown option/);
      },
    );

    it.each(
      kept
        .filter(({ takesValue, allowEmpty }) => takesValue && !allowEmpty)
        .map((option) => [option.name]),
    )(
      `GIVEN the option %s given an empty value
        WHEN the new bin gets it
        THEN it refuses it, which is why the migration leaves such a script`,
      async (name) => {
        const option = invocation.options.find((entry) => entry.name === name)!;
        const target = Object.values(option.spellings).find(Boolean)!;
        const { error } = await parse([
          command,
          ...operandsOf(invocation, option),
          target,
          '',
        ]);

        expect(error).toMatch(/cannot be empty|invalid|argument/);
        expect(runnerOf[command]).not.toHaveBeenCalled();
      },
    );

    it.each(kept.filter(({ allowEmpty }) => allowEmpty).map((o) => [o.name]))(
      `GIVEN the option %s that takes an empty value
        WHEN the new bin gets one
        THEN it runs and the command is handed the empty value`,
      async (name) => {
        const option = invocation.options.find((entry) => entry.name === name)!;
        const target = Object.values(option.spellings).find(Boolean)!;
        const { error } = await parse([
          command,
          ...operandsOf(invocation, option),
          target,
          '',
        ]);

        expect(error).toBeUndefined();
        expect(runnerOf[command].mock.calls[0][0]).toEqual(
          expect.objectContaining({ [camelCase(name)]: '' }),
        );
      },
    );

    it.each(
      kept
        .filter(({ takesValue, variadic }) => takesValue && !variadic)
        .map((option) => [option.name]),
    )(
      `GIVEN the option %s given twice
        WHEN the new bin gets it
        THEN it refuses it, which is why the migration leaves such a script`,
      async (name) => {
        const option = invocation.options.find((entry) => entry.name === name)!;
        const target = Object.values(option.spellings).find(Boolean)!;
        const { error } = await parse([
          command,
          ...operandsOf(invocation, option),
          target,
          sampleOf(option),
          target,
          sampleOf(option),
        ]);

        expect(error).toMatch(/more than once/);
      },
    );

    it.each(
      kept.filter(({ variadic }) => variadic).map((option) => [option.name]),
    )(
      `GIVEN the option %s that takes several values
        WHEN the new bin gets it twice
        THEN it runs and the command gets the values of both`,
      async (name) => {
        const option = invocation.options.find((entry) => entry.name === name)!;
        const target = Object.values(option.spellings).find(Boolean)!;
        const { error } = await parse([
          command,
          ...operandsOf(invocation, option),
          target,
          'alpha',
          target,
          'beta',
        ]);

        expect(error).toBeUndefined();
        expect(runnerOf[command].mock.calls[0][0]).toEqual(
          expect.objectContaining({ [camelCase(name)]: ['alpha', 'beta'] }),
        );
      },
    );

    it.each(
      kept.filter(({ choices }) => choices).map((option) => [option.name]),
    )(
      `GIVEN the option %s that takes a fixed set of values
        WHEN the new bin gets another
        THEN it refuses it, and takes each value of the table`,
      async (name) => {
        const option = invocation.options.find((entry) => entry.name === name)!;
        const target = Object.values(option.spellings).find(Boolean)!;
        const operands = operandsOf(invocation, option);

        for (const choice of option.choices!) {
          expect(
            (await parse([command, ...operands, target, choice])).error,
          ).toBe(undefined);
        }

        const { error } = await parse([
          command,
          ...operands,
          target,
          'not-a-choice',
        ]);

        expect(error).toMatch(/not-a-choice|allowed choices/);
      },
    );

    it.each(kept.filter(({ list }) => list).map((option) => [option.name]))(
      `GIVEN the option %s that takes a comma separated list
        WHEN the new bin gets an empty part in it
        THEN it refuses it, which is why the migration leaves such a script`,
      async (name) => {
        const option = invocation.options.find((entry) => entry.name === name)!;
        const target = Object.values(option.spellings).find(Boolean)!;
        const { error } = await parse([
          command,
          ...operandsOf(invocation, option),
          target,
          'alpha,,beta',
        ]);

        expect(error).toMatch(/empty/);
      },
    );

    it.each(
      kept.filter(({ noComma }) => noComma).map((option) => [option.name]),
    )(
      `GIVEN the option %s whose values are separate arguments
        WHEN the new bin gets a comma in a value
        THEN it refuses it, which is why the migration leaves such a script`,
      async (name) => {
        const option = invocation.options.find((entry) => entry.name === name)!;
        const target = Object.values(option.spellings).find(Boolean)!;
        const { error } = await parse([
          command,
          ...operandsOf(invocation, option),
          target,
          'alpha,beta',
        ]);

        expect(error).toMatch(/comma/);
        expect(runnerOf[command]).not.toHaveBeenCalled();
      },
    );

    it.each(
      kept.filter(({ noComma }) => noComma).map((option) => [option.name]),
    )(
      `GIVEN the option %s whose values are separate arguments
        WHEN the new bin gets a comma in a value written with an equals sign
        THEN it refuses it as well, which is why the migration leaves such a script`,
      async (name) => {
        const option = invocation.options.find((entry) => entry.name === name)!;
        const target = Object.values(option.spellings).find((spelling) =>
          spelling?.startsWith('--'),
        )!;
        const { error } = await parse([
          command,
          ...operandsOf(invocation, option),
          `${target}=alpha,beta`,
        ]);

        expect(error).toMatch(/comma/);
        expect(runnerOf[command]).not.toHaveBeenCalled();
      },
    );

    it.each(
      kept
        .filter(
          ({ takesValue, noComma, list, choices }) =>
            takesValue && !noComma && !list && !choices,
        )
        .map((option) => [option.name]),
    )(
      `GIVEN the option %s that the table does not mark as refusing a comma
        WHEN the new bin gets a comma in a value
        THEN it runs, so the migration may leave such a script as it is`,
      async (name) => {
        const option = invocation.options.find((entry) => entry.name === name)!;
        const target = Object.values(option.spellings).find(Boolean)!;
        const { error } = await parse([
          command,
          ...operandsOf(invocation, option),
          target,
          'alpha,beta',
        ]);

        expect(error).toBeUndefined();
        expect(runnerOf[command]).toHaveBeenCalledTimes(1);
      },
    );

    if (invocation.positionals === 'none') {
      it(`GIVEN a command that takes no argument
          WHEN the new bin gets one
          THEN it refuses it`, async () => {
        const { error } = await parse([command, 'stray']);

        expect(error).toMatch(/too many arguments|unknown/);
      });
    }

    if (invocation.positionals === 'files') {
      it(`GIVEN a command that needs a file
          WHEN the new bin gets none
          THEN it refuses it, and takes several`, async () => {
        expect((await parse([command])).error).toMatch(/missing required/);
        expect((await parse([command, 'a.json', 'b.json'])).error).toBe(
          undefined,
        );
        expect(runners.runValidate).toHaveBeenCalledWith(['a.json', 'b.json']);
      });

      it(`GIVEN a file that starts with a dash
          WHEN the new bin gets it
          THEN it reads an option, where the legacy bin read a file`, async () => {
        expect((await parse([command, '-x'])).error).toMatch(/unknown option/);
      });
    }

    if (invocation.positionals === 'dist') {
      it(`GIVEN a command that needs the dist folder
          WHEN the new bin gets none, or two
          THEN it refuses it, and takes one as an argument or as an option`, async () => {
        expect((await parse([command])).error).toMatch(/missing required/);
        expect((await parse([command, 'a', 'b'])).error).toMatch(
          /too many arguments/,
        );
        expect((await parse([command, 'a', '-d', 'b'])).error).toMatch(
          /both as an argument/,
        );
        expect((await parse([command, 'folder'])).error).toBeUndefined();
        expect(runners.runOptimize).toHaveBeenCalledWith(
          expect.objectContaining({ dist: 'folder' }),
        );
        expect((await parse([command, '-d', 'folder'])).error).toBeUndefined();
      });
    }
  });
});
