import { Inject, Injectable, InjectionToken, Injector, Optional } from '@angular/core';
import { HashMap, Translation } from './types';
import { getValue, isDefined, isObject, isString, setValue } from './helpers';
import { defaultConfig, TRANSLOCO_CONFIG, TranslocoConfig } from './transloco.config';

export const TRANSLOCO_TRANSPILER = new InjectionToken('TRANSLOCO_TRANSPILER');

export interface TranslocoTranspiler {
  transpile(value: any, params: HashMap, translation: HashMap): any;

  onLangChanged?(lang: string): void;
}

export class DefaultTranspiler implements TranslocoTranspiler {
  protected interpolationMatcher: RegExp;

  constructor(@Optional() @Inject(TRANSLOCO_CONFIG) userConfig?: TranslocoConfig) {
    this.interpolationMatcher = resolveMatcher(userConfig);
  }

  transpile(value: any, params: HashMap = {}, translation: Translation): any {
    if (isString(value)) {
      return value.replace(this.interpolationMatcher, (_, match) => {
        match = match.trim();
        if (isDefined(params[match])) {
          return params[match];
        }

        return isDefined(translation[match]) ? this.transpile(translation[match], params, translation) : '';
      });
    } else if (params) {
      if (isObject(value)) {
        value = this.handleObject(value, params, translation);
      } else if (Array.isArray(value)) {
        value = this.handleArray(value, params, translation);
      }
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

  protected handleArray(value: string[], params: HashMap = {}, translation: Translation) {
    return value.map(v => this.transpile(v, params, translation));
  }
}

function resolveMatcher(userConfig?: TranslocoConfig): RegExp {
  const [start, end] = userConfig && userConfig.interpolation ? userConfig.interpolation : defaultConfig.interpolation;

  return new RegExp(`${start}(.*?)${end}`, 'g');
}

export interface TranslocoTranspilerFunction {
  transpile(...args: string[]): any;
}

export function getFunctionArgs(argsString: string): string[] {
  const splitted = argsString ? argsString.split(',') : [];
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

@Injectable()
export class FunctionalTranspiler extends DefaultTranspiler implements TranslocoTranspiler {
  constructor(private injector: Injector) {
    super();
  }

  transpile(value: any, params: HashMap = {}, translation: Translation): any {
    let transpiled = value;
    if (isString(value)) {
      transpiled = value.replace(/\[\[\s*(\w+)\((.*)\)\s*]]/g, (match: string, functionName: string, args: string) => {
        try {
          const func: TranslocoTranspilerFunction = this.injector.get(functionName);

          return func.transpile(...getFunctionArgs(args));
        } catch (e) {
          let message = `There is an error in: '${value}'. 
                          Check that the you used the right syntax in your translation and that the implementation of ${functionName} is correct.`;
          if (e.message.includes('NullInjectorError')) {
            message = `You are using the '${functionName}' function in your translation but no provider was found!`;
          }
          throw new Error(message);
        }
      });
    }

    return super.transpile(transpiled, params, translation);
  }
}
