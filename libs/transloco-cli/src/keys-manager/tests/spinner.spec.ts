import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const yocto = vi.hoisted(() => {
  const spinner = {
    isSpinning: false,
    start: vi.fn(() => {
      spinner.isSpinning = true;

      return spinner;
    }),
    stop: vi.fn(() => {
      spinner.isSpinning = false;

      return spinner;
    }),
  };

  return { spinner, create: vi.fn(() => spinner) };
});

vi.mock('yocto-spinner', () => ({ default: yocto.create }));

const green = (text: string) => `\u001B[32m${text}\u001B[39m`;

describe('startSpinner', () => {
  const platform = process.platform;
  const isTTY = Object.getOwnPropertyDescriptor(process.stderr, 'isTTY');
  let written: string[];

  function setIsTTY(value: boolean) {
    Object.defineProperty(process.stderr, 'isTTY', {
      value,
      configurable: true,
    });
  }

  function setPlatform(value: NodeJS.Platform) {
    Object.defineProperty(process, 'platform', { value, configurable: true });
  }

  /** The check mark is settled when the module loads, so every test loads it anew. */
  async function load() {
    vi.resetModules();

    return (await import('../utils/spinner.js')).startSpinner;
  }

  beforeEach(() => {
    written = [];
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      written.push(String(chunk));

      return true;
    });
    // A plain terminal environment: nothing forcing or forbidding colours
    for (const name of [
      'CI',
      'CI_NAME',
      'APPVEYOR',
      'BUILDKITE',
      'CIRCLECI',
      'DRONE',
      'GITHUB_ACTIONS',
      'GITLAB_CI',
      'TRAVIS',
      'FORCE_COLOR',
      'NO_COLOR',
      'NODE_DISABLE_COLORS',
      'TMUX',
      'TF_BUILD',
      'TEAMCITY_VERSION',
      'COLORTERM',
      'TERM_PROGRAM',
      'WT_SESSION',
      'TERMINUS_SUBLIME',
      'ConEmuTask',
      'TERMINAL_EMULATOR',
    ]) {
      vi.stubEnv(name, undefined);
    }
    vi.stubEnv('TERM', 'xterm-256color');
    setIsTTY(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    yocto.spinner.isSpinning = false;
    yocto.spinner.start.mockClear();
    yocto.spinner.stop.mockClear();
    yocto.create.mockClear();
    setPlatform(platform);
    if (isTTY) {
      Object.defineProperty(process.stderr, 'isTTY', isTTY);
    } else {
      delete (process.stderr as { isTTY?: boolean }).isTTY;
    }
  });

  describe('without a terminal', () => {
    it(`GIVEN stderr is piped
        WHEN a step starts and succeeds
        THEN a line starting with "- " and a line starting with the check mark are written, and nothing spins`, async () => {
      const startSpinner = await load();

      const spinner = startSpinner('Extracting Template and Component Keys 🗝');
      spinner.succeed('Extracting Template and Component Keys 🗝');

      expect(written).toEqual([
        '- Extracting Template and Component Keys 🗝\n',
        `${green('✔')} Extracting Template and Component Keys 🗝\n`,
      ]);
      expect(yocto.create).not.toHaveBeenCalled();
    });

    it(`GIVEN stderr is piped
        WHEN a step starts
        THEN no signal is listened for, an interruption ends the process right away`, async () => {
      const once = vi.spyOn(process, 'once');
      const startSpinner = await load();

      startSpinner('Extracting');

      expect(once).not.toHaveBeenCalled();
    });

    it(`GIVEN a step that already succeeded
        WHEN it succeeds again with other texts
        THEN each of them gets its own line, whatever it ends with`, async () => {
      const startSpinner = await load();

      const spinner = startSpinner('Checking for missing keys ✨');
      spinner.succeed('\x1b[4mSummary\x1b[0m\n');
      spinner.succeed('Added all missing keys\n');
      spinner.succeed('');

      expect(written).toEqual([
        '- Checking for missing keys ✨\n',
        `${green('✔')} \x1b[4mSummary\x1b[0m\n\n`,
        `${green('✔')} Added all missing keys\n\n`,
        `${green('✔')} \n`,
      ]);
    });

    it(`GIVEN an empty text
        WHEN a step starts
        THEN nothing is written for it`, async () => {
      const startSpinner = await load();

      startSpinner('');

      expect(written).toEqual([]);
    });

    it(`GIVEN a text of spaces alone
        WHEN a step starts
        THEN its line is written all the same`, async () => {
      const startSpinner = await load();

      startSpinner('  ');

      expect(written).toEqual(['-   \n']);
    });

    it.each([
      ['a CI', { CI: 'true' }],
      ['a CI variable that is set but empty', { CI: '' }],
      ['a dumb terminal', { TERM: 'dumb' }],
    ])(
      `GIVEN stderr is a terminal of %s
       WHEN a step starts and succeeds
       THEN the two lines are written and nothing spins`,
      async (_, env) => {
        for (const [name, value] of Object.entries(env)) {
          vi.stubEnv(name, value);
        }
        vi.stubEnv('FORCE_COLOR', '0');
        setIsTTY(true);
        const startSpinner = await load();

        startSpinner('Extracting').succeed('Extracted');

        expect(written).toEqual(['- Extracting\n', '✔ Extracted\n']);
        expect(yocto.create).not.toHaveBeenCalled();
      },
    );
  });

  describe('the check mark', () => {
    it.each([
      ['NO_COLOR is set', { NO_COLOR: '1' }, '✔'],
      ['FORCE_COLOR is 0', { FORCE_COLOR: '0' }, '✔'],
      ['the terminal is dumb', { TERM: 'dumb' }, '✔'],
      ['a CI is detected', { CI: 'true' }, '✔'],
      ['FORCE_COLOR is 1', { FORCE_COLOR: '1' }, green('✔')],
      ['FORCE_COLOR is 3', { FORCE_COLOR: '3' }, green('✔')],
      ['it is the Linux console', { TERM: 'linux' }, green('√')],
      [
        'it is the Linux console and NO_COLOR is set',
        { TERM: 'linux', NO_COLOR: '1' },
        '√',
      ],
    ])(
      `GIVEN stderr is piped and %s
       WHEN a step succeeds
       THEN the mark is written the way a terminal of that environment would show it`,
      async (_, env, mark) => {
        for (const [name, value] of Object.entries(env)) {
          vi.stubEnv(name, value);
        }
        const startSpinner = await load();

        startSpinner('').succeed('done');

        expect(written).toEqual([`${mark} done\n`]);
      },
    );

    it.each([
      ['Windows Terminal', { WT_SESSION: '1' }, '✔'],
      ['the terminal of VS Code', { TERM_PROGRAM: 'vscode' }, '✔'],
      [
        'the terminal of a JetBrains IDE',
        { TERMINAL_EMULATOR: 'JetBrains-JediTerm' },
        '✔',
      ],
      ['Cmder', { ConEmuTask: '{cmd::Cmder}' }, '✔'],
      ['an xterm', { TERM: 'xterm-256color' }, '✔'],
      ['alacritty', { TERM: 'alacritty' }, '✔'],
      ['the classic console', { TERM: undefined }, '√'],
    ])(
      `GIVEN Windows and %s
       WHEN a step succeeds
       THEN the mark is the one that terminal can show`,
      async (_, env, mark) => {
        setPlatform('win32');
        vi.stubEnv('NO_COLOR', '1');
        for (const [name, value] of Object.entries(env)) {
          vi.stubEnv(name, value);
        }
        const startSpinner = await load();

        startSpinner('').succeed('done');

        expect(written).toEqual([`${mark} done\n`]);
      },
    );
  });

  describe('on a terminal', () => {
    let listeners: Map<string | symbol, () => void>;

    beforeEach(() => {
      setIsTTY(true);
      listeners = new Map();
      vi.spyOn(process, 'once').mockImplementation((event, listener) => {
        listeners.set(event, listener as () => void);

        return process;
      });
    });

    it(`GIVEN stderr is a terminal
        WHEN a step starts
        THEN a spinner with the text is started on stderr and no line is written`, async () => {
      const startSpinner = await load();

      startSpinner('Extracting Template and Component Keys 🗝');

      expect(yocto.create).toHaveBeenCalledWith({
        text: 'Extracting Template and Component Keys 🗝',
        stream: process.stderr,
        handleSignals: false,
      });
      expect(yocto.spinner.start).toHaveBeenCalledTimes(1);
      expect(written).toEqual([]);
    });

    it(`GIVEN a running spinner
        WHEN the step succeeds
        THEN the spinner is stopped with the check mark and the text as its last line`, async () => {
      const startSpinner = await load();

      startSpinner('Extracting').succeed('Extracted 🗝');

      expect(yocto.spinner.stop).toHaveBeenCalledWith(
        `${green('✔')} Extracted 🗝`,
      );
      expect(written).toEqual([]);
    });

    it(`GIVEN a spinner that was already stopped
        WHEN the step succeeds again
        THEN the line is written to stderr, as a stopped spinner prints nothing`, async () => {
      const startSpinner = await load();

      const spinner = startSpinner('Checking');
      spinner.succeed('Summary\n');
      spinner.succeed('Added all missing keys\n');

      expect(yocto.spinner.stop).toHaveBeenCalledTimes(1);
      expect(written).toEqual([`${green('✔')} Added all missing keys\n\n`]);
    });

    it(`GIVEN several steps
        WHEN they start
        THEN the process listens for an interruption and a termination, once for all of them`, async () => {
      const startSpinner = await load();

      startSpinner('Extracting').succeed('Extracted');
      startSpinner('Checking');

      expect(process.once).toHaveBeenCalledTimes(2);
      expect([...listeners.keys()]).toEqual(['SIGINT', 'SIGTERM']);
    });

    it.each(['SIGINT', 'SIGTERM'] as const)(
      `GIVEN a step in progress
       WHEN the process receives %s
       THEN the cursor is shown again and the signal is sent on, so the process ends by it`,
      async (signal) => {
        const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);
        const startSpinner = await load();
        startSpinner('Extracting');

        listeners.get(signal)?.();

        expect(written).toEqual(['\u001B[?25h']);
        expect(kill).toHaveBeenCalledWith(process.pid, signal);
      },
    );
  });
});
