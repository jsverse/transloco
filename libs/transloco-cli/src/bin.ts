#!/usr/bin/env node
import { describeError } from './errors';
import { createProgram } from './program';

createProgram()
  .parseAsync(process.argv)
  .catch((error: unknown) => {
    const { message, exitCode } = describeError(error);

    // A failing command may leave a spinner or a file watcher behind, either of
    // which keeps the process alive, so it has to be ended explicitly. That
    // waits for the message to be written, as stderr isn't always synchronous.
    process.exitCode = exitCode;
    process.stderr.write(`${message}\n`, () => process.exit(exitCode));
  });
