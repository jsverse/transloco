import { DefaultTranspiler, TranslocoTranspiler, Translation, HashMap } from '@ngneat/transloco';
import * as MessageFormat from 'messageformat';

export class MessageFormatTranspiler implements TranslocoTranspiler {
  defaultTranspiler: DefaultTranspiler = new DefaultTranspiler();
  //@ts-ignore
  messageFormat: MessageFormat = new MessageFormat();

  transpile(value: string, params: HashMap = {}, translation: Translation): string {
    if (!value) {
      return value;
    }

    // TODO: @shahar resolve object

    const transpiled = this.defaultTranspiler.transpile(value, params, translation);
    const message = this.messageFormat.compile(transpiled);

    return message(params);
  }
}
