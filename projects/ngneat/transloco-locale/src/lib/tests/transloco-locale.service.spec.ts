import { Observable, of, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { TranslocoLocaleService } from '../transloco-locale.service';
import { mockService } from './mocks';
import { Locale } from '@ngneat/transloco-locale';

describe('TranslocoLocaleService', () => {
  let service: TranslocoLocaleService;

  describe('getCurrencySymbol', () => {
    it('should return symbol for locals with prefix notation', () => {
      service = mockService();
      expect(service.getCurrencySymbol()).toEqual('$');
    });

    it('should return symbol for locals with postfix notation', () => {
      service = mockService();
      service.setLocale('de-DE');
      expect(service.getCurrencySymbol()).toEqual('€');
    });
  });

  describe('getLocale', () => {
    let service: TranslocoLocaleService;
    let translocoService: any;
    let localeChanges: Observable<Locale>;

    describe('With lang mapping', () => {
      beforeEach(() => {
        translocoService = {
          langChanges$: new Subject()
        };
        service = mockService({ translocoService });
        localeChanges = service.localeChanges$.pipe(take(1));
      });

      it('should return the default locale, no language change', async () => {
        expect(await localeChanges.toPromise()).toEqual('en-US');
        expect(service.getLocale()).toEqual('en-US');
      });

      it('should return the current locale after active language change', async () => {
        translocoService.langChanges$.next('en-UK');

        expect(await localeChanges.toPromise()).toEqual('en-UK');
        expect(service.getLocale()).toEqual('en-UK');
      });

      it('should return ef mapped to en-US', async () => {
        translocoService.langChanges$.next('es');

        expect(await localeChanges.toPromise()).toEqual('es-ES');
        expect(service.getLocale()).toEqual('es-ES');
      });

      it('should not update a wrong locale format', async () => {
        translocoService.langChanges$.next('uuEF');

        expect(await localeChanges.toPromise()).toEqual('en-US');
        expect(service.getLocale()).toEqual('en-US');
      });
    });

    describe('Without lang mapping', () => {
      beforeEach(() => {
        translocoService = {
          langChanges$: new Subject()
        };
        service = mockService({ translocoService, langToLocaleMappingEnabled: false });
        localeChanges = service.localeChanges$.pipe(take(1));
      });

      it('should return the default locale', () => {
        service = mockService();
        expect(service.getLocale()).toEqual('en-US');
      });

      it('should return the current locale', async () => {
        service.setLocale('en-UK');
        expect(await localeChanges.toPromise()).toEqual('en-UK');
        expect(service.getLocale()).toEqual('en-UK');
      });

      it('should not update on lang change', async () => {
        translocoService.langChanges$.next('en-UK');

        expect(await localeChanges.toPromise()).toEqual('en-US');
        expect(service.getLocale()).toEqual('en-US');
      });
    });
  });

  describe('setLocale', () => {
    beforeEach(() => {
      const translocoService: any = {
        langChanges$: of('en')
      };
      service = mockService({ translocoService });
    });

    it('should set a given locale', () => {
      service.setLocale('es-ES');
      expect(service.getLocale()).toEqual('es-ES');
    });

    it('should throw error when receive wrong locale format', () => {
      spyOn(console, 'error');
      service.setLocale('en');
      service.setLocale('En-us');
      service.setLocale('en-Us');
      service.setLocale('en-us');
      expect(console.error).toHaveBeenCalledTimes(4);
    });
  });

  describe('localeChanges$', () => {
    it('should call subscription on locale change', () => {
      const translocoService: any = {
        langChanges$: of('en-US')
      };
      const spy = jasmine.createSpy();
      service = mockService({ translocoService });
      service.localeChanges$.subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('en-US');
    });

    it('should call subscription with the default language locale', () => {
      const translocoService: any = {
        langChanges$: of('en')
      };
      const spy = jasmine.createSpy();
      service = mockService({ translocoService });
      service.localeChanges$.subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('en-US');
    });

    it('should call subscription after setting locale', () => {
      const translocoService: any = {
        langChanges$: of()
      };
      const spy = jasmine.createSpy();
      service = mockService({ translocoService });
      service.localeChanges$.subscribe(spy);
      service.setLocale('en-US');
      expect(spy).toHaveBeenCalledWith('en-US');
    });
  });
});
