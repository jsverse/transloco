import { fakeAsync } from '@angular/core/testing';
import { TemplateHandler, TranslocoDirective } from '@ngneat/transloco';
import { loadingTemplateMock, providersMock, runLoader } from '../mocks';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator';
import { createFactory, preloadTranslations } from './shared';
import { TranslocoLoaderComponent } from '../../loader-component.component';

describe('Loading Template', () => {
  let spectator: SpectatorHost<TranslocoDirective>;
  const createHost = createFactory();

  it('should attach and detach view with inline loader template', fakeAsync(() => {
    spyOn<TemplateHandler>(TemplateHandler.prototype, 'attachView').and.callThrough();
    spyOn<TemplateHandler>(TemplateHandler.prototype, 'detachView').and.callThrough();
    spectator = createHost(`
        <section *transloco="let t; scope: 'lazy-page'; loadingTpl: loading">
          <h1 data-cy="lazy-page">{{ t('title') }}</h1>
        </section>

        <ng-template #loading>
          <h1 id="lazy-page-loading">Loading...</h1>
        </ng-template>
      `);

    expect((TemplateHandler.prototype as any).attachView).toHaveBeenCalledTimes(1);
    expect(spectator.queryHost('#lazy-page-loading')).toHaveText('Loading...');
    spectator.detectChanges();
    runLoader();
    expect(spectator.queryHost('#lazy-page-loading')).toBeNull();
    expect((TemplateHandler.prototype as any).detachView).toHaveBeenCalledTimes(1);
  }));

  it('should not attachView if no inline loader template has provided', () => {
    spyOn<TemplateHandler>(TemplateHandler.prototype, 'attachView').and.callThrough();
    spectator = createHost(`
        <section *transloco="let t; scope: 'lazy-page';">
          <h1 data-cy="lazy-page">{{ t('title') }}</h1>
        </section>
      `);

    expect((TemplateHandler.prototype as any).attachView).not.toHaveBeenCalled();
  });

  it('should not attachView if the translation have already loaded', fakeAsync(() => {
    spyOn<TemplateHandler>(TemplateHandler.prototype, 'attachView').and.callThrough();
    spectator = createHost(
      `
        <section *transloco="let t; scope: 'lazy-page'; loadingTpl: loading">
          <h1 data-cy="lazy-page">{{ t('title') }}</h1>
        </section>

        <ng-template #loading>
          <h1 id="lazy-page-loading">Loading...</h1>
        </ng-template>
      `,
      { detectChanges: false }
    );
    preloadTranslations(spectator);

    expect((TemplateHandler.prototype as any).attachView).not.toHaveBeenCalled();
  }));
});

describe('Custom loading template', () => {
  let spectator: SpectatorHost<TranslocoDirective>;

  const createHost = createHostFactory({
    component: TranslocoDirective,
    declarations: [TranslocoLoaderComponent],
    entryComponents: [TranslocoLoaderComponent],
    providers: [...providersMock, loadingTemplateMock]
  });

  it('should call attach view with provided template', fakeAsync(() => {
    spyOn<TemplateHandler>(TemplateHandler.prototype, 'attachView').and.callThrough();
    spyOn<TemplateHandler>(TemplateHandler.prototype, 'detachView').and.callThrough();

    spectator = createHost(`
        <section *transloco="let t; scope: 'lazy-page';">
          <h1 data-cy="lazy-page">{{ t('title') }}</h1>
        </section>
      `);

    expect((TemplateHandler.prototype as any).attachView).toHaveBeenCalled();
    expect(spectator.queryHost('.transloco-loader-template')).toHaveText('loading template...');
    spectator.detectChanges();
    runLoader();
    expect(spectator.queryHost('.transloco-loader-template')).toBeNull();
    expect((TemplateHandler.prototype as any).detachView).toHaveBeenCalled();
  }));

  it('should use the inline loader template instead of default', fakeAsync(() => {
    spectator = createHost(`
        <section *transloco="let t; scope: 'lazy-page'; loadingTpl: loading">
          <h1 data-cy="lazy-page">{{ t('title') }}</h1>
        </section>

        <ng-template #loading>
          <h1 id="lazy-page-loading">Loading...</h1>
        </ng-template>
      `);

    expect(spectator.queryHost('#lazy-page-loading')).toHaveText('Loading...');
    spectator.detectChanges();
    runLoader();
    expect(spectator.queryHost('#lazy-page-loading')).toBeNull();
  }));
});
