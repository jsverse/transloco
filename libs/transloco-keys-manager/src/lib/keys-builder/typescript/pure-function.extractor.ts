import { isNamed } from '../../utils/ts-ast.utils';

import { buildKeysFromCall } from './build-keys-from-call';
import { SourceFileScan } from './scan-source-file';
import { TSExtractorResult } from './types';

// `translate('key')` from `@jsverse/transloco`
export function pureFunctionExtractor({
  calls,
}: SourceFileScan): TSExtractorResult {
  return calls
    .filter((call) => isNamed(call.expression, 'translate'))
    .flatMap(buildKeysFromCall);
}
