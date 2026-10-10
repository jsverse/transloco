import * as nodeModule from 'node:module';

import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { loadDependencyRules } from './lazy-deps';

type TypeScript = typeof import('typescript');
type ImportSpecifier = import('typescript').ImportSpecifier;
type ImportDeclaration = import('typescript').ImportDeclaration;
type SourceFile = import('typescript').SourceFile;

export const CLI_PACKAGE = '@jsverse/transloco-cli';

/** Extensions carrying an `import` the import-rewriting steps can edit. */
export const SCANNED = ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs'];

/** `SCANNED`, plus the JSX ones. */
export const SCANNED_WITH_JSX = [...SCANNED, '.tsx', '.jsx'];

/** The usage that asks for the CLI when a workspace imports `name` from it. */
export const importsFromCli = (name: string) =>
  `files in your workspace import ${name} from it now`;

/** The sections of a `package.json` that make a package available to the workspace. */
const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

export interface Edit {
  start: number;
  end: number;
  text: string;
}

/** Applies non-overlapping edits, last first so the offsets stay valid. */
export function applyEdits(source: string, edits: Edit[]): string {
  let content = source;
  for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
    content =
      content.slice(0, edit.start) + edit.text + content.slice(edit.end);
  }

  return content;
}

/**
 * The braces of an import with only `group` in them. The original text is kept
 * whenever the group is the whole import, so spacing and the like survive.
 */
export function namedImports(
  group: ImportSpecifier[],
  all: readonly ImportSpecifier[],
  original: string,
  dropTypeModifier: boolean,
): string {
  const unchanged =
    group.length === all.length &&
    !(dropTypeModifier && group.some((element) => element.isTypeOnly));
  if (unchanged) return original;

  const names = group.map((element) =>
    dropTypeModifier
      ? element.getText().replace(/^type\s+/, '')
      : element.getText(),
  );

  return `{ ${names.join(', ')} }`;
}

/** The line ending around `start`-`end`: the one after the statement, else the one before it. */
export function lineEndingAround(
  source: string,
  start: number,
  end: number,
): string {
  const after = source.indexOf('\n', end);
  const newline = after !== -1 ? after : source.lastIndexOf('\n', start);

  return newline > 0 && source[newline - 1] === '\r' ? '\r\n' : '\n';
}

/**
 * The edit that replaces an import with `statements`, one per line and at the
 * indent of the original. With none, the import goes: the whole line when
 * nothing else is on it.
 */
export function replaceImport(
  source: string,
  statement: ImportDeclaration,
  statements: string[],
): Edit {
  const start = statement.getStart();
  const end = statement.getEnd();
  const lineStart = source.lastIndexOf('\n', start - 1) + 1;

  if (!statements.length) {
    const lineEnd = source.indexOf('\n', end);
    const rest = source.slice(end, lineEnd === -1 ? undefined : lineEnd);
    const alone =
      /^\s*$/.test(source.slice(lineStart, start)) && /^\s*$/.test(rest);
    const bom = source[lineStart] === '﻿' ? 1 : 0;

    return alone
      ? {
          start: lineStart + bom,
          end: lineEnd === -1 ? source.length : lineEnd + 1,
          text: '',
        }
      : { start, end, text: '' };
  }

  // A BOM is whitespace to the scanner, but it belongs to the file, not the indent.
  const beforeStatement = source.slice(lineStart, start).replace('﻿', '');
  const indent = /^\s*$/.test(beforeStatement) ? beforeStatement : '';

  return {
    start,
    end,
    text: statements.join(`${lineEndingAround(source, start, end)}${indent}`),
  };
}

/** Whether `file` already imports `name` under its own name from `packageName`. */
export function importsUnaliased(
  ts: TypeScript,
  file: SourceFile,
  packageName: string,
  name: string,
): boolean {
  return file.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === packageName &&
      !!statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings) &&
      statement.importClause.namedBindings.elements.some(
        (element) => !element.propertyName && element.name.text === name,
      ),
  );
}

/** The version of this `@jsverse/transloco`, which `ng update` has installed by the time it runs. */
function installedVersion(): string | null {
  try {
    const manifest = nodeModule.createRequire(__filename)(
      '../../package.json',
    ) as { version?: string };

    return manifest.version ?? null;
  } catch {
    return null;
  }
}

/** Whether the root `package.json` lists `name`, or `null` when it can't be read. */
function isListed(tree: Tree, name: string): boolean | null {
  try {
    const manifest = JSON.parse(tree.read('/package.json')?.toString() ?? '');
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest))
      return null;

    return DEPENDENCY_SECTIONS.some((section) => manifest[section]?.[name]);
  } catch {
    return null;
  }
}

/**
 * Adds the CLI to the workspace's `devDependencies` when it isn't listed yet,
 * at the range of the `@jsverse/transloco` v9 that is installed, and schedules
 * the install. `usage` says what in the workspace needs it now, for the
 * message that asks for the dependency when it can't be added.
 *
 * Every step that needs the CLI calls this. The first one that finds it
 * missing adds it, and since the rules of a chain run one after the other on
 * the same tree, the next sees it listed and leaves it alone.
 */
export function addCliDependency(
  tree: Tree,
  context: SchematicContext,
  usage: string,
): Rule | void {
  const manual = `  ↳ Add '${CLI_PACKAGE}' to your devDependencies: ${usage}.`;

  const listed = isListed(tree, CLI_PACKAGE);
  if (listed) return;

  const version = installedVersion();
  const rules = loadDependencyRules();
  if (listed === null || !version || !rules) {
    context.logger.warn(manual);
    return;
  }

  context.logger.info(
    `  ↳ Added '${CLI_PACKAGE}@^${version}' to devDependencies.`,
  );

  return rules.addDependency(CLI_PACKAGE, `^${version}`, {
    type: rules.DependencyType.Dev,
    existing: rules.ExistingBehavior.Skip,
  });
}
