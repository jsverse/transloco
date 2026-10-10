import {
  CLI_SCRIPTS_TABLE,
  CliInvocation,
  CliOptionEntry,
  LegacyBin,
} from './cli-scripts-table';
import {
  parseScript,
  Redirect,
  SimpleCommand,
  Word,
} from './cli-scripts-shell';

export type ScriptTranslation =
  /** The script runs none of the deprecated bins. */
  | { kind: 'none' }
  | { kind: 'rewritten'; script: string; bins: LegacyBin[] }
  /** It runs one, in a way that can't be moved to the new bin without changing what it does. */
  | { kind: 'left'; reason: string };

export interface TranslateOptions {
  /**
   * Whether a path, written the way the script writes it, exists: `undefined`
   * when it can't be told from here. The options whose path the new bin
   * insists on are only checked when this is given.
   */
  pathExists?: (path: string) => boolean | undefined;
}

export const LEGACY_BINS: readonly LegacyBin[] = [
  'transloco-keys-manager',
  'transloco-validator',
  'transloco-optimize',
  'transloco-scoped-libs',
];

const BIN_ALTERNATIVES = LEGACY_BINS.join('|');
/** The suffixes Windows gives to the launcher of a bin. */
const LAUNCHER_SUFFIX = '\\.(?:[Cc][Mm][Dd]|[Pp][Ss]1|[Ee][Xx][Ee])';
/** Whether a text so much as names one of the bins. */
const NAMES_A_BIN = new RegExp(BIN_ALTERNATIVES);
/**
 * A bin standing on its own in a text, and not as a part of a path, a package or another name:
 * not behind a word character, `@`, `/`, `.` or `-` (but behind `.bin/`), and not in front of
 * a word character, `-`, `/` or a dot and a word character (`transloco-validator.log`). The
 * `.cmd`, `.ps1` and `.exe` launchers of Windows count as the bin.
 */
const BIN_AS_A_WORD = new RegExp(
  `(?:(?<![\\w@/.-])|(?<=\\.bin/))(?:${BIN_ALTERNATIVES})(?:${LAUNCHER_SUFFIX})?(?![\\w/-]|\\.\\w)`,
);
/**
 * `npx @jsverse/transloco-validator a.json`, `node node_modules/@jsverse/transloco-validator/src/index.js`:
 * the package is fetched or its file is run.
 */
const RUNS_A_PACKAGE = new RegExp(
  `(?:(?:npx|bunx|pnpm (?:exec|dlx)|yarn(?: dlx| run)?|npm exec)\\s+(?:-\\S+\\s+)*@jsverse/(?:${BIN_ALTERNATIVES})(?![\\w-])|node\\s+(?:-\\S+\\s+)*\\S*node_modules/@jsverse/(?:${BIN_ALTERNATIVES})/)`,
);
/**
 * A text that runs a bin, as the quoted argument of `concurrently "transloco-optimize dist"`
 * or of `sh -c "cd app && npx transloco-validator a.json"` does.
 */
const RUNS_A_BIN = new RegExp(
  `(?:^|[;&|(])\\s*(?:(?:npx|bunx|pnpm exec|yarn(?: run)?|npm exec)\\s+(?:-\\S+\\s+)*)?(?:\\S*/)?(?:${BIN_ALTERNATIVES})(?:${LAUNCHER_SUFFIX})?(?:\\s|$)`,
);
/** `@jsverse/transloco-validator@9`, `transloco-optimize@latest`: a package to fetch, not a bin to run. */
const PACKAGE_SPEC = new RegExp(
  `^(?:@jsverse/(?:${BIN_ALTERNATIVES})(?:@.*)?|(?:${BIN_ALTERNATIVES})@.*)$`,
);
/** Whether a text, a CI file, a Makefile, runs or names one of the bins on its own. */
export const mentionsBin = (text: string) => BIN_AS_A_WORD.test(text);
/**
 * Whether a script still holds a bin, as a whole word anywhere in it or as the
 * package that is fetched to run it, whatever the way it is run in.
 */
