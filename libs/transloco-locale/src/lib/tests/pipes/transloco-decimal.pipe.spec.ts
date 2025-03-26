import { SpectatorPipe } from '@ngneat/spectator';

import { TranslocoDecimalPipe } from '../../pipes';
import {
  LOCALE_CONFIG_MOCK,
  provideTranslocoLocaleConfigMock,
  provideTranslocoServiceMock,
} from '../mocks';
import { createLocalePipeFactory } from '../utils';

describe('TranslocoDecimalPipe', () => {
  let intlSpy: jasmine.Spy<(typeof Intl)['NumberFormat']>;
  let spectator: SpectatorPipe<TranslocoDecimalPipe>;
  const pipeFactory = createLocalePipeFactory(TranslocoDecimalPipe);

  function getIntlCallArgs() {
    const [locale, options] = intlSpy.calls.argsFor(0);

    return [locale!, options!] as const;
  }

  beforeEach(() => {
    intlSpy = spyOn(Intl, 'NumberFormat').and.callThrough();
  });

  it('should transform number to locale format number', () => {
    spectator = pipeFactory(`{{ 123456 | translocoDecimal }}`);
    expect(spectator.element).toHaveText('123,456');
  });

  it('should transform string to locale format number', () => {
    spectator = pipeFactory(`{{ '123456' | translocoDecimal }}`);
    expect(spectator.element).toHaveText('123,456');
  });

  it('should take the format from the locale', () => {
    spectator = pipeFactory(`{{ 123456 | translocoDecimal }}`, {
      providers: [provideTranslocoServiceMock('es-ES')],
    });
    expect(spectator.element).toHaveText('123.456');
  });

  it('should take the number from the locale', () => {
    spectator = pipeFactory(`{{ 123456 | translocoDecimal:{}:'es-ES' }}`, {
      providers: [provideTranslocoServiceMock('es-ES')],
    });
    expect(spectator.element).toHaveText('123.456');
  });

  it('should use default config options', () => {
    spectator = pipeFactory(`{{ 123456 | translocoDecimal }}`, {
      providers: [provideTranslocoLocaleConfigMock(LOCALE_CONFIG_MOCK)],
    });
    const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
    expect(useGrouping).toEqual(false);
    expect(maximumFractionDigits).toEqual(2);
  });

  it('should use passed digit options instead of default options', () => {
    spectator = pipeFactory(
      `{{ 123456 | translocoDecimal:{ useGrouping: true, maximumFractionDigits: 3 } }}`,
    );
    const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
    expect(useGrouping).toEqual(true);
    expect(maximumFractionDigits).toEqual(3);
  });

  describe('None transformable values', () => {
    it('should handle null', () => {
      spectator = pipeFactory(`{{ null | translocoDecimal }}`);
      expect(spectator.element).toHaveText('');
    });
    it('should handle {}', () => {
      spectator = pipeFactory(`{{ {} | translocoDecimal }}`);
      expect(spectator.element).toHaveText('');
    });
    it('should handle none number string', () => {
      spectator = pipeFactory(`{{ 'none number string' | translocoDecimal }}`);
      expect(spectator.element).toHaveText('');
    });
  });

  it('should return previous result with same config', () => {
    spectator = pipeFactory(
      `{{ data | translocoDecimal:config }}`,
      {
        hostProps: {
          data: 123,
          config: { useGrouping: false, maximumFractionDigits: 3 }
        }
      }
    );

    const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
    expect(useGrouping).toBeFalsy();
    expect(maximumFractionDigits).toEqual(3);
    const first = spectator.element.textContent;

    intlSpy.calls.reset();
    spectator.setHostInput({
      data: 123,
      config: { useGrouping: false, maximumFractionDigits: 3 }
    });
    const second = spectator.element.textContent;

    expect(intlSpy).not.toHaveBeenCalled();
    expect(second).toBe(first);
  });
});
