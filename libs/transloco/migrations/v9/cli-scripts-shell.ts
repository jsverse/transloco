/**
 * A word of a shell command line, with where it stands in the script so that a
 * rewrite can touch it and nothing around it.
 */
export interface Word {
  kind: 'word';
  start: number;
  end: number;
  /** The word as it is written, quotes included. */
  raw: string;
  /** What the shell hands over, quotes removed. Meaningless when `expands`. */
  value: string;
  /** Whether the word holds a quote or an escape. */
  quoted: boolean;
  /** Whether the shell works out part of it: a variable, a substitution, a brace list. */
  expands: boolean;
}

/** `&&`, `||`, `;`, `|`, `&`, a new line, and the parentheses of a subshell. */
export interface Operator {
  kind: 'operator';
  start: number;
  end: number;
  text: string;
}

/** A redirection and its target: `> out.log`, `2>&1`. */
export interface Redirect {
  kind: 'redirect';
  start: number;
  end: number;
  raw: string;
}

export type Token = Word | Operator | Redirect;

/** A command with its arguments, up to the next operator. */
export type SimpleCommand = Array<Word | Redirect>;

const WHITESPACE = /[ \t]/;
const OPERATOR_CHARS = new Set([';', '&', '|', '(', ')', '\n']);
/** Characters that end an unquoted word. */
const isWordBreak = (char: string) =>
  WHITESPACE.test(char) ||
  OPERATOR_CHARS.has(char) ||
  char === '<' ||
  char === '>';

class ScriptSyntaxError extends Error {}

/**
 * Where the `(` ... `)` of `$(` ... `)` ends, the index of the closing
 * parenthesis. Quotes and nested substitutions inside it are skipped.
 */
function endOfSubstitution(script: string, open: number): number {
  let depth = 0;

  for (let index = open; index < script.length; index++) {
    const char = script[index];

    if (char === '\\') {
      index++;
    } else if (char === "'") {
      index = script.indexOf("'", index + 1);
      if (index === -1) break;
    } else if (char === '"') {
      index = endOfDoubleQuote(script, index);
    } else if (char === '(') {
      depth++;
    } else if (char === ')' && --depth === 0) {
      return index;
    }
  }

  throw new ScriptSyntaxError('unterminated command substitution');
}

/** The index of the quote closing the double quote that opens at `open`. */
function endOfDoubleQuote(script: string, open: number): number {
  for (let index = open + 1; index < script.length; index++) {
    const char = script[index];

    if (char === '\\') {
      index++;
    } else if (char === '"') {
      return index;
    } else if (char === '$' && script[index + 1] === '(') {
      index = endOfSubstitution(script, index + 1);
    }
  }

  throw new ScriptSyntaxError('unterminated double quote');
}

function readWord(script: string, from: number): Word {
  let index = from;
  let value = '';
  let quoted = false;
  let expands = false;

  while (index < script.length && !isWordBreak(script[index])) {
    const char = script[index];

    if (char === '\\') {
      quoted = true;
      // A backslash before a new line joins the lines
      if (script[index + 1] !== '\n') value += script[index + 1] ?? '';
      index += 2;
    } else if (char === "'") {
      const close = script.indexOf("'", index + 1);
      if (close === -1)
        throw new ScriptSyntaxError('unterminated single quote');

      quoted = true;
      value += script.slice(index + 1, close);
      index = close + 1;
    } else if (char === '"') {
      const close = endOfDoubleQuote(script, index);
      const inner = script.slice(index + 1, close);

      quoted = true;
      expands ||= /\$|`/.test(inner);
      value += inner.replace(/\\([\\"$`])/g, '$1');
      index = close + 1;
    } else if (char === '`') {
      const close = script.indexOf('`', index + 1);
      if (close === -1) throw new ScriptSyntaxError('unterminated backtick');

      expands = true;
      index = close + 1;
    } else if (char === '$') {
      expands = true;

      if (script[index + 1] === '(') {
        index = endOfSubstitution(script, index + 1) + 1;
      } else if (script[index + 1] === '{') {
        const close = script.indexOf('}', index + 2);
        if (close === -1) throw new ScriptSyntaxError('unterminated expansion');

        index = close + 1;
      } else if (script[index + 1] === "'") {
        const close = script.indexOf("'", index + 2);
        if (close === -1) throw new ScriptSyntaxError('unterminated quote');

        index = close + 1;
      } else {
        index++;
      }
    } else {
      // A brace list is expanded by the shell: {en,es}, {1..3}
      if (
        char === '{' &&
        /^\{[^{}\s]*(,|\.\.)[^{}\s]*\}/.test(script.slice(index))
      ) {
        expands = true;
      }

      value += char;
      index++;
    }
  }

  return {
    kind: 'word',
    start: from,
    end: index,
    raw: script.slice(from, index),
    value,
    quoted,
    expands,
  };
}

