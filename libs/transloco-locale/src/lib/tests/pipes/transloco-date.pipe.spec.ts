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

  it(`GIVEN a date object
      WHEN transforming to locale formatted date
      THEN it should format according to current locale`, () => {
    spectator = pipeFactory(`{{ date | translocoDate }}`, {
      hostProps: {
        date,
      },
    });
    expect(spectator.element).toHaveText('10/7/2019');
  });

  it(`GIVEN a custom format config
      WHEN transforming date
      THEN it should use the given format over current locale`, () => {
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

  it(`GIVEN a global date config
      WHEN transforming date
      THEN it should apply the global config`, () => {
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

  it(`GIVEN locale-specific config and es-ES locale
      WHEN transforming date
      THEN it should use locale config over global config`, () => {
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

  it(`GIVEN custom config and global config
      WHEN transforming date
      THEN it should use given config over global config`, () => {
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
    it(`GIVEN null value
        WHEN transforming to date
        THEN it should return empty string`, () => {
      spectator = pipeFactory(`{{ null | translocoDate }}`);
      expect(spectator.element).toHaveText('');
    });
    it(`GIVEN empty object
        WHEN transforming to date
        THEN it should return empty string`, () => {
      spectator = pipeFactory(`{{ {} | translocoDate }}`);
      expect(spectator.element).toHaveText('');
    });
    it(`GIVEN non-numeric string
        WHEN transforming to date
        THEN it should return empty string`, () => {
      spectator = pipeFactory(`{{ 'none number string' | translocoDate }}`);
      expect(spectator.element).toHaveText('');
    });
  });

  it(`GIVEN a timestamp number (0) with UTC timezone
      WHEN transforming to date
      THEN it should format as epoch date`, () => {
    spectator = pipeFactory(`{{ date | translocoDate:config }}`, {
      hostProps: {
        date: 0,
        config: { timeZone: 'UTC' },
      },
    });
    expect(spectator.element).toHaveText('1/1/1970');
  });

  it(`GIVEN a date string
      WHEN transforming to date
      THEN it should parse and format the date`, () => {
    spectator = pipeFactory(`{{ date | translocoDate:config }}`, {
      hostProps: {
        date: '2019-02-08',
      },
    });
    expect(spectator.element).toHaveText('2/8/2019');
  });

  it(`GIVEN an ISO 8601 string with UTC timezone
      WHEN transforming to date with en-US locale
      THEN it should format with locale and timezone applied`, () => {
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
