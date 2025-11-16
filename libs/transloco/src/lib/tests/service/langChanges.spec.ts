import { createService } from '../mocks';
import { TranslocoService } from '../../transloco.service';

describe('translate', () => {
  let service: TranslocoService;

  beforeEach(() => (service = createService()));

  it(`GIVEN service with langChanges subscription
      WHEN setActiveLang is called
      THEN should emit new language`, () => {
    const langSpy = jasmine.createSpy();
    const newLang = 'es';
    service.langChanges$.subscribe(langSpy);
    service.setActiveLang(newLang);
    expect(langSpy).toHaveBeenCalledWith(newLang);
  });
});
