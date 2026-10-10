import os from 'node:os';

import type { CommandUnknownOpts } from '@commander-js/extra-typings';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createProgram } from './program.js';
import { collectOutput, everyCommand } from './tests/program-harness.js';

/**
 * Every way of writing every option, against one rule: a command line is
 * either rejected, or the command runs with everything that was typed, exactly
 * as it was typed. There is no third outcome, where the command runs and a
 * typed value went somewhere else or nowhere. Asking for the help or the
 * version is the one thing that isn't a setting: it prints, and nothing runs.
 * The help comes before all of it: a command line that asks for it gets the
 * help of the command it asks it of, whatever else was typed and however
 * wrong that is.
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
  runJoin: vi.fn(),
  runSplit: vi.fn(),
  runMigrateNgxTranslate: vi.fn(),
  runMigrateAngularI18n: vi.fn(),
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
vi.mock('./commands/join.js', () => ({ runJoin: runners.runJoin }));
vi.mock('./commands/split.js', () => ({ runSplit: runners.runSplit }));
vi.mock('./commands/migrate-ngx-translate.js', () => ({
  runMigrateNgxTranslate: runners.runMigrateNgxTranslate,
}));
vi.mock('./commands/migrate-angular-i18n.js', () => ({
  runMigrateAngularI18n: runners.runMigrateAngularI18n,
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
  /** A request for the help was put on the command line, so it has to be found there. */
  asksForHelp?: boolean;
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
          operands: [
            // An argument named like the option is the same setting given the other way
            ...command.registeredArguments
              .filter((argument) => argument.name() !== name)
              .map((argument) => `${argument.name()}-operand`),
            // An option that has to be given is part of a command line that runs
            ...command.options
              .filter(({ mandatory }) => mandatory)
              .filter((other) => other !== option)
              .flatMap((other) => [other.long as string, 'alpha']),
          ],
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

/** The `--input` of the keys manager is a comma separated list of paths, the one of `migrate` is a folder. */
const isPathList = ({ path, name }: OptionInfo) =>
  name === 'input' && ['extract', 'find'].includes(path[0]);
const samePath = (a: OptionInfo, b: OptionInfo) =>
  a.path.join(' ') === b.path.join(' ');

/** The real program. Its commands and options are read off it, it never runs. */
const tree: CommandUnknownOpts = createProgram();
const version = `${tree.version()}\n`;

/** What the help of the command at the path starts with. */
const usageOf = (path: string[]) =>
  `Usage: ${[tree.name(), ...path].join(' ')} `;

/** The help option is the one commander shows without it being declared. */
function helpOptionOf(command: CommandUnknownOpts) {
  const option = command
    .createHelp()
    .visibleOptions(command)
    .find((visible) => !command.options.includes(visible));

  return { long: option?.long as string, short: option?.short as string };
}

/** The command and the ones above it. */
function lineage(command: CommandUnknownOpts): CommandUnknownOpts[] {
  return command.parent ? [command, ...lineage(command.parent)] : [command];
}

/** What commander takes for an argument although it starts with a dash. */
const negativeNumber = /^-(\d+|\d*\.\d+)(e[+-]?\d+)?$/;

/**
 * The commands leading to the one a command line asks the help of, or
 * `undefined` when it doesn't ask for any. This is the rule of the README,
 * written out a second time and apart from the program, which the matrix
 * holds to it:
 *
 * - A request is `--help`, `-h`, or the help letter among nothing but flags of
 *   the command behind one dash. It counts anywhere before `--`, also where a
 *   value was expected, and never inside `--name=value`.
 * - It is a request for the help of the command whose arguments it stands
 *   among. Those of a command with subcommands end at the name of one, for as
 *   long as the command knows every option before that name: at the first one
 *   it doesn't know, the rest of the command line is its own.
 */