/** The redirection that starts at `from`, which is a `<`, a `>`, or the digits of a file descriptor in front of one. */
function readRedirect(script: string, from: number): Redirect {
  let index = from;

  while (/[0-9]/.test(script[index] ?? '')) index++;
  while (/[<>&|]/.test(script[index] ?? '')) index++;
  while (WHITESPACE.test(script[index] ?? '')) index++;

  const target =
    index < script.length && !isWordBreak(script[index])
      ? readWord(script, index)
      : undefined;
  const end = target ? target.end : index;

  return {
    kind: 'redirect',
    start: from,
    end,
    raw: script.slice(from, end).trimEnd(),
  };
}

/**
 * Splits a script into its words, operators and redirections. Quotes, escapes
 * and `$(...)` are read the way a POSIX shell does, nothing is expanded.
 *
 * @throws when a quote or a substitution is left open
 */
export function tokenize(script: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < script.length) {
    const char = script[index];

    if (WHITESPACE.test(char)) {
      index++;
    } else if (char === '\\' && script[index + 1] === '\n') {
      index += 2;
    } else if (char === '#') {
      // A comment runs to the end of the line
      const lineEnd = script.indexOf('\n', index);
      index = lineEnd === -1 ? script.length : lineEnd;
    } else if (char === '&' && script[index + 1] === '>') {
      const redirect = readRedirect(script, index);
      tokens.push(redirect);
      index = redirect.end;
    } else if (OPERATOR_CHARS.has(char)) {
      const two = script.slice(index, index + 2);
      const text = ['&&', '||', '|&', ';;'].includes(two) ? two : char;

      tokens.push({
        kind: 'operator',
        start: index,
        end: index + text.length,
        text,
      });
      index += text.length;
    } else if (char === '<' || char === '>') {
      const redirect = readRedirect(script, index);
      tokens.push(redirect);
      index = redirect.end;
    } else if (/[0-9]/.test(char) && /^[0-9]+[<>]/.test(script.slice(index))) {
      const redirect = readRedirect(script, index);
      tokens.push(redirect);
      index = redirect.end;
    } else {
      const word = readWord(script, index);
      tokens.push(word);
      index = word.end;
    }
  }

  return tokens;
}

/** The commands of a script: its words and redirections, cut at every operator. */
export function splitCommands(tokens: Token[]): SimpleCommand[] {
  const commands: SimpleCommand[] = [];
  let current: SimpleCommand = [];

  for (const token of tokens) {
    if (token.kind === 'operator') {
      if (current.length) commands.push(current);
      current = [];
    } else {
      current.push(token);
    }
  }

  if (current.length) commands.push(current);

  return commands;
}

/**
 * The simple commands of a script, or `null` when it can't be read: a quote or
 * a substitution is left open.
 */
export function parseScript(script: string): SimpleCommand[] | null {
  try {
    return splitCommands(tokenize(script));
  } catch (error) {
    if (error instanceof ScriptSyntaxError) return null;

    throw error;
  }
}
