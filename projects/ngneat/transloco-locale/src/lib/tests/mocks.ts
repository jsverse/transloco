import { of } from 'rxjs';

export function createFakeService(locale: string = 'en-US') {
  return {
    getLocale: jasmine.createSpy().and.callFake(() => locale),
    locale$: {
      subscribe: () => of(locale)
    }
  };
}
export function createFakeCDR(locale: string = 'en-US') {
  return {
    markForCheck: jasmine.createSpy()
  };
}
