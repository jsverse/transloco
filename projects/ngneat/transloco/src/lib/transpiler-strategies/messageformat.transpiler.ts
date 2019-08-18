import { TranslocoTranspiler, DefaultTranspiler } from '../transloco.transpiler';
import { HashMap, Translation } from '../types';

import MessageFormat from 'messageformat';

export class MessageFormatTranspiler implements TranslocoTranspiler {
  defaultTranspiler: DefaultTranspiler = new DefaultTranspiler();
  messageFormat: MessageFormat = new MessageFormat();

  transpile(value: string, params: HashMap = {}, translation: Translation): string {
    if (!value) {
      return value;
    }

    const transpiled = this.defaultTranspiler.transpile(value, params, translation);
    const message = this.messageFormat.compile(transpiled);

    return message(params);
  }
}
