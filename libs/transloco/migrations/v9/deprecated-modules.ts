import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import type {
  ArrayLiteralExpression,
  CallExpression,
  ImportDeclaration,
  Node,
  ObjectLiteralExpression,
} from 'typescript';

import { loadTypeScript } from './lazy-deps';
import { collectFiles } from './workspace-utils';

const CORE = '@jsverse/transloco';
const LOCALE = '@jsverse/transloco-locale';

const CORE_DECLARABLES = ['TranslocoDirective', 'TranslocoPipe'];
const LOCALE_PIPES = [
  'TranslocoCurrencyPipe',
  'TranslocoDatePipe',
  'TranslocoDecimalPipe',
  'TranslocoPercentPipe',
];
const TESTING_PROVIDER = 'provideTranslocoTesting';

type ModuleKind = 'module' | 'testing' | 'locale';

/** The deprecated NgModules, by exported name. */
const DEPRECATED: Record<string, { pkg: string; kind: ModuleKind }> = {
  TranslocoModule: { pkg: CORE, kind: 'module' },
  TranslocoTestingModule: { pkg: CORE, kind: 'testing' },
  TranslocoLocaleModule: { pkg: LOCALE, kind: 'locale' },
};

const MODULE_NAMES = /Transloco(Locale|Testing)?Module/;

interface Edit {
  start: number;
  end: number;
  text: string;
}

interface Binding {
  imported: string;
  pkg: string;
  kind: ModuleKind;
}

export interface UnresolvedUsage {
  name: string;
  line: number;
}

export interface DeprecatedModulesResult {
  content: string;
  /** Usages rewritten to the standalone API. */
  migrated: number;
  /** Usages left as they were, because they can't be rewritten safely. */
  unresolved: UnresolvedUsage[];
}

/**
 * Rewrites the deprecated NgModules to the standalone API they wrap:
 *
 * - `TranslocoModule` -> `TranslocoDirective, TranslocoPipe`
 * - `TranslocoLocaleModule` -> the four locale pipes
 * - `TranslocoTestingModule.forRoot(opts)` -> `TranslocoDirective, TranslocoPipe`
 *   in `imports`, plus `provideTranslocoTesting(opts)` in the `providers` of the
 *   same object literal
 *
 * Only usages that sit directly in an array literal (or, for `forRoot`, in the
 * `imports` of an object literal) are rewritten - those are the shapes where the
 * result is provably equivalent. Anything else, such as a helper returning the
 * module from a function, is left alone and reported: moving a module between
 * `imports` and `providers` needs to know where it ends up.
 *
 * Both the directive and the pipe are always added, without reading templates,
 * because that is exactly what the module exported. A component using only one
 * of them may get Angular's unused-standalone-import warning.
 *
 * Positions come from the AST so aliases and quote style survive and the rest of
 * the file is left untouched (re-printing would reformat it).
 */
