import { fakeAsync } from '@angular/core/testing';
import {
  createComponentFactory,
  Spectator,
  SpectatorHost,
} from '@ngneat/spectator';
import { createFactory } from './shared';
import { providersMock, runLoader } from '../mocks';
import { Component, Provider } from '@angular/core';
import { TranslocoDirective } from '../../transloco.directive';
import { TRANSLOCO_SCOPE } from '../../transloco-scope';
import { TranslocoModule } from '../../transloco.module';

function getScopeProviders(): Provider[] {
  return [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'admin-page',
        alias: 'adminPageAlias',
      },
      multi: true,
    },
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'lazy-page',
        alias: 'lazyPage',
      },
      multi: true,
    },
  ];
}

function getNestedScopeProviders(): Provider[] {
  return [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: [
        {
          scope: 'admin-page',
          alias: 'adminPageAlias',
        },
        {
          scope: 'lazy-page',
          alias: 'lazyPage',
        },
      ],
      multi: true,
    },
  ];
}

describe('Scope alias', () => {
  let spectator: SpectatorHost<TranslocoDirective>;

  const createHostWithSeparateScopes = createFactory(getScopeProviders());
  const createHostWithNestedScopes = createFactory(getScopeProviders());
  const template = `<section *transloco="let t;">
    <div>
      {{t('adminPageAlias.title')}}<br />
      {{t('lazyPage.title')}}
    </div>
  </section>
  `;

  it('should support multiple scopes with aliases provided separately', fakeAsync(() => {
    spectator = createHostWithSeparateScopes(template);
    runLoader();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('div')).toHaveText('Admin english', false);
    expect(spectator.query('div')).toHaveText('Admin Lazy english', false);
  }));

  it('should support nested scopes with aliases', fakeAsync(() => {
    spectator = createHostWithNestedScopes(template);
    runLoader();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('div')).toHaveText('Admin english', false);
    expect(spectator.query('div')).toHaveText('Admin Lazy english', false);
  }));
});

@Component({
  template: `
    <p>{{ 'lazyPage.title' | transloco }}</p>
    <span>{{ 'adminPageAlias.title' | transloco }}</span>
    <h1>{{ 'nested.title' | transloco }}</h1>
  `,
})
class TestPipe {}

describe('Scope alias pipe', () => {
  let spectator: Spectator<TestPipe>;
  const createComponentFactoryWithProviders = (providers: Provider[]) =>
    createComponentFactory({
      component: TestPipe,
      imports: [TranslocoModule],
      providers: [providersMock, providers],
    });
  const createComponentSeparateScopes = createComponentFactoryWithProviders(
    getScopeProviders()
  );
  const createComponentNestedScopes = createComponentFactoryWithProviders(
    getNestedScopeProviders()
  );

  it('should support multiple scope aliases provided separately', fakeAsync(() => {
    spectator = createComponentSeparateScopes();
    runLoader();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('p')).toHaveText('Admin Lazy english');
    expect(spectator.query('span')).toHaveText('Admin english');
  }));

  it('should support nested scope aliases', fakeAsync(() => {
    spectator = createComponentNestedScopes();
    runLoader();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('p')).toHaveText('Admin Lazy english');
    expect(spectator.query('span')).toHaveText('Admin english');
  }));
});
