import { createFakeService, createFakeCDR } from '../mocks';
import { TranslocoDecimalPipe } from './../../pipes/transloco-decimal.pipe';

describe('TranslocoDecimalPipe', () => {
  let service;
  let cdr;
  let pipe: TranslocoDecimalPipe;

  beforeEach(() => {
    service = createFakeService();
    cdr = createFakeCDR();
    pipe = new TranslocoDecimalPipe(service, cdr, {}, {});
  });

  it('Should transform number to locale format number', () => {
    expect(pipe.transform(123456)).toEqual('123,456');
  });

  it('Should transform string to locale format number', () => {
    expect(pipe.transform('123456')).toEqual('123,456');
  });

  it('Should take the format from the locale', () => {
    service = createFakeService('es-ES');
    pipe = new TranslocoDecimalPipe(service, cdr, {}, {});
    expect(pipe.transform(123456)).toEqual('123.456');
  });

  it('Should take the number from the locale', () => {
    expect(pipe.transform(123456, undefined, 'es-ES')).toEqual('123.456');
  });

  it('Should use default config options', () => {
    spyOn(Intl, 'NumberFormat').and.callThrough();
    const config = { useGrouping: true, maximumFractionDigits: 2 };
    const pipe = new TranslocoDecimalPipe(service, cdr, config, {});
    pipe.transform('123');
    const call = (Intl.NumberFormat as any).calls.argsFor(0);
    expect(call[1].useGrouping).toBeTruthy();
    expect(call[1].maximumFractionDigits).toEqual(2);
  });

  it('Should use passed digit options instead of default options', () => {
    spyOn(Intl, 'NumberFormat').and.callThrough();
    const config = { useGrouping: true, maximumFractionDigits: 3 };
    pipe.transform('123', config);
    const call = (Intl.NumberFormat as any).calls.argsFor(0);
    expect(call[1].useGrouping).toBeTruthy();
    expect(call[1].maximumFractionDigits).toEqual(3);
  });

  it('Should handle none transformable values', () => {
    expect(pipe.transform(null)).toEqual('');
    expect(pipe.transform(<any>{})).toEqual('');
    expect(pipe.transform('none number string')).toEqual('');
  });
});
