import { InjectionToken } from '@angular/core';
import { HashMap, Translation } from './types';
import { getValue, isString, isObject, setValue, isDefined } from './helpers';

export const TRANSLOCO_TRANSPILER = new InjectionToken('TRANSLOCO_TRANSPILER');

export interface TranslocoTranspiler {
  transpile(value: any, params: HashMap<any>, translation: HashMap): any;
}

export class DefaultTranspiler implements TranslocoTranspiler {
  transpile(value: any, params: HashMap<any> = {}, translation: Translation): any {
    if (isString(value)) {
      return value.replace(/{{(.*?)}}/g, function(_, match) {
        match = match.trim();
        if (isDefined(params[match])) {
          return params[match];
        }

        return isDefined(translation[match]) ? translation[match] : '';
      });
    }

    if (isObject(value) && params) {
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
      Object.keys(params).forEach(p => {
        // get the value of "b.c" inside "a" => "Hello {{ value }}"
        const v = getValue(value, p);
        // get the params of "b.c" => { value: "Transloco" }
        const getParams = getValue(params, p);

        // transpile the value => "Hello Transloco"
        const transpiled = this.transpile(v, getParams, translation);

        // set "b.c" to `transpiled`
        value = setValue(value, p, transpiled);
      });
    }

    return value;
  }
}
