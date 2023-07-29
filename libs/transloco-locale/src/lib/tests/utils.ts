import { coerceArray, isObject, isString, OrArray } from '@ngneat/transloco';
import { createPipeFactory } from '@ngneat/spectator';
import { Type } from '@angular/core';

import { BaseLocalePipe } from '../pipes';
import { provideTranslocoLocale } from '../transloco-locale.providers';
import { TranslocoLocaleConfig } from '../transloco-locale.types';

import {
  DEFAULT_CURRENCY_MOCK,
  DEFAULT_LOCALE_MOCK,
  LANG_LOCALE_MOCK,
  LOCALE_CURRENCY_MOCK,
  provideTranslocoServiceMock,
} from './mocks';

export function pipeTplFactory(pipeName: `transloco${string}`) {
  return function <T>(value: T, params: OrArray<string> = []) {
    let resolvedValue: T | string = value;

    if (isString(value)) {
      resolvedValue = `"${value}"`;
    } else if (isObject(value)) {
      resolvedValue = '{}';
    }

    return `{{ ${resolvedValue} | ${[pipeName, ...coerceArray(params)].join(
      ':'
    )} }}`;
  };
}

export function createLocalePipeFactory<T extends BaseLocalePipe>(
  pipe: Type<T>,
  providers?: TranslocoLocaleConfig
) {
  return createPipeFactory({
    pipe,
    providers: [
      provideTranslocoServiceMock(),
      provideTranslocoLocale({
        defaultLocale: DEFAULT_LOCALE_MOCK,
        defaultCurrency: DEFAULT_CURRENCY_MOCK,
        langToLocaleMapping: LANG_LOCALE_MOCK,
        localeToCurrencyMapping: LOCALE_CURRENCY_MOCK,
        ...providers,
      }),
    ],
  });
}
