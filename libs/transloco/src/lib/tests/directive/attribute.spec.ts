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

  it('should set the translation value inside the element', fakeAsync(() => {
    spectator = createHost(`<div transloco="home"></div>`);
    runLoader();
    expect(spectator.queryHost('[transloco]')).toHaveText('home english');
  }));

  it('should support params', fakeAsync(() => {
    spectator = createHost(
      `<div transloco="alert" [translocoParams]="{ value: 'netanel' }"></div>`
    );
    runLoader();
    expect(spectator.queryHost('[transloco]')).toHaveText(
      'alert netanel english'
    );
  }));

  it('should support dynamic key', fakeAsync(() => {
    spectator = createHost(`<div [transloco]="key"></div>`, {
      hostProps: { key: 'home' },
    });
    runLoader();
    expect(spectator.queryHost('div')).toHaveText('home english');
    (spectator.hostComponent as any).key = 'fromList';
    spectator.detectChanges();
    expect(spectator.queryHost('div')).toHaveText('from list');
  }));

  it('should support dynamic params', fakeAsync(() => {
    spectator = createHost(
      `<div transloco="alert" [translocoParams]="{ value: dynamic }"></div>`,
      {
        hostProps: {
          dynamic: 'netanel',
        },
      }
    );
    runLoader();
    expect(spectator.queryHost('[transloco]')).toHaveText(
      'alert netanel english'
    );
    (spectator.hostComponent as any).dynamic = 'kazaz';
    spectator.detectChanges();
    expect(spectator.queryHost('[transloco]')).toHaveText(
      'alert kazaz english'
    );
  }));

  it('should load scoped translation', fakeAsync(() => {
    spectator = createHost(
      `<div transloco="lazyPage.title" translocoScope="lazy-page"></div>`,
      {
        detectChanges: false,
      }
    );
    testScopedTranslation(spectator);
  }));

  it("should load scoped translation even if global didn't load", fakeAsync(() => {
    spectator = createHost(
      `
        <div class="global" transloco="home" translocoScope="lazy-page"></div>
        <div class="scoped" transloco="lazyPage.title" translocoScope="lazy-page"></div>`,
      {
        detectChanges: false,
      }
    );
    testMergedScopedTranslation(spectator);
  }));

  it('should expose both scoped and global translation', fakeAsync(() => {
    spectator = createHost(
      `
        <div class="global" transloco="home" translocoScope="lazy-page"></div>
        <div class="scoped" transloco="lazyPage.title" translocoScope="lazy-page"></div>`,
      {
        detectChanges: false,
      }
    );
    testMergedScopedTranslation(spectator, true);
  }));
});
