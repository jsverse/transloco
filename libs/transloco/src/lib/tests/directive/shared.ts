import { createHostFactory, HostComponent, SpectatorHost } from '@ngneat/spectator';
import { providersMock, runLoader, setlistenToLangChange } from '../transloco.mocks';
import { TranslocoDirective } from '../../transloco.directive';
import { TranslocoService } from '../../transloco.service';

export function createFactory(providers = []) {
  return createHostFactory({
    component: TranslocoDirective,
    providers: [providersMock, providers]
  });
}

function initScopeTest(host: SpectatorHost<TranslocoDirective, HostComponent>, service) {
  setlistenToLangChange(service);
  host.detectChanges();
  runLoader();
  // fakeAsync doesn't trigger CD
  host.detectChanges();
}

export function testMergedScopedTranslation(spectator: SpectatorHost<TranslocoDirective>, preload?: boolean) {
  const service = spectator.get(TranslocoService);
  if (preload) {
    service.load('en').subscribe();
    runLoader();
  }
  initScopeTest(spectator, service);
  expect(spectator.queryHost('.global')).toHaveText(preload ? 'home english' : '');
  expect(spectator.queryHost('.scoped')).toHaveText('Admin Lazy english');
  if (preload) {
    service.load('es').subscribe();
    runLoader();
  }
  service.setActiveLang('es');
  runLoader();
  spectator.detectChanges();
  expect(spectator.queryHost('.global')).toHaveText(preload ? 'home spanish' : '');
  expect(spectator.queryHost('.scoped')).toHaveText('Admin Lazy spanish');
}

export function testScopedTranslation(spectator: SpectatorHost<TranslocoDirective>) {
  const service = spectator.get(TranslocoService);
  initScopeTest(spectator, service);
  expect(spectator.queryHost('div')).toHaveText('Admin Lazy english');
  service.setActiveLang('es');
  runLoader();
  spectator.detectChanges();
  expect(spectator.queryHost('div')).toHaveText('Admin Lazy spanish');
}

export function testTranslationWithRead(spectator: SpectatorHost<TranslocoDirective>) {
  const service = spectator.get(TranslocoService);
  initScopeTest(spectator, service);
  expect(spectator.queryHost('div')).toHaveText('Title english');
  service.setActiveLang('es');
  runLoader();
  spectator.detectChanges();
  expect(spectator.queryHost('div')).toHaveText('Title spanish');
}
