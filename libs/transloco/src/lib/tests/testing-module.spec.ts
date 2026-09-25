import { TestBed } from '@angular/core/testing';

import { TRANSLOCO_CONFIG } from '../transloco.config';
import { TranslocoService } from '../transloco.service';
import {
  TranslocoTestingModule,
  provideTranslocoTesting,
} from '../transloco-testing.module';

describe('TranslocoTestingModule', () => {
  it('should accept missingHandler config but still provide logMissingKey default for testing', () => {
    const testBed = TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: {},
          translocoConfig: {
            availableLangs: ['es', 'en'],
            defaultLang: 'es',
            missingHandler: {
              allowEmpty: true,
            },
          },
        }),
      ],
    });

    const config = testBed.inject(TRANSLOCO_CONFIG);
    expect(config.missingHandler.logMissingKey).toBe(false);
    expect(config.missingHandler.allowEmpty).toBe(true);
  });
});

describe('provideTranslocoTesting', () => {
  it('should provide testing config and serve the given langs', async () => {
    const testBed = TestBed.configureTestingModule({
      providers: [
        provideTranslocoTesting({
          langs: { en: { hello: 'Hello' } },
          preloadLangs: true,
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
            missingHandler: { allowEmpty: true },
          },
        }),
      ],
    });

    const config = testBed.inject(TRANSLOCO_CONFIG);
    expect(config.missingHandler.logMissingKey).toBe(false);
    expect(config.missingHandler.allowEmpty).toBe(true);

    const service = testBed.inject(TranslocoService);
    await service.load('en').toPromise();
    expect(service.translate('hello')).toBe('Hello');
  });
});
