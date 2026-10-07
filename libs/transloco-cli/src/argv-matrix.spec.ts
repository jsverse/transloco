import os from 'node:os';

import type { CommandUnknownOpts } from '@commander-js/extra-typings';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createProgram } from './program';
import { collectOutput, everyCommand } from './tests/program-harness';

/**
 * Every way of writing every option, against one rule: a command line is
 * either rejected, or the command runs with everything that was typed, exactly
 * as it was typed. There is no third outcome, where the command runs and a
 * typed value went somewhere else or nowhere. Asking for the help or the
 * version is the one thing that isn't a setting: it prints, and nothing runs.
 *
 * The options are read off the real program and the shapes are generated per
 * option, so an option or a command added later is covered without touching
 * this spec.
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

interface OptionInfo {
  /** The commands leading to the option, none for a program option. */
  path: string[];
  name: string;
  /** The property the runner gets the option under. */
  key: string;
  long: string;
  short?: string;
  variadic: boolean;
  /** Two values the option accepts. */
  samples: [string, string];
  /** The arguments the command needs next to the option to be runnable. */
  operands: string[];
}

interface Shape {
  group: string;
  args: string[];
  /** The values typed for an option: when the command runs, it has to get each of them. */
  values?: Array<[OptionInfo, string]>;
  /** The flags typed: when the command runs, each of them has to be on. */
  flags?: OptionInfo[];
  /** What was typed can't be honoured at all, so running is always wrong. */
  impossible?: boolean;
  /** What stdout starts with when the help or the version was asked for: nothing runs and the exit code is 0. */
  prints?: string;
}

const takesValue = (option: CommandUnknownOpts['options'][number]) =>
  option.required || option.optional;

/** Every option of the command and of the commands below it, split into the ones taking a value and the flags. */
function readOptions(
  command: CommandUnknownOpts,
  path: string[] = [],
): { values: OptionInfo[]; flags: OptionInfo[] } {
  const own = command.options
    // `--version` prints and exits, it is no setting of a command
    .filter(
      (option) => option.long !== undefined && option.name() !== 'version',
    )
    .map((option) => {
      const name = option.name();
      const choices = option.argChoices;

      return {
        option,
        info: {
          path,
          name,
          key: option.attributeName(),
          long: option.long as string,
          short: option.short,
          variadic: option.variadic,
          samples: (choices
            ? [choices[0], choices[1] ?? choices[0]]
            : name === 'cwd'
              ? [os.tmpdir(), os.homedir()]
              : ['alpha', 'beta/gamma']) as [string, string],
          // An argument named like the option is the same setting given the other way
          operands: command.registeredArguments
            .filter((argument) => argument.name() !== name)
            .map((argument) => `${argument.name()}-operand`),
        },
      };
    });

  const below = command.commands.map((subcommand) =>
    readOptions(subcommand, [...path, subcommand.name()]),
  );

  return {
    values: [
      ...own.filter(({ option }) => takesValue(option)).map(({ info }) => info),
      ...below.flatMap(({ values }) => values),
    ],
    flags: [
      ...own
        .filter(({ option }) => !takesValue(option))
        .map(({ info }) => info),
      ...below.flatMap(({ flags }) => flags),
    ],
  };
}

const discovered = readOptions(createProgram());
const samePath = (a: OptionInfo, b: OptionInfo) =>
  a.path.join(' ') === b.path.join(' ');

/** A program option goes before a command, a command option after its command and operands. */
function commandLine(option: OptionInfo, tokens: string[]) {
  return option.path.length
    ? [...option.path, ...option.operands, ...tokens]
    : [...tokens, 'validate', 'en.json'];
}

/** The flags of the command the option belongs to that have a short form. */
function shortFlagsNextTo(option: OptionInfo) {
  return discovered.flags.filter(
    (flag) => samePath(flag, option) && flag.short !== undefined,
  );
}