export const stillRunsBin = (script: string) =>
  BIN_AS_A_WORD.test(script) || RUNS_A_PACKAGE.test(script);

const BIN_PATH = new RegExp(
  `^(?:.*/)?node_modules/\\.bin/(${BIN_ALTERNATIVES})$`,
);
/** `transloco-optimize.cmd`, `node_modules/.bin/transloco-optimize.ps1`: the launcher Windows runs for a bin. */
const LAUNCHER = new RegExp(
  `^(?:.*[\\\\/])?(${BIN_ALTERNATIVES})(${LAUNCHER_SUFFIX})$`,
);
/** `-s`: a flag that can share its dash with others. */
const SHORT_FLAG = /^-[^-]$/;
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;

/** Words that can stand in front of a command: `if transloco-validator a.json; then ...`. */
const KEYWORDS = new Set([
  'if',
  'then',
  'else',
  'elif',
  'do',
  'while',
  'until',
  '!',
  '{',
  'time',
]);
/** The options of the wrappers that take no value, which sit between the wrapper and the bin. */
const NPX_FLAGS = new Set([
  '--',
  '--no-install',
  '--no',
  '--yes',
  '-y',
  '--quiet',
  '-q',
  '--silent',
  '--prefer-offline',
  '--offline',
]);
const NPM_EXEC_FLAGS = new Set([
  '--',
  '--no',
  '--yes',
  '-y',
  '--silent',
  '-s',
  '--prefer-offline',
]);
const PNPM_FLAGS = new Set(['--']);
const YARN_FLAGS = new Set(['--silent', '-s', '--']);

interface Edit {
  start: number;
  end: number;
  text: string;
  /** Takes the span out of the script, together with a space next to it. */
  drop?: boolean;
}

interface Candidate {
  /** How the bin is invoked: once, or per command for `transloco-keys-manager`. */
  invocations: CliInvocation[];
  bin: LegacyBin;
  /** The part of the bin word that names the bin. */
  nameStart: number;
  nameEnd: number;
  /** What follows the bin in its command. */
  args: SimpleCommand;
}

type Lookup =
  | { kind: 'candidate'; candidate: Candidate }
  | { kind: 'unsupported'; reason: string }
  | { kind: 'none' };

const isWord = (token: Word | Redirect): token is Word => token.kind === 'word';

/** Runs the check on the word, unless it is not a plain word. */
const plainValue = (token: Word | Redirect | undefined) =>
  token && isWord(token) && !token.expands ? token.value : undefined;

function binOfPath(word: Word) {
  const match = BIN_PATH.exec(word.value);

  return match && word.raw.endsWith(match[1])
    ? { bin: match[1] as LegacyBin, nameStart: word.end - match[1].length }
    : undefined;
}

/**
 * Looks for a bin at the start of a command, behind the assignments and the
 * wrappers that only pass the command on: `FOO=1 npx -y transloco-optimize dist`.
 */
