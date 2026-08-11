import { fakeAsync } from '@angular/core/testing';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator';

import { provideTransloco } from '../../transloco.providers';
import { translocoConfig } from '../../transloco.config';
import { TranslocoDirective } from '../../transloco.directive';
import { TranslocoService } from '../../transloco.service';
import { MockedLoader, runLoader, setlistenToLangChange } from '../mocks';

describe('Signal tracking (useSignalTracking: true)', () => {
  let spectator: SpectatorHost<TranslocoDirective>;

  const createHost = createHostFactory({
    component: TranslocoDirective,
    providers: [
      provideTransloco({
        config: translocoConfig({
          availableLangs: ['en', 'es'],
          useSignalTracking: true,
        }),
        loader: MockedLoader,
      }),
    ],
  });

  it('should render translations correctly with useSignalTracking enabled', fakeAsync(() => {
    spectator = createHost(
      `
      <section *transloco="let t;">
        <div>{{t('home')}}</div>
        <span>{{t('a.b.c')}}</span>
      </section>
      `,
      { detectChanges: false },
    );
    spectator.detectChanges();
    runLoader();
    spectator.detectChanges();
    expect(spectator.queryHost('div')).toHaveText('home english');
    expect(spectator.queryHost('span')).toHaveText('a.b.c from list english');
  }));

  it('should update translations on lang change without markForCheck', fakeAsync(() => {
    spectator = createHost(
      `
      <section *transloco="let t;">
        <div>{{t('home')}}</div>
        <span>{{t('a.b.c')}}</span>
      </section>
      `,
      { detectChanges: false },
    );
    const service = spectator.inject(TranslocoService);
    setlistenToLangChange(service);

    spectator.detectChanges();
    runLoader();
    spectator.detectChanges();
    expect(spectator.queryHost('div')).toHaveText('home english');
    expect(spectator.queryHost('span')).toHaveText('a.b.c from list english');

    // Spy on directive's cdr AFTER initialization to verify markForCheck is not called on lang change
    spyOn((spectator.component as any).cdr, 'markForCheck');

    service.setActiveLang('es');
    runLoader();
    spectator.detectChanges();
    expect(spectator.queryHost('div')).toHaveText('home spanish');
    expect(spectator.queryHost('span')).toHaveText('a.b.c from list spanish');
    expect((spectator.component as any).cdr.markForCheck).not.toHaveBeenCalled();
  }));

  it('should work with attribute directive without markForCheck', fakeAsync(() => {
    spectator = createHost(`<div transloco="home"></div>`, {
      detectChanges: false,
    });
    const service = spectator.inject(TranslocoService);
    setlistenToLangChange(service);

    spectator.detectChanges();
    runLoader();
    spectator.detectChanges();
    expect(spectator.queryHost('[transloco]')).toHaveText('home english');

    // Spy after init to verify lang change path doesn't call markForCheck
    spyOn((spectator.component as any).cdr, 'markForCheck');

    service.setActiveLang('es');
    runLoader();
    spectator.detectChanges();
    expect(spectator.queryHost('[transloco]')).toHaveText('home spanish');
    expect((spectator.component as any).cdr.markForCheck).not.toHaveBeenCalled();
  }));
});