/** Whether the letters are nothing but short flags of the command: the one thing a longer single-dash token may be. */
function isFlagCluster(option: OptionInfo, letters: string) {
  const flags = shortFlagsNextTo(option).map((flag) => flag.short?.slice(1));

  return (
    letters.length > 0 && [...letters].every((letter) => flags.includes(letter))
  );
}

/**
 * The ways a long name ends up behind a single dash: in full, cut short (two
 * letters or more), in camelCase and with its dashes left out.
 */
function singleDashSpellings({ name, key }: OptionInfo) {
  const spellings = new Set<string>([key, name.replaceAll('-', '')]);

  for (let length = 2; length <= name.length; length++) {
    spellings.add(name.slice(0, length));
  }

  return [...spellings];
}

function permutations<T>(items: T[]): T[][] {
  return items.length <= 1
    ? [items]
    : items.flatMap((item, index) =>
        permutations([...items.slice(0, index), ...items.slice(index + 1)]).map(
          (rest) => [item, ...rest],
        ),
      );
}

function shapesOfValueOption(option: OptionInfo): Shape[] {
  const { long, short, samples } = option;
  const [first, second] = samples;
  const siblings = discovered.flags.filter((flag) => samePath(flag, option));
  const otherValue = discovered.values.find(
    (other) => samePath(other, option) && other !== option,
  );
  const shapes: Shape[] = [];
  const add = (
    group: string,
    tokens: string[],
    rest: Omit<Shape, 'group' | 'args'>,
  ) => shapes.push({ group, args: commandLine(option, tokens), ...rest });
  const typed = (...values: string[]): Pick<Shape, 'values'> => ({
    values: values.map((value) => [option, value]),
  });

  // The ways to write it
  add('long', [long, first], typed(first));
  add('long=', [`${long}=${first}`], typed(first));
  if (short) {
    add('short', [short, first], typed(first));
    // A value goes in the next argument or after `--long=`, never glued to the letter
    add('short attached', [`${short}${first}`], { impossible: true });
    add('short=', [`${short}=${first}`], { impossible: true });
  }

  // Values that are easy to produce by accident
  for (const [label, value] of [
    ['empty', ''],
    ['blank', ' '],
    ['tab', '\t'],
    ['newline', '\n'],
  ]) {
    add(`${label} long`, [long, value], typed(value));
    add(`${label} long=`, [`${long}=${value}`], typed(value));
    if (short) add(`${label} short`, [short, value], typed(value));
  }
  for (const value of ['false', 'true', '0', 'undefined']) {
    add(`value ${value}`, [long, value], typed(value));
  }

  // No value at all
  add('missing at the end, long', [long], { impossible: true });
  if (short) add('missing at the end, short', [short], { impossible: true });

  // Directly followed by something that is an option itself
  const followers = [
    '--',
    '--help',
    '-h',
    '--version',
    '-V',
    '--cwd',
    '-C',
    ...siblings.flatMap((flag) => [flag.long, flag.short]),
    ...(siblings.length > 1 && siblings[0].short && siblings[1].short
      ? [`${siblings[0].short}${siblings[1].short.slice(1)}`]
      : []),
    ...(otherValue ? [otherValue.long, otherValue.short] : []),
    ...(otherValue?.short ? [`${otherValue.short}attached`] : []),
    ...(otherValue ? [`${otherValue.long}=x`] : []),
  ].filter((token): token is string => token !== undefined);

  for (const follower of followers) {
    add(`long followed by ${follower}`, [long, follower], { impossible: true });
    if (short) {
      add(`short followed by ${follower}`, [short, follower], {
        impossible: true,
      });
    }
    // The way to pass a value that looks like an option
    add(`long=${follower}`, [`${long}=${follower}`], typed(follower));
  }
  add('long followed by -- and a value', [long, '--', first], {
    impossible: true,
  });

  // More than once
  for (const [label, tokens, values] of [
    ['long twice, same value', [long, first, long, first], [first, first]],
    ['long twice', [long, first, long, second], [first, second]],
    ['long twice, reversed', [long, second, long, first], [second, first]],
    ['long= twice', [`${long}=${first}`, `${long}=${second}`], [first, second]],
    ['long, then long= empty', [long, first, `${long}=`], [first, '']],
    ['long empty, then long', [long, '', long, first], ['', first]],
    ...(short
      ? ([
          [
            'short twice, same value',
            [short, first, short, first],
            [first, first],
          ],
          ['short twice', [short, first, short, second], [first, second]],
          ['short, then long', [short, first, long, second], [first, second]],
          ['long, then short', [long, first, short, second], [first, second]],
          [
            'short attached twice',
            [`${short}${first}`, `${short}${second}`],
            [first, second],
          ],
          ['short, then short empty', [short, first, short, ''], [first, '']],
          ['short empty, then short', [short, '', short, first], ['', first]],
        ] as const)
      : []),
  ] as ReadonlyArray<readonly [string, readonly string[], readonly string[]]>) {
    add(label, [...tokens], typed(...values));
  }

  // Not the option at all
  add('after --', ['--', long, first], { impossible: true });
  add('upper case', [long.toUpperCase(), first], { impossible: true });
  for (const spelling of singleDashSpellings(option)) {
    // Letters that are all flags are a cluster, which the flags cover
    if (isFlagCluster(option, spelling)) continue;

    add(`single dash "${spelling}"`, [`-${spelling}`], { impossible: true });
    add(`single dash "${spelling}", value next`, [`-${spelling}`, first], {
      impossible: true,
    });
    add(`single dash "${spelling}"=`, [`-${spelling}=${first}`], {
      impossible: true,
    });
  }
  if (option.name.length > 3) {
    add('abbreviated', [long.slice(0, 5), first], { impossible: true });
  }
  add('followed by an unknown option', [long, first, '--frobnicate'], {
    impossible: true,
  });
  add('followed by an unknown short option', [long, first, '-X'], {
    impossible: true,
  });
  // For an option collecting its values the word is one more value
  if (!option.variadic) {
    add('followed by a stray word', [long, first, 'false'], {
      impossible: true,
    });
  }

  // In a cluster: an option taking a value can't share its dash, wherever it stands
  const [flag, otherFlag] = shortFlagsNextTo(option);
  if (short && flag?.short) {
    const letter = short.slice(1);
    const one = flag.short.slice(1);
    const two = otherFlag?.short?.slice(1) ?? one;

    for (const [label, cluster] of [
      ['value option first', `-${letter}${one}${two}`],
      ['value option in the middle', `-${one}${letter}${two}`],
      ['value option last', `-${one}${two}${letter}`],
      ['one flag, then the value option', `-${one}${letter}`],
      ['the value option, then one flag', `-${letter}${one}`],
    ]) {
      add(`cluster, ${label}`, [cluster], { impossible: true });
      add(`cluster, ${label}, value next`, [cluster, first], {
        impossible: true,
      });
    }
    add('cluster, value attached', [`-${one}${letter}${first}`], {
      impossible: true,
    });
    add('cluster with an unknown letter', [long, first, `${flag.short}X`], {
      impossible: true,
    });
  }

  // Lists
  if (option.name === 'input') {
    for (const value of [
      'a,b',
      'a,',
      ',a',
      'a,,b',
      'a, ,b',
      ',',
      'a, b',
      ' a',
    ]) {
      add(`list "${value}"`, [long, value], typed(value));
    }
  }
  if (option.variadic) {
    add('several values', [long, first, second], typed(first, second));
    add(
      'several occurrences',
      [long, first, long, second],
      typed(first, second),
    );
    add('a comma', [long, `${first},${second}`], typed(`${first},${second}`));
    add('an empty element', [long, first, ''], typed(first, ''));
    add('an empty first element', [long, '', first], typed('', first));
    for (const sibling of siblings) {
      const token = sibling.short ?? sibling.long;

      add(`values, then ${token}`, [long, first, token], {
        ...typed(first),
        flags: [sibling],
      });
      add(`${token} in place of the values`, [long, token], {
        impossible: true,
      });
    }
  }

  return shapes;
}

