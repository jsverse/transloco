import { TranslocoDatePipe } from '../../pipes/transloco-date.pipe';
import { createFakeService, createFakeCDR, LOCALE_CONFIG_MOCK } from '../mocks';
import { defaultConfig } from '../../transloco-locale.config';
import { DateFormatOptions } from '../../transloco-locale.types';

describe('TranslocoDatePipe', () => {
  let service;
  let date;
  let cdr;

  beforeEach(() => {
    service = createFakeService();
    cdr = createFakeCDR();
    date = new Date(2019, 9, 7, 12, 0, 0);
  });

  it('should transform date to locale formatted date', () => {
    const pipe = new TranslocoDatePipe(service, cdr, defaultConfig.localeConfig);
    expect(pipe.transform(date)).toEqual('10/7/2019');
  });

  it('should consider a given format over the current locale', () => {
    spyOn(Intl, 'DateTimeFormat').and.callThrough();
    const pipe = new TranslocoDatePipe(service, cdr, defaultConfig.localeConfig);
    pipe.transform(date, { dateStyle: 'medium', timeStyle: 'medium' });
    const call = (Intl.DateTimeFormat as any).calls.argsFor(0);

    expect(call[1].dateStyle).toEqual('medium');
    expect(call[1].timeStyle).toEqual('medium');
  });

  it('should consider a global date config', () => {
    spyOn(Intl, 'DateTimeFormat').and.callThrough();
    const pipe = new TranslocoDatePipe(service, cdr, LOCALE_CONFIG_MOCK);
    pipe.transform(date);
    const call = (Intl.DateTimeFormat as any).calls.argsFor(0);

    expect(call[1].dateStyle).toEqual('medium');
    expect(call[1].timeStyle).toEqual('medium');
  });

  it('should consider a locale config over global', () => {
    spyOn(Intl, 'DateTimeFormat').and.callThrough();
    service = createFakeService('es-ES');
    const pipe = new TranslocoDatePipe(service, cdr, LOCALE_CONFIG_MOCK);
    pipe.transform(date);

    const call = (Intl.DateTimeFormat as any).calls.argsFor(0);

    expect(call[0]).toEqual('es-ES');
    expect(call[1].dateStyle).toEqual('long');
    expect(call[1].timeStyle).toEqual('long');
  });

  it('should consider a given config over the global config', () => {
    spyOn(Intl, 'DateTimeFormat').and.callThrough();
    const pipe = new TranslocoDatePipe(service, cdr, LOCALE_CONFIG_MOCK);
    pipe.transform(date, { dateStyle: 'full' });

    const call = (Intl.DateTimeFormat as any).calls.argsFor(0);

    expect(call[1].dateStyle).toEqual('full');
  });

  it('should handle none date values', () => {
    const pipe = new TranslocoDatePipe(service, cdr, LOCALE_CONFIG_MOCK);
    expect(pipe.transform(null)).toEqual('');
    expect(pipe.transform(<any>{})).toEqual('');
    expect(pipe.transform('none date string')).toEqual('');
  });

  it('should transform number to date', () => {
    const pipe = new TranslocoDatePipe(service, cdr, defaultConfig.localeConfig);
    expect(pipe.transform(0)).toEqual('1/1/1970');
  });

  it('should transform string to date', () => {
    const pipe = new TranslocoDatePipe(service, cdr, defaultConfig.localeConfig);
    expect(pipe.transform('2019-02-08')).toEqual('2/8/2019');
  });

  it('should transform an ISO 8601 string to date', () => {
    const pipe = new TranslocoDatePipe(service, cdr, LOCALE_CONFIG_MOCK);
    expect(pipe.transform('2019-09-12T19:51:33Z', { timeZone: 'UTC' }, 'en-US')).toEqual('Sep 12, 2019, 7:51:33 PM');
  });
});
