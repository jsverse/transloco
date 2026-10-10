import tty from 'node:tty';

import yoctoSpinner from 'yocto-spinner';

export interface Spinner {
  /** Ends the step with a check mark and the text. Works after the spinner stopped as well. */
  succeed(text: string): void;
}

const stream = process.stderr;

/** Whether the terminal can show the check mark, or only its plain stand-in. */
function isUnicodeSupported() {
  const { env } = process;
  const { TERM, TERM_PROGRAM } = env;

  if (process.platform !== 'win32') {
    // The Linux console
    return TERM !== 'linux';
  }

  return (
    Boolean(env['WT_SESSION']) ||
    Boolean(env['TERMINUS_SUBLIME']) ||
    env['ConEmuTask'] === '{cmd::Cmder}' ||
    TERM_PROGRAM === 'Terminus-Sublime' ||
    TERM_PROGRAM === 'vscode' ||
    TERM === 'xterm-256color' ||
    TERM === 'alacritty' ||
    TERM === 'rxvt-unicode' ||
    TERM === 'rxvt-unicode-256color' ||
    env['TERMINAL_EMULATOR'] === 'JetBrains-JediTerm'
  );
}

// The colour follows the environment and not the stream: a log gets the green
// a terminal of that environment would show, unless `NO_COLOR`, `FORCE_COLOR=0`
// or a CI say otherwise.
const mark = isUnicodeSupported() ? '✔' : '√';
const successSymbol = tty.WriteStream.prototype.hasColors()
  ? `\u001B[32m${mark}\u001B[39m`
  : mark;

function isInteractive() {
  return Boolean(
    stream.isTTY && process.env['TERM'] !== 'dumb' && !('CI' in process.env),
  );
}

let showsCursorWhenInterrupted = false;

/**
 * A spinner hides the cursor, and the steps it is shown for keep the process
 * busy without a pause. An interruption is therefore only seen once the step
 * is over: the cursor is shown again and the signal takes its course, so the
 * process ends the way it would have without anyone listening.
 */
function showCursorWhenInterrupted() {
  if (showsCursorWhenInterrupted) return;

  showsCursorWhenInterrupted = true;

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      stream.write('\u001B[?25h');
      process.kill(process.pid, signal);
    });
  }
}

/**
 * Shows a step in progress on stderr.
 *
 * A terminal gets an animated spinner. Anything else, a pipe or a CI log, gets
 * a line starting with `- ` when the step begins, and in both cases a line
 * starting with the check mark when it's done.
 */
export function startSpinner(text: string): Spinner {
  let spinner: ReturnType<typeof yoctoSpinner> | undefined;

  if (isInteractive()) {
    showCursorWhenInterrupted();
    // Its own handling of signals ends with the step, and a signal sent during
    // the step would be lost with it.
    spinner = yoctoSpinner({ text, stream, handleSignals: false }).start();
  } else if (text) {
    stream.write(`- ${text}\n`);
  }

  return {
    succeed(text) {
      const line = `${successSymbol} ${text}`;

      if (spinner?.isSpinning) {
        spinner.stop(line);
      } else {
        stream.write(`${line}\n`);
      }
    },
  };
}