function findCandidate(command: SimpleCommand): Lookup {
  let index = 0;
  /** Whether a wrapper that runs a bin by name stands in front. */
  let runner = false;
  let installs = false;

  const skipAssignments = () => {
    while (true) {
      const token = command[index];

      if (token && (!isWord(token) || ASSIGNMENT.test(token.raw))) {
        index++;
      } else {
        return;
      }
    }
  };
  const skipFlags = (flags: Set<string>) => {
    while (true) {
      const value = plainValue(command[index]);

      if (value !== undefined && flags.has(value)) {
        index++;
      } else {
        return;
      }
    }
  };

  while (true) {
    skipAssignments();

    const head = plainValue(command[index]);
    const next = plainValue(command[index + 1]);

    if (head === undefined) return { kind: 'none' };

    if (KEYWORDS.has(head)) {
      index++;
    } else if (head === 'cross-env' || head === 'sudo' || head === 'env') {
      // `env` is followed by its assignments, which the loop skips
      index++;
    } else if (head === 'node') {
      // Only a bin of node_modules is a script of the package to run through node
      if (!next || !BIN_PATH.test(next)) return { kind: 'none' };

      index++;
    } else if (head === 'npx' || head === 'bunx') {
      runner = true;
      index++;
      skipFlags(NPX_FLAGS);
    } else if (head === 'npm' && next === 'exec') {
      runner = true;
      index += 2;
      skipFlags(NPM_EXEC_FLAGS);
    } else if (head === 'pnpm' && (next === 'exec' || next === 'dlx')) {
      runner = true;
      installs ||= next === 'dlx';
      index += 2;
      skipFlags(PNPM_FLAGS);
    } else if (head === 'yarn') {
      runner = true;
      index += next === 'run' ? 2 : 1;
      skipFlags(YARN_FLAGS);
    } else {
      break;
    }
  }

  const word = command[index];

  if (!word || !isWord(word) || word.expands) return { kind: 'none' };

  const named = BIN_PATH.test(word.value)
    ? binOfPath(word)
    : LEGACY_BINS.includes(word.value as LegacyBin)
      ? { bin: word.value as LegacyBin, nameStart: word.start }
      : undefined;

  const launcher = LAUNCHER.exec(word.value);

  if (!named && launcher) {
    return {
      kind: 'unsupported',
      reason: `${launcher[1]} is run through its ${launcher[2]} launcher, which this migration does not rewrite`,
    };
  }

  if (!named) {
    if (!runner) return { kind: 'none' };

    if (PACKAGE_SPEC.test(word.value)) {
      return {
        kind: 'unsupported',
        reason: `${word.value} is a package that is fetched by name, the transloco bin is in @jsverse/transloco-cli`,
      };
    }

    // An option of the wrapper that isn't read: the bin could be anywhere behind it
    const later = word.value.startsWith('-')
      ? command
          .slice(index)
          .filter(isWord)
          .find(
            (candidate) =>
              !candidate.expands &&
              LEGACY_BINS.includes(candidate.value as LegacyBin),
          )
      : undefined;

    return later
      ? {
          kind: 'unsupported',
          reason: `${later.value} is run through a wrapper whose options this migration does not read (${word.value})`,
        }
      : { kind: 'none' };
  }

  if (installs) {
    return {
      kind: 'unsupported',
      reason: `${named.bin} is run through pnpm dlx, which fetches the package it is given by name`,
    };
  }

  if (command.slice(0, index).some((token) => token.kind === 'redirect')) {
    return {
      kind: 'unsupported',
      reason: `a redirection stands in front of ${named.bin}`,
    };
  }

  return {
    kind: 'candidate',
    candidate: {
      invocations: CLI_SCRIPTS_TABLE.invocations.filter(
        ({ bin }) => bin === named.bin,
      ),
      bin: named.bin,
      nameStart: named.nameStart,
      nameEnd: word.end,
      args: command.slice(index + 1),
    },
  };
}

/** Whether the command is a `cd` or a `pushd`. */
function changesFolder(command: SimpleCommand) {
  const head = command.find(
    (token): token is Word =>
      isWord(token) && !ASSIGNMENT.test(token.raw) && !KEYWORDS.has(token.raw),
  );

  return head?.value === 'cd' || head?.value === 'pushd';
}

/** The first word that runs a bin from inside something this migration doesn't parse: a quoted argument, a substitution. */
function findHiddenBin(command: SimpleCommand): string | undefined {
  for (const token of command) {
    if (!isWord(token)) continue;

    const hidden = token.expands
      ? BIN_AS_A_WORD.exec(token.raw)
      : token.quoted
        ? RUNS_A_BIN.exec(token.value)
        : null;

    if (hidden) {
      const [bin] = LEGACY_BINS.filter((name) => hidden[0].includes(name));

      return `${bin} is run from inside a quoted argument or a substitution`;
    }
  }

  return undefined;
}

type Outcome = { edits: Edit[] } | { reason: string };

const stopAt = (reason: string): { reason: string } => ({ reason });

