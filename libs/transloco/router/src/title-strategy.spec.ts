import { fakeAsync, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { TranslocoService } from '@jsverse/transloco';

import { createService } from '../../src/lib/tests/mocks';
import { loadLang } from '../../src/lib/tests/service/service-spec-utils';

import {
  provideTranslocoTitleStrategy,
  TranslocoTitleStrategy,
} from './title-strategy';

function createStrategy(service: TranslocoService, title: string | undefined) {
  const setTitle = vi.fn();

  // `createService` already instantiated its own TestBed module; reset it so
  // we can configure a fresh one just for the strategy under test.
  TestBed.resetTestingModule();
  const strategy = TestBed.configureTestingModule({
    providers: [
      TranslocoTitleStrategy,
      { provide: TranslocoService, useValue: service },
      { provide: Title, useValue: { setTitle } },
    ],
  }).inject(TranslocoTitleStrategy);

  // `buildTitle` resolves `snapshot.data[RouteTitleKey]` where `RouteTitleKey`
  // is an internal, non-exported symbol from `@angular/router`. Stubbing the
  // (public, inherited) `buildTitle` method lets us drive `updateTitle` with
  // an arbitrary resolved title key without depending on that internal.
  vi.spyOn(strategy, 'buildTitle').mockReturnValue(title);

  return { strategy, setTitle };
}

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

  it(`GIVEN a route was activated with a translation key as its title
      WHEN a translation successfully finishes loading (e.g. a scoped/lazy
           translation not yet available on the first navigation to its route)
      THEN it re-applies the title without a new navigation`, fakeAsync(() => {
    loadLang(service, 'en');
    const { strategy, setTitle } = createStrategy(service, 'nested.title');

    strategy.updateTitle({} as RouterStateSnapshot);
    setTitle.mockClear();

    loadLang(service, 'admin-page/en');

    expect(setTitle).toHaveBeenCalledWith('Title english');
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
    expect(provideTranslocoTitleStrategy()).toEqual({
      provide: TitleStrategy,
      useClass: TranslocoTitleStrategy,
    });
  });
});
