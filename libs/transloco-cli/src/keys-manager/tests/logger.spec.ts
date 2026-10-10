import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import debug from 'debug';

const spinnerModule = vi.hoisted(() => {
  const spinner = { succeed: vi.fn() };

  return { spinner, startSpinner: vi.fn(() => spinner) };
});

vi.mock('../utils/spinner.js', () => ({
  startSpinner: spinnerModule.startSpinner,
}));

describe('logger', () => {
  const originalEnv = process.env.PRODUCTION;

  afterEach(() => {
    process.env.PRODUCTION = originalEnv;
    vi.restoreAllMocks();
    spinnerModule.startSpinner.mockClear();
    spinnerModule.spinner.succeed.mockClear();
  });

  describe('getLogger', () => {
    it('should return a logger with log, warn, success, and startSpinner methods', async () => {
      const { getLogger } = await import('../utils/logger.js');
      const logger = getLogger();
      expect(logger).toHaveProperty('log');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('success');
      expect(logger).toHaveProperty('startSpinner');
    });

    it('should write warnings to stderr through console.warn', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { getLogger } = await import('../utils/logger.js');
      getLogger().warn('something is off');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('something is off'),
      );
    });
  });

  describe('spinner', () => {
    beforeEach(() => {
      vi.resetModules();
      delete process.env.PRODUCTION;
    });

    it('should start the spinner of the spinner module with the message', async () => {
      const { getLogger } = await import('../utils/logger.js');

      getLogger().startSpinner('x');

      expect(spinnerModule.startSpinner).toHaveBeenCalledExactlyOnceWith('x');
    });

    it('should succeed the spinner that was started, with the message', async () => {
      const { getLogger } = await import('../utils/logger.js');
      const logger = getLogger();
      logger.startSpinner('x');

      logger.success('y');

      expect(spinnerModule.spinner.succeed).toHaveBeenCalledExactlyOnceWith(
        'y',
      );
    });
  });

  describe('devlog', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('should return early if debug namespace is not enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      debug.disable();

      const { devlog } = await import('../utils/logger.js');
      devlog('config', 'Test', { key: 'value' });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log debug output when namespace is enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      debug.enable('tkm:config');

      const { devlog } = await import('../utils/logger.js');
      devlog('config', 'MyTag', { myVar: 'myValue' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG - MyTag'),
      );
      debug.disable();
      consoleSpy.mockRestore();
    });

    it('should log each variable in values', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      debug.enable('tkm:extraction');
      // `devlog` writes per-variable output through the `debug` package's
      // own log sink (not console.log), so capture that to assert each
      // variable is actually logged, not just that *something* was logged.
      const debugLogSpy = vi.fn();
      const originalDebugLog = debug.log;
      debug.log = debugLogSpy;

      const { devlog } = await import('../utils/logger.js');
      devlog('extraction', 'Extract', { a: 1, b: 'two' });

      // The header goes through console.log.
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG - Extract'),
      );
      // Each entry in `values` must produce its own debug log call,
      // formatted as `<variable>: <value>`.
      expect(debugLogSpy).toHaveBeenCalledTimes(2);
      expect(debugLogSpy.mock.calls[0][0]).toEqual(
        expect.stringContaining('a: 1'),
      );
      expect(debugLogSpy.mock.calls[1][0]).toEqual(
        expect.stringContaining("b: 'two'"),
      );

      debug.log = originalDebugLog;
      debug.disable();
      consoleSpy.mockRestore();
    });
  });
});
