import { fakeAsync } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { translate, TranslocoService } from '../../transloco.service';
import { provideGlobalTranslateFn } from '../../transloco.providers';
import { mockLangs, providersMock } from '../mocks';

import { loadLang } from './service-spec-utils';

describe('provideGlobalTranslateFn', () => {
  it(`GIVEN provideGlobalTranslateFn is explicitly added to providers
      WHEN translate() is called after loading a language
      THEN should return the translated value`, fakeAsync(() => {
    const svc = TestBed.configureTestingModule({
      providers: [providersMock, provideGlobalTranslateFn()],
    }).inject(TranslocoService);
    loadLang(svc);
    expect(translate('home')).toEqual(mockLangs['en'].home);
  }));
});
