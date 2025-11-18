import { fakeAsync } from '@angular/core/testing';
import { isString } from '@jsverse/utils';

import { TranslocoService } from '../../transloco.service';
import { Translation } from '../../transloco.types';
import { createService, runLoader } from '../mocks';

import { loadLang } from './service-spec-utils';

describe('Custom Interceptor', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it(`GIVEN custom interceptor for translations
      WHEN translations are loaded and keys are set
      THEN should apply interceptor transformations`, fakeAsync(() => {
    (service as any).interceptor = {
      preSaveTranslation(translation: Translation) {
        return Object.keys(translation).reduce((acc, key) => {
          acc[key] =
            isString(translation[key]) &&
            translation[key].includes('preSaveTranslationKey')
              ? translation[key]
              : `Intercepted ${key}`;
          return acc;
        }, {} as Translation);
      },
      preSaveTranslationKey(key: string) {
        return `preSaveTranslationKey ${key}`;
      },
    };
    loadLang(service);
    runLoader();
    const translation = service.getTranslation('en');
    Object.keys(translation).forEach((key) => {
      expect(translation[key]).toEqual(`Intercepted ${key}`);
    });
    service.setTranslationKey('home', 'test');
    expect(service.translate('home')).toEqual('preSaveTranslationKey home');
  }));
});
