import { statSync } from 'node:fs';

import {
  Command,
  type CommandUnknownOpts,
  Option,
} from '@commander-js/extra-typings';

import type { Config } from './keys-manager/types.js';
import { readPackageJson } from './package-info.js';

const helpShort = '-h';
const helpLong = '--help';
const helpFlags = `${helpShort}, ${helpLong}`;
const helpCommand = 'help';
const helpDescription = 'Display help for the command';

/**
 * Builds the `transloco` program without running it.
 *
 * Nothing a command needs is imported here: every action loads its runner on
 * demand, so `--help`, `validate` and `optimize` never pay for the Angular
 * compiler and TypeScript the keys manager pulls in.
 *
 * The options of `extract` and `find` declare no default. A flag that wasn't
 * passed has to stay out of the parsed options, as that's what lets a value from
 * the config file apply. The file is free to hold options of both commands,
 * only the flags typed on the command line are held to the invoked command.
 * `optimize --comments-key` is the one option with a default, and no config
 * file is involved there.
 */
export function createProgram() {
  const program = new Command('transloco')
    .description('The Transloco command line')
    .version(readPackageJson().version, '-V, --version', 'Output the version')
    .helpOption(helpFlags, helpDescription)
    .helpCommand(`${helpCommand} [command]`, helpDescription)
    .option('-C, --cwd <dir>', 'Run as if transloco was started in <dir>')
    // Program options go before the command, which leaves every command free
    // to reject whatever it doesn't declare itself.
    .enablePositionalOptions()
    .showHelpAfterError('(add --help for additional information)')
    .hook('preAction', (thisCommand) => {
      const { cwd } = thisCommand.opts();

      if (cwd === undefined) return;

      if (!isDirectory(cwd)) {
        return thisCommand.error(
          `error: the --cwd directory does not exist: ${cwd}`,
        );
      }

      process.chdir(cwd);
    });

  /** The options both `extract` and `find` read. */
  const keysManagerCommand = (name: Config['command'], description: string) =>
    program
      .command(name)
      .description(description)
      .helpOption(helpFlags, helpDescription)
      .option('--project <name>', 'Name of the targeted project')
      .option('-c, --config <path>', 'Path to a custom transloco config')
      .option(
        '-i, --input <paths>',
        'The source directory for all files using the translation keys, comma separated when there are several',
      )
      .addOption(
        new Option(
          '-f, --file-format <format>',
          'The translation file format, `json` unless configured otherwise',
        ).choices(['json', 'pot'] as const),
      )
      .option('-m, --marker <name>', 'The marker sign for dynamic values')
      .option('-s, --sort', 'Sort keys using the sort() method')
      .option('-u, --unflat', 'Unflat the translation file')
      .option(
        '-d, --default-value <value>',
        'The default value of a generated key',
      );

  keysManagerCommand(
    'extract',
    'Extract the translation keys into the translation files',
  )
    .option(
      '-o, --output <path>',
      'The target directory for all generated translation files',
    )
    .option('-l, --langs <langs...>', 'The languages files to generate')
    .option(
      '-r, --replace',
      'Replace the contents of a translation file (if it exists) with the generated one (default value is false, in which case files are merged)',
    )
    .option(
      '-R, --remove-extra-keys',
      'Remove extra keys from existing translation files',
    )
    .action(async (options) => {
      const { runExtract } = await import('./commands/extract.js');

      await runExtract(toKeysManagerConfig('extract', options));
    });

  keysManagerCommand(
    'find',
    'Find the keys missing from the translation files, and the extra ones in them',
  )
    .option(
      '-p, --translations-path <path>',
      'Where are the main translation files',
    )
    .option(
      '-a, --add-missing-keys',
      'Add missing keys that were found by the detective (default value is false)',
    )
    .option(
      '-e, --emit-error-on-extra-keys',
      'Emit an error and exit the process if extra keys were found (defaults to `false`)',
    )
    .action(async (options) => {
      const { runFind } = await import('./commands/find.js');

      await runFind(toKeysManagerConfig('find', options));
    });

  program
    .command('validate')
    .description(
      'Verify the translation files are valid JSON and hold no duplicate keys',
    )
    .helpOption(helpFlags, helpDescription)
    .argument('<files...>', 'The translation files to validate')
    .action(async (files) => {
      const { runValidate } = await import('./commands/validate.js');

      runValidate(files);
    });

  program
    .command('optimize')
    .description(
      'Flatten and minify the translation files of a production build, dropping the translator comments',
    )
    .helpOption(helpFlags, helpDescription)
    .argument('[dist]', 'The directory holding the built translation files')
    .option('-d, --dist <path>', 'Same as the `dist` argument')
    .option(
      '-k, --comments-key <key>',
      'The key translator comments are kept under',
      'comment',
    )
    .action(
      async (distArgument, { dist: distOption, commentsKey }, command) => {
        if (distArgument !== undefined && distOption !== undefined) {
          return command.error(
            `error: 'dist' was given both as an argument and through '--dist'`,
          );
        }

        const dist = distArgument ?? distOption;

        if (dist === undefined) {
          return command.error(`error: missing required argument 'dist'`);
        }

        // An empty path would resolve to the working directory and optimize
        // every JSON file below it. `--dist` is covered by the rule for
        // options, this is for the argument.
        if (dist.trim() === '') {
          return command.error(`error: 'dist' cannot be empty`);
        }

        const { runOptimize } = await import('./commands/optimize.js');

        await runOptimize({ dist, commentsKey });
      },
    );

  program
    .command('scoped-libs')
    .description(
      'Copy the translation files of scoped libraries into the application',
    )
    .helpOption(helpFlags, helpDescription)
    .option('-w, --watch', 'Keep running and copy the files as they change')
    .option(
      '--skip-gitignore',
      `Don't add the copied translation files to .gitignore`,
    )
    .option('-c, --config <path>', 'Path to a custom transloco config')
    .action(async (options) => {
      const { runScopedLibs } = await import('./commands/scoped-libs.js');

      await runScopedLibs(options);
    });

  program
    .command('join')
    .description(
      'Join the translation files of all scopes into one file per language',
    )
    .helpOption(helpFlags, helpDescription)
    .option(
      '--translations-path <dir>',
      'The folder of the root translation files (defaults to `rootTranslationsPath` of the config)',
    )
    .option(
      '-o, --out-dir <dir>',
      'The folder the joined files are written to, it is emptied first',
      'dist-i18n',
    )
    .option(
      '--default-lang <lang>',
      'The default language of the project (defaults to `defaultLang` of the config)',
    )
    .option(
      '--include-default-lang',
      'Join the default language as well, it is left out otherwise',
    )
    .option('-c, --config <path>', 'Path to a custom transloco config')
    .action(async (options) => {
      const { runJoin } = await import('./commands/join.js');

      runJoin(options);
    });

  program
    .command('split')
    .description('Split joined translation files back into the scope folders')
    .helpOption(helpFlags, helpDescription)
    .option(
      '--translations-path <dir>',
      'The folder of the root translation files (defaults to `rootTranslationsPath` of the config)',
    )
    .option(
      '--source <dir>',
      'The folder holding the joined translation files',
      'dist-i18n',
    )
    .option('-c, --config <path>', 'Path to a custom transloco config')
    .action(async (options) => {
      const { runSplit } = await import('./commands/split.js');

      runSplit(options);
    });

  // Last, so that it covers every command and option declared above.
  enforceOptionRules(program);

  return program;
}

