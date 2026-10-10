import { addDevDependency } from './manifest-edit';

const CLI = '@jsverse/transloco-cli';
const RANGE = '^9.0.0';

interface Layout {
  indent?: string | number;
  eol?: string;
  bom?: string;
  trailing?: boolean;
}

function manifest(content: object, layout: Layout = {}) {
  const { indent = 2, eol = '\n', bom = '', trailing = true } = layout;

  return (
    bom +
    JSON.stringify(content, null, indent).replace(/\n/g, eol) +
    (trailing ? eol : '')
  );
}

/** What `output` holds on top of `input`, when it holds nothing else: the inserted text. */
function insertedText(input: string, output: string) {
  const length = output.length - input.length;
  let prefix = 0;

  while (prefix < input.length && input[prefix] === output[prefix]) prefix++;

  const inserted = output.slice(prefix, prefix + length);

  expect(output.slice(0, prefix) + output.slice(prefix + length)).toBe(input);

  return inserted;
}

const base = {
  name: 'app',
  scripts: { build: 'ng build' },
  dependencies: { '@angular/core': '^20.0.0' },
  devDependencies: { '@angular/cli': '^20.0.0', typescript: '~5.9.0' },
};

describe('addDevDependency', () => {
  function expectOnlyTheEntryAdded(input: string) {
    const output = addDevDependency(input, CLI, RANGE);

    expect(output).not.toBeNull();

    const text = output as string;
    const parsed = JSON.parse(text.replace(/^\uFEFF/, ''));

    expect(parsed.devDependencies[CLI]).toBe(RANGE);
    expect(text.split(`"${CLI}"`)).toHaveLength(2);
    const inserted = insertedText(input, text);

    expect(inserted.length).toBeGreaterThan(CLI.length);

    return { text, inserted };
  }

  it.each<[string, Layout]>([
    ['two spaces', { indent: 2 }],
    ['four spaces', { indent: 4 }],
    ['tabs', { indent: '\t' }],
    ['CRLF line endings', { eol: '\r\n' }],
    ['a byte order mark', { bom: '\uFEFF' }],
    ['no final newline', { trailing: false }],
    ['a single line', { indent: 0 }],
  ])(
    `GIVEN a package.json written with %s
      WHEN the CLI is added
      THEN the file differs by the inserted entry only`,
    (_, layout) => {
      const input = manifest(base, layout);
      const { text, inserted } = expectOnlyTheEntryAdded(input);

      expect(text.endsWith('\n')).toBe(input.endsWith('\n'));
      expect(text.startsWith('\uFEFF')).toBe(input.startsWith('\uFEFF'));

      if (layout.eol === '\r\n') expect(text).not.toMatch(/(?<!\r)\n/);
      if (layout.indent === 0) expect(inserted).not.toMatch(/\s/);
    },
  );

  it(`GIVEN a minified package.json without devDependencies
      WHEN the CLI is added
      THEN the file stays on one line`, () => {
    const input = JSON.stringify({ name: 'app', dependencies: { a: '1' } });

    const { text } = expectOnlyTheEntryAdded(input);

    expect(text).toBe(
      `{"name":"app","dependencies":{"a":"1"},"devDependencies":{"${CLI}":"${RANGE}"}}`,
    );
  });

  it.each<[string, Record<string, string>, string[]]>([
    [
      'first',
      { '@zzz/last': '1', typescript: '1' },
      [CLI, '@zzz/last', 'typescript'],
    ],
    [
      'in the middle',
      { '@angular/cli': '1', typescript: '1' },
      ['@angular/cli', CLI, 'typescript'],
    ],
    [
      'last',
      { '@angular/cli': '1', '@jsverse/transloco': '1' },
      ['@angular/cli', '@jsverse/transloco', CLI],
    ],
  ])(
    `GIVEN a devDependencies section where the CLI sorts %s
      WHEN the CLI is added
      THEN it takes that position and the neighbours stay put`,
    (_, devDependencies, order) => {
      for (const indent of [2, 4, '\t', 0]) {
        const input = manifest({ ...base, devDependencies }, { indent });
        const { text } = expectOnlyTheEntryAdded(input);

        expect(Object.keys(JSON.parse(text).devDependencies)).toEqual(order);
      }
    },
  );

  it(`GIVEN a package.json without devDependencies
      WHEN the CLI is added
      THEN the section follows dependencies`, () => {
    const input = manifest({
      name: 'app',
      dependencies: { a: '1' },
      scripts: { build: 'ng build' },
    });

    const { text } = expectOnlyTheEntryAdded(input);

    expect(Object.keys(JSON.parse(text))).toEqual([
      'name',
      'dependencies',
      'devDependencies',
      'scripts',
    ]);
    expect(text).toContain(
      `  "devDependencies": {\n    "${CLI}": "${RANGE}"\n  },\n  "scripts"`,
    );
  });

  it.each<[string, Layout]>([
    ['four spaces', { indent: 4 }],
    ['tabs', { indent: '\t' }],
    ['CRLF', { eol: '\r\n', indent: 2 }],
  ])(
    `GIVEN a package.json without devDependencies or dependencies, written with %s
      WHEN the CLI is added
      THEN the section is added at the end in the file's style`,
    (_, layout) => {
      const input = manifest(
        { name: 'app', scripts: { build: 'ng build' } },
        layout,
      );

      const { text } = expectOnlyTheEntryAdded(input);

      expect(Object.keys(JSON.parse(text))).toEqual([
        'name',
        'scripts',
        'devDependencies',
      ]);
      expect(text.endsWith('\n')).toBe(true);
    },
  );

  it.each<[string, string]>([
    ['empty on one line', '{\n  "name": "app",\n  "devDependencies": {}\n}\n'],
    [
      'empty over two lines',
      '{\n  "name": "app",\n  "devDependencies": {\n  }\n}\n',
    ],
    ['empty and minified', '{"name":"app","devDependencies":{}}'],
    ['empty with tabs', '{\n\t"name": "app",\n\t"devDependencies": {}\n}\n'],
  ])(
    `GIVEN a devDependencies section that is %s
      WHEN the CLI is added
      THEN it is the only entry`,
    (_, input) => {
      const { text } = expectOnlyTheEntryAdded(input);

      expect(JSON.parse(text).devDependencies).toEqual({ [CLI]: RANGE });
    },
  );

  it(`GIVEN a package.json holding an empty object
      WHEN the CLI is added
      THEN the section is the only member`, () => {
    expect(JSON.parse(addDevDependency('{}', CLI, RANGE) as string)).toEqual({
      devDependencies: { [CLI]: RANGE },
    });
    expect(
      JSON.parse(addDevDependency('{\n}\n', CLI, RANGE) as string),
    ).toEqual({ devDependencies: { [CLI]: RANGE } });
  });

  it(`GIVEN a devDependencies section with strings holding braces, quotes and commas
      WHEN the CLI is added
      THEN the entry lands in the right object`, () => {
    const input = manifest({
      name: 'app',
      scripts: { odd: 'echo "}" , {' },
      devDependencies: { 'a,b': '{1}', 'z"q': '"}' },
    });

    const { text } = expectOnlyTheEntryAdded(input);

    expect(JSON.parse(text).devDependencies[CLI]).toBe(RANGE);
  });

  it(`GIVEN two devDependencies sections
      WHEN the CLI is added
      THEN it goes into the last one, which is the one a JSON parser keeps`, () => {
    const input = `{\n  "devDependencies": { "a": "1" },\n  "devDependencies": { "b": "1" }\n}\n`;

    const { text } = expectOnlyTheEntryAdded(input);

    expect(Object.keys(JSON.parse(text).devDependencies)).toEqual([CLI, 'b']);
  });

  it.each([
    ['an array', '[]'],
    ['text that is not JSON', 'not json'],
    ['devDependencies that is not an object', '{ "devDependencies": [] }'],
    ['an empty file', ''],
  ])(
    `GIVEN %s
      WHEN the CLI is added
      THEN nothing is returned`,
    (_, input) => {
      expect(addDevDependency(input, CLI, RANGE)).toBeNull();
    },
  );
});
