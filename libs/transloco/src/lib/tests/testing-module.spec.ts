import { TestBed } from '@angular/core/testing';

import { TRANSLOCO_CONFIG } from '../transloco.config';
import { TranslocoTestingModule } from '../transloco-testing.module';

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