function shapesOfFlag(flag: OptionInfo): Shape[] {
  const { long, short, name } = flag;
  const shapes: Shape[] = [];
  const add = (
    group: string,
    tokens: string[],
    rest: Omit<Shape, 'group' | 'args'>,
  ) => shapes.push({ group, args: commandLine(flag, tokens), ...rest });
  const on = { flags: [flag] };
  const never = { impossible: true };
  const camelCase = `--${flag.key}`;

  add('long', [long], on);
  add('long twice', [long, long], on);
  add('long=true', [`${long}=true`], on);
  add('long=false', [`${long}=false`], never);
  add('long=', [`${long}=`], never);
  add('long, then false', [long, 'false'], never);
  add('long, then true', [long, 'true'], never);
  add('negated', [`--no-${name}`], never);
  add('after --', ['--', long], never);
  add('upper case', [long.toUpperCase()], never);
  if (camelCase !== long) add('camelCase', [camelCase], never);
  if (short) {
    add('short', [short], on);
    add('short twice', [short, short], on);
    add('long and short', [long, short], on);
    add('short=false', [`${short}=false`], never);
    add('short with false attached', [`${short}false`], never);
    add('short with 0 attached', [`${short}0`], never);
    add('short with an unknown letter', [`${short}X`], never);
    add('short after --', ['--', short], never);
  }
  for (const spelling of singleDashSpellings(flag)) {
    if (isFlagCluster(flag, spelling)) continue;

    add(`single dash "${spelling}"`, [`-${spelling}`], never);
    add(`single dash "${spelling}"=true`, [`-${spelling}=true`], never);
  }

  return shapes;
}

