import { fakeAsync } from '@angular/core/testing';
import {
  createComponentFactory,
  Spectator,
  SpectatorHost,
} from '@ngneat/spectator/vitest';
import { Component } from '@angular/core';

import { providersMock, runLoader } from '../mocks';
import { TranslocoDirective } from '../../transloco.directive';
import { provideTranslocoScope } from '../../transloco.providers';
import { TranslocoPipe } from '../../transloco.pipe';

import { createFactory } from './shared';

describe('Scope alias', () => {
  let spectator: SpectatorHost<TranslocoDirective>;

  const createHost = createFactory(
    provideTranslocoScope(
      { scope: 'admin-page', alias: 'adminPageAlias' },
      { scope: 'lazy-page', alias: 'lazyPage' },
    ),
  );

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
  imports: [TranslocoDirective, TranslocoPipe],
})
class TestPipe {}

describe('Scope alias pipe', () => {
  let spectator: Spectator<TestPipe>;
  const createComponent = createComponentFactory({
    component: TestPipe,
    imports: [TranslocoDirective, TranslocoPipe],
    providers: [
      providersMock,
      provideTranslocoScope(
        { scope: 'lazy-page', alias: 'lazy' },
        { scope: 'admin-page', alias: 'admin' },
      ),
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
