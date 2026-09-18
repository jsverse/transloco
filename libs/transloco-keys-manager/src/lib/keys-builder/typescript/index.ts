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
import { extractKeys } from '../utils/extract-keys';
import { resolveScopeAlias } from '../utils/resolvers.utils';

import { inlineTemplateExtractor } from './inline-template';
import { markerExtractor } from './marker.extractor';
import { pureFunctionExtractor } from './pure-function.extractor';
import { serviceExtractor } from './service.extractor';
import { signalExtractor } from './signal.extractor';

export function extractTSKeys(config: Config): ExtractionResult {
  return extractKeys(config, 'ts', TSExtractor);
}

const translocoImport = /@(jsverse|ngneat)\/transloco/;
const translocoKeysManagerImport = /@(jsverse|ngneat)\/transloco-keys-manager/;
function TSExtractor(config: ExtractorConfig): ScopeMap {
  const { file, scopes, defaultValue, scopeToKeys, serviceNames } = config;
  const content = readFile(file);
  const extractors = [];

  const hasTranslocoImport = translocoImport.test(content);
  const hasMarkerImport = translocoKeysManagerImport.test(content);
  const hasCustomService =
    serviceNames?.some((name) => content.includes(name)) ?? false;
  const hasTranslocoUsage = content.includes('transloco') || hasCustomService;

  if (hasTranslocoImport) {
    extractors.push(serviceExtractor, pureFunctionExtractor, signalExtractor);
  } else if (hasCustomService) {
    // Custom wrapper services live behind arbitrary import paths, so the
    // transloco import gate doesn't apply to them.
    extractors.push(serviceExtractor);
  }

  if (hasMarkerImport) {
    extractors.push(markerExtractor);
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
  if (!hasTranslocoUsage) {
    addCommentSectionKeys({
      content,
      regexFactory: regexFactoryMap.ts.comments,
      ...baseParams,
    });
    return scopeToKeys;
  }

  const ast = tsquery.ast(content, undefined, ScriptKind.TS);

  extractors
    .map((ex) => ex(ast, serviceNames))
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
