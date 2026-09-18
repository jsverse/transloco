import { tsquery, ScriptKind } from '@phenomnomnominal/tsquery';

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
const titleStrategyProviderUsage = /\bprovideTranslocoTitleStrategy\b/;
const routeTitleProperty = /\btitle\s*:/;

/**
 * Project-wide, one-time check for `provideTranslocoTitleStrategy()` usage:
 * it's typically called once (e.g. in `app.config.ts`), far from the route
 * files declaring `title` keys, so gating {@link routeTitleExtractor} per
 * file (like the other extractors gate on local imports) would miss it.
 */
function detectTitleStrategyProvider(config: Config): boolean {
  return resolveFileList(config, 'ts').some((file) =>
    titleStrategyProviderUsage.test(readFile(file)),
  );
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
