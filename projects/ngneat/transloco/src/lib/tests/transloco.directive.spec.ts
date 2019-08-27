import { fakeAsync } from '@angular/core/testing';
import { TranslocoDirective, TranslocoParamsPipe, TranslocoService } from '../../public-api';
import { createHostComponentFactory, HostComponent, SpectatorWithHost } from '@netbasal/spectator';
import { TranslocoLoaderComponent } from '../loader-component.component';
import { TemplateHandler } from '../template-handler';
import { loadingTemplateMock, providersMock, runLoader, setlistenToLangChange } from './transloco.mocks';

describe('TranslocoDirective', () => {
  let host: SpectatorWithHost<TranslocoDirective>;
  const createHost = createHostComponentFactory({
    component: TranslocoDirective,
    declarations: [TranslocoParamsPipe],
    providers: providersMock
  });

  function initScopeTest(host: SpectatorWithHost<TranslocoDirective, HostComponent>, service) {
    setlistenToLangChange(service);
    host.detectChanges();
    runLoader();
    // fakeAsync doesn't trigger CD
    host.detectChanges();
  }

  function testMergedScopedTranslation(host: SpectatorWithHost<TranslocoDirective, HostComponent>, preload?) {
    const service = host.get<TranslocoService>(TranslocoService);
    if (preload) {
      service.load('en').subscribe();
      runLoader();
    }
    initScopeTest(host, service);
    expect(host.queryHost('.global')).toHaveText(preload ? 'home english' : '');
    expect(host.queryHost('.scoped')).toHaveText('Admin Lazy english');
    if (preload) {
      service.load('es').subscribe();
      runLoader();
    }
    service.setActiveLang('es');
    runLoader();
    host.detectChanges();
    expect(host.queryHost('.global')).toHaveText(preload ? 'home spanish' : '');
    expect(host.queryHost('.scoped')).toHaveText('Admin Lazy spanish');
  }

  function testScopedTranslation(host: SpectatorWithHost<TranslocoDirective, HostComponent>) {
    const service = host.get<TranslocoService>(TranslocoService);
    initScopeTest(host, service);
    expect(host.queryHost('div')).toHaveText('Admin Lazy english');
    service.setActiveLang('es');
    runLoader();
    host.detectChanges();
    expect(host.queryHost('div')).toHaveText('Admin Lazy spanish');
  }

  function testLimitedTranslation(host: SpectatorWithHost<TranslocoDirective, HostComponent>) {
    const service = host.get<TranslocoService>(TranslocoService);
    initScopeTest(host, service);
    expect(host.queryHost('div')).toHaveText('Title english');
    service.setActiveLang('es');
    runLoader();
    host.detectChanges();
    expect(host.queryHost('div')).toHaveText('Title spanish');
  }

  it('should unsubscribe after one emit when not in listenToLangChange mode', fakeAsync(() => {
    host = createHost(`<div transloco="home"></div>`);
    runLoader();
    expect(host.queryHost('[transloco]')).toHaveText('home english');
    host.get<TranslocoService>(TranslocoService).setActiveLang('es');
    host.detectChanges();
    runLoader();
    expect(host.queryHost('[transloco]')).toHaveText('home english');
  }));

  describe('Basic directive', () => {
    it('should set the translation value inside the element', fakeAsync(() => {
      host = createHost(`<div transloco="home"></div>`);
      runLoader();
      expect(host.queryHost('[transloco]')).toHaveText('home english');
    }));

    it('should support params', fakeAsync(() => {
      host = createHost(`<div transloco="alert" [translocoParams]="{ value: 'netanel' }"></div>`);
      runLoader();
      expect(host.queryHost('[transloco]')).toHaveText('alert netanel english');
    }));

    it('should support dynamic key', fakeAsync(() => {
      host = createHost(`<div [transloco]="key"></div>`, true, {
        key: 'home'
      });
      runLoader();
      expect(host.queryHost('div')).toHaveText('home english');
      host.component.key = 'fromList';
      host.detectChanges();
      expect(host.queryHost('div')).toHaveText('from list');
    }));

    it('should support dynamic params', fakeAsync(() => {
      host = createHost(`<div transloco="alert" [translocoParams]="{ value: dynamic }"></div>`, true, {
        dynamic: 'netanel'
      } as any);
      runLoader();
      expect(host.queryHost('[transloco]')).toHaveText('alert netanel english');
      (host.component as any).dynamic = 'kazaz';
      host.detectChanges();
      expect(host.queryHost('[transloco]')).toHaveText('alert kazaz english');
    }));

    it('should load scoped translation', fakeAsync(() => {
      host = createHost(`<div transloco="lazyPage.title" translocoScope="lazy-page"></div>`, false);
      testScopedTranslation(host);
    }));

    it("should load scoped translation even if global didn't load", fakeAsync(() => {
      host = createHost(
        `
        <div class="global" transloco="home" translocoScope="lazy-page"></div>
        <div class="scoped" transloco="lazyPage.title" translocoScope="lazy-page"></div>`,
        false
      );
      testMergedScopedTranslation(host);
    }));

    it('should expose both scoped and global translation', fakeAsync(() => {
      host = createHost(
        `
        <div class="global" transloco="home" translocoScope="lazy-page"></div>
        <div class="scoped" transloco="lazyPage.title" translocoScope="lazy-page"></div>`,
        false
      );
      testMergedScopedTranslation(host, true);
    }));
  });

  describe('Structural directive', () => {
    it('should load scoped translation', fakeAsync(() => {
      host = createHost(
        `<section *transloco="let t; scope: 'lazy-page'"><div>{{t.lazyPage.title}}</div></section>`,
        false
      );
      testScopedTranslation(host);
    }));

    it("should load scoped translation even if global didn't load", fakeAsync(() => {
      host = createHost(
        `
        <section *transloco="let t; scope: 'lazy-page'">
        <div class="scoped">{{t.lazyPage.title}}</div>
        <div class="global">{{t.home}}</div>
        </section>`,
        false
      );
      testMergedScopedTranslation(host);
    }));

    it('should expose both scoped and global translation', fakeAsync(() => {
      host = createHost(
        `
        <section *transloco="let t; scope: 'lazy-page'">
        <div class="scoped">{{t.lazyPage.title}}</div>
        <div class="global">{{t.home}}</div>
        </section>`,
        false
      );
      testMergedScopedTranslation(host, true);
    }));

    it('should create embedded view once', fakeAsync(() => {
      spyOn(TranslocoDirective.prototype as any, 'getLoadingTpl').and.callThrough();
      host = createHost(`<section *transloco="let t"></section>`, false);
      const service = host.get<TranslocoService>(TranslocoService);

      setlistenToLangChange(service);
      host.detectChanges();
      runLoader();
      service.setActiveLang('es');
      runLoader();
      expect((TranslocoDirective.prototype as any).getLoadingTpl).toHaveBeenCalledTimes(1);
    }));

    it('should set the translation value', fakeAsync(() => {
      host = createHost(`
        <section *transloco="let t">
           <div>{{t.home}}</div>
           <span>{{t.fromList}}</span>
           <p>{{t.a.b.c | translocoParams}}</p>
           <p>{{t.a.b.c | translocoParams:{fromList: "value"} }}</p>
        </section>
     `);
      runLoader();
      // fakeAsync doesn't trigger CD
      host.detectChanges();
      expect(host.queryHost('div')).toHaveText('home english');
      expect(host.queryHost('span')).toHaveText('from list');
      expect(host.queryHost('p')).toHaveText('a.b.c from list english');
      expect(host.queryHostAll('p')[1]).toHaveText('a.b.c value english');
    }));

    it('should limit translation to a nested property', fakeAsync(() => {
      host = createHost(`<section *transloco="let t; limit: 'nested'"><div>{{t.title}}</div></section>`, false);
      testLimitedTranslation(host);
    }));
  });

  describe('Loading Template', () => {
    it('should attach and detach view with inline loader template', fakeAsync(() => {
      spyOn<TemplateHandler>(TemplateHandler.prototype, 'attachView').and.callThrough();
      spyOn<TemplateHandler>(TemplateHandler.prototype, 'detachView').and.callThrough();
      host = createHost(`
        <section *transloco="let t; scope: 'lazy-page'; loadingTpl: loading">
          <h1 data-cy="lazy-page">{{ t.title }}</h1>
        </section>

        <ng-template #loading>
          <h1 id="lazy-page-loading">Loading...</h1>
        </ng-template>
      `);

      expect((TemplateHandler.prototype as any).attachView).toHaveBeenCalledTimes(1);
      expect(host.queryHost('#lazy-page-loading')).toHaveText('Loading...');
      host.detectChanges();
      runLoader();
      expect(host.queryHost('#lazy-page-loading')).toBeNull();
      expect((TemplateHandler.prototype as any).detachView).toHaveBeenCalledTimes(1);
    }));

    it('should not attachView if no inline loader template has provided', () => {
      spyOn<TemplateHandler>(TemplateHandler.prototype, 'attachView').and.callThrough();
      host = createHost(`
        <section *transloco="let t; scope: 'lazy-page';">
          <h1 data-cy="lazy-page">{{ t.title }}</h1>
        </section>
      `);

      expect((TemplateHandler.prototype as any).attachView).not.toHaveBeenCalled();
    });
  });

  describe('default loader template', () => {
    const createHost = createHostComponentFactory({
      component: TranslocoDirective,
      declarations: [TranslocoParamsPipe, TranslocoLoaderComponent],
      entryComponents: [TranslocoLoaderComponent],
      providers: [...providersMock, loadingTemplateMock]
    });

    it('should call attach view with default template', fakeAsync(() => {
      spyOn<TemplateHandler>(TemplateHandler.prototype, 'attachView').and.callThrough();
      spyOn<TemplateHandler>(TemplateHandler.prototype, 'detachView').and.callThrough();

      host = createHost(`
        <section *transloco="let t; scope: 'lazy-page';">
          <h1 data-cy="lazy-page">{{ t.title }}</h1>
        </section>
      `);

      expect((TemplateHandler.prototype as any).attachView).toHaveBeenCalled();
      expect(host.queryHost('.transloco-loader-template')).toHaveText('loading template...');
      host.detectChanges();
      runLoader();
      expect(host.queryHost('.transloco-loader-template')).toBeNull();
      expect((TemplateHandler.prototype as any).detachView).toHaveBeenCalled();
    }));

    it('should use the inline loader template instead of default', fakeAsync(() => {
      host = createHost(`
        <section *transloco="let t; scope: 'lazy-page'; loadingTpl: loading">
          <h1 data-cy="lazy-page">{{ t.title }}</h1>
        </section>

        <ng-template #loading>
          <h1 id="lazy-page-loading">Loading...</h1>
        </ng-template>
      `);

      expect(host.queryHost('#lazy-page-loading')).toHaveText('Loading...');
      host.detectChanges();
      runLoader();
      expect(host.queryHost('#lazy-page-loading')).toBeNull();
    }));
  });
});
