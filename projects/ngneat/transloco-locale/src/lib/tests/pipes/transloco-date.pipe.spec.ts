import { TranslocoDatePipe } from '../../pipes/transloco-date.pipe';
import { createFakeService, createFakeCDR, LOCALE_CONFIG_MOCK } from '../mocks';
import { defaultConfig } from '../../transloco-locale.config';

describe('TranslocoDatePipe', () => {
  let service;
  let date;
  let cdr;

  beforeEach(() => {
    service = createFakeService();
    cdr = createFakeCDR();
    date = new Date(2019, 9, 7, 12, 0, 0);
    spyOn(date, 'toLocaleDateString').and.callThrough();
  });

  it('Should transform date to locale formatted date', () => {
    const pipe = new TranslocoDatePipe(service, cdr, defaultConfig.localeConfig);
    expect(pipe.transform(date)).toEqual('10/7/2019');
  });

  it('Should consider a given format over the current locale', () => {
    const pipe = new TranslocoDatePipe(service, cdr, defaultConfig.localeConfig);
    pipe.transform(date, { dateStyle: 'medium', timeStyle: 'medium' });
    expect(date.toLocaleDateString).toHaveBeenCalledWith('en-US', { dateStyle: 'medium', timeStyle: 'medium' });
  });

  it('Should consider a global date config', () => {
    const pipe = new TranslocoDatePipe(service, cdr, LOCALE_CONFIG_MOCK);
    pipe.transform(date);
    expect(date.toLocaleDateString).toHaveBeenCalledWith('en-US', { dateStyle: 'medium', timeStyle: 'medium' });
  });

  it('Should consider a locale config over global', () => {
    service = createFakeService('es-ES');
    const pipe = new TranslocoDatePipe(service, cdr, LOCALE_CONFIG_MOCK);
    pipe.transform(date);
    expect(date.toLocaleDateString).toHaveBeenCalledWith('es-ES', { dateStyle: 'long', timeStyle: 'long' });
  });

  it('Should consider a given config over the global config', () => {
    const pipe = new TranslocoDatePipe(service, cdr, LOCALE_CONFIG_MOCK);
    pipe.transform(date, { dateStyle: 'full' });
    expect(date.toLocaleDateString).toHaveBeenCalledWith('en-US', { dateStyle: 'full', timeStyle: 'medium' });
  });

  it('Should handle none date values', () => {
    const pipe = new TranslocoDatePipe(service, cdr, LOCALE_CONFIG_MOCK);
    expect(pipe.transform(null)).toEqual('');
    expect(pipe.transform(<any>{})).toEqual('');
    expect(pipe.transform('none date string')).toEqual('');
  });

  it('Should transform number to date', () => {
    const pipe = new TranslocoDatePipe(service, cdr, defaultConfig.localeConfig);
    expect(pipe.transform(0)).toEqual('1/1/1970');
  });

  it('Should transform string to date', () => {
    const pipe = new TranslocoDatePipe(service, cdr, defaultConfig.localeConfig);
    expect(pipe.transform('2019-02-08')).toEqual('2/8/2019');
  });

  it('Should transform an ISO 8601 string to date', () => {
    const pipe = new TranslocoDatePipe(service, cdr, LOCALE_CONFIG_MOCK);
    expect(pipe.transform('2019-09-12T19:51:33Z')).toEqual('Sep 12, 2019, 10:51:33 PM');
  });
});
