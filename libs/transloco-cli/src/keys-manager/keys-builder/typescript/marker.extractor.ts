import { isNamed, resolveImportedNames } from '../../utils/ts-ast.utils';

import { buildKeysFromCall } from './build-keys-from-call';
import { SourceFileScan } from './scan-source-file';
import { TSExtractorResult } from './types';

// `marker` is exported by the core package root only: not by its `/router`
// entry point, and no longer by the keys manager, whose exports v9 removed.
const markerImport = /^@jsverse\/transloco$/;

// `marker('key')`, also under an import alias
export function markerExtractor({
  imports,
  calls,
}: SourceFileScan): TSExtractorResult {
  const markerNames = resolveImportedNames(imports, markerImport, 'marker');
  if (!markerNames.length) return [];

  // A file can import it more than once, e.g. under an alias as well
  return calls
    .filter((call) =>
      markerNames.some((name) => isNamed(call.expression, name)),
    )
    .flatMap(buildKeysFromCall);
}
