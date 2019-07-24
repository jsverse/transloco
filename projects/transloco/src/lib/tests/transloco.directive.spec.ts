import { fakeAsync } from '@angular/core/testing';
import { TranslocoDirective } from '../../public-api';
import { createHostComponentFactory, SpectatorWithHost } from '@netbasal/spectator';
import { providersMock, runLoader } from "./transloco.mocks";

describe('TranslocoDirective', () => {
  let host: SpectatorWithHost<TranslocoDirective>;
  const createHost = createHostComponentFactory({
    component: TranslocoDirective,
    providers: providersMock
  });

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
  });

  describe('Structural directive', () => {

  });

});
