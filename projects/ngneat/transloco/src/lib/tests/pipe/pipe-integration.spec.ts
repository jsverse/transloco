import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { Component } from '@angular/core';
import { providersMock, runLoader } from '../transloco.mocks';
import {
  defaultConfig,
  TRANSLOCO_CONFIG,
  TRANSLOCO_LANG,
  TRANSLOCO_SCOPE,
  TranslocoConfig,
  TranslocoModule,
  TranslocoService
} from '@ngneat/transloco';
import { fakeAsync } from '@angular/core/testing';

@Component({
  template: `
    <p>{{ 'home' | transloco }}</p>
    <h1>{{ 'nested.title' | transloco }}</h1>
    <span>{{ 'alert' | transloco: { value: 'netanel' } }}</span>
  `
})
class TestPipe {}

describe('Pipe', () => {
  let spectator: Spectator<TestPipe>;
  const createComponent = createComponentFactory({
    component: TestPipe,
    imports: [TranslocoModule],
    providers: providersMock
  });

  it('should translate', fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('p')).toHaveText('home english');
    expect(spectator.query('h1')).toHaveText('Title english');
    expect(spectator.query('span')).toHaveText('alert netanel english');
  }));

  it('should translate and listen to lang changes', fakeAsync(() => {
    spectator = createComponent({
      detectChanges: false,
      providers: [
        {
          provide: TRANSLOCO_CONFIG,
          useValue: { ...defaultConfig, availableLangs: ['en', 'es'], reRenderOnLangChange: true } as TranslocoConfig
        }
      ]
    });
    const service = spectator.get(TranslocoService);
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
        useValue: 'es'
      },
      {
        provide: TRANSLOCO_CONFIG,
        useValue: { ...defaultConfig, availableLangs: ['en', 'es'], reRenderOnLangChange: true } as TranslocoConfig
      }
    ]
  });

  it('should support provider lang', fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('p')).toHaveText('home spanish');
    expect(spectator.query('h1')).toHaveText('Title spanish');
    expect(spectator.query('span')).toHaveText('alert netanel spanish');
    // not static should changed
    spectator.get(TranslocoService).setActiveLang('en');
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
        useValue: 'es|static'
      },
      {
        provide: TRANSLOCO_CONFIG,
        useValue: { ...defaultConfig, availableLangs: ['en', 'es'], reRenderOnLangChange: true } as TranslocoConfig
      }
    ]
  });

  it('should support provider lang static', fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('p')).toHaveText('home spanish');
    expect(spectator.query('h1')).toHaveText('Title spanish');
    expect(spectator.query('span')).toHaveText('alert netanel spanish');
    // static should NOT changed
    spectator.get(TranslocoService).setActiveLang('en');
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('p')).toHaveText('home spanish');
    expect(spectator.query('h1')).toHaveText('Title spanish');
    expect(spectator.query('span')).toHaveText('alert netanel spanish');
  }));
});

@Component({
  template: `
    <p>{{ 'lazyPage.title' | transloco }}</p>
    <h1>{{ 'nested.title' | transloco }}</h1>
    <span>{{ 'alert' | transloco: { value: 'netanel' } }}</span>
  `
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
        useValue: 'lazy-page'
      },
      {
        provide: TRANSLOCO_CONFIG,
        useValue: { ...defaultConfig, availableLangs: ['en', 'es'], reRenderOnLangChange: true } as TranslocoConfig
      }
    ]
  });

  it('should support scope', fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('p')).toHaveText('Admin Lazy english');
    expect(spectator.query('h1')).toHaveText('Title english');
    expect(spectator.query('span')).toHaveText('alert netanel english');
    // not static should changed
    spectator.get(TranslocoService).setActiveLang('es');
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('p')).toHaveText('Admin Lazy spanish');
    expect(spectator.query('h1')).toHaveText('Title spanish');
    expect(spectator.query('span')).toHaveText('alert netanel spanish');
  }));
});
