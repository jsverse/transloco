import { fakeAsync } from '@angular/core/testing';
import { SpectatorHost } from '@ngneat/spectator';

import { runLoader } from '../mocks';
import { TranslocoDirective } from '../../transloco.directive';

import {
  createFactory,
  testMergedScopedTranslation,
  testScopedTranslation,
} from './shared';

describe('Attribute directive', () => {
  let spectator: SpectatorHost<TranslocoDirective>;
  const createHost = createFactory();

  it(`GIVEN attribute directive with static key
      WHEN translations are loaded
      THEN should set the translation value inside the element`, fakeAsync(() => {
    spectator = createHost(`<div transloco="home"></div>`);
    runLoader();
    expect(spectator.queryHost('[transloco]')).toHaveText('home english');
  }));

  it(`GIVEN attribute directive with params
      WHEN translations are loaded
      THEN should interpolate params in translation`, fakeAsync(() => {
    spectator = createHost(
      `<div transloco="alert" [translocoParams]="{ value: 'netanel' }"></div>`,
    );
    runLoader();
    expect(spectator.queryHost('[transloco]')).toHaveText(
      'alert netanel english',
    );
  }));

  it(`GIVEN attribute directive with dynamic key
      WHEN key changes
      THEN should update translation`, fakeAsync(() => {
    spectator = createHost(`<div [transloco]="key"></div>`, {
      hostProps: { key: 'home' },
    });
    runLoader();
    expect(spectator.queryHost('div')).toHaveText('home english');
    (spectator.hostComponent as any).key = 'fromList';
    spectator.detectChanges();
    expect(spectator.queryHost('div')).toHaveText('from list');
  }));

  it(`GIVEN attribute directive with dynamic params
      WHEN params change
      THEN should update interpolated translation`, fakeAsync(() => {
    spectator = createHost(
      `<div transloco="alert" [translocoParams]="{ value: dynamic }"></div>`,
      {
        hostProps: {
          dynamic: 'netanel',
        },
      },
    );
    runLoader();
    expect(spectator.queryHost('[transloco]')).toHaveText(
      'alert netanel english',
    );
    (spectator.hostComponent as any).dynamic = 'kazaz';
    spectator.detectChanges();
    expect(spectator.queryHost('[transloco]')).toHaveText(
      'alert kazaz english',
    );
  }));

  it(`GIVEN attribute directive with scope
      WHEN scoped translations are loaded
      THEN should display scoped translation`, fakeAsync(() => {
    spectator = createHost(
      `<div transloco="lazyPage.title" translocoScope="lazy-page"></div>`,
      {
        detectChanges: false,
      },
    );
    testScopedTranslation(spectator);
  }));

  it(`GIVEN scoped directive with global and scoped keys
      WHEN scoped translation loads before global
      THEN should load scoped translation correctly`, fakeAsync(() => {
    spectator = createHost(
      `
        <div class="global" transloco="home" translocoScope="lazy-page"></div>
        <div class="scoped" transloco="lazyPage.title" translocoScope="lazy-page"></div>`,
      {
        detectChanges: false,
      },
    );
    testMergedScopedTranslation(spectator);
  }));

  it(`GIVEN scoped directive with global and scoped keys
      WHEN both translations are loaded
      THEN should expose both scoped and global translation`, fakeAsync(() => {
    spectator = createHost(
      `
        <div class="global" transloco="home" translocoScope="lazy-page"></div>
        <div class="scoped" transloco="lazyPage.title" translocoScope="lazy-page"></div>`,
      {
        detectChanges: false,
      },
    );
    testMergedScopedTranslation(spectator, true);
  }));
});
