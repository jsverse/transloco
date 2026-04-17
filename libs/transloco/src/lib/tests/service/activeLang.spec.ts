import { createService } from '../mocks';
import { TranslocoService } from '../../transloco.service';

describe('activeLang', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it(`GIVEN a newly initialized service
      WHEN activeLang is read
      THEN it should return the default language`, () => {
    expect(service.activeLang()).toBe('en');
  });

  it(`GIVEN a service with a default language
      WHEN setActiveLang is called with a new language
      THEN activeLang signal should reflect the new language`, () => {
    service.setActiveLang('es');
    expect(service.activeLang()).toBe('es');
  });

  it(`GIVEN a service
      WHEN setActiveLang is called multiple times
      THEN activeLang signal should always reflect the latest language`, () => {
    service.setActiveLang('es');
    expect(service.activeLang()).toBe('es');
    service.setActiveLang('en');
    expect(service.activeLang()).toBe('en');
  });
});