function helpAskedOf(
  args: string[],
  command = tree,
  path: string[] = [],
): string[] | undefined {
  const end = args.indexOf('--');
  const typed = end === -1 ? args : args.slice(0, end);
  const help = helpOptionOf(command);
  const short = (letter: string) =>
    command.options.find((option) => option.short === `-${letter}`);
  const asks = (token: string) =>
    token === help.long ||
    token === help.short ||
    (/^-[^-]/.test(token) &&
      token.includes(help.short.slice(1)) &&
      [...token.slice(1)].every((letter) => {
        const option = short(letter);

        return `-${letter}` === help.short || (option && !takesValue(option));
      }));
  const own = typed.some(asks) ? path : undefined;

  // The first name that isn't the value of an option is the subcommand
  for (let index = 0; index < typed.length; index++) {
    const token = typed[index];
    const next: string | undefined = typed[index + 1];

    if (asks(token) || !command.commands.length) return own;

    if (!token.startsWith('-') || token === '-' || negativeNumber.test(token)) {
      // `help <command>` is the help of that command already
      const [name, ...rest] =
        token === 'help' ? typed.slice(index + 1) : typed.slice(index);
      const subcommand = command.commands.find(
        (candidate) => candidate.name() === name,
      );

      return subcommand
        ? helpAskedOf(rest, subcommand, [...path, subcommand.name()])
        : own;
    }

    // Whether the option is known, and whether it is still waiting for a value
    let waiting: boolean;

    if (token.startsWith('--')) {
      const [name, ...attached] = token.split('=');
      const option = command.options.find(({ long }) => long === name);

      if (!option || (attached.length && !takesValue(option))) return own;

      waiting = Boolean(takesValue(option)) && !attached.length;
    } else {
      const letters = [...token.slice(1)].map(short);
      const valueAt = letters.findIndex(
        (option) => option && takesValue(option),
      );
      const read = valueAt === -1 ? letters : letters.slice(0, valueAt + 1);

      if (!read.every(Boolean)) return own;

      waiting = valueAt === letters.length - 1 && valueAt !== -1;
    }

    // What reads as an option isn't taken for the value
    const known = lineage(command).flatMap(({ options }) => options);
    const readsAsOption =
      next !== undefined &&
      (next.startsWith('--')
        ? [help.long, ...known.map(({ long }) => long)].includes(
            next.split('=')[0],
          )
        : next.length > 1 &&
          [help.short, ...known.map((option) => option.short)].includes(
            next.slice(0, 2),
          ));

    if (waiting && next !== undefined && !readsAsOption) index++;
  }

  return own;
}

/** The whole help of the command at the path: what `--help` prints for it. */
const helps = new Map<string, string>();

