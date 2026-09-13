import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

import { TranslationResolver } from '../translation-resolver';

describe('TranslationResolver', () => {
  let langChanges$: Subject<string>;
  let loadDependencies: ReturnType<typeof vi.fn>;
  let setScopeAlias: ReturnType<typeof vi.fn>;
  let service: any;
  let resolver: TranslationResolver;

  beforeEach(() => {
    langChanges$ = new Subject<string>();
    loadDependencies = vi.fn((path: string) => of('translation-for:' + path));
    setScopeAlias = vi.fn();
    service = {
      langChanges$,
      config: { reRenderOnLangChange: true, scopes: { keepCasing: false } },
      _loadDependencies: loadDependencies,
      _setScopeAlias: setScopeAlias,
    };
    resolver = new TranslationResolver(service);
  });

  it(`GIVEN a single provider scope
      WHEN resolve() is called and the active lang changes
      THEN it should load the resolved lang/scope path on every emission`, () => {
    const results: unknown[] = [];
    resolver
      .resolve({
        inlineLang: undefined,
        providerLang: undefined,
        inlineScope: undefined,
        providerScope: 'admin-page',
      })
      .subscribe((value) => results.push(value));

    langChanges$.next('en');
    langChanges$.next('es');

    expect(loadDependencies).toHaveBeenNthCalledWith(
      1,
      'admin-page/en',
      undefined,
    );
    expect(loadDependencies).toHaveBeenNthCalledWith(
      2,
      'admin-page/es',
      undefined,
    );
    expect(results).toEqual([
      { lang: 'en', translation: 'translation-for:admin-page/en' },
      { lang: 'es', translation: 'translation-for:admin-page/es' },
    ]);
  });

  it(`GIVEN an array of provider scopes
      WHEN resolve() is called
      THEN it should forkJoin every scope into a single ResolvedTranslation`, () => {
    let result: unknown;
    resolver
      .resolve({
        inlineLang: undefined,
        providerLang: undefined,
        inlineScope: undefined,
        providerScope: ['admin-page', 'todos-page'],
      })
      .pipe(take(1))
      .subscribe((value) => (result = value));

    langChanges$.next('en');

    expect(result).toEqual({
      lang: 'en',
      translation: [
        'translation-for:admin-page/en',
        'translation-for:todos-page/en',
      ],
    });
  });

  it(`GIVEN inline lang with the '|static' pipe
      WHEN resolve() is called and the active lang changes afterwards
      THEN it should only emit once and ignore further lang changes`, () => {
    const next = vi.fn();
    resolver
      .resolve({
        inlineLang: 'es|static',
        providerLang: undefined,
        inlineScope: undefined,
        providerScope: null,
      })
      .subscribe(next);

    langChanges$.next('en');
    langChanges$.next('fr');

    expect(next).toHaveBeenCalledTimes(1);
    expect(loadDependencies).toHaveBeenCalledWith('es', undefined);
  });

  it(`GIVEN reRenderOnLangChange config is false
      WHEN resolve() is called and the active lang changes afterwards
      THEN it should only emit once`, () => {
    service.config.reRenderOnLangChange = false;
    const next = vi.fn();
    resolver
      .resolve({
        inlineLang: undefined,
        providerLang: undefined,
        inlineScope: undefined,
        providerScope: 'admin-page',
      })
      .subscribe(next);

    langChanges$.next('en');
    langChanges$.next('fr');

    expect(next).toHaveBeenCalledTimes(1);
  });

  it(`GIVEN a provider scope object with an alias
      WHEN resolve() is called
      THEN it should set the scope alias on the service`, () => {
    resolver
      .resolve({
        inlineLang: undefined,
        providerLang: undefined,
        inlineScope: undefined,
        providerScope: { scope: 'admin-page', alias: 'admin' },
      })
      .subscribe();

    langChanges$.next('en');

    expect(setScopeAlias).toHaveBeenCalledWith('admin-page', 'admin');
  });

  it(`GIVEN a single provider scope
      WHEN resolve() is called
      THEN the emitted ResolvedTranslation should carry the lang used to load it`, () => {
    let result: unknown;
    resolver
      .resolve({
        inlineLang: undefined,
        providerLang: undefined,
        inlineScope: undefined,
        providerScope: 'admin-page',
      })
      .subscribe((value) => (result = value));

    langChanges$.next('en');

    expect(result).toEqual({
      lang: 'en',
      translation: 'translation-for:admin-page/en',
    });
  });

  it(`GIVEN both inline and provider lang with the '|static' pipe on inline only
      WHEN resolve() is called and the active lang changes afterwards
      THEN it should honor the inline lang's '|static' marker and only emit once`, () => {
    const next = vi.fn();
    resolver
      .resolve({
        inlineLang: 'es|static',
        providerLang: 'fr',
        inlineScope: undefined,
        providerScope: null,
      })
      .subscribe(next);

    langChanges$.next('en');
    langChanges$.next('de');

    expect(next).toHaveBeenCalledTimes(1);
    expect(loadDependencies).toHaveBeenCalledWith('es', undefined);
  });

  it(`GIVEN a single TranslationResolver instance
      WHEN resolve() is called twice with different inline langs
      THEN the second call should honor its own inline lang instead of the first call's`, () => {
    resolver
      .resolve({
        inlineLang: 'es',
        providerLang: undefined,
        inlineScope: undefined,
        providerScope: 'admin-page',
      })
      .subscribe();
    langChanges$.next('en');

    let secondResult: unknown;
    resolver
      .resolve({
        inlineLang: 'fr',
        providerLang: undefined,
        inlineScope: undefined,
        providerScope: 'admin-page',
      })
      .subscribe((value) => (secondResult = value));
    langChanges$.next('en');

    expect(secondResult).toEqual({
      lang: 'fr',
      translation: 'translation-for:admin-page/fr',
    });
  });

  it(`GIVEN a signal-based params function
      WHEN resolveSignal() is called and the active lang or params change
      THEN it should expose the resolved translation as a Signal`, () => {
    const inlineScope = signal<string | undefined>('admin-page');

    const translation = TestBed.runInInjectionContext(() =>
      resolver.resolveSignal(() => ({
        inlineLang: undefined,
        providerLang: undefined,
        inlineScope: inlineScope(),
        providerScope: null,
      })),
    );

    expect(translation()).toEqual(undefined);

    // toObservable() defers its first emission until effects flush.
    TestBed.tick();
    langChanges$.next('en');
    expect(translation()).toEqual({
      lang: 'en',
      translation: 'translation-for:admin-page/en',
    });

    inlineScope.set('todos-page');
    TestBed.tick();
    langChanges$.next('en');
    expect(translation()).toEqual({
      lang: 'en',
      translation: 'translation-for:todos-page/en',
    });
  });
});
