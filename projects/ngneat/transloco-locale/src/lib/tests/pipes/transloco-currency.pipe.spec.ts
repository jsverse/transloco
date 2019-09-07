import { TranslocoCurrencyPipe } from '../../pipes/transloco-currency.pipe';
import { createFakeService, createFakeCDR } from '../mocks';

describe('TranslocoCurrencyPipe', () => {
  let service;
  let cdr;

  beforeEach(() => {
    service = createFakeService();
    cdr = createFakeCDR();
  });

  it('Should transform number to currency', () => {
    const pipe = new TranslocoCurrencyPipe(service, cdr, {});
    expect(pipe.transform(123)).toEqual('$123.00');
    expect(pipe.transform('123')).toEqual('$123.00');
  });

  it('Should take the currency from the locale', () => {
    service = createFakeService('es-ES');
    const pipe = new TranslocoCurrencyPipe(service, cdr, {});
    expect(pipe.transform('123')).toContain('€');
  });

  it('Should take the currency from the locale', () => {
    const pipe = new TranslocoCurrencyPipe(service, cdr, {});
    expect(pipe.transform('123', undefined, undefined, 'EUR')).toContain('€');
  });
});
