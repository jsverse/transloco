import ts, { Node } from 'typescript';

import { hasDescendant, nameText } from '../../utils/ts-ast.utils.js';

import { buildKeysFromCall } from './build-keys-from-call.js';
import { SourceFileScan } from './scan-source-file.js';
import { TSExtractorResult } from './types.js';

const serviceMethods = new Set(['translate', 'selectTranslate']);

/**
 * `this.transloco.translate(...)`, `transloco.selectTranslate(...)` and any
 * other call on a local name bound to a `TranslocoService`.
 */
export function serviceExtractor({
  calls,
  serviceNames,
}: SourceFileScan): TSExtractorResult {
  if (!serviceNames.size) return [];

  const result: TSExtractorResult = [];
  for (const call of calls) {
    const callee = call.expression;
    if (
      ts.isPropertyAccessExpression(callee) &&
      serviceMethods.has(callee.name.text) &&
      refersToService(callee.expression, serviceNames)
    ) {
      result.push(...buildKeysFromCall(call));
    }
  }

  return result;
}

// `transloco`, `this.transloco`, `this.#transloco`, `this.transloco!` ...
function refersToService(receiver: Node, serviceNames: Set<string>) {
  const isService = (node: Node) => {
    const name = nameText(node);

    return !!name && serviceNames.has(name);
  };

  return isService(receiver) || hasDescendant(receiver, isService);
}