/** The edit that removes `start`-`end` and a space next to it, so that no double space is left behind. */
function removal(script: string, start: number, end: number): Edit {
  let after = end;

  while (script[after] === ' ' || script[after] === '\t') after++;

  if (after > end && after < script.length)
    return { start, end: after, text: '' };

  let before = start;

  while (
    before > 0 &&
    (script[before - 1] === ' ' || script[before - 1] === '\t')
  )
    before--;

  return { start: before, end, text: '' };
}

/**
 * Applies the edits. The spans to drop that have nothing but blanks between
 * them go as one, so that no blank is left over where the last of them was.
 */
function applyEdits(script: string, edits: Edit[]): string {
  const dropped: Edit[] = [];

  for (const edit of edits
    .filter(({ drop }) => drop)
    .sort((a, b) => a.start - b.start)) {
    const previous = dropped[dropped.length - 1];

    if (previous && /^[ \t]*$/.test(script.slice(previous.end, edit.start))) {
      previous.end = edit.end;
    } else {
      dropped.push({ ...edit });
    }
  }

  const sorted = [
    ...edits.filter(({ drop }) => !drop),
    ...dropped.map(({ start, end }) => removal(script, start, end)),
  ].sort((a, b) => a.start - b.start || a.end - b.end);
  let result = '';
  let position = 0;

  for (const edit of sorted) {
    result += script.slice(position, edit.start) + edit.text;
    position = edit.end;
  }

  return result + script.slice(position);
}

function checkValue(entry: CliOptionEntry, spelling: string, value: string) {
  if (value.trim() === '' && !entry.allowEmpty) {
    return `${spelling} is given an empty value, which the transloco bin rejects`;
  }

  if (entry.choices && !entry.choices.includes(value)) {
    return `${spelling} is given '${value}', the transloco bin takes ${entry.choices.join(' or ')}`;
  }

  if (entry.list && value.split(',').some((part) => part.trim() === '')) {
    return `${spelling} holds an empty path, which the transloco bin rejects`;
  }

  if (entry.noComma && value.includes(',')) {
    return `${spelling} is given '${value}', a comma would make it one language, the transloco bin takes the languages as separate arguments`;
  }

  return undefined;
}

