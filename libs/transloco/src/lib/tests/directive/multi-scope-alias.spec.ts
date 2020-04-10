import { fakeAsync } from '@angular/core/testing';
import { createComponentFactory, Spectator, SpectatorHost } from '@ngneat/spectator';
import { createFactory } from './shared';
import { providersMock, runLoader } from '../transloco.mocks';
import { Component } from '@angular/core';
import { TranslocoDirective } from '../../transloco.directive';
import { TRANSLOCO_SCOPE } from '../../transloco-scope';
import { TranslocoModule } from '../../transloco.module';

describe('Scope alias', () => {
  let spectator: SpectatorHost<TranslocoDirective>;

  const createHost = createFactory([
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'admin-page',
        alias: 'adminPageAlias'
      },
      multi: true
    },
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'lazy-page',
        alias: 'lazyPage'
      },
      multi: true
    }
  ]);

  it('should support multiple scopes with aliases', fakeAsync(() => {
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
  `
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
          alias: 'lazy'
        },
        multi: true
      },
      {
        provide: TRANSLOCO_SCOPE,
        useValue: {
          scope: 'admin-page',
          alias: 'admin'
        },
        multi: true
      }
    ]
  });

  it('should support multiple scope aliasses', fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('p')).toHaveText('Admin Lazy english');
    expect(spectator.query('span')).toHaveText('Admin english');
  }));
});
