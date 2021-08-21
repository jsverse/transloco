import { fakeAsync } from '@angular/core/testing';
import { TranslocoService } from '../../transloco.service';
import { Translation } from '../../types';
import {isString} from "../../helpers";
import { createService, runLoader } from '../mocks';
import { loadLang } from './utils';

describe('Custom Interceptor', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it('should support', fakeAsync(() => {
    (service as any).interceptor = {
      preSaveTranslation(translation: Translation) {
        return Object.keys(translation).reduce((acc, key) => {
          acc[key] =
            isString(translation[key]) && translation[key].includes('preSaveTranslationKey')
              ? translation[key]
              : `Intercepted ${key}`;
          return acc;
        }, {} as Translation);
      },
      preSaveTranslationKey(key: string) {
        return `preSaveTranslationKey ${key}`;
      }
    };
    loadLang(service);
    runLoader();
    const translation = service.getTranslation('en');
    Object.keys(translation).forEach(key => {
      expect(translation[key]).toEqual(`Intercepted ${key}`);
    });
    service.setTranslationKey('home', 'test');
    expect(service.translate('home')).toEqual('preSaveTranslationKey home');
  }));
});
