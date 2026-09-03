import { isNamed, resolveImportedName } from '../../utils/ts-ast.utils';

import { buildKeysFromCall } from './build-keys-from-call';
import { SourceFileScan } from './scan-source-file';
import { TSExtractorResult } from './types';

const translocoImport = /^@(jsverse|ngneat)\/transloco/;

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
