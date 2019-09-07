import { TranslocoPercentPipe } from '../../pipes/transloco-percent.pipe';
import { createFakeService, createFakeCDR } from '../mocks';

describe('TranslocoPercentPipe', () => {
  let service;
  let cdr;

  beforeEach(() => {
    service = createFakeService();
    cdr = createFakeCDR();
  });

  it('Should transform number to locale format number', () => {
    const pipe = new TranslocoPercentPipe(service, cdr, {});
    expect(pipe.transform(1)).toEqual('100%');
  });
});