/** What to do instead of repeating an option, for the ones that have an answer. */
const repeatHints: Record<string, string> = {
  input:
    ' Separate several paths with a comma instead, e.g. --input src/app,projects/ui/src',
};

/**
 * The options that take an empty value. An empty default value for the
 * generated keys is a choice, and it has always worked.
 */
const emptyValueAllowed = new Set(['default-value']);

/** What is wrong with a value beyond being empty, for the options with a format. */
const valueProblems: Record<string, (value: string) => string | undefined> = {
  // The paths are taken as they are, a blank one included, which would then
  // resolve to the working directory.
  input: (value) =>
    value.split(',').some((path) => path.trim() === '')
      ? 'holds an empty path. Separate the paths with a single comma, e.g. --input src/app,projects/ui/src'
      : undefined,
};

/**
 * Holds every option that takes a value, of the command and of all the
 * commands below it, to two rules the argument parser doesn't have:
 *
 * - It can be given once. Commander keeps the last value and drops the others
 *   without a word, which for `--input` means sources silently left out of
 *   the extraction. A variadic option, `--langs` that is, may repeat.
 * - Its value can't be empty or blank. That's what `--input "$SRC"` turns
 *   into when the variable isn't set, and the command would carry on with the
 *   default or with the working directory.
 *
 * It also makes the command check how its arguments are written, see
 * `enforceOptionGrammar`, and answer a request for the help before any of
 * that, see `helpRequestPath`.
 *
 * It listens to the occurrences instead of wrapping the parsing of the values,
 * which leaves the parsed options untouched: an absent option stays absent and
 * a default doesn't count as an occurrence. Only what was typed on the command
 * line is checked, the config file isn't.
 */
