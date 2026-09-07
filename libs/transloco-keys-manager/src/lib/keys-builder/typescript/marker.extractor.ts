import { isNamed, resolveImportedName } from '../../utils/ts-ast.utils';

import { buildKeysFromCall } from './build-keys-from-call';
import { SourceFileScan } from './scan-source-file';
import { TSExtractorResult } from './types';

const markerImport = /^@(jsverse|ngneat)\/transloco-keys-manager(\/marker)?$/;

// `marker('key')`, also under an import alias
export function markerExtractor({
  imports,
  calls,
}: SourceFileScan): TSExtractorResult {
  const markerName = resolveImportedName(imports, markerImport, 'marker');
  if (!markerName) return [];

  return calls
    .filter((call) => isNamed(call.expression, markerName))
    .flatMap(buildKeysFromCall);
}
