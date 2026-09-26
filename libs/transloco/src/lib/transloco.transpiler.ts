import { inject, Injectable, InjectionToken, Injector } from '@angular/core';
import { isDefined, isObject, isString } from '@jsverse/utils';

import { Translation } from './transloco.types';
import { injectTranslocoConfig, TranslocoConfig } from './transloco.config';
import { HashMap } from './utils/type.utils';
import { getValue, setValue } from './utils/object.utils';
import {
  formatTranslocoError,
  TranslocoErrorCode,
} from './transloco-error-code';

export const TRANSLOCO_TRANSPILER =
  /* @__PURE__ */ new InjectionToken<TranslocoTranspiler>(
    typeof ngDevMode !== 'undefined' && ngDevMode ? 'TRANSLOCO_TRANSPILER' : '',
  );

/** Resolves the provided `TRANSLOCO_TRANSPILER`. */
export function injectTranspiler(): TranslocoTranspiler {
  return inject(TRANSLOCO_TRANSPILER);
}

// Unicode private-use characters that stand in for interpolation delimiters inside
// substituted values while a string is being transpiled
const ESCAPED_INTERPOLATION_START = '';
const ESCAPED_INTERPOLATION_END = '';

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
  protected config = injectTranslocoConfig();
  // The chain of keys currently being resolved, used to detect circular key references
  private resolvingKeys: string[] = [];

  protected get interpolationMatcher() {
    return resolveMatcher(this.config);
  }

  transpile({ value, params = {}, translation, key }: TranspileParams): any {
    if (isString(value)) {
      let paramMatch: RegExpExecArray | null;
      let parsedValue = value;
      const isEntryKey =
        this.resolvingKeys.length === 0 && translation[key] === value;
      if (isEntryKey) {
        this.resolvingKeys.push(key);
      }

      try {
        // Rescan after each replacement so replaced values can form dynamic key references,
        // e.g. `{{ common.{{ type }} }}`. Substituted values are escaped, so their own
        // interpolation syntax is never matched.
        while (
          (paramMatch = this.interpolationMatcher.exec(parsedValue)) !== null
        ) {
          const [match, paramValue] = paramMatch;
          parsedValue = parsedValue.replace(match, () => {
            const match = paramValue.trim();

            const param = getValue(params, match);
            if (isDefined(param)) {
              return this.escapeInterpolation(param);
            }

            return isDefined(translation[match])
              ? this.escapeInterpolation(
                  this.resolveKeyReference(match, {
                    params,
                    translation,
                    key,
                  }),
                )
              : '';
          });
        }
      } finally {
        if (isEntryKey) {
          this.resolvingKeys.pop();
        }
      }

      return this.unescapeInterpolation(parsedValue);
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

  private resolveKeyReference(
    referencedKey: string,
    { params, translation, key }: Omit<TranspileParams, 'value'>,
  ): unknown {
    if (this.resolvingKeys.includes(referencedKey)) {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const path = [...this.resolvingKeys, referencedKey].join(' -> ');
        throw new Error(`Circular key reference detected: ${path}`);
      }

      return '';
    }

    this.resolvingKeys.push(referencedKey);
    try {
      return this.transpile({
        params,
        translation,
        key,
        value: translation[referencedKey],
      });
    } finally {
      this.resolvingKeys.pop();
    }
  }

  private escapeInterpolation<T>(value: T): T | string {
    if (!isString(value)) return value;
    const [start, end] = this.config.interpolation;

    return value
      .replaceAll(start, ESCAPED_INTERPOLATION_START)
      .replaceAll(end, ESCAPED_INTERPOLATION_END);
  }

  private unescapeInterpolation(value: string): string {
    const [start, end] = this.config.interpolation;

    return value
      .replaceAll(ESCAPED_INTERPOLATION_START, start)
      .replaceAll(ESCAPED_INTERPOLATION_END, end);
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

const functionalCallRegExp = /\[\[\s*(\w+)\((.*?)\)\s*]]/g;

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
        functionalCallRegExp,
        (match: string, functionName: string, args: string) => {
          try {
            const func: TranslocoTranspilerFunction =
              this.injector.get(functionName);

            const transpiledArgs = this.transpile({
              value: getFunctionArgs(args),
              ...rest,
            });
            return func.transpile(...transpiledArgs);
          } catch (e: unknown) {
            let message: string;
            if (typeof ngDevMode !== 'undefined' && ngDevMode) {
              message = `There is an error in: '${value}'. 
                          Check that the you used the right syntax in your translation and that the implementation of ${functionName} is correct.`;
              if ((e as Error).message.includes('NullInjectorError')) {
                message = `You are using the '${functionName}' function in your translation but no provider was found!`;
              }
            } else {
              message = formatTranslocoError(
                TranslocoErrorCode.FunctionalTranspilerInvalidSyntax,
              );
            }

            throw new Error(message, { cause: e });
          }
        },
      );
    }

    return super.transpile({ value: transpiled, ...rest });
  }
}
