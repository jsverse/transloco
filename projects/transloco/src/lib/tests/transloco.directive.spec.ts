import { timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { fakeAsync, tick } from '@angular/core/testing';
import {
  DefaultParser,
  TRANSLOCO_CONFIG,
  TRANSLOCO_LOADER,
  TRANSLOCO_PARSER,
  TranslocoDirective
} from '../../public-api';
import { createHostComponentFactory, SpectatorWithHost } from '@netbasal/spectator';

describe('TranslocoDirective', () => {
  let host: SpectatorWithHost<TranslocoDirective>;
  const createHost = createHostComponentFactory({
    component: TranslocoDirective,
    providers: [
      {
        provide: TRANSLOCO_CONFIG,
        useValue: {}
      },
      {
        provide: TRANSLOCO_LOADER,
        useValue: () => timer(1000).pipe(map(() => ({ alert: 'Alert' })))
      },
      {
        provide: TRANSLOCO_PARSER,
        useClass: DefaultParser
      }
    ]
  });

  it('should set the translation value inside the element', fakeAsync(() => {
    host = createHost(`<div transloco="alert"></div>`);
    tick(1002);
    expect(host.queryHost('[transloco]')['innerText']).toEqual('Alert');
  }));
});
