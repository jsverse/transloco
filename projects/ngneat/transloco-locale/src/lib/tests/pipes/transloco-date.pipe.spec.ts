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
    const pipe = new TranslocoDatePipe(service, cdr, {}, {});
    expect(pipe.transform(date)).toEqual('10/7/2019');
  });

  it('Should consider a given format over the current locale', () => {
    const pipe = new TranslocoDatePipe(service, cdr, {}, {});
    expect(pipe.transform(date, { dateStyle: 'medium', timeStyle: 'medium' })).toEqual('Oct 7, 2019, 12:00:00 PM');
  });

  it('Should consider a global date config', () => {
    const pipe = new TranslocoDatePipe(service, cdr, { dateStyle: 'medium', timeStyle: 'medium' }, {});
    expect(pipe.transform(date)).toEqual('Oct 7, 2019, 12:00:00 PM');
  });

  it('Should consider a given config over the global config', () => {
    const pipe = new TranslocoDatePipe(service, cdr, { dateStyle: 'medium', timeStyle: 'medium' }, {});
    expect(pipe.transform(date, { dateStyle: 'full' })).toEqual('Monday, October 7, 2019 at 12:00:00 PM');
  });

  it('Should handle none date values', () => {
    const pipe = new TranslocoDatePipe(service, cdr, { dateStyle: 'medium', timeStyle: 'medium' }, {});
    expect(pipe.transform(null)).toEqual('');
    expect(pipe.transform(<any>{})).toEqual('');
    expect(pipe.transform('none date string')).toEqual('');
  });

  it('Should transform number to date', () => {
    const pipe = new TranslocoDatePipe(service, cdr, { dateStyle: 'medium' }, {});
    expect(pipe.transform(0)).toEqual('Jan 1, 1970');
  });

  it('Should transform string to date', () => {
    const pipe = new TranslocoDatePipe(service, cdr, { dateStyle: 'medium' }, {});
    expect(pipe.transform('2019-02-08')).toEqual('Feb 8, 2019');
  });

  it('Should transform an ISO 8601 string to date', () => {
    const pipe = new TranslocoDatePipe(service, cdr, { dateStyle: 'medium', timeStyle: 'medium' }, {});
    expect(pipe.transform('2019-09-12T19:51:33Z')).toEqual('Sep 12, 2019, 10:51:33 PM');
  });
});
