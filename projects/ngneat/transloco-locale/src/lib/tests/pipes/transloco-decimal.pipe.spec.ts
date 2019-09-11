import { createFakeService, createFakeCDR } from '../mocks';
import { TranslocoDecimalPipe } from './../../pipes/transloco-decimal.pipe';

describe('TranslocoDecimalPipe', () => {
  let service;
  let cdr;

  beforeEach(() => {
    service = createFakeService();
    cdr = createFakeCDR();
  });

  it('Should transform number to locale format number', () => {
    const pipe = new TranslocoDecimalPipe(service, cdr, {});
    expect(pipe.transform(123456)).toEqual('123,456');
  });
  // TODO: test string.
  it('Should transform number to locale format number', () => {
    // const pipe = new TranslocoDecimalPipe(service, cdr, {});
    // expect(pipe.transform(123456)).toEqual('123,456');
  });
});
