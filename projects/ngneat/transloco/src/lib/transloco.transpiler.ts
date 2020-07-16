import { InjectionToken, Injector } from '@angular/core';
import { HashMap, Translation } from './types';
import { getValue, isString, isObject, setValue, isDefined } from './helpers';

export const TRANSLOCO_TRANSPILER = new InjectionToken('TRANSLOCO_TRANSPILER');

export interface TranslocoTranspiler {
  transpile(value: any, params: HashMap, translation: HashMap): any;
  onLangChanged?(lang: string): void;
}

export class DefaultTranspiler implements TranslocoTranspiler {
  transpile(value: any, params: HashMap = {}, translation: Translation): any {
    if (isString(value)) {
      return value.replace(/{{(.*?)}}/g, (_, match) => {
        match = match.trim();
        if (isDefined(params[match])) {
          return params[match];
        }

        return isDefined(translation[match]) ? this.transpile(translation[match], params, translation) : '';
      });
    }

    if (isObject(value) && params) {
      value = this.handleObject(value, params, translation);
    }

    return value;
  }

  /**
   *
   * @example
   *
   * const en = {
   *  a: {
   *    b: {
   *      c: "Hello {{ value }}"
   *    }
   *  }
   * }
   *
   * const params =  {
   *  "b.c": { value: "Transloco "}
   * }
   *
   * service.selectTranslate('a', params);
   *
   * // the first param will be the result of `en.a`.
   * // the second param will be `params`.
   * parser.transpile(value, params, {});
   *
   *
   */
  protected handleObject(value: any, params: HashMap = {}, translation: Translation) {
    let result = value;
    Object.keys(params).forEach(p => {
      // get the value of "b.c" inside "a" => "Hello {{ value }}"
      const v = getValue(result, p);
      // get the params of "b.c" => { value: "Transloco" }
      const getParams = getValue(params, p);

      // transpile the value => "Hello Transloco"
      const transpiled = this.transpile(v, getParams, translation);

      // set "b.c" to `transpiled`
      result = setValue(result, p, transpiled);
    });

    return result;
  }
}

export interface TranslocoTranspilerFunction {
  transpile(...args: string[]): any;
}

export class FunctionalTranspiler extends DefaultTranspiler implements TranslocoTranspiler {
  constructor(private injector: Injector) {
    super();
  }

  transpile(value: any, params: HashMap = {}, translation: Translation): any {
    if (isString(value)) {
      const transpiled = value.replace(
        /\[\[\s*(?<functionName>\w+)\((?<args>.*)\)\s*]]/g,
        (match: string, functionName: string, args: string) => {
          const func: TranslocoTranspilerFunction = this.injector.get(functionName);

          return func.transpile(...this.getFunctionArgs(args));
        }
      );

      return super.transpile(transpiled, params, translation);
    }

    if (isObject(value) && params) {
      value = this.handleObject(value, params, translation);
    }

    return value;
  }

  private getFunctionArgs(argsString: string): string[] {
    const splitted = argsString.split(',');
    const args = [];
    for (let i = 0; i < splitted.length; i++) {
      let value = splitted[i].trim();
      while (value[value.length - 1] === '\\') {
        i++;
        value = value.replace('\\', ',') + splitted[i];
      }
      args.push(value);
    }

    return args;
  }
}
