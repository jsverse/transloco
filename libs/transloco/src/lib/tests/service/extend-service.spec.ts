import { inject, Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoService } from '../../transloco.service';
import { TRANSLOCO_LOADER } from '../../transloco.loader';
import { TRANSLOCO_TRANSPILER } from '../../transloco.transpiler';
import { TRANSLOCO_MISSING_HANDLER } from '../../transloco-missing-handler';
import { TRANSLOCO_INTERCEPTOR } from '../../transloco.interceptor';
import { TRANSLOCO_CONFIG } from '../../transloco.config';
import { TRANSLOCO_FALLBACK_STRATEGY } from '../../transloco-fallback-strategy';
import { provideTransloco } from '../../transloco.providers';

@Injectable()
class CustomTranslocoService extends TranslocoService {
  constructor() {
    // The loader is @Optional(); `inject(..., { optional: true })` returns
    // `TranslocoLoader | null` and must pass straight through without a `!`.
    super(
      inject(TRANSLOCO_LOADER, { optional: true }),
      inject(TRANSLOCO_TRANSPILER),
      inject(TRANSLOCO_MISSING_HANDLER),
      inject(TRANSLOCO_INTERCEPTOR),
      inject(TRANSLOCO_CONFIG),
      inject(TRANSLOCO_FALLBACK_STRATEGY),
    );
  }
}

describe('extending TranslocoService', () => {
  it(`GIVEN a subclass forwarding the optional loader to super()
      WHEN it is instantiated without a provided loader
      THEN it constructs and translates via the default loader`, () => {
    const service = TestBed.configureTestingModule({
      providers: [
        provideTransloco({ config: { availableLangs: ['en'] } }),
        CustomTranslocoService,
      ],
    }).inject(CustomTranslocoService);

    service.setTranslation({ key: 'value' }, 'en');
    expect(service.translate('key')).toBe('value');
  });
});
