import { tsquery, ScriptKind } from '@phenomnomnominal/tsquery';
import ts, { SourceFile } from 'typescript';

import {
  Config,
  ExtractionResult,
  ExtractorConfig,
  ScopeMap,
  Scopes,
} from '../../types';
import { readFile } from '../../utils/file.utils';
import { regexFactoryMap } from '../../utils/regexs.utils';
import { addCommentSectionKeys } from '../add-comment-section-keys';
import { addKey } from '../add-key';
import { extractKeys, resolveFileList } from '../utils/extract-keys';
import { resolveScopeAlias } from '../utils/resolvers.utils';

import { inlineTemplateExtractor } from './inline-template';
import { markerExtractor } from './marker.extractor';
import { pureFunctionExtractor } from './pure-function.extractor';
import { routeTitleExtractor } from './route-title.extractor';
import { serviceExtractor } from './service.extractor';
import { signalExtractor } from './signal.extractor';

export function extractTSKeys(config: Config): ExtractionResult {
  const hasTitleStrategyProvider = detectTitleStrategyProvider(config);

  return extractKeys(config, 'ts', (extractorConfig) =>
    TSExtractor(extractorConfig, hasTitleStrategyProvider),
  );
}

const translocoImport = /@(jsverse|ngneat)\/transloco/;
const translocoKeysManagerImport = /@(jsverse|ngneat)\/transloco-keys-manager/;
const translocoRouterImport = /@(jsverse|ngneat)\/transloco\/router/;
const titleStrategyProviderUsage = /\bprovideTranslocoTitleStrategy\b/;
const routeTitleProperty = /\btitle\s*:/;
const PROVIDE_TITLE_STRATEGY = 'provideTranslocoTitleStrategy';

/**
 * Project-wide, one-time check for `provideTranslocoTitleStrategy()` usage:
 * it's typically called once (e.g. in `app.config.ts`), far from the route
 * files declaring `title` keys, so gating {@link routeTitleExtractor} per
 * file (like the other extractors gate on local imports) would miss it.
 *
 * A cheap text search narrows down candidate files first (most files don't
 * even mention `provideTranslocoTitleStrategy`), but the actual decision is
 * AST-based, resolved through the import binding from `@jsverse/transloco/router`
 * (or the legacy `@ngneat/transloco/router`) — a named import (optionally
 * aliased) or a namespace import — and only counts as "used" if that binding
 * is actually the callee of a `CallExpression`. This means:
 * - a bare import with no call, or a reference passed as an argument/value
 *   (not called) doesn't count;
 * - an unrelated local function/variable that happens to share the name
 *   `provideTranslocoTitleStrategy` (but isn't imported from the package)
 *   doesn't count either;
 * - both `import { provideTranslocoTitleStrategy as provideTitle } from '...'`
 *   and `import * as router from '...'; router.provideTranslocoTitleStrategy()`
 *   are correctly recognized as the real provider being used.
 */
function detectTitleStrategyProvider(config: Config): boolean {
  return resolveFileList(config, 'ts').some((file) => {
    const content = readFile(file);

    if (!titleStrategyProviderUsage.test(content)) return false;

    const ast = tsquery.ast(content, undefined, ScriptKind.TS);

    return isTitleStrategyProviderCalled(ast);
  });
}

/** @internal exported for unit testing only */
export function isTitleStrategyProviderCalled(ast: SourceFile): boolean {
  const { directNames, namespaceNames } =
    resolveTitleStrategyImportBindings(ast);

  if (directNames.size === 0 && namespaceNames.size === 0) return false;

  return tsquery(ast, 'CallExpression').some((node) => {
    if (!ts.isCallExpression(node)) return false;

    const { expression } = node;

    if (ts.isIdentifier(expression)) {
      return directNames.has(expression.text);
    }

    return (
      ts.isPropertyAccessExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      namespaceNames.has(expression.expression.text) &&
      expression.name.text === PROVIDE_TITLE_STRATEGY
    );
  });
}

