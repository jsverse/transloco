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
import { combineLatest, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { OrArray } from '@jsverse/utils';

import { LangResolver } from './lang-resolver';
import { ScopeResolver } from './scope-resolver';
import { TRANSLOCO_LANG } from './transloco-lang';
import { TRANSLOCO_SCOPE } from './transloco-scope';
import { TranslocoService } from './transloco.service';
import { Translation, TranslocoScope } from './transloco.types';
import {
  listenOrNotOperator,
  shouldListenToLangChanges,
} from './utils/lang.utils';
import {
  getLangFromScope,
  getScopeFromLang,
  isScopeObject,
  resolveInlineLoader,
} from './utils/scope.utils';
import { HashMap } from './utils/type.utils';

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
    return resolveTranslation$(service, key, params, lang, false);
  });
  return toSignal(result, {
    initialValue: Array.isArray(key) ? [''] : '',
    injector,
  });
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
    return resolveTranslation$(service, key, params, lang, true);
  });
  return toSignal(result, {
    initialValue: Array.isArray(key) ? [] : {},
    injector,
  });
}

/**
 * Builds the reactive pipeline shared by `translateSignal`/`translateObjectSignal`.
 *
 * Mirrors the structural directive/pipe resolution order (inline > provider > active for lang,
 * inline > provider for scope) and loads through `_loadDependencies` so the global lang is always
 * loaded alongside a scope, exactly like `TranslocoDirective`/`TranslocoPipe` already do.
 */
function resolveTranslation$(
  service: TranslocoService,
  key: TranslateSignalKey,
  params: TranslateSignalParams | undefined,
  lang: ScopeType | undefined,
  isObject: boolean,
): Observable<any> {
  const providerLang = inject(TRANSLOCO_LANG, { optional: true });
  const providerScope: OrArray<TranslocoScope> | null = inject(
    TRANSLOCO_SCOPE,
    { optional: true },
  );
  const { inlineScope, inlineLang } = splitInlineScopeOrLang(lang, service);
  const langResolver = new LangResolver();
  const scopeResolver = new ScopeResolver(service);
  const listenToLangChange = shouldListenToLangChanges(
    service,
    providerLang || inlineLang,
  );
  // Must be called synchronously, in injection context - it internally uses `toObservable`.
  const keysAndParams$ = computerKeysAndParams(key, params);

  const resolvePath$ = (
    resolvedLang: string,
    scope: TranslocoScope | null,
  ): Observable<string> => {
    const resolvedScope = isScopeObject(inlineScope)
      ? scopeResolver.resolve({ inline: undefined, provider: inlineScope })
      : scopeResolver.resolve({ inline: inlineScope, provider: scope });
    const path = langResolver.resolveLangPath(resolvedLang, resolvedScope);
    const inlineLoader = resolveInlineLoader(
      isScopeObject(inlineScope) ? inlineScope : scope,
      resolvedScope,
    );

    return service._loadDependencies(path, inlineLoader).pipe(map(() => path));
  };

  const path$ = service.langChanges$.pipe(
    switchMap((activeLang) => {
      const resolvedLang = langResolver.resolve({
        inline: inlineLang,
        provider: providerLang,
        active: activeLang,
      });

      return Array.isArray(providerScope)
        ? forkJoin(
            providerScope.map((scope) => resolvePath$(resolvedLang, scope)),
          ).pipe(map((paths) => paths[paths.length - 1]))
        : resolvePath$(resolvedLang, providerScope);
    }),
    listenOrNotOperator(listenToLangChange),
  );

  return combineLatest([path$, keysAndParams$]).pipe(
    map(([path, dynamic]) => {
      const currentLang = langResolver.resolveLangBasedOnScope(path);

      return isObject
        ? service.translateObject(dynamic.key, dynamic.params, currentLang)
        : service.translate(dynamic.key, dynamic.params, currentLang);
    }),
  );
}

/**
 * Splits the single `lang` argument accepted by `translateSignal`/`translateObjectSignal` into an
 * inline lang and/or inline scope, so both can be resolved independently against `TRANSLOCO_LANG`/
 * `TRANSLOCO_SCOPE` providers - the same precedence `LangResolver`/`ScopeResolver` already apply
 * for the directive/pipe.
 */
function splitInlineScopeOrLang(
  value: ScopeType | undefined,
  service: TranslocoService,
): { inlineScope?: TranslocoScope; inlineLang?: string } {
  if (value === undefined || value === '') {
    return {};
  }

  if (Array.isArray(value)) {
    return splitInlineScopeOrLang(value[value.length - 1], service);
  }

  if (isScopeObject(value)) {
    return { inlineScope: value };
  }

  if (service.isLang(value)) {
    return { inlineLang: value };
  }

  const langFromScope = getLangFromScope(value);
  if (service.isLang(langFromScope)) {
    // Fully resolved `scope/lang` combo, e.g. `todos/es`.
    return { inlineScope: getScopeFromLang(value), inlineLang: langFromScope };
  }

  return { inlineScope: value };
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
): Observable<{
  key: string | string[];
  params: HashMap | undefined;
}> {
  // Avoid async effect from toObservable for those that do not need it
  if (!isSignalKey(key) && !isSignalParams(params)) {
    return of({
      key,
      params,
    });
  }
  const computedKeys = isSignalKey(key)
    ? computerKeys(key)
    : computed(() => key);
  const computedParams = isSignalParams(params)
    ? computerParams(params)
    : computed(() => params);
  return toObservable(
    computed(() => ({ key: computedKeys(), params: computedParams() })),
  );
}
