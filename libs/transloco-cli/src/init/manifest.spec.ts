import { describe, expect, it } from 'vitest';

import { CliError } from '../errors.js';

import { addScripts, parseManifest } from './manifest.js';

const scripts = {
  'i18n:extract': 'transloco extract',
  'i18n:find': 'transloco find',
};

describe('parseManifest', () => {
  it(`GIVEN a package.json with scripts
      WHEN it is parsed
      THEN the scripts are handed back`, () => {
    expect(parseManifest('{"scripts": {"build": "tsc"}}')).toEqual({
      scripts: { build: 'tsc' },
    });
  });

  it(`GIVEN a package.json with no scripts
      WHEN it is parsed
      THEN the scripts are empty`, () => {
    expect(parseManifest('{"name": "app"}')).toEqual({ scripts: {} });
  });

  it(`GIVEN a package.json that starts with a BOM
      WHEN it is parsed
      THEN it is read all the same`, () => {
    expect(parseManifest('\uFEFF{"scripts": {"a": "b"}}')).toEqual({
      scripts: { a: 'b' },
    });
  });

  it.each([
    ['text that is no JSON', '{ nope', /package\.json is not valid JSON/],
    ['an empty file', '', /package\.json is not valid JSON/],
    ['an array', '[]', /does not hold an object/],
    ['null', 'null', /does not hold an object/],
    ['a string', '"app"', /does not hold an object/],
    [
      'scripts that are a string',
      '{"scripts": "tsc"}',
      /scripts .* not an object/,
    ],
    ['scripts that are null', '{"scripts": null}', /scripts .* not an object/],
    [
      'scripts that are an array',
      '{"scripts": []}',
      /scripts .* not an object/,
    ],
  ])(
    `GIVEN a package.json holding %s
     WHEN it is parsed
     THEN a CLI error says why it can't take scripts`,
    (_, text, message) => {
      expect(() => parseManifest(text)).toThrow(CliError);
      expect(() => parseManifest(text)).toThrow(message);
    },
  );
});

describe('addScripts', () => {
  it(`GIVEN a package.json indented with two spaces
      WHEN scripts are added
      THEN they are written with two spaces after the existing ones`, () => {
    const text = `{\n  "name": "app",\n  "scripts": {\n    "build": "tsc"\n  },\n  "license": "MIT"\n}\n`;

    expect(addScripts(text, scripts)).toBe(
      `{\n  "name": "app",\n  "scripts": {\n    "build": "tsc",\n    "i18n:extract": "transloco extract",\n    "i18n:find": "transloco find"\n  },\n  "license": "MIT"\n}\n`,
    );
  });

  it(`GIVEN a package.json indented with four spaces
      WHEN scripts are added
      THEN they are written with four spaces`, () => {
    const text = `{\n    "name": "app",\n    "scripts": {\n        "build": "tsc"\n    }\n}\n`;

    expect(addScripts(text, { 'i18n:find': 'transloco find' })).toBe(
      `{\n    "name": "app",\n    "scripts": {\n        "build": "tsc",\n        "i18n:find": "transloco find"\n    }\n}\n`,
    );
  });

  it(`GIVEN a package.json indented with tabs
      WHEN scripts are added
      THEN they are written with tabs`, () => {
    const text = `{\n\t"name": "app",\n\t"scripts": {\n\t\t"build": "tsc"\n\t}\n}\n`;

    expect(addScripts(text, { 'i18n:find': 'transloco find' })).toBe(
      `{\n\t"name": "app",\n\t"scripts": {\n\t\t"build": "tsc",\n\t\t"i18n:find": "transloco find"\n\t}\n}\n`,
    );
  });

  it(`GIVEN a package.json with Windows line endings
      WHEN scripts are added
      THEN every line break in the file is still a CRLF`, () => {
    const text = `{\r\n  "name": "app",\r\n  "scripts": {\r\n    "build": "tsc"\r\n  }\r\n}\r\n`;

    const result = addScripts(text, scripts);

    expect(result).toBe(
      `{\r\n  "name": "app",\r\n  "scripts": {\r\n    "build": "tsc",\r\n    "i18n:extract": "transloco extract",\r\n    "i18n:find": "transloco find"\r\n  }\r\n}\r\n`,
    );
    expect(result.replaceAll('\r\n', '')).not.toContain('\n');
  });

  it(`GIVEN a package.json that starts with a BOM
      WHEN scripts are added
      THEN the BOM is kept, once`, () => {
    const text = `\uFEFF{\n  "scripts": {}\n}\n`;

    const result = addScripts(text, { 'i18n:find': 'transloco find' });

    expect(result).toBe(
      `\uFEFF{\n  "scripts": {\n    "i18n:find": "transloco find"\n  }\n}\n`,
    );
  });

  it(`GIVEN a package.json with no line break at its end
      WHEN scripts are added
      THEN it still has none`, () => {
    const text = `{\n  "scripts": {\n    "build": "tsc"\n  }\n}`;

    expect(addScripts(text, { 'i18n:find': 'transloco find' })).toBe(
      `{\n  "scripts": {\n    "build": "tsc",\n    "i18n:find": "transloco find"\n  }\n}`,
    );
  });

  it(`GIVEN a package.json with no scripts
      WHEN scripts are added
      THEN the object is created at the end, behind the other keys`, () => {
    const text = `{\n  "name": "app",\n  "version": "1.0.0"\n}\n`;

    expect(addScripts(text, scripts)).toBe(
      `{\n  "name": "app",\n  "version": "1.0.0",\n  "scripts": {\n    "i18n:extract": "transloco extract",\n    "i18n:find": "transloco find"\n  }\n}\n`,
    );
  });

  it(`GIVEN a package.json with keys in an unusual order
      WHEN scripts are added
      THEN the keys keep their order`, () => {
    const text = `{\n  "scripts": {\n    "z": "1",\n    "a": "2"\n  },\n  "name": "app",\n  "dependencies": {}\n}\n`;

    const result = addScripts(text, { 'i18n:find': 'transloco find' });

    expect(Object.keys(JSON.parse(result))).toEqual([
      'scripts',
      'name',
      'dependencies',
    ]);
    expect(Object.keys(JSON.parse(result).scripts)).toEqual([
      'z',
      'a',
      'i18n:find',
    ]);
  });

  it(`GIVEN a package.json on a single line
      WHEN scripts are added
      THEN it stays on one line`, () => {
    const result = addScripts('{"name":"app"}', {
      'i18n:find': 'transloco find',
    });

    expect(result).not.toContain('\n');
    expect(JSON.parse(result)).toEqual({
      name: 'app',
      scripts: { 'i18n:find': 'transloco find' },
    });
  });
});
