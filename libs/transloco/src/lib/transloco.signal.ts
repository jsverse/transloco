import {
  assertInInjectionContext,
  computed,
  inject,
  Injector,
  isSignal,
  runInInjectionContext,
  Signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

import { TRANSLOCO_SCOPE } from './transloco-scope';
import { TranslocoService } from './transloco.service';
import { HashMap, Translation, TranslocoScope } from './types';

type ScopeType = string | TranslocoScope | TranslocoScope[];
type SignalKey = Signal<string> | Signal<string[]> | Signal<string>[];
type TranslateSignalKey = string | string[] | SignalKey;
type TranslateSignalParams =
  | HashMap
  | HashMap<Signal<string>>
  | Signal<HashMap>;
type TranslateSignalRef<T> = T extends unknown[] | Signal<string[]>
  ? Signal<string[]>
  : Signal<string>;
type TranslateObjectSignalRef<T> = T extends unknown[] | Signal<string[]>
  ? Signal<Translation[]>
  : Signal<Translation>;

/**
 * Gets the translated value of a key as Signal
 *
 * @example
 * text = translateSignal('hello');
 * textList = translateSignal(['green', 'blue']);
 * textVar = translateSignal('hello', { variable: 'world' });
 * textSpanish = translateSignal('hello', { variable: 'world' }, 'es');
 * textTodosScope = translateSignal('hello', { variable: 'world' }, { scope: 'todos' });
 *
 * @example
 * dynamicKey = signal('hello');
 * dynamicParam = signal({ variable: 'world' });
 * text = translateSignal(this.dynamicKey, this.dynamicParam);
 *
 */
export function translateSignal<T extends TranslateSignalKey>(
  key: T,
  params?: TranslateSignalParams,
  lang?: ScopeType,
  injector?: Injector,
): TranslateSignalRef<T> {
  if (!injector) {
    assertInInjectionContext(translateSignal);
  }
  injector ??= inject(Injector);
  const result = runInInjectionContext(injector, () => {
    const service = inject(TranslocoService);
    const scope = resolveScope(lang);
    return toObservable(computerKeysAndParams(key, params)).pipe(
      switchMap((dynamic) =>
        service.selectTranslate(dynamic.key, dynamic.params, scope),
      ),
    );
  });
  return toSignal(result, { initialValue: Array.isArray(key) ? [''] : '' });
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
 * dynamicParam = signal({ variable: 'world' });
 * object = translateObjectSignal(this.dynamicKey, this.dynamicParam);
 */
export function translateObjectSignal<T extends TranslateSignalKey>(
  key: T,
  params?: TranslateSignalParams,
  lang?: ScopeType,
  injector?: Injector,
): TranslateObjectSignalRef<T> {
  if (!injector) {
    assertInInjectionContext(translateObjectSignal);
  }
  injector ??= inject(Injector);
  const result = runInInjectionContext(injector, () => {
    const service = inject(TranslocoService);
    const scope = resolveScope(lang);
    return toObservable(computerKeysAndParams(key, params)).pipe(
      switchMap((dynamic) =>
        service.selectTranslateObject(
          dynamic.key,
          dynamic.params,
          scope as string,
        ),
      ),
    );
  });
  return toSignal(result, { initialValue: Array.isArray(key) ? [] : {} });
}

function computerParams(params: HashMap<Signal<string>> | Signal<HashMap>) {
  if (isSignal(params)) {
    return computed(() => params());
  }
  return computed(() => {
    return Object.entries(params).reduce((acc, [key, value]) => {
      acc[key] = isSignal(value) ? value() : value;
      return acc;
    }, {} as HashMap);
  });
}

function computerKeys(
  keys: Signal<string> | Signal<string[]> | Signal<string>[],
) {
  if (Array.isArray(keys)) {
    return computed(() => keys.map((key) => (isSignal(key) ? key() : key)));
  }
  return computed(() => keys());
}

function isSignalKey(key: TranslateSignalKey): key is SignalKey {
  return Array.isArray(key) ? key.some(isSignal) : isSignal(key);
}

function isSignalParams(
  params?: HashMap,
): params is HashMap<Signal<string>> | Signal<HashMap> {
  return params
    ? isSignal(params) || Object.values(params).some(isSignal)
    : false;
}

function computerKeysAndParams(
  key: TranslateSignalKey,
  params?: TranslateSignalParams,
) {
  const computedKeys = isSignalKey(key)
    ? computerKeys(key)
    : computed(() => key);
  const computedParams = isSignalParams(params)
    ? computerParams(params)
    : computed(() => params);
  return computed(() => ({ key: computedKeys(), params: computedParams() }));
}

function resolveScope(scope?: ScopeType) {
  if (typeof scope === 'undefined' || scope === '') {
    const translocoScope = inject(TRANSLOCO_SCOPE, { optional: true });
    return translocoScope ?? undefined;
  }
  return scope;
}
