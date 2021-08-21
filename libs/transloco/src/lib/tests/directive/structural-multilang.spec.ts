import { fakeAsync } from '@angular/core/testing';
import { runLoader, setlistenToLangChange } from '../mocks';
import { SpectatorHost } from '@ngneat/spectator';
import { createFactory } from './shared';
import { TranslocoDirective } from '../../transloco.directive';
import { TranslocoService } from '../../transloco.service';

describe('Multi Langs', () => {
  let spectator: SpectatorHost<TranslocoDirective>;
  const createHost = createFactory();

  it('should support multi langs', fakeAsync(() => {
    spectator = createHost(
      `
      <section *transloco="let t;">
        <h1>{{ t('home') }}</h1>     
      </section>
      <section *transloco="let t; lang: 'es'">
       <h2>{{ t('home') }}</h2>     
      </section>
      `,
      {
        detectChanges: false
      }
    );
    const service = spectator.inject<TranslocoService>(TranslocoService);
    setlistenToLangChange(service);
    spectator.detectChanges();
    runLoader();
    spectator.detectChanges();
    expect(spectator.queryHost('h1')).toHaveText('home english');
    expect(spectator.queryHost('h2')).toHaveText('home spanish');
    service.setActiveLang('es');
    runLoader();
    spectator.detectChanges();
    // it should change both because when we don't have static it's
    // only the initial value
    expect(spectator.queryHost('h1')).toHaveText('home spanish');
    expect(spectator.queryHost('h2')).toHaveText('home spanish');
  }));

  it('should respect scopes', fakeAsync(() => {
    spectator = createHost(
      `
      <section *transloco="let t;">
        <h1>{{ t('home') }}</h1>     
      </section>
      <section *transloco="let t; lang: 'es'; scope: 'lazy-page'">
       <h2>{{ t('lazyPage.title') }}</h2>     
      </section>
      `,
      {
        detectChanges: false
      }
    );
    const service = spectator.inject(TranslocoService);
    setlistenToLangChange(service);
    spectator.detectChanges();
    runLoader();
    spectator.detectChanges();
    expect(spectator.queryHost('h1')).toHaveText('home english');
    expect(spectator.queryHost('h2')).toHaveText('Admin Lazy spanish');
    service.setActiveLang('es');
    runLoader();
    spectator.detectChanges();
    // it should change both because when we don't have static it's
    // only the initial value
    expect(spectator.queryHost('h1')).toHaveText('home spanish');
    expect(spectator.queryHost('h2')).toHaveText('Admin Lazy spanish');
    service.setActiveLang('en');
    runLoader();
    spectator.detectChanges();
    expect(spectator.queryHost('h1')).toHaveText('home english');
    expect(spectator.queryHost('h2')).toHaveText('Admin Lazy english');
  }));

  it('should not change the static lang', fakeAsync(() => {
    spectator = createHost(
      `
      <section *transloco="let t;">
        <h1>{{ t('home') }}</h1>  
        <section *transloco="let inline; lang: 'en|static'">
          <h2>{{ inline('home') }}</h2>         
        </section>      
      </section>
      `,
      {
        detectChanges: false
      }
    );
    const service = spectator.inject(TranslocoService);
    setlistenToLangChange(service);
    spectator.detectChanges();
    runLoader();
    spectator.detectChanges();
    expect(spectator.queryHost('h1')).toHaveText('home english');
    expect(spectator.queryHost('h2')).toHaveText('home english');
    service.setActiveLang('es');
    runLoader();
    spectator.detectChanges();
    expect(spectator.queryHost('h1')).toHaveText('home spanish');
    expect(spectator.queryHost('h2')).toHaveText('home english');
  }));
});
