import {
  computed,
  inject,
  Injector,
  isSignal,
  runInInjectionContext,
  signal,
  Signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

import { TRANSLOCO_SCOPE } from './transloco-scope';
import { TranslocoService } from './transloco.service';
import {
  HashMap,
  TranslateObjectParams,
  Translation,
  TranslocoScope,
} from './types';

type ScopeType = string | TranslocoScope | TranslocoScope[];
type TranslateSignalKey = string | string[] | Signal<string> | Signal<string>[];
type translateObjectSignal =
  | TranslateObjectParams
  | Signal<string>
  | Signal<string>[];
type TranslateSignalRef<T> = T extends unknown[]
  ? Signal<string[]>
  : Signal<string>;
type TranslateObjectSignalRef<T> = T extends unknown[]
  ? Signal<Translation[]>
  : Signal<Translation>;

/**
 * Gets the translated value of a key as Signal
 *
 * @example
 * text = translateSignal('hello');
 * textList = translateSignal(['green', 'blue']);
 * textVar = translateSignal('hello', { variable: 'Word' });
 * textSpanish = translateSignal('hello', { variable: 'Word' }, 'es');
 * textTodosScope = translateSignal('hello', { variable: 'Word' }, { scope: 'todos' });
 *
 * @example
 * dynamicKey = signal('hello');
 * dynamicParam = signal('Word');
 * text = translateSignal(this.dynamicKey, { variable: this.dynamicParam });
 *
 */
export function translateSignal<T extends TranslateSignalKey>(
  key: T,
  params?: HashMap,
  lang?: ScopeType,
  injector?: Injector,
): TranslateSignalRef<T> {
  injector ??= inject(Injector);
  const result = runInInjectionContext(injector, () => {
    const service = inject(TranslocoService);
    const scope = (lang ??=
      inject(TRANSLOCO_SCOPE, { optional: true }) ?? lang);
    return toObservable(computerKeysAndParams(key, params)).pipe(
      switchMap((dynamic) =>
        service.selectTranslate(
          dynamic.key as string,
          dynamic.params,
          scope as string,
        ),
      ),
    );
  });
  return toSignal(result, {
    initialValue: Array.isArray(key) ? [] : '',
  }) as TranslateSignalRef<T>;
}

/**
 * Gets the translated object of a key as Signal
 *
 * @example
 * object = translateObjectSignal('nested.object');
 * title = object().title;
 *
 * @example
 * dynamicKey = signal('nested.object');
 * dynamicParam = signal('Word');
 * object = translateObjectSignal(this.dynamicKey, { variable: this.dynamicParam });
 */
export function translateObjectSignal<T extends TranslateSignalKey>(
  key: T,
  params?: HashMap,
  lang?: ScopeType,
  injector?: Injector,
): TranslateObjectSignalRef<T> {
  injector ??= inject(Injector);
  const result = runInInjectionContext(injector, () => {
    const service = inject(TranslocoService);
    const scope = (lang ??=
      inject(TRANSLOCO_SCOPE, { optional: true }) ?? lang);
    return toObservable(computerKeysAndParams(key, params)).pipe(
      switchMap((dynamic) =>
        service.selectTranslateObject(
          dynamic.key as string,
          dynamic.params,
          scope as string,
        ),
      ),
    );
  });
  return toSignal(result, { initialValue: Array.isArray(key) ? [] : {} });
}

function computerParams(params?: HashMap) {
  if (!params) {
    return signal(params).asReadonly();
  }
  const hasSignal = Object.values(params).some(isSignal);
  if (!hasSignal) {
    return signal(params).asReadonly();
  }
  const getter = computed(() => {
    return Object.entries(params).reduce((acc, [key, value]) => {
      acc[key] = isSignal(value) ? value() : value;
      return acc;
    }, {} as HashMap);
  });
  return getter;
}

function computerKeys<T extends TranslateSignalKey>(keys: T) {
  if (Array.isArray(keys)) {
    const hasSignal = keys.some(isSignal);
    if (!hasSignal) {
      return signal(keys).asReadonly();
    }
    const getter = computed(() => {
      return keys.map((key) => {
        return isSignal(key) ? key() : key;
      });
    });
    return getter;
  }
  if (isSignal(keys)) {
    return computed(() => keys());
  }
  return signal(keys).asReadonly();
}

function computerKeysAndParams(key: TranslateSignalKey, params?: HashMap) {
  const computedKeys = computerKeys(key);
  const computedParams = computerParams(params);
  return computed(() => ({ key: computedKeys(), params: computedParams() }));
}
