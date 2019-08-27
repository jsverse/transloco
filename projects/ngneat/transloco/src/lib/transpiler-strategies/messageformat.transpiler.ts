import { TranslocoTranspiler, DefaultTranspiler } from '../transloco.transpiler';
import { HashMap, Translation } from '../types';

import * as MessageFormat from 'messageformat';
import { isString } from '../helpers';

export class MessageFormatTranspiler implements TranslocoTranspiler {
  defaultTranspiler: DefaultTranspiler = new DefaultTranspiler();
  //@ts-ignore
  messageFormat: MessageFormat = new MessageFormat();

  transpile(value: string, params: HashMap = {}, translation: Translation): string {
    if (!value || isString(value) === false) {
      return value;
    }

    const transpiled = this.defaultTranspiler.transpile(value, params, translation);
    const message = this.messageFormat.compile(transpiled);

    return message(params);
  }
}
