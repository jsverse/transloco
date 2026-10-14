/**
 * A failure the user can act on. It's reported as its message alone, while
 * anything else is unexpected and gets its stack printed when `DEBUG` is set.
 */
export class CliError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
  }
}

/** What to print to stderr for the error and the code the process should exit with. */
export function describeError(error: unknown): {
  message: string;
  exitCode: number;
} {
  if (error instanceof CliError) {
    return { message: error.message, exitCode: error.exitCode };
  }

  if (error instanceof Error) {
    return {
      message: (process.env['DEBUG'] && error.stack) || error.message,
      exitCode: 1,
    };
  }

  return { message: String(error), exitCode: 1 };
}
