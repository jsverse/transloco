import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { Component } from '@angular/core';
import { fakeAsync } from '@angular/core/testing';

import { providersMock, runLoader } from '../mocks';
import { defaultConfig, TRANSLOCO_CONFIG } from '../../transloco.config';
import { TranslocoModule } from '../../transloco.module';
import { TranslocoService } from '../../transloco.service';
import { TRANSLOCO_LANG } from '../../transloco-lang';
import { TRANSLOCO_SCOPE } from '../../transloco-scope';

export const listenToLangChangesProvider = {
  provide: TRANSLOCO_CONFIG,
  useValue: {
    ...defaultConfig,
    availableLangs: ['en', 'es'],
    reRenderOnLangChange: true,
  },
};

@Component({
  template: `
    <p>{{ 'home' | transloco }}</p>
    <h1>{{ 'nested.title' | transloco }}</h1>
    <span>{{ 'alert' | transloco: { value: 'netanel' } }}</span>
    <h3>{{ 'alert' | transloco: { value: value } }}</h3>
    <h5>{{ 'home' | transloco: null : 'es' }}</h5>
  `,
})
class TestPipe {
  value = 'hey';
}

describe('Transloco Pipe', () => {
  describe('Pipe basic', () => {
    let spectator: Spectator<TestPipe>;
    const createComponent = createComponentFactory({
      component: TestPipe,
      imports: [TranslocoModule],
      providers: providersMock,
    });

    it(`GIVEN pipe with various translation keys
        WHEN translations are loaded
        THEN should translate all keys including params and inline lang`, fakeAsync(() => {
      spectator = createComponent();
      runLoader();
      spectator.detectChanges();
      expect(spectator.query('p')).toHaveText('home english');
      expect(spectator.query('h1')).toHaveText('Title english');
      expect(spectator.query('span')).toHaveText('alert netanel english');

      // should support inline lang
      expect(spectator.query('h5')).toHaveText('home spanish');
    }));

    it(`GIVEN pipe with dynamic params
        WHEN param values change
        THEN should update translation with new params`, fakeAsync(() => {
      spectator = createComponent();
      runLoader();
      spectator.detectChanges();
      expect(spectator.query('h3')).toHaveText('alert hey english');
      spectator.component.value = 'changed';
      spectator.detectChanges();
      expect(spectator.query('h3')).toHaveText('alert changed english');
    }));

    it(`GIVEN pipe with reRenderOnLangChange enabled
        WHEN active language changes
        THEN should update all translations`, fakeAsync(() => {
      spectator = createComponent({
        detectChanges: false,
        providers: [listenToLangChangesProvider],
      });
      const service = spectator.inject(TranslocoService);
      spectator.detectChanges();
      runLoader();
      spectator.detectChanges();
      expect(spectator.query('p')).toHaveText('home english');
      expect(spectator.query('h1')).toHaveText('Title english');
      expect(spectator.query('span')).toHaveText('alert netanel english');
      service.setActiveLang('es');
      runLoader();
      spectator.detectChanges();
      expect(spectator.query('p')).toHaveText('home spanish');
      expect(spectator.query('h1')).toHaveText('Title spanish');
      expect(spectator.query('span')).toHaveText('alert netanel spanish');
    }));
  });

  describe('Provider lang', () => {
    let spectator: Spectator<TestPipe>;
    const createComponent = createComponentFactory({
      component: TestPipe,
      imports: [TranslocoModule],
      providers: [
        providersMock,
        {
          provide: TRANSLOCO_LANG,
          useValue: 'es',
        },
        listenToLangChangesProvider,
      ],
    });

    it(`GIVEN pipe with provider lang
        WHEN active language changes
        THEN should update to active language`, fakeAsync(() => {
      spectator = createComponent();
      runLoader();
      spectator.detectChanges();
      expect(spectator.query('p')).toHaveText('home spanish');
      expect(spectator.query('h1')).toHaveText('Title spanish');
      expect(spectator.query('span')).toHaveText('alert netanel spanish');
      // not static should changed
      spectator.inject(TranslocoService).setActiveLang('en');
      runLoader();
      spectator.detectChanges();
      expect(spectator.query('p')).toHaveText('home english');
      expect(spectator.query('h1')).toHaveText('Title english');
      expect(spectator.query('span')).toHaveText('alert netanel english');
    }));
  });

  describe('Provider lang static', () => {
    let spectator: Spectator<TestPipe>;
    const createComponent = createComponentFactory({
      component: TestPipe,
      imports: [TranslocoModule],
      providers: [
        providersMock,
        {
          provide: TRANSLOCO_LANG,
          useValue: 'es|static',
        },
        listenToLangChangesProvider,
      ],
    });

    it(`GIVEN pipe with provider lang marked static
        WHEN active language changes
        THEN should keep static language unchanged`, fakeAsync(() => {
      spectator = createComponent();
      runLoader();
      spectator.detectChanges();
      expect(spectator.query('p')).toHaveText('home spanish');
      expect(spectator.query('h1')).toHaveText('Title spanish');
      expect(spectator.query('span')).toHaveText('alert netanel spanish');
      // static should NOT changed
      spectator.inject(TranslocoService).setActiveLang('en');
      runLoader();
      spectator.detectChanges();
      expect(spectator.query('p')).toHaveText('home spanish');
      expect(spectator.query('h1')).toHaveText('Title spanish');
      expect(spectator.query('span')).toHaveText('alert netanel spanish');
    }));
  });

  @Component({
    selector: 'transloco-scope-pipe',
    template: `
      <p>{{ 'lazyPage.title' | transloco }}</p>
      <h1>{{ 'nested.title' | transloco }}</h1>
      <span>{{ 'alert' | transloco: { value: 'netanel' } }}</span>
    `,
  })
  class TestScopePipe {}

  describe('Scope lang', () => {
    let spectator: Spectator<TestScopePipe>;
    const createComponent = createComponentFactory({
      component: TestScopePipe,
      imports: [TranslocoModule],
      providers: [
        providersMock,
        {
          provide: TRANSLOCO_SCOPE,
          useValue: 'lazy-page',
        },
        listenToLangChangesProvider,
      ],
    });

    it(`GIVEN pipe with scope provider
        WHEN translations are loaded and language changes
        THEN should use scoped translations`, fakeAsync(() => {
      spectator = createComponent();
      runLoader();
      spectator.detectChanges();
      expect(spectator.query('p')).toHaveText('Admin Lazy english');
      expect(spectator.query('h1')).toHaveText('Title english');
      expect(spectator.query('span')).toHaveText('alert netanel english');
      // not static should changed
      spectator.inject(TranslocoService).setActiveLang('es');
      runLoader();
      spectator.detectChanges();
      expect(spectator.query('p')).toHaveText('Admin Lazy spanish');
      expect(spectator.query('h1')).toHaveText('Title spanish');
      expect(spectator.query('span')).toHaveText('alert netanel spanish');
    }));
  });
});
