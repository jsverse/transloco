import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  Injector,
  Signal,
  untracked,
} from '@angular/core';

import { translateObjectSignal, translateSignal } from './transloco.signal';
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
    scopeOrLang: combineScopeAndLang(options?.scope, options?.lang),
    prefix: undefined,
  });
}

interface TranslocoRefContext {
  injector: Injector;
  service: TranslocoService;
  destroyRef: DestroyRef;
  scopeOrLang: string | undefined;
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
  const memoKeyFor = (key: string, params?: HashMap) =>
    params ? `${key}${JSON.stringify(params)}` : key;

  const translate = (key: string, params?: HashMap): string => {
    const prefixedKey = withPrefix(key);
    const memoKey = memoKeyFor(prefixedKey, params);
    let signal = translateMemo.get(memoKey);
    if (!signal) {
      // `translateSignal` calls `toSignal` internally, which refuses to run
      // inside a reactive context (e.g. the first time `t(key)` is evaluated
      // from within a template binding). Creating it is a one-off side
      // effect, not a reactive read, so it must happen untracked; the actual
      // `signal()` read below stays tracked.
      signal = untracked(() =>
        translateSignal(prefixedKey, params, ctx.scopeOrLang, ctx.injector),
      );
      translateMemo.set(memoKey, signal);
    }
    return signal();
  };

  const translateObject = (
    key: string,
    params?: HashMap,
  ): Record<string, string> => {
    const prefixedKey = withPrefix(key);
    const memoKey = memoKeyFor(prefixedKey, params);
    let signal = translateObjectMemo.get(memoKey);
    if (!signal) {
      signal = untracked(() =>
        translateObjectSignal(
          prefixedKey,
          params,
          ctx.scopeOrLang,
          ctx.injector,
        ),
      );
      translateObjectMemo.set(memoKey, signal);
    }
    return signal();
  };

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

function combineScopeAndLang(
  scope?: string,
  lang?: string,
): string | undefined {
  if (scope && lang) {
    return `${scope}/${lang}`;
  }
  return scope ?? lang;
}
