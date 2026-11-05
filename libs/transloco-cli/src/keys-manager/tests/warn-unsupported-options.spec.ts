import commandLineArgs from 'command-line-args';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commandSpecificOptions, optionDefinitions } from '../cli-options';
import { warnUnsupportedOptions } from '../utils/warn-unsupported-options';

import { spyOnConsole } from './spec-utils';

/**
 * The options both commands read, spelled out so `commandSpecificOptions` can't
 * silently miss a new flag: an option that is neither classified there nor
 * listed here fails the tests below, which forces the call to be made when the
 * flag is added instead of after a bug report.
 */
const sharedOptions = [
  'project',
  'config',
  'input',
  'langs',
  'fileFormat',
  'marker',
  'sort',
  'unflat',
  'defaultValue',
  'translationsPath',
  'help',
];

/** Mirrors the camelCasing `commandLineArgs` applies to the option names. */
function camelCase(option: string) {
  return option.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

describe('warnUnsupportedOptions', () => {
  let warnSpy: ReturnType<typeof spyOnConsole>;

  beforeEach(() => {
    vi.restoreAllMocks();
    warnSpy = spyOnConsole('warn');
  });

  it('should warn when a detective only option is passed to extract', () => {
    warnUnsupportedOptions('extract', { emitErrorOnExtraKeys: true });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('--emit-error-on-extra-keys');
    expect(warnSpy.mock.calls[0][0]).toContain('extract');
  });

  it('should warn when an extractor only option is passed to find', () => {
    warnUnsupportedOptions('find', { removeExtraKeys: true });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('--remove-extra-keys');
    expect(warnSpy.mock.calls[0][0]).toContain('find');
  });

  it('should list every unsupported option in a single warning', () => {
    warnUnsupportedOptions('find', {
      output: 'i18n',
      replace: true,
      removeExtraKeys: true,
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [message] = warnSpy.mock.calls[0];
    expect(message).toContain('--output');
    expect(message).toContain('--replace');
    expect(message).toContain('--remove-extra-keys');
  });

  it('should announce the upcoming breaking change', () => {
    warnUnsupportedOptions('extract', { addMissingKeys: true });

    expect(warnSpy.mock.calls[0][0]).toContain('next major version');
  });

  it('should stay silent when the command supports every option', () => {
    warnUnsupportedOptions('extract', {
      removeExtraKeys: true,
      replace: true,
      output: 'i18n',
    });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  /**
   * `defaultValue` and `sort` are documented as extractor options, but both
   * commands run the same extraction pipeline, so they change what `find`
   * writes with `--add-missing-keys`. Warning about them would be wrong.
   */
  it('should not warn for options both commands read', () => {
    warnUnsupportedOptions('find', {
      defaultValue: 'missing',
      sort: true,
      unflat: true,
      langs: ['en'],
      marker: 't',
      fileFormat: 'json',
      translationsPath: 'i18n',
    });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  /**
   * The warning must only fire for options typed on the CLI. A single
   * `transloco.config.js` legitimately serves both commands, and
   * `command-line-args` omits options that weren't passed - that absence is
   * the whole provenance mechanism, so lock it in.
   */
  it('should ignore options that were not passed on the CLI', () => {
    const parsed = commandLineArgs(optionDefinitions, {
      camelCase: true,
      argv: ['--sort'],
    });

    expect('emitErrorOnExtraKeys' in parsed).toBe(false);

    warnUnsupportedOptions('extract', parsed);

    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('commandSpecificOptions', () => {
  it('should classify every CLI option as command specific or shared', () => {
    const unclassified = optionDefinitions
      .map(({ name }) => camelCase(name))
      .filter(
        (option) =>
          !commandSpecificOptions[option] && !sharedOptions.includes(option),
      );

    expect(
      unclassified,
      'Add the option to `commandSpecificOptions` if a single command reads it, otherwise to `sharedOptions` in this spec',
    ).toEqual([]);
  });

  /**
   * An option listed in both places passes the check above, which would let a
   * later deletion from `commandSpecificOptions` go unnoticed: the option stops
   * warning while `sharedOptions` keeps it looking classified.
   */
  it('should not classify an option as both command specific and shared', () => {
    const overlapping = Object.keys(commandSpecificOptions).filter((option) =>
      sharedOptions.includes(option),
    );

    expect(
      overlapping,
      'The option is both command specific and shared, remove it from one of the two',
    ).toEqual([]);
  });

  it('should not classify options that no longer exist', () => {
    const definedOptions = optionDefinitions.map(({ name }) => camelCase(name));

    const stale = [
      ...Object.keys(commandSpecificOptions),
      ...sharedOptions,
    ].filter((option) => !definedOptions.includes(option));

    expect(
      stale,
      'The option was renamed or removed, drop it from `commandSpecificOptions` or from `sharedOptions`. A leftover key in the former warns about nothing',
    ).toEqual([]);
  });
});