function enforceOptionRules(command: CommandUnknownOpts) {
  for (const option of command.options) {
    if (!takesValue(option)) continue;

    const name = option.name();
    const flags = `option '${option.flags}'`;
    let given = false;

    command.on(`option:${name}`, (value: unknown) => {
      if (given && !option.variadic) {
        command.error(
          `error: ${flags} was given more than once.${repeatHints[name] ?? ''}`,
        );
      }

      given = true;

      if (typeof value !== 'string') return;

      if (value.trim() === '' && !emptyValueAllowed.has(name)) {
        command.error(`error: ${flags} argument cannot be empty`);
      }

      const problem = valueProblems[name]?.(value);

      if (problem) {
        command.error(`error: ${flags} argument '${value}' ${problem}`);
      }
    });
  }

  // The rules above see the values commander parsed. The ones below need the
  // arguments as they were written, before commander reads them.
  const parseOptions = command.parseOptions.bind(command);

  command.parseOptions = (args) => {
    const helpPath = helpRequestPath(command, args);

    // The help comes first. Commander gets the request and nothing else, so
    // whatever was typed next to it is neither read, checked nor run.
    return parseOptions(
      helpPath ? [...helpPath, helpLong] : enforceOptionGrammar(command, args),
    );
  };

  for (const subcommand of command.commands) {
    enforceOptionRules(subcommand);
  }
}

type AnyOption = CommandUnknownOpts['options'][number];

const takesValue = (option: AnyOption) => option.required || option.optional;

/** The option of the command that is written as `flag`, which is `--name` or `-x`. */
const findOption = (command: CommandUnknownOpts, flag: string) =>
  command.options.find(
    (option) => option.long === flag || option.short === flag,
  );

/** Whether the letter is a flag of the command, the one of its help included. */
function isFlag(command: CommandUnknownOpts, letter: string) {
  const option = findOption(command, `-${letter}`);

  return `-${letter}` === helpShort || (option && !takesValue(option));
}

/** What commander takes for an argument although it starts with a dash. */
const negativeNumber = /^-(\d+|\d*\.\d+)(e[+-]?\d+)?$/;

/** Whether the token is an argument or the name of a command, and no option. */
const isOperand = (token: string) =>
  !token.startsWith('-') || token === '-' || negativeNumber.test(token);

/**
 * Whether the token asks for the help of the command: `--help`, `-h`, or the
 * help letter among flags behind one dash, as in `-sh`. Next to anything else
 * the letter is a mistake like any other: `-hc`, `-hX`, `-h=1`.
 */
function isHelpRequest(command: CommandUnknownOpts, token: string) {
  if (token === helpLong || token === helpShort) return true;
  if (token.startsWith('--') || !token.startsWith('-')) return false;

  const letters = [...token.slice(1)];

  return (
    letters.includes(helpShort.slice(1)) &&
    letters.every((letter) => isFlag(command, letter))
  );
}

/**
 * Looks for a request for the help among the arguments of the command. It
 * wins over everything else that was typed: over the version, and over
 * whatever is wrong with the other arguments, as the help is what someone
 * asks for when the command line doesn't work.
 *
 * A request counts anywhere before `--`, also where a value was expected
 * (`-c -h`). What follows the "=" of `--name=value` is a value and isn't
 * looked at, so `--default-value=-h` stays one.
 *
 * It belongs to the command it comes after, the way commander reads the
 * arguments: a subcommand is looked for as long as the command knows all that
 * stands before it. `--frobnicate extract -h` and `translate -h` therefore
 * ask for the help of the program, and `help extract -h` for the one of
 * `extract`, as `help extract` does.
 *
 * @returns the names leading from this command to the one whose help is asked
 * for, none when it's its own, and `undefined` when there is no request
 */