/** Several flags behind one dash: any order, any repetition, and nothing but flags. */
function shapesOfFlagClusters(): Shape[] {
  return commandPaths().flatMap((anyOption) => {
    const flags = shortFlagsNextTo(anyOption);
    const letters = (cluster: OptionInfo[]) =>
      `-${cluster.map((flag) => flag.short?.slice(1)).join('')}`;
    const shape = (
      group: string,
      token: string,
      rest: Omit<Shape, 'group' | 'args'>,
    ) => ({
      group,
      args: commandLine(anyOption, [token]),
      ...rest,
    });

    if (flags.length < 2) return [];

    const [first, second] = flags;

    return [
      ...permutations(flags).map((order) =>
        shape('every flag, in one order', letters(order), { flags }),
      ),
      ...flags.flatMap((a) =>
        flags
          .filter((b) => b !== a)
          .map((b) => shape('two flags', letters([a, b]), { flags: [a, b] })),
      ),
      shape('a flag twice', letters([first, first]), { flags: [first] }),
      shape('a flag repeated around another', letters([first, second, first]), {
        flags: [first, second],
      }),
      shape('an unknown letter first', `-X${letters(flags).slice(1)}`, {
        impossible: true,
      }),
      shape(
        'an unknown letter in the middle',
        `${letters([first])}X${letters([second]).slice(1)}`,
        {
          impossible: true,
        },
      ),
      shape('an unknown letter last', `${letters(flags)}X`, {
        impossible: true,
      }),
      shape('a digit in the cluster', `${letters([first])}1`, {
        impossible: true,
      }),
    ];
  });
}

/**
 * The help letter behind one dash with the flags of a command, the program and
 * a command without any flag included. It is a flag like the others, wherever
 * it stands. Next to the version letter the version is printed, in either
 * order, as it is when the two are typed apart.
 */
