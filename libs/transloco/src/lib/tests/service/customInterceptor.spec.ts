import { fakeAsync } from '@angular/core/testing';
import { createService, runLoader } from '../transloco.mocks';
import { loadLang } from './utils';
import { isString } from '../../helpers';

describe('Custom Interceptor', () => {
  let service;

  beforeEach(() => (service = createService()));

  it('should support', fakeAsync(() => {
    (service as any).interceptor = {
      // tslint:disable-next-line:no-shadowed-variable
      preSaveTranslation(translation, lang) {
        return Object.keys(translation).reduce((acc: any, key) => {
          acc[key] =
            isString(translation[key]) && translation[key].includes('preSaveTranslationKey')
              ? translation[key]
              : `Intercepted ${key}`;
          return acc;
        }, {});
      },
      preSaveTranslationKey(key, value) {
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
