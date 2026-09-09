import { Component, inject, Injector, OnInit } from '@angular/core';
import { fakeAsync } from '@angular/core/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator';

import { TranslocoService } from '../transloco.service';
import { TRANSLOCO_SCOPE } from '../transloco-scope';
import { TRANSLOCO_LANG } from '../transloco-lang';
import { injectTransloco, TranslocoRef } from '../transloco.inject';
import { translocoConfig } from '../transloco.config';
import { provideTransloco } from '../transloco.providers';

import { MockedLoader, providersMock, runLoader } from './mocks';

@Component({
  template: `
    <div id="text">{{ t('home') }}</div>
    <div id="alias">{{ t.translate('home') }}</div>
    <div id="object">{{ t.translateObject('nested').title }}</div>
    <div id="activeLang">{{ t.activeLang() }}</div>
    <div id="prefixed">{{ nested('title') }}</div>
    <div id="outside">{{ outsideInjectionContext('home') }}</div>
  `,
})
class TestComponent implements OnInit {
  private readonly injector = inject(Injector);

  t = injectTransloco();
  nested = this.t.read('nested');

  // Placeholder created in injection context (field initializer); reassigned
  // in ngOnInit to prove injectTransloco also works outside one, given an
  // explicit injector. Never actually rendered with this initial value.
  outsideInjectionContext: TranslocoRef = injectTransloco();

  ngOnInit(): void {
    this.outsideInjectionContext = injectTransloco({
      injector: this.injector,
    });
  }

  setOutsideInjectionContextWithoutInjector(): void {
    injectTransloco();
  }
}

describe('injectTransloco', () => {
  let spectator: Spectator<TestComponent>;
  const createComponent = createComponentFactory({
    component: TestComponent,
    providers: providersMock,
  });

  it(`GIVEN injectTransloco used as a callable
      WHEN translations are loaded
      THEN t(key) should return the translated text`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('#text')).toHaveText('home english');
  }));

  it(`GIVEN injectTransloco with static key
      WHEN translations haven't loaded yet
      THEN t(key) should return an empty string`, fakeAsync(() => {
    spectator = createComponent();
    spectator.detectChanges();
    expect(spectator.query('#text')).toHaveText('');
  }));

  it(`GIVEN injectTransloco
      WHEN calling t(key) and t.translate(key) with the same key
      THEN both should return the same translated text`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('#text')).toHaveText(
      spectator.query('#alias')!.textContent!,
    );
  }));

  it(`GIVEN injectTransloco
      WHEN calling t.translateObject(key)
      THEN it should return the translated object`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('#object')).toHaveText('Title english');
  }));

  it(`GIVEN injectTransloco
      WHEN reading t.activeLang
      THEN it should reflect TranslocoService's active language`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('#activeLang')).toHaveText('en');

    spectator.inject(TranslocoService).setActiveLang('es');
    spectator.detectChanges();
    expect(spectator.query('#activeLang')).toHaveText('es');
  }));

  it(`GIVEN t.read(prefix)
      WHEN calling the derived ref with a key
      THEN it should apply the prefix without loading a new scope`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    // 'nested.title' already exists in the root translation - read() only
    // prefixes keys, it never triggers a scope load of its own.
    expect(spectator.query('#prefixed')).toHaveText('Title english');
  }));

  it(`GIVEN injectTransloco with static key outside of an injection context
      WHEN called with an explicit injector
      THEN it should resolve translations normally`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('#outside')).toHaveText('home english');
  }));

  it(`GIVEN injectTransloco outside of an injection context
      WHEN called without an injector
      THEN it should throw`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(() =>
      spectator.component.setOutsideInjectionContextWithoutInjector(),
    ).toThrow();
  }));
});

@Component({
  // 'title' is deliberately unprefixed - injectTransloco/translateSignal auto-prefix keys
  // with the active scope (config.scopes.autoPrefixKeys), unlike the directive/pipe, which
  // require the caller to prefix manually.
  template: `<div id="scoped">{{ t('title') }}</div>`,
})
class TestScopedComponent {
  t = injectTransloco({ scope: 'lazy-page' });
}