function helpRequestPath(
  command: CommandUnknownOpts,
  args: readonly string[],
): string[] | undefined {
  let subcommandAhead = command.commands.length > 0;

  for (let index = 0; index < args.length; index++) {
    const token = args[index];

    if (token === '--') return undefined;

    if (isHelpRequest(command, token)) return [];

    if (!subcommandAhead) continue;

    if (isOperand(token)) {
      const rest = args.slice(index + 1);
      const [name, ...below] = token === helpCommand ? rest : [token, ...rest];
      const subcommand = command.commands.find(
        (candidate) =>
          candidate.name() === name || candidate.aliases().includes(name),
      );

      if (subcommand) {
        const path = helpRequestPath(subcommand, below);

        return path && [subcommand.name(), ...path];
      }

      // No command of this one, so the rest stays with it
      subcommandAhead = false;

      continue;
    }

    const read = readOption(command, token);
    const next = args[index + 1];

    if (!read) {
      // Commander stops looking for a subcommand at what it doesn't know
      subcommandAhead = false;
    } else if (
      read.valueNext &&
      next !== undefined &&
      !isOption(next, command)
    ) {
      // The value of the option, unless it reads as an option itself, which
      // a request for the help does
      index++;
    }
  }

  return undefined;
}

/**
 * How commander reads an option of the command: whether its value is the next
 * argument, or `undefined` for an option the command doesn't have.
 */
function readOption(
  command: CommandUnknownOpts,
  token: string,
): { valueNext: boolean } | undefined {
  if (token.startsWith('--')) {
    const [name] = token.split('=');
    const option = findOption(command, name);
    const attached = token !== name;

    // Only an option taking a value can have one attached
    return option && (!attached || takesValue(option))
      ? { valueNext: Boolean(takesValue(option)) && !attached }
      : undefined;
  }

  // Letters behind one dash: flags, up to a letter taking a value, which is
  // the rest of the token when there is any
  const letters = [...token.slice(1)];

  for (const [position, letter] of letters.entries()) {
    const option = findOption(command, `-${letter}`);

    if (!option) return undefined;

    if (takesValue(option)) {
      return { valueNext: position === letters.length - 1 };
    }
  }

  return { valueNext: false };
}

/** The options of the command and of the commands above it, the program included. */
function reachableOptions(command: CommandUnknownOpts): AnyOption[] {
  const options: AnyOption[] = [];

  for (
    let current: CommandUnknownOpts | null = command;
    current;
    current = current.parent
  ) {
    options.push(...current.options);
  }

  return options;
}

/**
 * Whether commander would read the token as an option if it stood where an
 * option goes: `--`, a known long option with or without `=value`, or a
 * single dash followed by the letter of a known short option.
 */
function isOption(token: string, command: CommandUnknownOpts) {
  if (token === '--') return true;

  const options = reachableOptions(command);

  if (token.startsWith('--')) {
    const [name] = token.split('=');

    return name === helpLong || options.some((option) => option.long === name);
  }

  if (token.startsWith('-') && token.length > 1) {
    const short = token.slice(0, 2);

    return (
      short === helpShort || options.some((option) => option.short === short)
    );
  }

  return false;
}

/**
 * Holds the arguments of a command to the grammar of its options, before
 * commander reads them:
 *
 * - `--name value` or `--name=value` for a long option.
 * - `-x` for a short one. When it takes a value, the value is the next
 *   argument: `-c path`.
 * - Several letters behind one dash are flags, every one of them: `-su`.
 *   Commander also reads `-cpath` as `-c` with `path` attached and `-sc` as
 *   two options, which is how `-output`, `-defaultValue=TODO` and `-c=path`
 *   run with a value nobody typed. An option taking a value never shares its
 *   dash here. The flags are handed over one by one, `-s -u`.
 * - An option that needs a value doesn't take another option for it: in
 *   `-c -s` the value of `-c` is missing. A value that does start with a dash
 *   is written as `--config=-s`.
 *
 * What stands where a value goes is a value and isn't looked at, nor is
 * anything after `--`. It reads the arguments the way commander is about to:
 * the options of this command, up to the name of a subcommand when it has any.
 *
 * @returns the arguments for commander to read
 */
