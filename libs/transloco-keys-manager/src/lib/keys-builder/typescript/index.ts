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
import { scanSourceFile, SourceFileScan } from './scan-source-file';
import { serviceExtractor } from './service.extractor';
import { signalExtractor } from './signal.extractor';
import { TSExtractorResult } from './types';

export function extractTSKeys(config: Config): ExtractionResult {
  return extractKeys(config, 'ts', TSExtractor);
}

type TSExtractor = (scan: SourceFileScan) => TSExtractorResult;

const translocoImport = /@(jsverse|ngneat)\/transloco/;
const translocoKeysManagerImport = /@(jsverse|ngneat)\/transloco-keys-manager/;
function TSExtractor(config: ExtractorConfig): ScopeMap {
  const { file, scopes, defaultValue, scopeToKeys } = config;
  const content = readFile(file);
  const baseParams = { scopeToKeys, scopes, defaultValue };
  const commentParams = {
    content,
    regexFactory: regexFactoryMap.ts.comments,
    ...baseParams,
  };

  // Both import regexes contain "transloco", so this single check is enough
  // to skip the expensive AST parse for files that cannot hold any key.
  if (!content.includes('transloco')) {
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

  const scan = scanSourceFile(parseTsSource(content, file));

  for (const extractor of extractors) {
    for (const { key, lang, params } of extractor(scan)) {
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
