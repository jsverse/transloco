import os from 'node:os';
import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliError } from '../errors';
import type { Config } from '../keys-manager/types';

import { runExtract } from './extract';
import { runFind } from './find';

const { assertKeysManagerPeers, buildTranslationFiles, findMissingKeys } =
  vi.hoisted(() => ({
    assertKeysManagerPeers: vi.fn(),
    buildTranslationFiles: vi.fn(),
    findMissingKeys: vi.fn(),
  }));

vi.mock('../peers.js', () => ({ assertKeysManagerPeers }));
vi.mock('../keys-manager/keys-builder/index.js', () => ({
  buildTranslationFiles,
}));
vi.mock('../keys-manager/keys-detective/index.js', () => ({
  findMissingKeys,
}));

const missingPeer = new CliError(
  'error: "transloco" needs typescript, which is not installed.',
);

describe('keys manager runners', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('runExtract', () => {
    it(`GIVEN the peers are installed
        WHEN it runs
        THEN the peers are verified first and the builder gets the config`, async () => {
      const config: Partial<Config> = { command: 'extract', input: ['src'] };

      await runExtract(config);

      expect(assertKeysManagerPeers).toHaveBeenCalledExactlyOnceWith('extract');
      expect(buildTranslationFiles).toHaveBeenCalledExactlyOnceWith(config);
      expect(assertKeysManagerPeers.mock.invocationCallOrder[0]).toBeLessThan(
        buildTranslationFiles.mock.invocationCallOrder[0],
      );
      expect(findMissingKeys).not.toHaveBeenCalled();
    });

    it(`GIVEN a peer is missing
        WHEN it runs
        THEN it fails with the peer error before the keys manager is loaded`, async () => {
      assertKeysManagerPeers.mockImplementationOnce(() => {
        throw missingPeer;
      });

      await expect(runExtract({ command: 'extract' })).rejects.toBe(
        missingPeer,
      );

      expect(buildTranslationFiles).not.toHaveBeenCalled();
    });

    it(`GIVEN the builder rejects while writing the files
        WHEN it runs
        THEN the rejection is not swallowed`, async () => {
      const failure = new Error('EACCES: permission denied');
      buildTranslationFiles.mockRejectedValueOnce(failure);

      await expect(runExtract({ command: 'extract' })).rejects.toBe(failure);
    });
  });

  describe('the --config path', () => {
    const missing = path.join(os.tmpdir(), 'transloco-cli-no-such.config.js');

    it.each([
      ['extract', runExtract],
      ['find', runFind],
    ] as const)(
      `GIVEN a config path that does not exist
       WHEN %s runs
       THEN it fails naming the path, before the peers are checked or the keys manager is loaded`,
      async (command, runner) => {
        const error = await runner({ command, config: missing }).catch(
          (e) => e,
        );

        expect(error).toBeInstanceOf(CliError);
        expect(error).toMatchObject({
          exitCode: 1,
          message: `error: the --config path does not exist: ${missing}`,
        });
        expect(assertKeysManagerPeers).not.toHaveBeenCalled();
        expect(buildTranslationFiles).not.toHaveBeenCalled();
        expect(findMissingKeys).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['a file', __filename],
      ['a directory', __dirname],
    ])(
      `GIVEN a config path that is %s
       WHEN the commands run
       THEN they carry on, as the loader searches a directory for a config`,
      async (_, config) => {
        await runExtract({ command: 'extract', config });
        await runFind({ command: 'find', config });

        expect(buildTranslationFiles).toHaveBeenCalledOnce();
        expect(findMissingKeys).toHaveBeenCalledOnce();
      },
    );

    it(`GIVEN no config path
        WHEN the commands run
        THEN nothing is checked`, async () => {
      await runExtract({ command: 'extract' });
      await runFind({ command: 'find' });

      expect(buildTranslationFiles).toHaveBeenCalledOnce();
      expect(findMissingKeys).toHaveBeenCalledOnce();
    });
  });

  describe('runFind', () => {
    it(`GIVEN the peers are installed
        WHEN it runs
        THEN the peers are verified first and the detective gets the config`, async () => {
      const config: Partial<Config> = {
        command: 'find',
        addMissingKeys: true,
      };

      await runFind(config);

      expect(assertKeysManagerPeers).toHaveBeenCalledExactlyOnceWith('find');
      expect(findMissingKeys).toHaveBeenCalledExactlyOnceWith(config);
      expect(assertKeysManagerPeers.mock.invocationCallOrder[0]).toBeLessThan(
        findMissingKeys.mock.invocationCallOrder[0],
      );
      expect(buildTranslationFiles).not.toHaveBeenCalled();
    });

    it(`GIVEN a peer is missing
        WHEN it runs
        THEN it fails with the peer error before the keys manager is loaded`, async () => {
      assertKeysManagerPeers.mockImplementationOnce(() => {
        throw missingPeer;
      });

      await expect(runFind({ command: 'find' })).rejects.toBe(missingPeer);

      expect(findMissingKeys).not.toHaveBeenCalled();
    });
  });
});
