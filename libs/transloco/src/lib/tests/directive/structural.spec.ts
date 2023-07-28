import { fakeAsync } from '@angular/core/testing';
import { SpectatorHost } from '@ngneat/spectator';

import { runLoader, setlistenToLangChange } from '../mocks';
import { TranslocoDirective } from '../../transloco.directive';
import { TranslocoService } from '../../transloco.service';

import {
  createFactory,
  testMergedScopedTranslation,
  testScopedTranslation,
  testTranslationWithRead,
} from './shared';

describe('Structural directive', () => {
  let spectator: SpectatorHost<TranslocoDirective>;
  const createHost = createFactory();

  it('should set the translation value', fakeAsync(() => {
    spectator = createHost(`
        <section *transloco="let t;">
           <div>{{t('home') }}</div>
           <span>{{t('fromList')}}</span>
           <p>{{t('a.b.c')}}</p>
           <h2>{{t('a.b.c', {fromList: "value"}) }}</h2>
        </section>
     `);
    runLoader();
    // fakeAsync doesn't trigger CD
    spectator.detectChanges();
    expect(spectator.queryHost('div')).toHaveText('home english');
    expect(spectator.queryHost('span')).toHaveText('from list');
    expect(spectator.queryHost('p')).toHaveText('a.b.c from list english');
    expect(spectator.queryHost('h2')).toHaveText('a.b.c value english');
  }));

  it('should set the translation value and listen to lang changes', fakeAsync(() => {
    spectator = createHost(
      `
        <section *transloco="let t;">
           <div>{{t('home') }}</div>
           <span>{{t('fromList')}}</span>
           <p>{{t('a.b.c')}}</p>
           <h2>{{t('a.b.c', {fromList: "value"}) }}</h2>
        </section>
     `,
      { detectChanges: false }
    );
    const service = spectator.inject(TranslocoService);
    setlistenToLangChange(service);
    spectator.detectChanges();
    runLoader();
    // fakeAsync doesn't trigger CD
    spectator.detectChanges();
    expect(spectator.queryHost('div')).toHaveText('home english');
    expect(spectator.queryHost('span')).toHaveText('from list');
    expect(spectator.queryHost('p')).toHaveText('a.b.c from list english');
    expect(spectator.queryHost('h2')).toHaveText('a.b.c value english');
    (service as TranslocoService).setActiveLang('es');
    runLoader();
    spectator.detectChanges();
    expect(spectator.queryHost('div')).toHaveText('home spanish');
    expect(spectator.queryHost('span')).toHaveText('from list');
    expect(spectator.queryHost('p')).toHaveText('a.b.c from list spanish');
    expect(spectator.queryHost('h2')).toHaveText('a.b.c value spanish');
  }));

  it('should create embedded view once', fakeAsync(() => {
    spyOn(
      TranslocoDirective.prototype as any,
      'resolveLoadingContent'
    ).and.callThrough();
    spectator = createHost(`<section *transloco="let t"></section>`, {
      detectChanges: false,
    });
    const service = spectator.inject(TranslocoService);

    setlistenToLangChange(service);
    spectator.detectChanges();
    runLoader();
    service.setActiveLang('es');
    runLoader();
    expect(
      (TranslocoDirective.prototype as any).resolveLoadingContent
    ).toHaveBeenCalledTimes(1);
  }));

  it('should unsubscribe after one emit when not in reRenderOnLangChange mode', fakeAsync(() => {
    spectator = createHost(`<div transloco="home"></div>`);
    runLoader();
    expect(spectator.queryHost('[transloco]')).toHaveText('home english');
    spectator.inject(TranslocoService).setActiveLang('es');
    spectator.detectChanges();
    runLoader();
    expect(spectator.queryHost('[transloco]')).toHaveText('home english');
  }));

  describe('Scope', () => {
    it('should load scoped translation', fakeAsync(() => {
      spectator = createHost(
        `<section *transloco="let t; scope: 'lazy-page'"><div>{{t('lazyPage.title')}}</div></section>`,
        {
          detectChanges: false,
        }
      );
      testScopedTranslation(spectator);
    }));

    it("should load scoped translation even if global didn't load", fakeAsync(() => {
      spectator = createHost(
        `
        <section *transloco="let t; scope: 'lazy-page'">
        <div class="scoped">{{t('lazyPage.title')}}</div>
        <div class="global">{{t('home')}}</div>
        </section>`,
        {
          detectChanges: false,
        }
      );
      testMergedScopedTranslation(spectator);
    }));

    it('should expose both scoped and global translation', fakeAsync(() => {
      spectator = createHost(
        `
        <section *transloco="let t; scope: 'lazy-page'">
        <div class="scoped">{{t('lazyPage.title')}}</div>
        <div class="global">{{t('home')}}</div>
        </section>`,
        {
          detectChanges: false,
        }
      );
      testMergedScopedTranslation(spectator, true);
    }));
  });

  describe('Read', () => {
    it('should get translation of a nested property using read', fakeAsync(() => {
      spectator = createHost(
        `<section *transloco="let t; read: 'nested'"><div>{{t('title')}}</div></section>`,
        {
          detectChanges: false,
        }
      );
      testTranslationWithRead(spectator);
    }));
  });

  describe('CurrentLang', () => {
    beforeEach(fakeAsync(() => {
      spectator = createHost(
        `
        <section *transloco="let t; currentLang as currentLang">
           <div>{{ currentLang }}</div>
        </section>
     `,
        { detectChanges: false }
      );
      const service = spectator.inject(TranslocoService);
      setlistenToLangChange(service);
      spectator.detectChanges();
      runLoader();
    }));

    it('should expose currentLang to the template', fakeAsync(() => {
      spectator.detectChanges();
      expect(spectator.queryHost('div')).toHaveText('en');
    }));

    it('should change on langChanges', fakeAsync(() => {
      spectator.inject(TranslocoService).setActiveLang('es');
      runLoader();
      spectator.detectChanges();
      expect(spectator.queryHost('div')).toHaveText('es');
    }));
  });
});
