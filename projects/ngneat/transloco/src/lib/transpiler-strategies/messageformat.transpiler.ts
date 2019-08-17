import { TranslocoTranspiler, DefaultTranspiler } from '../transloco.transpiler';
import { isString } from '../helpers';
import { HashMap, Translation } from '../types';

import * as MessageFormat from 'messageformat';

export class MessageFormatTranspiler implements TranslocoTranspiler {
  defaultTranspiler: DefaultTranspiler = new DefaultTranspiler();
  //@ts-ignore
  messageFormat: MessageFormat = new MessageFormat();

  transpile(value: string, params: HashMap = {}, translation: Translation): string {
    value = this.defaultTranspiler.transpile(value, params, translation);

    if (isString(value)) {
      const message = this.messageFormat.compile(value);
      const transpiled = message(params);

      return transpiled;
    }

    return value;
  }
}
