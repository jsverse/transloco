import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The CLI must not import from core (and core must not import from the CLI),
// so each owns a copy of `TranslocoGlobalConfig`. They are read from disk here
// rather than imported, to keep it that way while failing when they drift.
const CLI_TYPE = join(import.meta.dirname, 'transloco-utils.types.ts');
const CORE_TYPE = join(
  import.meta.dirname,
  '../../../transloco/src/lib/transloco-global-config.ts',
);

/** The `interface TranslocoGlobalConfig { ... }` declaration, comments and whitespace removed. */
function readInterface(file: string): string {
  const source = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  const start = source.search(/interface\s+TranslocoGlobalConfig\b/);
  if (start === -1) throw new Error(`No TranslocoGlobalConfig in ${file}`);

  const open = source.indexOf('{', start);
  let depth = 0;
  for (let index = open; index < source.length; index++) {
    if (source[index] === '{') depth++;
    if (source[index] === '}' && --depth === 0) {
      return source.slice(start, index + 1).replace(/\s+/g, ' ');
    }
  }
  throw new Error(`Unterminated TranslocoGlobalConfig in ${file}`);
}

describe('TranslocoGlobalConfig copies', () => {
  it('GIVEN the CLI and core declarations WHEN compared THEN they are identical', () => {
    const cli = readInterface(CLI_TYPE);
    const core = readInterface(CORE_TYPE);

    expect(cli).toContain('rootTranslationsPath?: string;');
    expect(core).toBe(cli);
  });
});