function enforceOptionGrammar(
  command: CommandUnknownOpts,
  args: readonly string[],
) {
  const hasSubcommands = command.commands.length > 0;
  /** The index of the value of the option at `index`, having checked that it is one. */
  const valueAfter = (option: AnyOption, index: number) => {
    const next = args[index + 1];

    if (next !== undefined && isOption(next, command)) {
      command.error(
        `error: option '${option.flags}' argument missing ('${next}' is an option, a value that starts with a dash is written as ${option.long}=${next})`,
      );
    }

    return next === undefined ? index : index + 1;
  };

  const read: string[] = [];

  for (let index = 0; index < args.length; index++) {
    const token = args[index];

    if (token === '--') return [...read, ...args.slice(index)];

    if (isOperand(token)) {
      // An argument of this command, or the subcommand the rest belongs to
      if (hasSubcommands) return [...read, ...args.slice(index)];

      read.push(token);

      continue;
    }

    // `--name` and `-x`: when the option takes a value, the next argument is it
    if (token.startsWith('--') || token.length === 2) {
      const option = token.includes('=')
        ? undefined
        : findOption(command, token);
      const last =
        option && takesValue(option) ? valueAfter(option, index) : index;

      read.push(...args.slice(index, last + 1));
      index = last;

      continue;
    }

    const letters = [...token.slice(1)];

    if (!letters.every((letter) => isFlag(command, letter))) {
      command.error(`error: ${describeInvalidCluster(command, token)}`);
    }

    read.push(...letters.map((letter) => `-${letter}`));
  }

  return read;
}

/** `default-value`, `defaultValue` and `defaultvalue` alike. */
const withoutDashes = (name: string) => name.replaceAll('-', '').toLowerCase();

/**
 * What is wrong with several letters behind one dash that aren't all flags,
 * and how to write what was most likely meant.
 */
function describeInvalidCluster(command: CommandUnknownOpts, token: string) {
  // The letters up to a "=", which is what was meant for a name
  const [word] = token.slice(1).split('=');
  // Only the options of this very command: one of the program isn't valid here
  const longNames = [
    ...command.options.flatMap(({ long }) => (long ? [long] : [])),
    helpLong,
  ];
  const typed = withoutDashes(word);
  // The name of a long option in any of its spellings: in full or cut short
  // (`-out`), with something added (`-sorted`), or only its last part (`-key`)
  const meant = longNames.filter((long) => {
    const name = withoutDashes(long);

    return (
      name.startsWith(typed) ||
      typed.startsWith(name) ||
      (typed.length >= 3 && name.endsWith(typed))
    );
  });
  const hint =
    typed.length >= 2 && meant.length
      ? `did you mean ${meant.map((long) => `'${long}'`).join(' or ')}?`
      : undefined;

  const letters = [...word].map((letter) =>
    command.options.find(({ short }) => short === `-${letter}`),
  );
  const withValue = letters.find((option) => option && takesValue(option));
  const [placeholder = '<value>'] =
    /<[^>]+>|\[[^\]]+\]/.exec(withValue?.flags ?? '') ?? [];
  const combined =
    withValue &&
    `option '${withValue.flags}' takes a value, so it can't share a dash with anything else ('${token}'): write '${withValue.short} ${placeholder}' or '${withValue.long}=${placeholder}'`;

  // Letters that are all options of the command are short options before
  // they are the start of a name (`-so out` is `-s -o out`, not `--sort`)
  if (combined && letters.every(Boolean)) {
    return hint ? `${combined} (or ${hint})` : combined;
  }

  if (hint) {
    return `unknown option '${token}' (${hint})`;
  }

  if (combined) {
    return combined;
  }

  const unknown = [...word].find(
    (letter, index) => !letters[index] && `-${letter}` !== helpShort,
  );

  if (unknown) {
    return `unknown option '${token}' ('${unknown}' is not an option of ${command.name()})`;
  }

  // Only flags, which leaves the "=" for what is wrong
  return word
    ? `unknown option '${token}' ('-${word}' takes no value)`
    : `unknown option '${token}'`;
}

/**
 * The inline config of the keys manager: the given options as they are, with
 * the comma separated `input` split into its paths.
 */
function toKeysManagerConfig<T extends { input?: string }>(
  command: Config['command'],
  { input, ...options }: T,
) {
  return {
    ...options,
    ...(input !== undefined ? { input: input.split(',') } : {}),
    command,
  };
}

function isDirectory(path: string) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}
