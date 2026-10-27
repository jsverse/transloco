import { isNamed, resolveImportedName } from '../../utils/ts-ast.utils.js';

import { buildKeysFromCall } from './build-keys-from-call.js';
import { SourceFileScan } from './scan-source-file.js';
import { TSExtractorResult } from './types.js';

const markerImport = /^@jsverse\/transloco-keys-manager(\/marker)?$/;

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
