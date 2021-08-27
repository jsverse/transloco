import { createService } from '../mocks';
import { TranslocoService } from '../../transloco.service';

describe('translate', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it('should set the current lang', () => {
    const langSpy = jasmine.createSpy();
    const newLang = 'es';
    service.langChanges$.subscribe(langSpy);
    service.setActiveLang(newLang);
    expect(langSpy).toHaveBeenCalledWith(newLang);
  });
});