/** Why a path can't be looked up in the workspace from the way it is written, or `undefined` when it can. */
function whyNotChecked(value: string): string | undefined {
  if (/[$`]/.test(value)) return 'it holds a $ or a backtick';
  if (/[*?[\]{}]/.test(value)) return 'it holds a glob character';
  if (value.startsWith('~')) return 'the shell expands the ~';
  if (value.includes('\\')) return 'it holds a backslash';
  if (/^(?:\/|[A-Za-z]:)/.test(value)) {
    return 'it is an absolute path, and only the workspace is visible here';
  }

  return undefined;
}

/** The reason to leave a script whose path option may not exist for the new bin, or `undefined` when it does. */
function checkPathExists(
  candidate: Candidate,
  invocation: CliInvocation,
  name: string,
  value: string,
  pathExists: NonNullable<TranslateOptions['pathExists']>,
  folderChanged: boolean,
) {
  const stops = `'transloco ${invocation.command}' stops when the --config path does not exist, where ${candidate.bin} ignores a missing path and uses the configuration it finds`;
  const unchecked = folderChanged
    ? 'the script changes folder before this command'
    : whyNotChecked(value);

  if (unchecked) {
    return `${name} points at '${value}', which can't be checked here (${unchecked}). ${stops}`;
  }

  const exists = pathExists(value);

  if (exists === undefined) {
    return `${name} points at '${value}', which is outside the workspace and can't be checked here. ${stops}`;
  }

  return exists
    ? undefined
    : `${name} points at '${value}', which was not found. ${stops}`;
}

function lookupOption(invocation: CliInvocation, spelling: string) {
  return invocation.options.find((entry) =>
    Object.prototype.hasOwnProperty.call(entry.spellings, spelling),
  );
}

/** Works out the edits that move one bin invocation to the transloco bin, or why it can't. */
function translateCandidate(
  candidate: Candidate,
  { pathExists }: TranslateOptions,
  folderChanged: boolean,
): Outcome {
  const { args } = candidate;
  const firstRedirect = args.findIndex((token) => token.kind === 'redirect');

  if (firstRedirect !== -1 && args.slice(firstRedirect).some(isWord)) {
    return stopAt('a redirection stands in the middle of the arguments');
  }

  const words = args.filter(isWord);
  const expanding = words.find((word) => word.expands);

  if (expanding) {
    return stopAt(
      `${expanding.raw} is worked out by the shell ($VAR, $(...), backticks or {a,b}), which this migration does not read`,
    );
  }

  let [invocation] = candidate.invocations;
  let index = 0;

  if (invocation.command) {
    const command = words[0]?.value;
    const found = candidate.invocations.find(
      (option) => option.command === command,
    );

    if (!found) {
      return stopAt(
        `${candidate.bin} is not given extract or find${command ? `, but ${command}` : ''}`,
      );
    }

    invocation = found;
    index = 1;
  }

  const edits: Edit[] = [
    {
      start: candidate.nameStart,
      end: candidate.nameEnd,
      text: invocation.to,
    },
  ];
  const seen = new Set<string>();
  let positionals = 0;

  for (; index < words.length; index++) {
    const word = words[index];
    const text = word.value;

    if (!text.startsWith('-')) {
      if (invocation.positionals === 'none') {
        return stopAt(
          `${candidate.bin} is given '${text}', which it does not take`,
        );
      }

      if (invocation.positionals === 'dist' && text.trim() === '') {
        return stopAt('the dist folder is empty');
      }

      if (++positionals > 1 && invocation.positionals === 'dist') {
        return stopAt('the dist folder is given twice');
      }

      continue;
    }

    if (text === '--')
      return stopAt("'--' ends the options, the legacy bin takes it as a file");

    const long = text.startsWith('--');
    const equals = long ? text.indexOf('=') : -1;
    const name = equals > 0 ? text.slice(0, equals) : text;
    const attached = equals > 0 ? text.slice(equals + 1) : undefined;

    if (!long && text.includes('=')) {
      return stopAt(`${text} attaches a value to a short option`);
    }

    if (!word.raw.startsWith(name) || (attached === undefined && word.quoted)) {
      return stopAt(`${word.raw} is an option written with quotes or escapes`);
    }

    if (invocation.positionals === 'files') {
      return stopAt(
        `${text} is taken as a file by ${candidate.bin}, and as an option by the transloco bin`,
      );
    }

    // `-su`: several flags behind one dash
    if (!long && name.length > 2) {
      const pieces: string[] = [];
      /** The flags that stay short, which go back behind one dash. */
      let cluster = '';
      const flush = () => {
        if (cluster) pieces.push(`-${cluster}`);
        cluster = '';
      };

      for (const letter of name.slice(1)) {
        const spelling = `-${letter}`;
        const entry = lookupOption(invocation, spelling);

        if (!entry)
          return stopAt(
            `${spelling} in ${text} is not an option of ${candidate.bin}`,
          );
        if (entry.takesValue) {
          return stopAt(
            `${spelling} takes a value, which can't share its dash in ${text}`,
          );
        }
        if (entry.outcome === 'leave')
          return stopAt(`${spelling}: ${entry.reason}`);
        if (seen.has(entry.name))
          return stopAt(`${spelling} is given more than once`);

        seen.add(entry.name);

        const target = entry.spellings[spelling];

        if (target && SHORT_FLAG.test(target)) {
          cluster += target[1];
        } else if (target) {
          flush();
          pieces.push(target);
        }
      }

      flush();

      const rewritten = pieces.join(' ');

      if (rewritten !== text) {
        edits.push(
          pieces.length
            ? { start: word.start, end: word.end, text: rewritten }
            : { start: word.start, end: word.end, text: '', drop: true },
        );
      }

      continue;
    }

    const entry = lookupOption(invocation, name);

    if (!entry)
      return stopAt(
        `${name} is not an option of ${candidate.bin}${invocation.command ? ` ${invocation.command}` : ''}`,
      );
    if (entry.outcome === 'leave') return stopAt(`${name}: ${entry.reason}`);

    if (seen.has(entry.name) && !entry.variadic) {
      return stopAt(`${name} is given more than once`);
    }

    seen.add(entry.name);

    const target = entry.spellings[name];
    let end = word.end;

    if (!entry.takesValue) {
      if (attached !== undefined)
        return stopAt(`${name} takes no value, but is given '${attached}'`);
    } else {
      const values: string[] = [];

      if (attached !== undefined) {
        values.push(attached);

        const following = words[index + 1];

        if (entry.variadic && following && !following.value.startsWith('-')) {
          return stopAt(`${name}= is followed by more values`);
        }
      } else {
        const next = words[index + 1];

        if (!next) return stopAt(`${name} is given no value`);
        if (next.value.startsWith('-')) {
          return stopAt(
            `${name} is given '${next.value}', which starts with a dash`,
          );
        }

        values.push(next.value);
        end = next.end;
        index++;

        while (entry.variadic) {
          const more = words[index + 1];

          if (!more || more.value.startsWith('-')) break;

          values.push(more.value);
          end = more.end;
          index++;
        }
      }

      for (const value of values) {
        const problem = checkValue(entry, name, value);

        if (problem) return stopAt(problem);

        if (entry.mustExist && pathExists) {
          const missing = checkPathExists(
            candidate,
            invocation,
            name,
            value,
            pathExists,
            folderChanged,
          );

          if (missing) return stopAt(missing);
        }
      }

      if (entry.name === 'dist' && ++positionals > 1) {
        return stopAt('the dist folder is given twice');
      }
    }

    if (target === null) {
      edits.push({ start: word.start, end, text: '', drop: true });
    } else if (target !== name) {
      edits.push({
        start: word.start,
        end: word.start + name.length,
        text: target,
      });
    }
  }

  if (invocation.positionals === 'files' && positionals === 0) {
    return stopAt(
      `${candidate.bin} is given no file, the transloco bin requires one`,
    );
  }

  if (invocation.positionals === 'dist' && positionals === 0) {
    return stopAt('no dist folder is given, the transloco bin requires one');
  }

  return { edits };
}

/**
 * Moves the deprecated bins a shell script runs to the `transloco` bin.
 *
 * Only the bin and the options of a command change, the rest of the script is
 * returned byte for byte. A script that runs a bin in any way that isn't read
 * to the last token is left whole, with the reason why.
 */
export function translateScript(
  script: string,
  options: TranslateOptions = {},
): ScriptTranslation {
  if (!NAMES_A_BIN.test(script)) return { kind: 'none' };

  const commands = parseScript(script);

  if (!commands) {
    return {
      kind: 'left',
      reason: 'the script has a quote or a substitution that is never closed',
    };
  }

  const edits: Edit[] = [];
  const bins: LegacyBin[] = [];
  /** Whether a command in front of the one at hand moved to another folder, where a relative path is no longer the one of the `package.json`. */
  let folderChanged = false;

  for (const command of commands) {
    const lookup = findCandidate(command);

    if (lookup.kind === 'unsupported')
      return { kind: 'left', reason: lookup.reason };

    if (lookup.kind === 'none') {
      const hidden = findHiddenBin(command);

      if (hidden) return { kind: 'left', reason: hidden };

      folderChanged ||= changesFolder(command);

      continue;
    }

    const outcome = translateCandidate(
      lookup.candidate,
      options,
      folderChanged,
    );

    if ('reason' in outcome) return { kind: 'left', reason: outcome.reason };

    edits.push(...outcome.edits);
    bins.push(lookup.candidate.bin);
  }

  return bins.length
    ? { kind: 'rewritten', script: applyEdits(script, edits), bins }
    : { kind: 'none' };
}
