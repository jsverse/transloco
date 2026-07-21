import { Component, inject, Injector, OnInit } from '@angular/core';
import { fakeAsync } from '@angular/core/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator';

import { TranslocoService } from '../transloco.service';
import { TRANSLOCO_SCOPE } from '../transloco-scope';
import { TRANSLOCO_LANG } from '../transloco-lang';
import { injectTransloco, TranslocoRef } from '../transloco.inject';

import { providersMock, runLoader } from './mocks';

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
  template: `<div id="scoped">{{ t('lazyPage.title') }}</div>`,
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
  template: `<div id="providedScope">{{ t('lazyPage.title') }}</div>`,
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
