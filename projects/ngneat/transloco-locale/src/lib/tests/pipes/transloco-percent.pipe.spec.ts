import { TranslocoPercentPipe } from '../../pipes/transloco-percent.pipe';
import { createFakeService, createFakeCDR } from '../mocks';
import { defaultConfig, LocaleConfig } from './../../transloco-locale.config';

describe('TranslocoPercentPipe', () => {
  let service;
  let cdr;
  let pipe: TranslocoPercentPipe;

  beforeEach(() => {
    service = createFakeService();
    cdr = createFakeCDR();
    pipe = new TranslocoPercentPipe(service, cdr, defaultConfig.localeConfig);
  });

  it('should transform number to locale format number', () => {
    expect(pipe.transform(1)).toEqual('100%');
  });

  it('should transform string to locale format number', () => {
    expect(pipe.transform('1')).toEqual('100%');
  });

  it('should handle none transformable values', () => {
    expect(pipe.transform(null)).toEqual('');
    expect(pipe.transform(<any>{})).toEqual('');
    expect(pipe.transform('none number string')).toEqual('');
  });

  it('should use default config options', () => {
    spyOn(Intl, 'NumberFormat').and.callThrough();
    const config: LocaleConfig = {
      global: { percent: { useGrouping: true, maximumFractionDigits: 2 } },
      localeBased: {}
    };
    const pipe = new TranslocoPercentPipe(service, cdr, config);
    pipe.transform('123');
    const call = (Intl.NumberFormat as any).calls.argsFor(0);
    expect(call[1].useGrouping).toBeTruthy();
    expect(call[1].maximumFractionDigits).toEqual(2);
  });

  it('should use passed digit options instead of default options', () => {
    spyOn(Intl, 'NumberFormat').and.callThrough();
    const config = { useGrouping: true, maximumFractionDigits: 3 };
    pipe.transform('123', config);
    const call = (Intl.NumberFormat as any).calls.argsFor(0);
    expect(call[1].useGrouping).toBeTruthy();
    expect(call[1].maximumFractionDigits).toEqual(3);
  });
});
