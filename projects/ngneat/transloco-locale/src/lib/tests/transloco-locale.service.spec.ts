import { TranslocoLocaleService } from '../transloco-locale.service';

describe('TranslocoLocaleService', () => {
  let service: TranslocoLocaleService;

  it('should return the current locale', () => {
    const translocoService: any = {
      getActiveLang: jasmine.createSpy().and.callFake(() => 'en-US')
    };
    service = new TranslocoLocaleService(translocoService);
    expect(service.getLocale()).toEqual('en-US');
  });

  it('should throw error it the active lang is not locale format', () => {
    const translocoService: any = {
      getActiveLang: jasmine.createSpy().and.returnValues(['en', 'En-us', 'en-Us', 'en-us'])
    };
    service = new TranslocoLocaleService(translocoService);
    expect(() => service.getLocale()).toThrow();
    expect(() => service.getLocale()).toThrow();
    expect(() => service.getLocale()).toThrow();
    expect(() => service.getLocale()).toThrow();
  });
});
