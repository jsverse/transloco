import { createService } from '../transloco.mocks';

describe('translate', () => {
  let service;

  beforeEach(() => (service = createService()));

  it('should set the current lang', () => {
    const langSpy = jasmine.createSpy();
    const newLang = 'es';
    service.langChanges$.subscribe(langSpy);
    service.setActiveLang(newLang);
    expect(langSpy).toHaveBeenCalledWith(newLang);
  });
});
