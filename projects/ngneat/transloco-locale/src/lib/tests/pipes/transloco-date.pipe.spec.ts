import { TranslocoDatePipe } from '../../pipes/transloco-date.pipe';
import { createFakeService, createFakeCDR } from '../mocks';

describe('TranslocoDatePipe', () => {
  let service;
  let date;
  let cdr;

  beforeEach(() => {
    service = createFakeService();
    cdr = createFakeCDR();
    date = new Date(2019, 9, 7, 12, 0, 0);
  });

  it('Should transform date to locale formatted date', () => {
    const pipe = new TranslocoDatePipe(service, cdr, {});
    expect(pipe.transform(date)).toEqual('10/7/2019');
  });

  it('Should consider a given format over the current locale', () => {
    const pipe = new TranslocoDatePipe(service, cdr, {});
    expect(pipe.transform(date, { dateStyle: 'medium', timeStyle: 'medium' })).toEqual('Oct 7, 2019, 12:00:00 PM');
  });
});
