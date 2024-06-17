import { SpectatorPipe } from '@ngneat/spectator';

import { TranslocoDateRangePipe } from '../../pipes';
import {
  LOCALE_CONFIG_MOCK,
  provideTranslocoLocaleConfigMock,
  provideTranslocoServiceMock,
} from '../mocks';
import { createLocalePipeFactory } from '../utils';

describe('TranslocoDateRangePipe', () => {
  let intlSpy: jasmine.Spy<(typeof Intl)['DateTimeFormat']>;
  let spectator: SpectatorPipe<TranslocoDateRangePipe>;
  const pipeFactory = createLocalePipeFactory(TranslocoDateRangePipe);

  const startDate = new Date(2019, 9, 7, 12, 0, 0);
  const endDate = new Date(2020, 4, 15, 16, 0, 0);

  function getIntlCallArgs() {
    const [locale, options] = intlSpy.calls.argsFor(0);

    return [locale!, options!] as const;
  }

  beforeEach(() => {
    intlSpy = spyOn(Intl, 'DateTimeFormat').and.callThrough();
  });

  it('should transform date to locale formatted date', () => {
    spectator = pipeFactory(`{{ startDate | translocoDateRange:endDate }}`, {
      hostProps: {
        startDate: startDate,
        endDate: endDate,
      },
    });
    expect(spectator.element).toHaveText('9/7/2019 – 4/15/2020');
  });

  it('should consider a given format over the current locale', () => {
    spectator = pipeFactory(`{{ startDate | translocoDateRange:endDate:config }}`, {
      hostProps: {
        startDate: startDate,
        config: { dateStyle: 'medium', timeStyle: 'medium' },
      },
    });
    const [, { dateStyle, timeStyle }] = getIntlCallArgs();
    expect(dateStyle).toEqual('medium');
    expect(timeStyle).toEqual('medium');
  });

  it('should consider a global date config', () => {
    spectator = pipeFactory(`{{ startDate | translocoDateRange:endDate }}`, {
      hostProps: {
        startDate: startDate,
      },
      providers: [provideTranslocoLocaleConfigMock(LOCALE_CONFIG_MOCK)],
    });
    const [, { dateStyle, timeStyle }] = getIntlCallArgs();
    expect(dateStyle).toEqual('medium');
    expect(timeStyle).toEqual('medium');
  });

  it('should consider a locale config over global', () => {
    spectator = pipeFactory(`{{ startDate | translocoDateRange:endDate }}`, {
      hostProps: {
        startDate: startDate,
      },
      providers: [
        provideTranslocoLocaleConfigMock(LOCALE_CONFIG_MOCK),
        provideTranslocoServiceMock('es-ES'),
      ],
    });
    const [locale, { dateStyle, timeStyle }] = getIntlCallArgs();
    expect(locale).toEqual('es-ES');
    expect(dateStyle).toEqual('long');
    expect(timeStyle).toEqual('long');
  });

  it('should consider a given config over the global config', () => {
    spectator = pipeFactory(`{{ startDate | translocoDateRange:endDate:config }}`, {
      hostProps: {
        startDate: startDate,
        config: { dateStyle: 'full' },
      },
      providers: [provideTranslocoLocaleConfigMock(LOCALE_CONFIG_MOCK)],
    });
    const [, { dateStyle, timeStyle }] = getIntlCallArgs();
    expect(dateStyle).toEqual('full');
    expect(timeStyle).toEqual('medium');
  });

  describe('None date values', () => {
    it('should handle null', () => {
      spectator = pipeFactory(`{{ null | translocoDateRange:null }}`);
      expect(spectator.element).toHaveText('');
    });
    it('should handle {}', () => {
      spectator = pipeFactory(`{{ {} | translocoDateRange:{} }}`);
      expect(spectator.element).toHaveText('');
    });
    it('should handle none number string', () => {
      spectator = pipeFactory(`{{ 'none number string' | translocoDateRange:'none number string' }}`);
      expect(spectator.element).toHaveText('');
    });
  });

  it('should transform number to date', () => {
    spectator = pipeFactory(`{{ startDate | translocoDateRange:endDate:config }}`, {
      hostProps: {
        startDate: 0,
        endDate: 1000000000,
        config: { timeZone: 'UTC' },
      },
    });
    expect(spectator.element).toHaveText('1/1/1970 – 9/9/2001');
  });

  it('should transform string to date', () => {
    spectator = pipeFactory(`{{ startDate | translocoDateRange:config }}`, {
      hostProps: {
        startDate: '2019-02-08',
        endDate: '2020-05-15',
      },
    });
    expect(spectator.element).toHaveText('2/8/2019–5/15/2020');
  });

  it('should transform an ISO 8601 string to date', () => {
    spectator = pipeFactory(`{{ startDate | translocoDateRange:config:locale }}`, {
      hostProps: {
        startDate: '2019-09-12T19:51:33Z',
        endDate: '2019-10-12T19:51:33Z',
        config: { timeZone: 'UTC' },
        locale: 'en-US',
      },
      providers: [provideTranslocoLocaleConfigMock(LOCALE_CONFIG_MOCK)],
    });
    expect(spectator.element).toHaveText('Sep 12, 2019, 7:51:33 PM – Oct 12, 2019, 7:51:33 PM');
  });
});
