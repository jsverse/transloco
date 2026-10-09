import { isNamed } from '../../utils/ts-ast.utils.js';

import { buildKeysFromCall } from './build-keys-from-call.js';
import { SourceFileScan } from './scan-source-file.js';
import { TSExtractorResult } from './types.js';

// `translate('key')` from `@jsverse/transloco`
export function pureFunctionExtractor({
  calls,
}: SourceFileScan): TSExtractorResult {
  return calls
    .filter((call) => isNamed(call.expression, 'translate'))
    .flatMap(buildKeysFromCall);
}