function shapesOfHelpInClusters(): Shape[] {
  const program = createProgram();
  const version = `${program.version()}\n`;

  return everyCommand(program).flatMap((command) => {
    const names: string[] = [];

    for (
      let current: CommandUnknownOpts | null = command;
      current;
      current = current.parent
    ) {
      names.unshift(current.name());
    }

    const [, ...path] = names;
    const operands = command.registeredArguments.map(
      (argument) => `${argument.name()}-operand`,
    );
    const letter = (option?: { short?: string }) => option?.short?.slice(1);
    // The help option is the one commander shows without it being declared
    const help = letter(
      command
        .createHelp()
        .visibleOptions(command)
        .find((option) => !command.options.includes(option)),
    ) as string;
    const versionLetter = letter(
      command.options.find((option) => option.name() === 'version'),
    );
    const letters = (takingValue: boolean) =>
      command.options
        .filter((option) => Boolean(takesValue(option)) === takingValue)
        .flatMap((option) => letter(option) ?? []);
    const flags = letters(false);
    const shape = (
      group: string,
      tokens: string[],
      rest: Omit<Shape, 'group' | 'args'>,
    ): Shape => ({
      group: `${names.join(' ')}: ${group}`,
      args: path.length
        ? [...path, ...operands, ...tokens]
        : [...tokens, 'validate', 'en.json'],
      ...rest,
    });
    const printing = (group: string, typed: string[], separately = false) =>
      shape(
        group,
        separately ? typed.map((one) => `-${one}`) : [`-${typed.join('')}`],
        {
          prints:
            versionLetter && typed.includes(versionLetter)
              ? version
              : `Usage: ${names.join(' ')} `,
        },
      );
    const never = { impossible: true };

    return [
      printing('the help letter alone', [help]),
      printing('the help letter twice', [help, help]),
      ...flags.flatMap((flag) => [
        printing('the help letter before a flag', [help, flag]),
        printing('the help letter after a flag', [flag, help]),
        printing('the help letter and a flag, apart', [help, flag], true),
        printing('a flag and the help letter, apart', [flag, help], true),
      ]),
      // In every position among all the flags of the command
      ...(flags.length > 1
        ? [...flags, help].map((_, position) =>
            printing(`the help letter at ${position} among every flag`, [
              ...flags.slice(0, position),
              help,
              ...flags.slice(position),
            ]),
          )
        : []),
      ...letters(true).flatMap((value) => [
        shape(
          'the help letter before a value option',
          [`-${help}${value}`],
          never,
        ),
        shape(
          'the help letter after a value option',
          [`-${value}${help}`],
          never,
        ),
      ]),
      shape('the help letter before an unknown one', [`-${help}X`], never),
      shape('the help letter after an unknown one', [`-X${help}`], never),
      shape('the help letter with a value', [`-${help}=true`], never),
      shape(
        'the help letter in upper case behind another',
        [`-${help}${help.toUpperCase()}`],
        never,
      ),
    ];
  });
}

/** The commands of the program, each with the arguments it needs to run. */
function commandPaths() {
  const paths = new Map<string, OptionInfo>();

  for (const option of [...discovered.values, ...discovered.flags]) {
    if (option.path.length) paths.set(option.path.join(' '), option);
  }

  return [...paths.values()];
}

/** A program option only counts in front of the command. */
function shapesOfProgramOptionsAfterCommand(): Shape[] {
  return commandPaths().flatMap((anyOption) =>
    [
      ['-C', os.tmpdir()],
      ['--cwd', os.tmpdir()],
      [`--cwd=${os.tmpdir()}`],
      ['-V'],
      ['--version'],
    ].map((tokens) => ({
      group: `${anyOption.path.join(' ')} followed by ${tokens[0]}`,
      args: [...anyOption.path, ...tokens],
      impossible: true,
    })),
  );
}

const matrix = [
  ...discovered.values.map((option) => ({
    title: [...option.path, option.long].join(' '),
    shapes: shapesOfValueOption(option),
  })),
  ...discovered.flags.map((flag) => ({
    title: [...flag.path, flag.long].join(' '),
    shapes: shapesOfFlag(flag),
  })),
  {
    title: 'program options after a command',
    shapes: shapesOfProgramOptionsAfterCommand(),
  },
  { title: 'clusters of flags', shapes: shapesOfFlagClusters() },
  { title: 'the help letter in a cluster', shapes: shapesOfHelpInClusters() },
];

