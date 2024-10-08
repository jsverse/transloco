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
        scope: 'lazy-page',
        alias: 'lazy',
      },
    },
  ]);

  it('should support scope alias', fakeAsync(() => {
    spectator = createHost(
      `<section *transloco="let t;"><div>{{t('lazy.title')}}</div></section>`,
    );
    runLoader();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('div')).toHaveText('Admin Lazy english');
  }));
});

@Component({
  template: `
    <p>{{ 'lazy.title' | transloco }}</p>
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
      },
    ],
  });

  it('should support scope alias', fakeAsync(() => {
    spectator = createComponent();
    runLoader();
    runLoader();
    spectator.detectChanges();
    expect(spectator.query('p')).toHaveText('Admin Lazy english');
  }));
});