describe('injectTransloco with scope', () => {
  let spectator: Spectator<TestScopedComponent>;
  const createComponent = createComponentFactory({
    component: TestScopedComponent,
    providers: providersMock,
  });

  it(`GIVEN injectTransloco with an options.scope
      WHEN the scope loads
      THEN it should also ensure the global lang loads alongside it
      AND react to later active-lang changes, like the directive/pipe do`, fakeAsync(() => {
    // injectTransloco resolves lazily, the first time t(key) is evaluated by
    // the template - which happens as part of Spectator's default initial
    // detectChanges(). reRenderOnLangChange must therefore be set before that
    // first render, same as the directive/pipe scope tests do.
    spectator = createComponent({ detectChanges: false });
    const service = spectator.inject(TranslocoService);
    service.config.reRenderOnLangChange = true;
    spectator.detectChanges();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('#scoped')).toHaveText('Admin Lazy english');

    service.setActiveLang('es');
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('#scoped')).toHaveText('Admin Lazy spanish');
  }));
});

@Component({
  template: `<div id="providedLang">{{ t('home') }}</div>`,
  providers: [{ provide: TRANSLOCO_LANG, useValue: 'es' }],
})
class TestProvidedLangComponent {
  t = injectTransloco();
}

describe('injectTransloco respects TRANSLOCO_LANG', () => {
  let spectator: Spectator<TestProvidedLangComponent>;
  const createComponent = createComponentFactory({
    component: TestProvidedLangComponent,
    providers: providersMock,
  });

  it(`GIVEN a component providing TRANSLOCO_LANG
      WHEN injectTransloco is used without an explicit lang option
      THEN it should translate using the provided language`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('#providedLang')).toHaveText('home spanish');
  }));
});

@Component({
  template: `<div id="providedScope">{{ t('title') }}</div>`,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'lazy-page' }],
})
class TestProvidedScopeComponent {
  t = injectTransloco();
}

describe('injectTransloco respects TRANSLOCO_SCOPE', () => {
  let spectator: Spectator<TestProvidedScopeComponent>;
  const createComponent = createComponentFactory({
    component: TestProvidedScopeComponent,
    providers: providersMock,
  });

  it(`GIVEN a component providing TRANSLOCO_SCOPE
      WHEN injectTransloco is used without an explicit scope option
      THEN it should load and translate using the provided scope`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('#providedScope')).toHaveText('Admin Lazy english');
  }));
});

@Component({
  template: `
    <div id="bare">{{ t('title') }}</div>
    <div id="qualified">{{ t('lazyPage.title') }}</div>
    <div id="viaRead">{{ readT('title') }}</div>
  `,
})
class TestNoAutoPrefixComponent {
  t = injectTransloco({ scope: 'lazy-page' });
  // read() is a plain key prefix, independent of scopes.autoPrefixKeys - it's
  // the ergonomic replacement for auto-prefixing when that config is off.
  readT = this.t.read('lazyPage');
}

describe('injectTransloco with scopes.autoPrefixKeys disabled', () => {
  // injectTransloco never decides on its own whether to prefix a key - it hands the
  // resolved (possibly scope-embedded) path straight to service.translate()/
  // translateObject(), which is the only place scopes.autoPrefixKeys is honored. So
  // disabling that config is a supported migration path with no changes needed here:
  // callers just switch from relying on auto-prefixing to writing the fully-qualified
  // key themselves, optionally via t.read(prefix) instead of repeating it per call.
  let spectator: Spectator<TestNoAutoPrefixComponent>;
  const createComponent = createComponentFactory({
    component: TestNoAutoPrefixComponent,
    providers: provideTransloco({
      config: translocoConfig({
        availableLangs: ['en', 'es'],
        scopes: { autoPrefixKeys: false },
      }),
      loader: MockedLoader,
    }),
  });

  it(`GIVEN injectTransloco with a scope and scopes.autoPrefixKeys disabled
      WHEN the scope loads
      THEN an unprefixed key should not resolve, but a fully-qualified one should -
      whether written by hand or produced via read(prefix)`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    // Falls back to the missing-key handler's default (returns the key as-is).
    expect(spectator.query('#bare')).toHaveText('title');
    expect(spectator.query('#qualified')).toHaveText('Admin Lazy english');
    expect(spectator.query('#viaRead')).toHaveText('Admin Lazy english');
  }));
});
