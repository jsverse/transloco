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
        THEN no signal and no exit is listened for, an interruption ends the process right away`, async () => {
      const once = vi.spyOn(process, 'once');
      const on = vi.spyOn(process, 'on');
      const startSpinner = await load();

      startSpinner('Extracting');

      expect(once).not.toHaveBeenCalled();
      expect(on).not.toHaveBeenCalled();
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
    const showCursor = '\u001B[?25h';
    const common = ['SIGHUP', 'SIGINT', 'SIGTERM'];
    const posix = [
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
    ];
    const linux = ['SIGIO', 'SIGPOLL', 'SIGPWR', 'SIGSTKFLT'];
    const handled = {
      win32: common,
      darwin: [...common, ...posix],
      linux: [...common, ...posix, ...linux],
    } as const;
    const events = ['exit', ...handled.linux];
    let before: Map<string, unknown[]>;

    /** The listeners a step registered, the ones that were there before it not included. */
    function added(event: string) {
      return process
        .rawListeners(event)
        .filter((listener) => !before.get(event)?.includes(listener)) as Array<
        () => void
      >;
    }

    beforeEach(() => {
      setIsTTY(true);
      before = new Map(events.map((e) => [e, process.rawListeners(e)]));
    });

    afterEach(() => {
      for (const event of events) {
        for (const listener of added(event)) {
          process.removeListener(event, listener);
        }
      }
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

    it.each(Object.keys(handled) as Array<keyof typeof handled>)(
      `GIVEN %s
       WHEN several steps start
       THEN the process listens for the end of it and for the signals that end it, once for all of them`,
      async (platform) => {
        setPlatform(platform);
        const startSpinner = await load();

        startSpinner('Extracting').succeed('Extracted');
        startSpinner('Checking');

        expect(added('exit')).toHaveLength(1);
        for (const signal of handled[platform]) {
          expect(added(signal), signal).toHaveLength(1);
        }
        for (const signal of handled.linux.filter(
          (s) => !handled[platform].includes(s as never),
        )) {
          expect(added(signal), signal).toHaveLength(0);
        }
      },
    );

    it(`GIVEN a signal the process can't listen for
        WHEN a step starts
        THEN the other signals are still listened for and nothing throws`, async () => {
      const once = process.once.bind(process);
      vi.spyOn(process, 'once').mockImplementation(((event, listener) => {
        if (event === 'SIGHUP') throw new Error('uv_signal_start EINVAL');

        return once(event, listener);
      }) as typeof process.once);
      const startSpinner = await load();

      expect(() => startSpinner('Extracting')).not.toThrow();

      expect(added('SIGINT')).toHaveLength(1);
      expect(added('SIGTERM')).toHaveLength(1);
      expect(yocto.spinner.start).toHaveBeenCalledTimes(1);
    });

    it(`GIVEN 50 steps that start and succeed
        WHEN they are done
        THEN the listeners of the process are those of the first one`, async () => {
      const startSpinner = await load();

      startSpinner('Extracting').succeed('Extracted');
      const counts = events.map((e) => process.listenerCount(e));
      for (let i = 0; i < 50; i++) {
        startSpinner(`Step ${i}`).succeed(`Step ${i} done`);
      }

      expect(events.map((e) => process.listenerCount(e))).toEqual(counts);
    });

    it(`GIVEN a step in progress
        WHEN the process exits, whatever the reason
        THEN the cursor is shown again, once`, async () => {
      const startSpinner = await load();
      startSpinner('Extracting');

      for (const listener of added('exit')) listener();

      expect(written).toEqual([showCursor]);
    });

    it(`GIVEN a step that succeeded
        WHEN the process exits
        THEN nothing is written, the spinner showed the cursor when it stopped`, async () => {
      const startSpinner = await load();
      startSpinner('Extracting').succeed('Extracted');

      for (const listener of added('exit')) listener();

      expect(written).toEqual([]);
    });

    it(`GIVEN a step that succeeded and another one in progress
        WHEN the process exits
        THEN the cursor is shown again`, async () => {
      const startSpinner = await load();
      startSpinner('Extracting').succeed('Extracted');
      startSpinner('Checking');

      for (const listener of added('exit')) listener();

      expect(written).toEqual([showCursor]);
    });

    it(`GIVEN stderr is piped
        WHEN a step starts and the process exits
        THEN no listener is added and no escape sequence is written`, async () => {
      setIsTTY(false);
      const startSpinner = await load();

      startSpinner('Extracting').succeed('Extracted');

      expect(events.flatMap((e) => added(e))).toEqual([]);
      expect(written.join('')).not.toContain('\u001B[?');
    });

    it.each(handled.linux)(
      `GIVEN a step in progress
       WHEN the process receives %s
       THEN the cursor is shown again and the signal is sent on, so the process ends by it`,
      async (signal) => {
        setPlatform('linux');
        const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);
        const startSpinner = await load();
        startSpinner('Extracting');

        added(signal)[0]();

        expect(written).toEqual([showCursor]);
        expect(kill).toHaveBeenCalledExactlyOnceWith(process.pid, signal);
        expect(added(signal)).toHaveLength(0);
      },
    );

    it(`GIVEN a step that succeeded
        WHEN the process receives a signal
        THEN the signal is sent on and nothing is written`, async () => {
      const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);
      const startSpinner = await load();
      startSpinner('Extracting').succeed('Extracted');

      added('SIGTERM')[0]();

      expect(written).toEqual([]);
      expect(kill).toHaveBeenCalledWith(process.pid, 'SIGTERM');
    });
  });
});
