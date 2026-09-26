import {
  Config,
  ExtractionResult,
  ExtractorConfig,
  ScopeMap,
  Scopes,
} from '../../types';
import { readFile } from '../../utils/file.utils';
import { regexFactoryMap } from '../../utils/regexs.utils';
import { parseTsSource } from '../../utils/ts-ast.utils';
import { addCommentSectionKeys } from '../add-comment-section-keys';
import { addKey } from '../add-key';
import { extractKeys } from '../utils/extract-keys';
import { resolveScopeAlias } from '../utils/resolvers.utils';

import { inlineTemplateExtractor } from './inline-template';
import { markerExtractor } from './marker.extractor';
import { pureFunctionExtractor } from './pure-function.extractor';
import { routeTitleExtractor } from './route-title.extractor';
import { scanSourceFile, SourceFileScan } from './scan-source-file';
import { serviceExtractor } from './service.extractor';
import { signalExtractor } from './signal.extractor';
import {
  importsTitleStrategyProvider,
  mentionsTitleStrategyProvider,
} from './title-strategy-provider.detector';
import { TSExtractorResult } from './types';

/**
 * Route title keys are collected while extracting, but only applied once some
 * file turned out to import `provideTranslocoTitleStrategy`; otherwise they're
 * discarded, as plain `title` properties aren't translation keys without it.
 */
interface RouteTitleCollector {
  providerUsed: boolean;
  pendingKeys: (() => void)[];
}

export function extractTSKeys(config: Config): ExtractionResult {
  const routeTitles: RouteTitleCollector = {
    providerUsed: false,
    pendingKeys: [],
  };

  const result = extractKeys(config, 'ts', (extractorConfig) =>
    TSExtractor(extractorConfig, routeTitles),
  );

  if (routeTitles.providerUsed) {
    routeTitles.pendingKeys.forEach((addPendingKeys) => addPendingKeys());
  }

  return result;
}

type TSExtractor = (scan: SourceFileScan) => TSExtractorResult;

const translocoImport = /@jsverse\/transloco/;
const translocoKeysManagerImport = /@jsverse\/transloco-keys-manager/;
const routeTitleProperty = /\btitle\s*:/;

function TSExtractor(
  config: ExtractorConfig,
  routeTitles: RouteTitleCollector,
): ScopeMap {
  const { file, scopes, defaultValue, scopeToKeys } = config;
  const content = readFile(file);
  const baseParams = { scopeToKeys, scopes, defaultValue };
  const commentParams = {
    content,
    regexFactory: regexFactoryMap.ts.comments,
    ...baseParams,
  };

  // Cheap pre-filters: only parse this file's AST for route titles / the
  // title strategy provider if it declares a `title:` property / mentions it.
  const hasRouteTitle = routeTitleProperty.test(content);
  const mentionsProvider =
    !routeTitles.providerUsed && mentionsTitleStrategyProvider(content);

  // Both import regexes contain "transloco", so this single check is enough
  // to skip the expensive AST parse for files that cannot hold any key.
  if (!content.includes('transloco') && !hasRouteTitle && !mentionsProvider) {
    addCommentSectionKeys(commentParams);
    return scopeToKeys;
  }

  const extractors: TSExtractor[] = [];
  if (translocoImport.test(content)) {
    extractors.push(serviceExtractor, pureFunctionExtractor, signalExtractor);
  }
  if (translocoKeysManagerImport.test(content)) {
    extractors.push(markerExtractor);
  }

  const ast = parseTsSource(content, file);
  const scan = scanSourceFile(ast);

  const addExtractedKeys = (results: TSExtractorResult) => {
    for (const { key, lang, params } of results) {
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
    }
  };

  for (const extractor of extractors) {
    addExtractedKeys(extractor(scan));
  }

  if (hasRouteTitle) {
    const routeTitleKeys = routeTitleExtractor(ast, scopes);

    if (routeTitleKeys.length) {
      routeTitles.pendingKeys.push(() => addExtractedKeys(routeTitleKeys));
    }
  }

  if (mentionsProvider && importsTitleStrategyProvider(ast)) {
    routeTitles.providerUsed = true;
  }

  /** Check for dynamic markings */
  addCommentSectionKeys(commentParams);

  inlineTemplateExtractor(scan, config);

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