/**
 * Resolves the local binding name(s) that refer to
 * `provideTranslocoTitleStrategy`, imported from `@jsverse/transloco/router`
 * (or `@ngneat/transloco/router`):
 * - `directNames`: names that refer to the export directly, whether imported
 *   as-is or aliased (`import { provideTranslocoTitleStrategy as provideTitle }`).
 * - `namespaceNames`: local names of a namespace import
 *   (`import * as router from '...'`), where usage looks like
 *   `router.provideTranslocoTitleStrategy()`.
 */
function resolveTitleStrategyImportBindings(ast: SourceFile) {
  const directNames = new Set<string>();
  const namespaceNames = new Set<string>();

  for (const statement of ast.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (!translocoRouterImport.test(statement.moduleSpecifier.text)) continue;

    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings) continue;

    if (ts.isNamedImports(namedBindings)) {
      for (const element of namedBindings.elements) {
        const importedName = (element.propertyName ?? element.name).text;
        if (importedName === PROVIDE_TITLE_STRATEGY) {
          directNames.add(element.name.text);
        }
      }
    } else if (ts.isNamespaceImport(namedBindings)) {
      namespaceNames.add(namedBindings.name.text);
    }
  }

  return { directNames, namespaceNames };
}

function TSExtractor(
  config: ExtractorConfig,
  hasTitleStrategyProvider: boolean,
): ScopeMap {
  const { file, scopes, defaultValue, scopeToKeys } = config;
  const content = readFile(file);
  const extractors = [];

  const hasTranslocoImport = translocoImport.test(content);
  const hasMarkerImport = translocoKeysManagerImport.test(content);
  const hasTranslocoUsage = content.includes('transloco');
  // Cheap pre-filter: only bother parsing this file's AST for route titles
  // if it actually declares a `title:` property.
  const hasRouteTitle =
    hasTitleStrategyProvider && routeTitleProperty.test(content);

  if (hasTranslocoImport) {
    extractors.push(serviceExtractor, pureFunctionExtractor, signalExtractor);
  }

  if (hasMarkerImport) {
    extractors.push(markerExtractor);
  }

  if (hasRouteTitle) {
    extractors.push(routeTitleExtractor);
  }

  const baseParams = {
    scopeToKeys,
    scopes,
    defaultValue,
  };

  // Skip expensive AST parsing if no transloco-related content found.
  // Note: hasTranslocoImport/hasMarkerImport imply hasTranslocoUsage, since
  // both import regexes match strings that contain "transloco", so checking
  // !hasTranslocoUsage alone is sufficient here.
  if (!hasTranslocoUsage && !hasRouteTitle) {
    addCommentSectionKeys({
      content,
      regexFactory: regexFactoryMap.ts.comments,
      ...baseParams,
    });
    return scopeToKeys;
  }

  const ast = tsquery.ast(content, undefined, ScriptKind.TS);

  extractors
    .map((ex) => ex(ast))
    .flat()
    .forEach(({ key, lang, params }) => {
      const [keyWithoutScope, scopeAlias] = resolveAliasAndKeyFromService(
        key,
        lang,
        scopes,
      );
      addKey({
        scopeAlias,
        keyWithoutScope,
        params,
        ...baseParams,
      });
    });

  /** Check for dynamic markings */
  addCommentSectionKeys({
    content,
    regexFactory: regexFactoryMap.ts.comments,
    ...baseParams,
  });

  inlineTemplateExtractor(ast, config);

  return scopeToKeys;
}

/**
 *
 * It can be one of the following:
 *
 * translate('2', {}, 'some/nested');
 * translate('3', {}, 'some/nested/en');
 * translate('globalKey');
 *
 */
function resolveAliasAndKeyFromService(
  key: string,
  scopePath: string,
  scopes: Scopes,
): [string, string | null] {
  // It means that it's the global
  if (!scopePath) {
    return [key, null];
  }

  const scopeAlias = resolveScopeAlias({ scopePath, scopes });

  return [key, scopeAlias];
}
