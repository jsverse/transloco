import { createHostFactory, SpectatorHost } from '@ngneat/spectator';

import { providersMock, runLoader, setlistenToLangChange } from '../mocks';
import { TranslocoDirective } from '../../transloco.directive';
import { TranslocoService } from '../../transloco.service';

export function createFactory(providers: any[] = []) {
  return createHostFactory({
    component: TranslocoDirective,
    providers: [providersMock, providers],
  });
}

function initScopeTest(
  host: SpectatorHost<TranslocoDirective>,
  service: TranslocoService
) {
  setlistenToLangChange(service);
  host.detectChanges();
  runLoader();
  // fakeAsync doesn't trigger CD
  host.detectChanges();
}

export function testMergedScopedTranslation(
  spectator: SpectatorHost<TranslocoDirective>,
  preload?: boolean
) {
  const service = spectator.inject(TranslocoService);
  if (preload) {
    preloadTranslations(spectator);
  }
  initScopeTest(spectator, service);
  expect(spectator.queryHost('.global')).toHaveText(
    preload ? 'home english' : ''
  );
  expect(spectator.queryHost('.scoped')).toHaveText('Admin Lazy english');
  if (preload) {
    service.load('es').subscribe();
    runLoader();
  }
  service.setActiveLang('es');
  runLoader();
  spectator.detectChanges();
  expect(spectator.queryHost('.global')).toHaveText(
    preload ? 'home spanish' : ''
  );
  expect(spectator.queryHost('.scoped')).toHaveText('Admin Lazy spanish');
}

export function testScopedTranslation(
  spectator: SpectatorHost<TranslocoDirective>
) {
  const service = spectator.inject(TranslocoService);
  initScopeTest(spectator, service);
  expect(spectator.queryHost('div')).toHaveText('Admin Lazy english');
  service.setActiveLang('es');
  runLoader();
  spectator.detectChanges();
  expect(spectator.queryHost('div')).toHaveText('Admin Lazy spanish');
}

export function testTranslationWithRead(
  spectator: SpectatorHost<TranslocoDirective>
) {
  const service = spectator.inject(TranslocoService);
  initScopeTest(spectator, service);
  expect(spectator.queryHost('div')).toHaveText('Title english');
  service.setActiveLang('es');
  runLoader();
  spectator.detectChanges();
  expect(spectator.queryHost('div')).toHaveText('Title spanish');
}

export function preloadTranslations(
  spectator: SpectatorHost<TranslocoDirective>,
  lang = 'en'
) {
  const service = spectator.inject(TranslocoService);
  service.load(lang).subscribe();
  runLoader();
}
