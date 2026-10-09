import { isNamed, resolveImportedName } from '../../utils/ts-ast.utils.js';

import { buildKeysFromCall } from './build-keys-from-call.js';
import { SourceFileScan } from './scan-source-file.js';
import { TSExtractorResult } from './types.js';

const translocoImport = /^@jsverse\/transloco/;

// `translateSignal('key')`, also under an import alias
export function signalExtractor({
  imports,
  calls,
}: SourceFileScan): TSExtractorResult {
  const signalName = resolveImportedName(
    imports,
    translocoImport,
    'translateSignal',
  );
  if (!signalName) return [];

  return calls
    .filter((call) => isNamed(call.expression, signalName))
    .flatMap(buildKeysFromCall);
}
