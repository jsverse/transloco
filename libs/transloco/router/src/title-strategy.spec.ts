import { Component } from '@angular/core';
import { fakeAsync, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import {
  provideRouter,
  RouterStateSnapshot,
  TitleStrategy,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import {
  provideTranslocoScope,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';

import { createService, providersMock } from '../../src/lib/tests/mocks';
import { loadLang } from '../../src/lib/tests/service/service-spec-utils';

import {
  provideTranslocoTitleStrategy,
  TranslocoTitleStrategy,
  TranslocoTitleStrategyConfig,
  TRANSLOCO_TITLE_STRATEGY_CONFIG,
} from './title-strategy';

/** A `Title` stand-in that actually tracks the current title, like the real service. */
function createTitleMock() {
  let current = '';
  return {
    getTitle: vi.fn(() => current),
    setTitle: vi.fn((title: string) => (current = title)),
  };
}

function createStrategy(
  service: TranslocoService,
  title: string | undefined,
  config: TranslocoTitleStrategyConfig = {},
) {
  const titleMock = createTitleMock();

  // `createService` already instantiated its own TestBed module; reset it so
  // we can configure a fresh one just for the strategy under test.
  TestBed.resetTestingModule();
  const strategy = TestBed.configureTestingModule({
    providers: [
      TranslocoTitleStrategy,
      { provide: TranslocoService, useValue: service },
      { provide: Title, useValue: titleMock },
      { provide: TRANSLOCO_TITLE_STRATEGY_CONFIG, useValue: config },
    ],
  }).inject(TranslocoTitleStrategy);

  // `buildTitle` resolves `snapshot.data[RouteTitleKey]` where `RouteTitleKey`
  // is an internal, non-exported symbol from `@angular/router`. Stubbing the
  // (public, inherited) `buildTitle` method lets us drive `updateTitle` with
  // an arbitrary resolved title key without depending on that internal.
  vi.spyOn(strategy, 'buildTitle').mockReturnValue(title);

  return { strategy, setTitle: titleMock.setTitle };
}

@Component({ template: `{{ 'title' | transloco }}`, imports: [TranslocoPipe] })
class ScopedPage {}

describe('TranslocoTitleStrategy', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it(`GIVEN a translation key set as the route title
      WHEN the route is activated
      THEN it sets the translated title on the document`, fakeAsync(() => {
    loadLang(service, 'en');
    const { strategy, setTitle } = createStrategy(service, 'nested.title');

    strategy.updateTitle({} as RouterStateSnapshot);

    expect(setTitle).toHaveBeenCalledWith('Title english');
  }));

  it(`GIVEN a route without a resolved title
      WHEN the route is activated
      THEN it does not set the document title`, fakeAsync(() => {
    loadLang(service, 'en');
    const { strategy, setTitle } = createStrategy(service, undefined);

    strategy.updateTitle({} as RouterStateSnapshot);

    expect(setTitle).not.toHaveBeenCalled();
  }));

  it(`GIVEN a route was activated with a translation key as its title
      WHEN the active language changes
      THEN it re-translates and re-applies the title without a new navigation`, fakeAsync(() => {
    loadLang(service, 'en');
    loadLang(service, 'es');
    const { strategy, setTitle } = createStrategy(service, 'nested.title');

    strategy.updateTitle({} as RouterStateSnapshot);
    setTitle.mockClear();

    service.setActiveLang('es');

    expect(setTitle).toHaveBeenCalledWith('Title spanish');
  }));

  it(`GIVEN a route was activated with an already-loaded translation key as
           its title
      WHEN an unrelated translation successfully finishes loading (e.g. a
           different scope than the one the title key belongs to)
      THEN it does not re-apply the title, since the translated value hasn't
           changed`, fakeAsync(() => {
    loadLang(service, 'en');
    const { strategy, setTitle } = createStrategy(service, 'nested.title');

    strategy.updateTitle({} as RouterStateSnapshot);
    setTitle.mockClear();

    loadLang(service, 'admin-page/en');

    expect(setTitle).not.toHaveBeenCalled();
  }));

  it(`GIVEN no navigation has occurred yet
      WHEN the active language changes
      THEN it does not set any document title`, fakeAsync(() => {
    loadLang(service, 'en');
    loadLang(service, 'es');
    const { setTitle } = createStrategy(service, 'nested.title');

    service.setActiveLang('es');

    expect(setTitle).not.toHaveBeenCalled();
  }));

  it(`GIVEN a route was activated with a translation key as its title
      WHEN the strategy is destroyed and the active language then changes
      THEN it no longer re-applies the title`, fakeAsync(() => {
    loadLang(service, 'en');
    loadLang(service, 'es');
    const { strategy, setTitle } = createStrategy(service, 'nested.title');

    strategy.updateTitle({} as RouterStateSnapshot);
    setTitle.mockClear();

    strategy.ngOnDestroy();
    service.setActiveLang('es');

    expect(setTitle).not.toHaveBeenCalled();
  }));

  it(`GIVEN provideTranslocoTitleStrategy
      WHEN read
      THEN it provides TranslocoTitleStrategy under the TitleStrategy token`, () => {
    expect(provideTranslocoTitleStrategy()).toEqual([
      { provide: TitleStrategy, useClass: TranslocoTitleStrategy },
      { provide: TRANSLOCO_TITLE_STRATEGY_CONFIG, useValue: {} },
    ]);
  });

  it(`GIVEN a scoped title key whose scope isn't loaded yet
      WHEN the route is activated
      THEN it does not translate the key or set a title`, fakeAsync(() => {
    loadLang(service, 'en');
    const translateSpy = vi.spyOn(service, 'translate');
    const missingHandlerSpy = vi.spyOn(service, '_handleMissingKey');
    const { strategy, setTitle } = createStrategy(service, 'adminPage.title');

    strategy.updateTitle({} as RouterStateSnapshot);

    expect(translateSpy).not.toHaveBeenCalled();
    expect(missingHandlerSpy).not.toHaveBeenCalled();
    expect(setTitle).not.toHaveBeenCalled();
  }));

  it(`GIVEN a scoped title key whose scope isn't loaded yet
      WHEN the route is activated and the scope then finishes loading
      THEN the title is set exactly once, to the translated key`, fakeAsync(() => {
    loadLang(service, 'en');
    const { strategy, setTitle } = createStrategy(service, 'adminPage.title');

    strategy.updateTitle({} as RouterStateSnapshot);
    expect(setTitle).not.toHaveBeenCalled();

    loadLang(service, 'admin-page/en');

    expect(setTitle).toHaveBeenCalledTimes(1);
    expect(setTitle).toHaveBeenCalledWith('Admin english');
  }));

  it(`GIVEN a route was activated with a translation key as its title
      WHEN the active language changes before the new language is loaded
      THEN the previous title is kept, with no raw key and no missing-handler
           call, until the new language finishes loading`, fakeAsync(() => {
    loadLang(service, 'en');
    const { strategy, setTitle } = createStrategy(service, 'nested.title');

    strategy.updateTitle({} as RouterStateSnapshot);
    setTitle.mockClear();

    const missingHandlerSpy = vi.spyOn(service, '_handleMissingKey');
    service.setActiveLang('es'); // not loaded yet

    expect(missingHandlerSpy).not.toHaveBeenCalled();
    expect(setTitle).not.toHaveBeenCalled();

    loadLang(service, 'es');

    expect(setTitle).toHaveBeenCalledTimes(1);
    expect(setTitle).toHaveBeenCalledWith('Title spanish');
  }));

  it(`GIVEN an already-loaded title key
      WHEN the route is activated
      THEN it translates and sets the title immediately, unchanged from
           before`, fakeAsync(() => {
    loadLang(service, 'en');
    const { strategy, setTitle } = createStrategy(service, 'nested.title');

    strategy.updateTitle({} as RouterStateSnapshot);

    expect(setTitle).toHaveBeenCalledTimes(1);
    expect(setTitle).toHaveBeenCalledWith('Title english');
  }));

  it(`GIVEN whenMissing: 'key'
      WHEN the route is activated with a scoped key whose scope isn't loaded
      THEN it falls back to translating (and showing) the raw key, matching
           the pre-existing behaviour`, fakeAsync(() => {
    loadLang(service, 'en');
    const missingHandlerSpy = vi.spyOn(service, '_handleMissingKey');
    const { strategy, setTitle } = createStrategy(service, 'adminPage.title', {
      whenMissing: 'key',
    });

    strategy.updateTitle({} as RouterStateSnapshot);

    expect(missingHandlerSpy).toHaveBeenCalledWith(
      'adminPage.title',
      undefined,
      {},
    );
    expect(setTitle).toHaveBeenCalledWith('adminPage.title');
  }));

  it(`GIVEN a format function
      WHEN the title is applied
      THEN it's applied to the translated title before Title.setTitle`, fakeAsync(() => {
    loadLang(service, 'en');
    const { strategy, setTitle } = createStrategy(service, 'nested.title', {
      format: (title) => `${title} - MyApp`,
    });

    strategy.updateTitle({} as RouterStateSnapshot);

    expect(setTitle).toHaveBeenCalledWith('Title english - MyApp');
  }));

  it(`GIVEN a route that declares its scope in providers and uses it in its component,
      with a scope-prefixed title
      WHEN the route is activated
      THEN the title is corrected once the scope finishes loading`, async () => {
    const titleMock = createTitleMock();
    const { setTitle } = titleMock;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        providersMock,
        { provide: Title, useValue: titleMock },
        provideTranslocoTitleStrategy(),
        provideRouter([
          {
            path: 'admin',
            component: ScopedPage,
            providers: [provideTranslocoScope('admin-page')],
            // The scope alias is the camel-cased scope name.
            title: 'adminPage.title',
          },
        ]),
      ],
    });

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin');

    // `MockedLoader` resolves after real 1s timers (lang, then scope).
    await vi.waitFor(
      () => expect(setTitle).toHaveBeenLastCalledWith('Admin english'),
      { timeout: 5000 },
    );
  });
});
