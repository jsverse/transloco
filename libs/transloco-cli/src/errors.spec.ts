import { afterEach, describe, expect, it, vi } from 'vitest';

import { CliError, describeError } from './errors.js';

describe('describeError', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it(`GIVEN a CliError
      WHEN it is described
      THEN it is its message alone and its exit code, even with DEBUG set`, () => {
    vi.stubEnv('DEBUG', 'tkm:*');

    expect(describeError(new CliError('Found duplicate keys: a', 3))).toEqual({
      message: 'Found duplicate keys: a',
      exitCode: 3,
    });
  });

  it(`GIVEN a CliError without an exit code
      WHEN it is described
      THEN the exit code is 1`, () => {
    expect(describeError(new CliError('nope')).exitCode).toBe(1);
  });

  it(`GIVEN an unexpected error and DEBUG is not set
      WHEN it is described
      THEN it is its message without the stack and the exit code is 1`, () => {
    vi.stubEnv('DEBUG', '');

    expect(describeError(new TypeError('boom'))).toEqual({
      message: 'boom',
      exitCode: 1,
    });
  });

  it(`GIVEN an unexpected error and DEBUG is set
      WHEN it is described
      THEN it is its stack and the exit code is 1`, () => {
    vi.stubEnv('DEBUG', 'tkm:*');
    const error = new TypeError('boom');

    const { message, exitCode } = describeError(error);

    expect(message).toBe(error.stack);
    expect(message).toContain('TypeError: boom\n    at ');
    expect(exitCode).toBe(1);
  });

  it(`GIVEN a rejection that is not an Error
      WHEN it is described
      THEN it is turned into a string and the exit code is 1`, () => {
    expect(describeError('Transloco Optimize: nothing to do')).toEqual({
      message: 'Transloco Optimize: nothing to do',
      exitCode: 1,
    });
  });
});
