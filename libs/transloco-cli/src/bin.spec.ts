import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const parseAsync = vi.hoisted(() => vi.fn());

vi.mock('./program.js', () => ({
  createProgram: () => ({ parseAsync }),
}));

describe('transloco bin', () => {
  const originalExitCode = process.exitCode;
  let exit: ReturnType<typeof vi.spyOn>;
  let written: string[];
  /** What happened, in order: each write to stderr and the exit. */
  let events: string[];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    written = [];
    events = [];
    exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      events.push('exit');
    }) as never);
    vi.spyOn(process.stderr, 'write').mockImplementation(((
      chunk: string,
      done?: () => void,
    ) => {
      written.push(chunk);
      events.push('write');
      // Flushed later, like a pipe would
      setImmediate(() => done?.());

      return true;
    }) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    process.exitCode = originalExitCode;
  });

  /**
   * The modules are reset for every run of the bin, so an error only counts as
   * a CliError when it comes from the same fresh copy of the module the bin loads.
   */
  async function cliError(message: string, exitCode?: number) {
    const { CliError } = await import('./errors.js');

    return new CliError(message, exitCode);
  }

  /** Runs the bin and lets its rejection handler and the stderr flush complete. */
  async function runBin() {
    await import('./bin.js');
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  }

  it(`GIVEN a command that completes
      WHEN the bin runs
      THEN it parses the process arguments and leaves the exit to node`, async () => {
    parseAsync.mockResolvedValueOnce(undefined);

    await runBin();

    expect(parseAsync).toHaveBeenCalledExactlyOnceWith(process.argv);
    expect(exit).not.toHaveBeenCalled();
    expect(written).toEqual([]);
  });

  it(`GIVEN a command that fails with a CliError
      WHEN the bin runs
      THEN it writes the message to stderr and only then exits with the error's code`, async () => {
    parseAsync.mockRejectedValueOnce(
      await cliError('Found duplicate keys: a (en.json)', 3),
    );

    await runBin();

    expect(written).toEqual(['Found duplicate keys: a (en.json)\n']);
    expect(exit).toHaveBeenCalledExactlyOnceWith(3);
    expect(events).toEqual(['write', 'exit']);
    expect(process.exitCode).toBe(3);
  });

  it(`GIVEN a command that throws unexpectedly
      WHEN the bin runs
      THEN it writes the message without the stack and exits with code 1`, async () => {
    vi.stubEnv('DEBUG', '');
    parseAsync.mockRejectedValueOnce(new TypeError('boom'));

    await runBin();

    expect(written).toEqual(['boom\n']);
    expect(exit).toHaveBeenCalledExactlyOnceWith(1);
  });

  it(`GIVEN a failing command whose message is still being flushed
      WHEN the bin handles the failure
      THEN the process is not ended before the flush completes`, async () => {
    parseAsync.mockRejectedValueOnce(await cliError('slow pipe'));

    await import('./bin.js');
    // The rejection handler has run, the write callback hasn't yet
    await Promise.resolve();
    await Promise.resolve();

    expect(written).toEqual(['slow pipe\n']);
    expect(exit).not.toHaveBeenCalled();

    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));

    expect(exit).toHaveBeenCalledExactlyOnceWith(1);
  });
});
