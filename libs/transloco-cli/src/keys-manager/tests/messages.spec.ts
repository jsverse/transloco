import { describe, it, expect } from 'vitest';

import { messages } from '../messages';

describe('messages', () => {
  it('should return singular "file" when filesCount is 1', () => {
    expect(messages.keysFound(5, 1)).toBe('5 keys were found in 1 file.');
  });

  it('should return plural "files" when filesCount is greater than 1', () => {
    expect(messages.keysFound(10, 3)).toBe('10 keys were found in 3 files.');
  });

  it('should return singular "File" for startBuild when langsCount is 1', () => {
    expect(messages.startBuild(1)).toBe('Starting Translation File Build');
  });

  it('should return plural "Files" for startBuild when langsCount is greater than 1', () => {
    expect(messages.startBuild(3)).toBe('Starting Translation Files Build');
  });

  it('should return singular "was" for merged when len is 1', () => {
    expect(messages.merged(1)).toBe(
      'Existing translation file was found and merged',
    );
  });

  it('should return plural "were" for merged when len is greater than 1', () => {
    expect(messages.merged(2)).toBe(
      'Existing translation files were found and merged',
    );
  });

  it('should use singular wording for a single unsupported option', () => {
    expect(messages.unsupportedOptions('extract', ['--output'])).toBe(
      '--output is not supported by the "extract" command and was ignored. This will throw an error in the next major version.',
    );
  });

  it('should use plural wording for several unsupported options', () => {
    const result = messages.unsupportedOptions('find', [
      '--output',
      '--replace',
    ]);
    expect(result).toContain('--output, --replace are not supported');
    expect(result).toContain('were ignored');
  });

  it('should format problematic keys for unflat', () => {
    const result = messages.problematicKeysForUnflat(['a.b', 'a.b.c']);
    expect(result).toContain('"a.b"');
    expect(result).toContain('"a.b.c"');
  });
});
