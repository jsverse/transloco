import { coerceArray, isObject, isString, OrArray } from '@jsverse/utils';
import { createPipeFactory } from '@ngneat/spectator/vitest';
import { Type } from '@angular/core';
import { vi, type MockInstance } from 'vitest';

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
      ':',
    )} }}`;
  };
}

/**
 * vi.spyOn calls through for plain methods, but not when the spied target
 * is used as a constructor (`new Intl.NumberFormat(...)`). Reconstruct the
 * original so `.format(...)` still works while recording the ctor args.
 *
 * Must be (re)created inside `beforeEach` since the base vitest config sets
 * `restoreMocks: true`, which restores mocks before each test.
 */
export function spyOnIntl(format: 'NumberFormat' | 'DateTimeFormat') {
  const Original = Intl[format];

  return vi.spyOn(Intl, format).mockImplementation(function (
    ...args: ConstructorParameters<typeof Original>
  ) {
    return new (Original as any)(...args);
  });
}

export function getIntlCallArgs(intlSpy: MockInstance) {
  const [locale, options] = intlSpy.mock.calls[0];

  return [locale!, options!] as const;
}

export function createLocalePipeFactory<T extends BaseLocalePipe>(
  pipe: Type<T>,
  providers?: TranslocoLocaleConfig,
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
