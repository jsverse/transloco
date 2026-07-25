import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import debug from 'debug';

vi.mock('ora', () => {
  const mockSpinner = {
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
  };
  return { default: vi.fn(() => mockSpinner) };
});

describe('logger', () => {
  const originalEnv = process.env.PRODUCTION;

  afterEach(() => {
    process.env.PRODUCTION = originalEnv;
    vi.restoreAllMocks();
  });

  describe('getLogger', () => {
    it('should return a logger with log, success, and startSpinner methods', async () => {
      const { getLogger } = await import('../utils/logger');
      const logger = getLogger();
      expect(logger).toHaveProperty('log');
      expect(logger).toHaveProperty('success');
      expect(logger).toHaveProperty('startSpinner');
    });
  });

  describe('devlog', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('should return early if debug namespace is not enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      debug.disable();

      const { devlog } = await import('../utils/logger');
      devlog('config', 'Test', { key: 'value' });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log debug output when namespace is enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      debug.enable('tkm:config');

      const { devlog } = await import('../utils/logger');
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

      const { devlog } = await import('../utils/logger');
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
