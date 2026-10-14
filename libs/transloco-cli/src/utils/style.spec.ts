import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { style } from './style.js';

const red = (text: string) => `\u001B[31m${text}\u001B[39m`;

describe('style', () => {
  const stdoutIsTTY = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
  const stderrIsTTY = Object.getOwnPropertyDescriptor(process.stderr, 'isTTY');

  function setIsTTY(stream: NodeJS.WriteStream, value: boolean) {
    Object.defineProperty(stream, 'isTTY', { value, configurable: true });
  }

  function restoreIsTTY(
    stream: NodeJS.WriteStream,
    descriptor: PropertyDescriptor | undefined,
  ) {
    if (descriptor) {
      Object.defineProperty(stream, 'isTTY', descriptor);
    } else {
      delete (stream as { isTTY?: boolean }).isTTY;
    }
  }

  beforeEach(() => {
    // Both variables set at once make Node warn about the contradiction
    vi.stubEnv('NO_COLOR', undefined);
    vi.stubEnv('NODE_DISABLE_COLORS', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    restoreIsTTY(process.stdout, stdoutIsTTY);
    restoreIsTTY(process.stderr, stderrIsTTY);
  });

  describe('with colours forced', () => {
    beforeEach(() => {
      vi.stubEnv('FORCE_COLOR', '1');
    });

    it(`GIVEN a single line
        WHEN it is styled
        THEN it is wrapped in the codes of the style`, () => {
      expect(style('red', 'Something went wrong')).toBe(
        red('Something went wrong'),
      );
    });

    it(`GIVEN several styles
        WHEN a text is styled
        THEN they open in the given order and close in reverse`, () => {
      expect(style(['bgRed', 'black'], 'Input requires a directory.')).toBe(
        '\u001B[41m\u001B[30mInput requires a directory.\u001B[39m\u001B[49m',
      );
      expect(style(['black', 'bgRed'], 'Unable to load')).toBe(
        '\u001B[30m\u001B[41mUnable to load\u001B[49m\u001B[39m',
      );
    });

    it(`GIVEN several values
        WHEN they are styled
        THEN they are joined with a space`, () => {
      expect(style('red', 'Please specify', 'the src.', 3)).toBe(
        red('Please specify the src. 3'),
      );
    });

    it(`GIVEN a single value that isn't a string
        WHEN it is styled
        THEN it is turned into one`, () => {
      expect(style('red', new SyntaxError('en.json: Unexpected token'))).toBe(
        red('SyntaxError: en.json: Unexpected token'),
      );
      expect(style('blue', undefined)).toBe('\u001B[34mundefined\u001B[39m');
    });

    it(`GIVEN a text of several lines
        WHEN it is styled
        THEN every line is styled on its own and the line breaks stay outside of the codes`, () => {
      expect(style('red', 'first', '\n  second\nthird')).toBe(
        `${red('first ')}\n${red('  second')}\n${red('third')}`,
      );
    });

    it(`GIVEN a text with Windows line breaks, an empty line and a trailing line break
        WHEN it is styled
        THEN the line breaks are kept as they are and an empty line holds the codes alone`, () => {
      expect(style('red', 'one\r\ntwo\n\nthree\n')).toBe(
        `${red('one')}\r\n${red('two')}\n${red('')}\n${red('three')}\n${red('')}`,
      );
    });

    it(`GIVEN nothing to style
        WHEN it is styled
        THEN the result is empty, without any codes`, () => {
      expect(style('red', '')).toBe('');
      expect(style('red')).toBe('');
    });
  });

  describe('with colours turned off', () => {
    beforeEach(() => {
      vi.stubEnv('FORCE_COLOR', '0');
      setIsTTY(process.stdout, true);
    });

    it(`GIVEN a text of several values and lines
        WHEN it is styled
        THEN it is the joined text, untouched`, () => {
      expect(style(['bgRed', 'black'], 'first', '\n  second\r\nthird\n')).toBe(
        'first \n  second\r\nthird\n',
      );
    });
  });

  describe('with nothing forcing colours either way', () => {
    beforeEach(() => {
      vi.stubEnv('FORCE_COLOR', undefined);
    });

    it(`GIVEN stdout is not a terminal, while stderr is
        WHEN a text is styled
        THEN it is left plain, as stdout is where it gets printed`, () => {
      setIsTTY(process.stdout, false);
      setIsTTY(process.stderr, true);

      expect(style('magenta', 'Starting Transloco Scoped Libs...')).toBe(
        'Starting Transloco Scoped Libs...',
      );
    });

    it(`GIVEN stdout is a terminal, while stderr is not
        WHEN a text is styled
        THEN it gets the codes of the style`, () => {
      setIsTTY(process.stdout, true);
      setIsTTY(process.stderr, false);

      expect(style('magenta', 'Starting Transloco Scoped Libs...')).toBe(
        '\u001B[35mStarting Transloco Scoped Libs...\u001B[39m',
      );
    });
  });
});