function helpOf(path: string[]) {
  const key = path.join(' ');

  if (!helps.has(key)) {
    const program = createProgram();
    const output = collectOutput(program);

    try {
      program.parse([...path, '--help'], { from: 'user' });
    } catch {
      // Commander is done once the help is printed
    }

    helps.set(key, output.stdout);
  }

  return helps.get(key) as string;
}

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
    // The help is asked for wherever it stands, also where a value was expected
    const outcome = ['--help', '-h'].includes(follower)
      ? { prints: usageOf(option.path) }
      : { impossible: true };

    add(`long followed by ${follower}`, [long, follower], outcome);
    if (short) {
      add(`short followed by ${follower}`, [short, follower], outcome);
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
  if (isPathList(option)) {
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
 * it stands. Next to the version letter the help is printed as well, in either
 * order, as it is when the two are typed apart: the help comes first.
 */
function shapesOfHelpInClusters(): Shape[] {
  return everyCommand(createProgram()).flatMap((command) => {
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
        { prints: `Usage: ${names.join(' ')} ` },
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

/**
 * The version, alone and in front of a command. It is printed as soon as it is
 * read, so nothing after it is looked at.
 */
function shapesOfVersion(): Shape[] {
  const option = tree.options.find(({ long }) => long === '--version');
  const { long, short } = option as { long: string; short: string };

  return [
    [short],
    [long],
    [short, short],
    [short, long],
    [short, 'validate', 'en.json'],
    [long, 'extract'],
    ['--cwd', os.tmpdir(), short],
    [`--cwd=${os.tmpdir()}`, long, 'extract'],
  ].map((args) => ({ group: args.join(' '), args, prints: version }));
}

/**
 * The same command lines with a request for the help added: in each of its
 * forms, at every position before `--`. Whatever the command line was, one
 * that ran, one that was rejected or one that printed the version, it now
 * prints the help.
 */
function withHelpRequest(shapes: Shape[]): Shape[] {
  const seen = new Set<string>();
  const isCommand = (name: string) =>
    tree.commands.some((command) => command.name() === name);

  return shapes.flatMap(({ group, args }) => {
    const end = args.includes('--') ? args.indexOf('--') : args.length;
    const nameAt = args.slice(0, end).findIndex(isCommand);
    const named = tree.commands.find(
      (command) => command.name() === args[nameAt],
    ) as CommandUnknownOpts;
    // The commands a command line starts with: `migrate`, then `ngx-translate`
    const chain: CommandUnknownOpts[] = [];

    for (let current = tree, index = 0; nameAt === 0 && index < end; index++) {
      const next = current.commands.find(
        (command) => command.name() === args[index],
      );

      if (!next) break;

      chain.push(next);
      current = next;
    }

    return Array.from({ length: end + 1 }, (_, position) => {
      const inProgram = nameAt === -1 || position <= nameAt;
      // The commands named before the request: a request in front of the name
      // of the command is one for the help of the program, and one after a
      // command line starting with that name is for the help of the command, or
      // of the subcommand when it stands behind the name of that one. After
      // options of the program it depends on them, which is left to the rule to
      // tell.
      const above = chain.slice(0, position);
      const path = inProgram
        ? []
        : nameAt === 0
          ? above.map((command) => command.name())
          : undefined;
      const owner = inProgram ? tree : (above.at(-1) ?? named);
      const { long, short } = helpOptionOf(owner);
      const letter = short.slice(1);
      const [flag = letter] = path
        ? owner.options.flatMap((option) =>
            option.short && !takesValue(option) ? [option.short.slice(1)] : [],
          )
        : [];

      return [long, short, `-${letter}${flag}`, `-${flag}${letter}`].map(
        (request): Shape => ({
          group: `${group}, with ${request} at ${position}`,
          args: [...args.slice(0, position), request, ...args.slice(position)],
          asksForHelp: true,
          ...(path ? { prints: usageOf(path) } : {}),
        }),
      );
    })
      .flat()
      .filter(({ args: withRequest }) => {
        const key = JSON.stringify(withRequest);

        return !seen.has(key) && seen.add(key);
      });
  });
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
  { title: 'the version', shapes: shapesOfVersion() },
];

/** Every command line of the matrix once more, asking for the help as well. */
const helpMatrix = matrix.map(({ title, shapes }) => ({
  title,
  shapes: withHelpRequest(shapes),
}));

const countOf = (entries: Array<{ shapes: Shape[] }>) =>
  entries.reduce((total, { shapes }) => total + shapes.length, 0);

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
    const asked = helpAskedOf(shape.args);

    if (shape.asksForHelp && !asked) {
      return 'holds a request for the help that the rule does not find';
    }
    if (shape.prints?.startsWith('Usage: ') && !asked) {
      return 'is expected to print the help without asking for it';
    }
    if (asked) {
      if (ran.length) return 'ran a command instead of printing the help';
      if (chdir.mock.calls.length) return 'changed the working directory';
      if (failure?.exitCode !== 0) {
        return `didn't print the help and exit with 0: ${failure ? output.stderr.trim() : 'it ran'}`;
      }
      if (output.stderr) {
        return `wrote ${JSON.stringify(output.stderr.slice(0, 50))} to stderr`;
      }
      if (output.stdout !== helpOf(asked)) {
        return `printed ${JSON.stringify(output.stdout.slice(0, 50))} instead of the help of "${[tree.name(), ...asked].join(' ')}"`;
      }
      // Where the command is known from how the command line was put together
      if (shape.prints && !output.stdout.startsWith(shape.prints)) {
        return `printed the help of "${[tree.name(), ...asked].join(' ')}" instead of ${JSON.stringify(shape.prints)}`;
      }

      return undefined;
    }

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
        : isPathList(option)
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
        'join',
        'split',
        'migrate ngx-translate',
        'migrate angular-i18n',
      ]),
    );
    expect(discovered.values.length).toBeGreaterThanOrEqual(24);
    expect(discovered.flags.length).toBeGreaterThanOrEqual(10);
    expect(countOf(matrix)).toBeGreaterThan(3600);
  });

  it(`GIVEN the command lines of the matrix
      WHEN each is searched for a request for the help
      THEN every one holding a request is expected to print the help, none of them to run or to be rejected, and there are tens of thousands of them`, () => {
    const asking = [...matrix, ...helpMatrix]
      .flatMap(({ shapes }) => shapes)
      .filter(({ args }) => helpAskedOf(args));

    expect(
      asking
        .filter(
          ({ prints, asksForHelp, impossible, values, flags }) =>
            !(asksForHelp || prints?.startsWith('Usage: ')) ||
            impossible ||
            values ||
            flags,
        )
        .map(({ args }) => args),
    ).toEqual([]);
    expect(asking.length).toBeGreaterThanOrEqual(countOf(helpMatrix));
    expect(countOf(helpMatrix)).toBeGreaterThan(50_000);
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

  it.each(helpMatrix.map(({ title, shapes }) => [title, shapes] as const))(
    `GIVEN every way of writing "%s", with a request for the help added in each of its forms and at every position
     WHEN the program runs each of them
     THEN each prints the help of the command the request stands in, and nothing else happens`,
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
