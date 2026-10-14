import type { CommandUnknownOpts } from '@commander-js/extra-typings';

export interface ProgramOutput {
  stdout: string;
  stderr: string;
}

/** The command and every command below it, however deep. */
export function everyCommand(
  command: CommandUnknownOpts,
): CommandUnknownOpts[] {
  return [command, ...command.commands.flatMap(everyCommand)];
}

/**
 * Makes the program safe to run inside a test: on every command of the tree,
 * commander throws instead of exiting the process and its output is collected
 * instead of being printed.
 */
export function collectOutput(program: CommandUnknownOpts): ProgramOutput {
  const output: ProgramOutput = { stdout: '', stderr: '' };

  for (const command of everyCommand(program)) {
    command.exitOverride().configureOutput({
      writeOut: (text) => (output.stdout += text),
      writeErr: (text) => (output.stderr += text),
    });
  }

  return output;
}