export function migrateDeprecatedModulesSource(
  source: string,
): DeprecatedModulesResult | null {
  if (!MODULE_NAMES.test(source)) return null;

  const ts = loadTypeScript();
  if (!ts) return null;

  const file = ts.createSourceFile(
    'deprecated-modules.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
  );

  // Local name -> what it refers to, and every import declaration per package,
  // so new names can be added to the one the old ones came from.
  const bindings = new Map<string, Binding>();
  const declarations = new Map<string, ImportDeclaration[]>();
  const existing = new Map<string, Map<string, string>>();

  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      continue;

    const pkg = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (pkg !== CORE && pkg !== LOCALE) continue;
    if (!clause || clause.isTypeOnly || !clause.namedBindings) continue;
    if (!ts.isNamedImports(clause.namedBindings)) continue;

    declarations.set(pkg, [...(declarations.get(pkg) ?? []), statement]);
    const names = existing.get(pkg) ?? new Map<string, string>();
    existing.set(pkg, names);

    for (const element of clause.namedBindings.elements) {
      if (element.isTypeOnly) continue;
      const imported = (element.propertyName ?? element.name).text;
      names.set(imported, element.name.text);

      const deprecated = DEPRECATED[imported];
      if (deprecated?.pkg === pkg) {
        bindings.set(element.name.text, { imported, ...deprecated });
      }
    }
  }

  if (!bindings.size) return null;

  const edits: Edit[] = [];
  const unresolved: UnresolvedUsage[] = [];
  const added = new Map<string, Set<string>>();
  const rewritten = new Set<string>();
  const blocked = new Set<string>();
  const handledObjects = new Set<ObjectLiteralExpression>();
  let migrated = 0;

  /** The local name for a standalone export, queued for import if it's new. */
  const local = (pkg: string, name: string) => {
    const known = existing.get(pkg)?.get(name);
    if (known) return known;

    added.set(pkg, (added.get(pkg) ?? new Set<string>()).add(name));
    return name;
  };

  const standaloneFor = (binding: Binding) =>
    binding.kind === 'locale'
      ? LOCALE_PIPES.map((name) => local(LOCALE, name))
      : CORE_DECLARABLES.map((name) => local(CORE, name));

  const report = (node: Node, binding: Binding, localName: string) => {
    blocked.add(localName);
    unresolved.push({
      name: binding.imported,
      line: file.getLineAndCharacterOfPosition(node.getStart()).line + 1,
    });
  };

  /**
   * `TranslocoTestingModule.forRoot(...)` in the `imports` of an object literal:
   * returns whether it could be rewritten.
   */
  const migrateForRoot = (call: CallExpression): boolean => {
    const array = call.parent;
    if (!ts.isArrayLiteralExpression(array)) return false;

    const property = array.parent;
    if (
      !ts.isPropertyAssignment(property) ||
      !ts.isIdentifier(property.name) ||
      property.name.text !== 'imports' ||
      !ts.isObjectLiteralExpression(property.parent)
    )
      return false;

    const object = property.parent;
    // A second `forRoot` would need a second `providers` key.
    if (handledObjects.has(object)) return false;

    const providers = object.properties.find(
      (candidate) =>
        (ts.isPropertyAssignment(candidate) ||
          ts.isShorthandPropertyAssignment(candidate)) &&
        ts.isIdentifier(candidate.name) &&
        candidate.name.text === 'providers',
    );
    // `providers` given by reference can't be appended to in place.
    if (
      providers &&
      !(
        ts.isPropertyAssignment(providers) &&
        ts.isArrayLiteralExpression(providers.initializer)
      )
    )
      return false;

    handledObjects.add(object);

    const declarables = CORE_DECLARABLES.map((name) => local(CORE, name));
    const provider = `${local(CORE, TESTING_PROVIDER)}(${call.arguments
      .map((argument) => argument.getText())
      .join(', ')})`;

    edits.push({
      start: call.getStart(),
      end: call.getEnd(),
      text: declarables.join(', '),
    });

    if (providers && ts.isPropertyAssignment(providers)) {
      const list = providers.initializer as ArrayLiteralExpression;
      const last = list.elements[list.elements.length - 1];
      edits.push(
        last
          ? { start: last.getEnd(), end: last.getEnd(), text: `, ${provider}` }
          : {
              start: list.getStart() + 1,
              end: list.getStart() + 1,
              text: provider,
            },
      );
    } else {
      edits.push({
        start: property.getEnd(),
        end: property.getEnd(),
        text: `, providers: [${provider}]`,
      });
    }

    return true;
  };

  const visit = (node: Node): void => {
    if (ts.isImportDeclaration(node)) return;

    if (ts.isIdentifier(node) && bindings.has(node.text)) {
      const binding = bindings.get(node.text) as Binding;
      const parent = node.parent;

      const isMemberName =
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isPropertyAssignment(parent) && parent.name === node);
      if (isMemberName) return;

      const isForRoot =
        binding.kind === 'testing' &&
        ts.isPropertyAccessExpression(parent) &&
        parent.expression === node &&
        parent.name.text === 'forRoot' &&
        ts.isCallExpression(parent.parent) &&
        parent.parent.expression === parent;

      if (isForRoot) {
        const call = parent.parent as CallExpression;
        if (migrateForRoot(call)) {
          rewritten.add(node.text);
          migrated++;
        } else {
          report(call, binding, node.text);
        }
        // The call is either rewritten or reported; nothing inside is left to do.
        return;
      }

      if (ts.isArrayLiteralExpression(parent)) {
        edits.push({
          start: node.getStart(),
          end: node.getEnd(),
          text: standaloneFor(binding).join(', '),
        });
        rewritten.add(node.text);
        migrated++;
        return;
      }

      report(node, binding, node.text);
      return;
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(file, visit);

  if (!edits.length && !unresolved.length) return null;

  // Import declarations: drop the deprecated names that no longer have a use,
  // and add the standalone ones to the first declaration of each package.
  for (const [pkg, decls] of declarations) {
    decls.forEach((declaration, index) => {
      const namedImports = declaration.importClause?.namedBindings;
      if (!namedImports || !ts.isNamedImports(namedImports)) return;

      const kept = namedImports.elements.filter((element) => {
        const binding = bindings.get(element.name.text);
        const isDeprecated =
          binding &&
          !element.isTypeOnly &&
          (element.propertyName ?? element.name).text === binding.imported;
        return !(
          isDeprecated &&
          rewritten.has(element.name.text) &&
          !blocked.has(element.name.text)
        );
      });
      const additions = index === 0 ? [...(added.get(pkg) ?? [])] : [];

      if (
        kept.length === namedImports.elements.length &&
        additions.length === 0
      )
        return;

      if (!kept.length && !additions.length) {
        const end = declaration.getEnd();
        edits.push({
          start: declaration.getStart(),
          end: source[end] === '\n' ? end + 1 : end,
          text: '',
        });
        return;
      }

      edits.push({
        start: namedImports.getStart(),
        end: namedImports.getEnd(),
        text: `{ ${[...kept.map((element) => element.getText()), ...additions].join(', ')} }`,
      });
    });
  }

  let content = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    content =
      content.slice(0, edit.start) + edit.text + content.slice(edit.end);
  }

  return { content, migrated, unresolved };
}

