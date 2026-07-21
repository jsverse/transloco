import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  Injector,
  Signal,
  untracked,
} from '@angular/core';

import { createTranslationSignal } from './transloco.signal';
import { TranslocoService } from './transloco.service';
import { Translation } from './transloco.types';
import { HashMap } from './utils/type.utils';

export interface InjectTranslocoOptions {
  scope?: string;
  lang?: string;
  injector?: Injector;
}

export interface TranslocoRef {
  (key: string, params?: HashMap): string;
  translate(key: string, params?: HashMap): string;
  translateObject(key: string, params?: HashMap): Record<string, string>;
  activeLang: Signal<string>;
  read(prefix: string): TranslocoRef;
}

/**
 * Injects a reactive, signal-based translation reference.
 *
 * Unlike `*transloco`, it isn't a structural directive, so it doesn't delay view
 * initialization - it can be used alongside a static `ViewChild`/`viewChild`.
 *
 * @example
 * t = injectTransloco();
 * // in the template:
 * {{ t('hello') }}
 *
 * @example
 * t = injectTransloco({ scope: 'todos' });
 * header = t.read('header');
 * // in the template:
 * {{ header('title') }}
 */
export function injectTransloco(
  options?: InjectTranslocoOptions,
): TranslocoRef {
  if (!options?.injector) {
    assertInInjectionContext(injectTransloco);
  }
  const injector = options?.injector ?? inject(Injector);

  return createTranslocoRef({
    injector,
    service: injector.get(TranslocoService),
    destroyRef: injector.get(DestroyRef),
    scope: options?.scope,
    lang: options?.lang,
    prefix: undefined,
  });
}

interface TranslocoRefContext {
  injector: Injector;
  service: TranslocoService;
  destroyRef: DestroyRef;
  scope: string | undefined;
  lang: string | undefined;
  prefix: string | undefined;
}

function createTranslocoRef(ctx: TranslocoRefContext): TranslocoRef {
  const translateMemo = new Map<string, Signal<string>>();
  const translateObjectMemo = new Map<string, Signal<Translation>>();
  ctx.destroyRef.onDestroy(() => {
    translateMemo.clear();
    translateObjectMemo.clear();
  });

  const withPrefix = (key: string) =>
    ctx.prefix ? `${ctx.prefix}.${key}` : key;

  /**
   * Gets-or-creates the memoized signal for `key`/`params` and returns its current
   * value. `create` only runs on a cache miss, and always `untracked` - `createTranslationSignal`
   * calls `toSignal` internally, which refuses to run inside a reactive context (e.g. the first
   * time `t(key)` is evaluated from within a template binding). Creating the signal is a one-off
   * side effect, not a reactive read, so it must happen untracked; reading it back (`signal()`)
   * stays tracked so callers in a template still subscribe to future changes.
   */
  const readMemoized = <T>(
    memo: Map<string, Signal<T>>,
    key: string,
    params: HashMap | undefined,
    create: (prefixedKey: string) => Signal<T>,
  ): T => {
    const prefixedKey = withPrefix(key);
    const memoKey = params
      ? `${prefixedKey}${JSON.stringify(params)}`
      : prefixedKey;
    let signal = memo.get(memoKey);
    if (!signal) {
      signal = untracked(() => create(prefixedKey));
      memo.set(memoKey, signal);
    }
    return signal();
  };

  const translate = (key: string, params?: HashMap): string =>
    readMemoized(translateMemo, key, params, (prefixedKey) =>
      createTranslationSignal(
        prefixedKey,
        params,
        { scope: ctx.scope, lang: ctx.lang },
        ctx.injector,
        { isObject: false },
      ),
    );

  const translateObject = (
    key: string,
    params?: HashMap,
  ): Record<string, string> =>
    readMemoized(translateObjectMemo, key, params, (prefixedKey) =>
      createTranslationSignal(
        prefixedKey,
        params,
        { scope: ctx.scope, lang: ctx.lang },
        ctx.injector,
        { isObject: true },
      ),
    );

  return Object.assign(translate, {
    translate,
    translateObject,
    activeLang: ctx.service.activeLang,
    read: (prefix: string) =>
      createTranslocoRef({
        ...ctx,
        prefix: withPrefix(prefix),
      }),
  }) as TranslocoRef;
}
