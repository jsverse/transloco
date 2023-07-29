import { SpectatorPipe } from '@ngneat/spectator';

import { TranslocoDatePipe } from '../../pipes';
import {
  LOCALE_CONFIG_MOCK,
  provideTranslocoLocaleConfigMock,
  provideTranslocoServiceMock,
} from '../mocks';
import { createLocalePipeFactory } from '../utils';

describe('TranslocoDatePipe', () => {
  let intlSpy: jasmine.Spy<(typeof Intl)['DateTimeFormat']>;
  let spectator: SpectatorPipe<TranslocoDatePipe>;
  const pipeFactory = createLocalePipeFactory(TranslocoDatePipe);

  const date = new Date(2019, 9, 7, 12, 0, 0);

  function getIntlCallArgs() {
    const [locale, options] = intlSpy.calls.argsFor(0);

    return [locale!, options!] as const;
  }

  beforeEach(() => {
    intlSpy = spyOn(Intl, 'DateTimeFormat').and.callThrough();
  });

  it('should transform date to locale formatted date', () => {
    spectator = pipeFactory(`{{ date | translocoDate }}`, {
      hostProps: {
        date,
      },
    });
    expect(spectator.element).toHaveText('10/7/2019');
  });

  it('should consider a given format over the current locale', () => {
    spectator = pipeFactory(`{{ date | translocoDate:config }}`, {
      hostProps: {
        date,
        config: { dateStyle: 'medium', timeStyle: 'medium' },
      },
    });
    const [, { dateStyle, timeStyle }] = getIntlCallArgs();
    expect(dateStyle).toEqual('medium');
    expect(timeStyle).toEqual('medium');
  });

  it('should consider a global date config', () => {
    spectator = pipeFactory(`{{ date | translocoDate }}`, {
      hostProps: {
        date,
      },
      providers: [provideTranslocoLocaleConfigMock(LOCALE_CONFIG_MOCK)],
    });
    const [, { dateStyle, timeStyle }] = getIntlCallArgs();
    expect(dateStyle).toEqual('medium');
    expect(timeStyle).toEqual('medium');
  });

  it('should consider a locale config over global', () => {
    spectator = pipeFactory(`{{ date | translocoDate }}`, {
      hostProps: {
        date,
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
    spectator = pipeFactory(`{{ date | translocoDate:config }}`, {
      hostProps: {
        date,
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
      spectator = pipeFactory(`{{ null | translocoDate }}`);
      expect(spectator.element).toHaveText('');
    });
    it('should handle {}', () => {
      spectator = pipeFactory(`{{ {} | translocoDate }}`);
      expect(spectator.element).toHaveText('');
    });
    it('should handle none number string', () => {
      spectator = pipeFactory(`{{ 'none number string' | translocoDate }}`);
      expect(spectator.element).toHaveText('');
    });
  });

  it('should transform number to date', () => {
    spectator = pipeFactory(`{{ date | translocoDate:config }}`, {
      hostProps: {
        date: 0,
        config: { timeZone: 'UTC' },
      },
    });
    expect(spectator.element).toHaveText('1/1/1970');
  });

  it('should transform string to date', () => {
    spectator = pipeFactory(`{{ date | translocoDate:config }}`, {
      hostProps: {
        date: '2019-02-08',
      },
    });
    expect(spectator.element).toHaveText('2/8/2019');
  });

  it('should transform an ISO 8601 string to date', () => {
    spectator = pipeFactory(`{{ date | translocoDate:config:locale }}`, {
      hostProps: {
        date: '2019-09-12T19:51:33Z',
        config: { timeZone: 'UTC' },
        locale: 'en-US',
      },
      providers: [provideTranslocoLocaleConfigMock(LOCALE_CONFIG_MOCK)],
    });
    expect(spectator.element).toHaveText('Sep 12, 2019, 7:51:33 PM');
  });
});