describe('argv matrix', () => {
  let chdir: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    chdir = vi.spyOn(process, 'chdir').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** What the command got for the option, however it is handed over. */
  function received(option: OptionInfo, argument: Record<string, unknown>) {
    return option.path.length
      ? argument[option.key]
      : chdir.mock.calls.at(-1)?.[0];
  }

  /** `undefined` when the shape is either rejected or honoured, otherwise what went wrong. */
  async function violation(shape: Shape): Promise<string | undefined> {
    vi.clearAllMocks();

    const program = createProgram();
    const output = collectOutput(program);

    let failure: { exitCode?: number } | undefined;

    try {
      await program.parseAsync(shape.args, { from: 'user' });
    } catch (error) {
      failure = error as { exitCode?: number };
    }

    const ran = Object.values(runners).filter(
      (runner) => runner.mock.calls.length > 0,
    );

    if (shape.prints !== undefined) {
      if (ran.length) return 'ran a command instead of only printing';
      if (failure?.exitCode !== 0) {
        return `didn't print and exit with 0: ${failure ? output.stderr.trim() : 'it ran'}`;
      }
      if (!output.stdout.startsWith(shape.prints) || output.stderr) {
        return `printed ${JSON.stringify(output.stdout.slice(0, 50))} instead of ${JSON.stringify(shape.prints)}`;
      }

      return undefined;
    }

    if (failure) {
      if (!failure.exitCode) return `failed without a non-zero exit code`;
      if (ran.length) return 'was rejected after a command had run';

      return undefined;
    }

    if (shape.impossible) return 'ran, although nothing can honour it';
    if (ran.length !== 1 || ran[0].mock.calls.length !== 1) {
      return `ran ${ran.length} commands`;
    }

    const argument = ran[0].mock.calls[0][0] as Record<string, unknown>;

    for (const [option, value] of shape.values ?? []) {
      const actual = received(option, argument);
      const honoured = option.variadic
        ? Array.isArray(actual) && actual.includes(value)
        : option.name === 'input'
          ? JSON.stringify(actual) === JSON.stringify(value.split(','))
          : actual === value;

      if (!honoured) {
        return `ran with ${option.long} = ${JSON.stringify(actual)} instead of ${JSON.stringify(value)}`;
      }
    }

    for (const flag of shape.flags ?? []) {
      if (argument[flag.key] !== true) {
        return `ran without ${flag.long}`;
      }
    }

    return undefined;
  }

  it(`GIVEN the real program
      WHEN its options are read off it
      THEN the matrix covers every command, with well over a thousand command lines`, () => {
    const covered = new Set(
      [...discovered.values, ...discovered.flags].map(({ path }) =>
        path.join(' '),
      ),
    );

    expect([...covered].sort()).toEqual(
      expect.arrayContaining([
        '',
        'extract',
        'find',
        'optimize',
        'scoped-libs',
      ]),
    );
    expect(discovered.values.length).toBeGreaterThanOrEqual(19);
    expect(discovered.flags.length).toBeGreaterThanOrEqual(10);
    expect(
      matrix.reduce((total, { shapes }) => total + shapes.length, 0),
    ).toBeGreaterThan(2800);
  });

  it.each(matrix.map(({ title, shapes }) => [title, shapes] as const))(
    `GIVEN every way of writing "%s"
     WHEN the program runs each of them
     THEN each is either rejected or the command gets exactly what was typed`,
    async (_, shapes) => {
      const violations: string[] = [];

      for (const shape of shapes) {
        const problem = await violation(shape);

        if (problem) {
          violations.push(
            `[${shape.group}] ${JSON.stringify(shape.args)}: ${problem}`,
          );
        }
      }

      expect(violations).toEqual([]);
    },
  );
});
