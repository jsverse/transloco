import { inject, Injectable, InjectionToken, Injector } from '@angular/core';
import { isDefined, isObject, isString } from '@jsverse/utils';

import { Translation } from './transloco.types';
import {
  defaultConfig,
  TRANSLOCO_CONFIG,
  TranslocoConfig,
} from './transloco.config';
import { HashMap } from './utils/type.utils';
import { getValue, setValue } from './utils/object.utils';

export const TRANSLOCO_TRANSPILER = new InjectionToken<TranslocoTranspiler>(
  ngDevMode ? 'TRANSLOCO_TRANSPILER' : '',
);

export interface TranslocoTranspiler {
  transpile(params: TranspileParams): any;

  onLangChanged?(lang: string): void;
}

export interface TranspileParams<V = unknown> {
  value: V;
  params?: HashMap;
  translation: Translation;
  key: string;
}

@Injectable()
export class DefaultTranspiler implements TranslocoTranspiler {
  protected config =
    inject(TRANSLOCO_CONFIG, { optional: true }) ?? defaultConfig;

  protected get interpolationMatcher() {
    return resolveMatcher(this.config);
  }

  transpile({ value, params = {}, translation, key }: TranspileParams): any {
    if (isString(value)) {
      let paramMatch: RegExpExecArray | null;
      let parsedValue = value;

      while (
        (paramMatch = this.interpolationMatcher.exec(parsedValue)) !== null
      ) {
        const [match, paramValue] = paramMatch;
        parsedValue = parsedValue.replace(match, () => {
          const match = paramValue.trim();

          const param = getValue(params, match);
          if (isDefined(param)) {
            return param;
          }

          return isDefined(translation[match])
            ? this.transpile({
                params,
                translation,
                key,
                value: translation[match],
              })
            : '';
        });
      }

      return parsedValue;
    } else if (params) {
      if (isObject(value)) {
        value = this.handleObject({
          value,
          params,
          translation,
          key,
        });
      } else if (Array.isArray(value)) {
        value = this.handleArray({ value, params, translation, key });
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
  protected handleObject({
    value,
    params = {},
    translation,
    key,
  }: TranspileParams<Record<any, any>>) {
    let result = value;

    Object.keys(params).forEach((p) => {
      // transpile the value => "Hello Transloco"
      const transpiled = this.transpile({
        // get the value of "b.c" inside "a" => "Hello {{ value }}"
        value: getValue(result, p),
        // get the params of "b.c" => { value: "Transloco" }
        params: getValue(params, p),
        translation,
        key,
      });

      // set "b.c" to `transpiled`
      result = setValue(result, p, transpiled);
    });

    return result;
  }

  protected handleArray({ value, ...rest }: TranspileParams<unknown[]>) {
    return value.map((v) =>
      this.transpile({
        value: v,
        ...rest,
      }),
    );
  }
}

function resolveMatcher(config: TranslocoConfig): RegExp {
  const [start, end] = config.interpolation;

  return new RegExp(`${start}([^${start}${end}]*?)${end}`, 'g');
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
export class FunctionalTranspiler
  extends DefaultTranspiler
  implements TranslocoTranspiler
{
  protected injector = inject(Injector);

  transpile({ value, ...rest }: TranspileParams) {
    let transpiled = value;
    if (isString(value)) {
      transpiled = value.replace(
        /\[\[\s*(\w+)\((.*?)\)\s*]]/g,
        (match: string, functionName: string, args: string) => {
          try {
            const func: TranslocoTranspilerFunction =
              this.injector.get(functionName);

            return func.transpile(...getFunctionArgs(args));
          } catch (e: unknown) {
            let message = `There is an error in: '${value}'. 
                          Check that the you used the right syntax in your translation and that the implementation of ${functionName} is correct.`;
            if ((e as Error).message.includes('NullInjectorError')) {
              message = `You are using the '${functionName}' function in your translation but no provider was found!`;
            }
            throw new Error(message);
          }
        },
      );
    }

    return super.transpile({ value: transpiled, ...rest });
  }
}
