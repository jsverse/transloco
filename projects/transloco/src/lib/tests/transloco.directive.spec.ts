import { fakeAsync, tick } from '@angular/core/testing';
import {TranslocoDirective} from '../../public-api';
import { createHostComponentFactory, SpectatorWithHost } from '@netbasal/spectator';
import {providersMock} from "./transloco.mocks";

describe('TranslocoDirective', () => {
  let host: SpectatorWithHost<TranslocoDirective>;
  const createHost = createHostComponentFactory({
    component: TranslocoDirective,
    providers: providersMock
  });

  it('should set the translation value inside the element', fakeAsync(() => {
    host = createHost(`<div transloco="alert"></div>`);
    tick(1002);
    expect(host.queryHost('[transloco]')['innerText']).toEqual('Alert');
  }));
});