/** Walks every `.ts` file in the tree, rewriting the deprecated modules. */
export function migrateDeprecatedModules(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    let migrated = 0;
    let unresolved = 0;

    for (const path of collectFiles(tree, '', ['.ts', '.mts'])) {
      const source = tree.read(path)?.toString();
      if (!source) continue;

      const result = migrateDeprecatedModulesSource(source);
      if (!result) continue;

      if (result.content !== source) tree.overwrite(path, result.content);
      migrated += result.migrated;

      for (const usage of result.unresolved) {
        unresolved++;
        context.logger.warn(
          `  ↳ ${path}:${usage.line} uses ${usage.name} in a form this migration cannot rewrite.\n` +
            `    It is deprecated and will be removed in v10 - replace it by hand.`,
        );
      }
    }

    if (migrated) {
      context.logger.info(
        `  ↳ Replaced ${migrated} deprecated module usage(s) with the standalone API.\n` +
          `    The directive and pipe are both added, because that is what the module exported, so a\n` +
          `    component that uses only one of them now has an unused import. Remove those with Angular's\n` +
          `    own migration:\n` +
          `      ng generate @angular/core:cleanup-unused-imports\n` +
          `    https://angular.dev/reference/migrations/cleanup-unused-imports`,
      );
    }

    if (!migrated && !unresolved) {
      context.logger.info('  ↳ No deprecated module usages found.');
    }
  };
}
