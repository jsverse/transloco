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

// A private-use character that prefixes escaped characters while a string is being transpiled.
// Substituted values have it and every interpolation delimiter character escaped, so they can
// never form a new placeholder. It is also escaped in the transpiled value itself, so private-use
// characters that are already in a translation or a param survive the round trip.
const ESCAPE_CHAR = '\uE000';
const ESCAPED_CHAR_CODE_OFFSET = ESCAPE_CHAR.charCodeAt(0) + 1;
const ESCAPED_CHAR_MATCHER = new RegExp(`${ESCAPE_CHAR}(.)`, 'gs');

// The chain of keys currently being resolved per translation, used to detect circular key references
const resolvingKeysByTranslation = new WeakMap<Translation, string[]>();

class CircularKeyReferenceError extends Error {}

function getResolvingKeys(translation: Translation): string[] {
  let resolvingKeys = resolvingKeysByTranslation.get(translation);
  if (!resolvingKeys) {
    resolvingKeys = [];
    resolvingKeysByTranslation.set(translation, resolvingKeys);
  }

  return resolvingKeys;
}

/**
 * Marks `key` as being resolved when `value` is its translation, so references back to it are detected.
 * Returns whether the key was marked, in which case the caller must release it with `releaseEntryKey`.
 */
function enterEntryKey({ value, translation, key }: TranspileParams): boolean {
  if (
    !isString(value) ||
    !isObject(translation) ||
    translation[key] !== value
  ) {
    return false;
  }

  const resolvingKeys = getResolvingKeys(translation);
  if (resolvingKeys.includes(key)) {
    return false;
  }

  resolvingKeys.push(key);

  return true;
}

function releaseEntryKey(translation: Translation) {
  getResolvingKeys(translation).pop();
}

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
  // The characters escaped in substituted values, the index of each one encodes it
  private escapedChars?: string[];

  protected get interpolationMatcher() {
    return resolveMatcher(this.config);
  }

  transpile({ value, params = {}, translation, key }: TranspileParams): any {
    if (isString(value)) {
      let paramMatch: RegExpExecArray | null;
      let parsedValue = this.escapeTranspiledValue(value);
      const isEntryKey = enterEntryKey({ value, translation, key });

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
              return this.escapeSubstitutedValue(param);
            }

            return isDefined(translation[match])
              ? this.escapeSubstitutedValue(
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
          releaseEntryKey(translation);
        }
      }

      return this.unescapeValue(parsedValue);
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
    const resolvingKeys = getResolvingKeys(translation);
    if (resolvingKeys.includes(referencedKey)) {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const path = [...resolvingKeys, referencedKey].join(' -> ');
        throw new CircularKeyReferenceError(
          `Circular key reference detected: ${path}`,
        );
      }

      return '';
    }

    resolvingKeys.push(referencedKey);
    try {
      return this.transpile({
        params,
        translation,
        key,
        value: translation[referencedKey],
      });
    } finally {
      resolvingKeys.pop();
    }
  }

  private getEscapedChars(): string[] {
    if (!this.escapedChars) {
      const [start, end] = this.config.interpolation;
      this.escapedChars = Array.from(new Set(ESCAPE_CHAR + start + end));
    }

    return this.escapedChars;
  }

  private escapeChar(char: string): string {
    const index = this.getEscapedChars().indexOf(char);

    return index === -1
      ? char
      : ESCAPE_CHAR + String.fromCharCode(ESCAPED_CHAR_CODE_OFFSET + index);
  }

  // Escapes the escape character itself, so it isn't mistaken for an escape sequence
  private escapeTranspiledValue(value: string): string {
    return value.includes(ESCAPE_CHAR)
      ? value.replaceAll(ESCAPE_CHAR, this.escapeChar(ESCAPE_CHAR))
      : value;
  }

  // Escapes the escape character and every interpolation delimiter character
  private escapeSubstitutedValue<T>(value: T): T | string {
    if (
      !isString(value) ||
      !this.getEscapedChars().some((char) => value.includes(char))
    ) {
      return value;
    }

    let escaped = '';
    for (const char of value) {
      escaped += this.escapeChar(char);
    }

    return escaped;
  }

  private unescapeValue(value: string): string {
    if (!value.includes(ESCAPE_CHAR)) {
      return value;
    }

    const escapedChars = this.getEscapedChars();

    return value.replace(
      ESCAPED_CHAR_MATCHER,
      (_, code: string) =>
        escapedChars[code.charCodeAt(0) - ESCAPED_CHAR_CODE_OFFSET],
    );
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
    // Mark the key before calling functions, so references back to it from their arguments are detected
    const isEntryKey = enterEntryKey({ value, ...rest });
    try {
      return super.transpile({
        value: this.transpileFunctions(value, rest),
        ...rest,
      });
    } finally {
      if (isEntryKey) {
        releaseEntryKey(rest.translation);
      }
    }
  }

  private transpileFunctions(
    value: unknown,
    rest: Omit<TranspileParams, 'value'>,
  ): unknown {
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
            if (e instanceof CircularKeyReferenceError) {
              throw e;
            }

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

    return transpiled;
  }
}
