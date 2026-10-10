import { isNamed, resolveImportedName } from '../../utils/ts-ast.utils.js';

import { buildKeysFromCall } from './build-keys-from-call.js';
import { SourceFileScan } from './scan-source-file.js';
import { TSExtractorResult } from './types.js';

// The CLI's `/marker` subpath, plus the two paths of the package it replaced.
// Only the subpath of the CLI: its root exports no `marker`.
const markerImport =
  /^@jsverse\/(?:transloco-keys-manager(?:\/marker)?|transloco-cli\/marker)$/;

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
