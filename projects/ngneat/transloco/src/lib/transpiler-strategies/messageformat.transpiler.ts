import { TranslocoTranspiler, DefaultTranspiler } from '../transloco.transpiler';
import { isString } from '../helpers';
import { HashMap, Translation } from '../types';

import MessageFormat from 'messageformat';

export class MessageFormatTranspiler implements TranslocoTranspiler {
  transpile(value: string, params: HashMap = {}, translation: Translation): string {
    const defaultTranspiler = new DefaultTranspiler();
    value = defaultTranspiler.transpile(value, params, translation);

    if (isString(value)) {
      const messageFormat = new MessageFormat();
      const message = messageFormat.compile(value);
      const transpiled = message(params);

      return transpiled;
    }

    return value;
  }
}
