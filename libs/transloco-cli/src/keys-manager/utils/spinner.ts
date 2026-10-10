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

// The braille frames of the default spinner need Unicode, so the plain line spinner stands in
const spinnerStyle = isUnicodeSupported()
  ? undefined
  : { frames: ['-', '\\', '|', '/'], interval: 130 };

function isInteractive() {
  return Boolean(
    stream.isTTY && process.env['TERM'] !== 'dumb' && !('CI' in process.env),
  );
}

// The signals that end a process, the ones `signal-exit` handles. A platform
// that doesn't know one of them has no signal of that name to send.
const signals = ['SIGHUP', 'SIGINT', 'SIGTERM'];

if (process.platform !== 'win32') {
  signals.push(
    'SIGALRM',
    'SIGABRT',
    'SIGVTALRM',
    'SIGXCPU',
    'SIGXFSZ',
    'SIGUSR2',
    'SIGTRAP',
    'SIGSYS',
    'SIGQUIT',
    'SIGIOT',
  );
}

if (process.platform === 'linux') {
  signals.push('SIGIO', 'SIGPOLL', 'SIGPWR', 'SIGSTKFLT');
}

const showCursor = '\u001B[?25h';
/** The spinners that hid the cursor and haven't stopped, so haven't shown it again. */
const hidingCursor = new Set<object>();
let showsCursorWhenAborted = false;

/**
 * A spinner hides the cursor and shows it when it stops. A process that ends
 * before that, by an error, `process.exit` or a signal, would leave the
 * terminal without a cursor. The steps a spinner is shown for keep the process
 * busy without a pause, so a signal is only seen once the step is over: the
 * cursor is shown again and the signal takes its course, so the process ends
 * the way it would have without anyone listening.
 */
function showCursorWhenAborted() {
  if (showsCursorWhenAborted) return;

  showsCursorWhenAborted = true;

  process.on('exit', () => {
    if (hidingCursor.size) {
      stream.write(showCursor);
    }
  });

  for (const signal of signals) {
    try {
      process.once(signal, () => {
        if (hidingCursor.size) {
          stream.write(showCursor);
        }
        process.kill(process.pid, signal);
      });
    } catch {
      // A signal this platform can't listen for
    }
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
    showCursorWhenAborted();
    // Its own handling of signals ends with the step, and a signal sent during
    // the step would be lost with it.
    spinner = yoctoSpinner({
      text,
      stream,
      handleSignals: false,
      ...(spinnerStyle && { spinner: spinnerStyle }),
    }).start();
    hidingCursor.add(spinner);
  } else if (text) {
    stream.write(`- ${text}\n`);
  }

  return {
    succeed(text) {
      const line = `${successSymbol} ${text}`;

      if (spinner?.isSpinning) {
        spinner.stop(line);
        hidingCursor.delete(spinner);
      } else {
        stream.write(`${line}\n`);
      }
    },
  };
}
