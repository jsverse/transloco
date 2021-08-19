import { createComponentFactory, Spectator, SpectatorHost } from '@ngneat/spectator';
import {
  ProviderScope,
  TRANSLOCO_SCOPE,
  TranslocoDirective,
  TranslocoModule,
  TranslocoService
} from '@ngneat/transloco';
import { createFactory } from './directive/shared';
import { fakeAsync } from '@angular/core/testing';
import { providersMock, runLoader, setlistenToLangChange, inlineScope } from './mocks';
import { Component } from '@angular/core';
import { listenToLangChangesProvider } from './pipe/pipe-integration.spec';

const inlineLoaders = {
  provide: TRANSLOCO_SCOPE,
  useValue: inlineScope
};

function updateView(spectator: Spectator<any>, service: TranslocoService) {
  runLoader();
  spectator.detectChanges();
  expect(spectator.query('span')).toHaveText('Todos Title English');
  expect(spectator.query('h1')).toHaveText('home english');

  service.setActiveLang('es');
  runLoader();
  spectator.detectChanges();
  expect(spectator.query('span')).toHaveText('Todos Title Spanish');
  expect(spectator.query('h1')).toHaveText('home spanish');
}

describe('Inline loaders: directive', () => {
  let spectator: SpectatorHost<TranslocoDirective>;

  const createHost = createFactory([inlineLoaders]);

  it('should support inline loaders', fakeAsync(() => {
    spectator = createHost(
      `
      <ng-container *transloco="let t">
        <span>{{ t('todos.title') }}</span>
        <h1>{{ t('home') }}</h1>
      </ng-container>
    `,
      { detectChanges: false }
    );

    const service = spectator.inject(TranslocoService);
    setlistenToLangChange(service);
    spectator.detectChanges();
    updateView(spectator, service);
  }));
});

@Component({
  template: `
    <span>{{ 'todos.title' | transloco }}</span>
    <h1>{{ 'home' | transloco }}</h1>
  `
})
class TestPipe {}

describe('Inline loaders: pipe', () => {
  let spectator: Spectator<TestPipe>;

  const createComponent = createComponentFactory({
    component: TestPipe,
    imports: [TranslocoModule],
    providers: [providersMock, inlineLoaders, listenToLangChangesProvider]
  });

  it('should support inline loaders', fakeAsync(() => {
    spectator = createComponent({ detectChanges: false });

    const service = spectator.inject(TranslocoService);
    spectator.detectChanges();

    updateView(spectator, service);
  }));
});
