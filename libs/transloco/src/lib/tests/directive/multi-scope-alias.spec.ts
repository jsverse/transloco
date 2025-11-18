import { fakeAsync } from '@angular/core/testing';
import {
  createComponentFactory,
  Spectator,
  SpectatorHost,
} from '@ngneat/spectator';
import { Component } from '@angular/core';

import { providersMock, runLoader } from '../mocks';
import { TranslocoDirective } from '../../transloco.directive';
import { TRANSLOCO_SCOPE } from '../../transloco-scope';
import { TranslocoModule } from '../../transloco.module';

import { createFactory } from './shared';

describe('Scope alias', () => {
  let spectator: SpectatorHost<TranslocoDirective>;

  const createHost = createFactory([
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
  ]);

  it(`GIVEN multiple scopes with aliases configured
      WHEN directive renders with aliased scope keys
      THEN should translate using both scope aliases`, fakeAsync(() => {
    spectator = createHost(`
        <section *transloco="let t;">
          <div>
            {{t('adminPageAlias.title')}}<br />
            {{t('lazyPage.title')}}
          </div>
        </section>
    `);
    runLoader();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('div')).toHaveText('Admin english', false);
    expect(spectator.query('div')).toHaveText('Admin Lazy english', false);
  }));
});

@Component({
  template: `
    <p>{{ 'lazy.title' | transloco }}</p>
    <span>{{ 'admin.title' | transloco }}</span>
    <h1>{{ 'nested.title' | transloco }}</h1>
  `,
})
class TestPipe {}

describe('Scope alias pipe', () => {
  let spectator: Spectator<TestPipe>;
  const createComponent = createComponentFactory({
    component: TestPipe,
    imports: [TranslocoModule],
    providers: [
      providersMock,
      {
        provide: TRANSLOCO_SCOPE,
        useValue: {
          scope: 'lazy-page',
          alias: 'lazy',
        },
        multi: true,
      },
      {
        provide: TRANSLOCO_SCOPE,
        useValue: {
          scope: 'admin-page',
          alias: 'admin',
        },
        multi: true,
      },
    ],
  });

  it(`GIVEN pipe with multiple scope aliases configured
      WHEN component renders with aliased scope keys
      THEN should translate using both scope aliases`, fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('p')).toHaveText('Admin Lazy english');
    expect(spectator.query('span')).toHaveText('Admin english');
  }));
});
