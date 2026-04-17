import { fakeAsync } from '@angular/core/testing';
import { SpectatorHost } from '@ngneat/spectator';

import { runLoader, setlistenToLangChange } from '../mocks';
import { TranslocoDirective } from '../../transloco.directive';
import { TranslocoService } from '../../transloco.service';

import { createFactory } from './shared';

describe('Multi Langs', () => {
  let spectator: SpectatorHost<TranslocoDirective>;
  const createHost = createFactory();

  it(`GIVEN directives with different lang inputs
      WHEN translations are loaded and active lang changes
      THEN should render correct translations per directive`, fakeAsync(() => {
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
        detectChanges: false,
      },
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

  it(`GIVEN directives with different langs and scopes
      WHEN translations are loaded and active lang changes
      THEN should render correct scoped translations per directive`, fakeAsync(() => {
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
        detectChanges: false,
      },
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

  it(`GIVEN nested directives with static lang marker
      WHEN active lang changes
      THEN should keep static lang unchanged`, fakeAsync(() => {
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
        detectChanges: false,
      },
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
