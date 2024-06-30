import { SpectatorPipe } from '@ngneat/spectator';
import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Mock } from 'ts-mocks';

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
      `{{ 123456 | translocoDecimal:{ useGrouping: true, maximumFractionDigits: 3 } }}`
    );
    const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
    expect(useGrouping).toEqual(true);
    expect(maximumFractionDigits).toEqual(3);
  });

  describe('None transformable values', () => {
    let pipe: TranslocoDecimalPipe;
    let cdrMock: ChangeDetectorRef;

    beforeEach(() => {
      cdrMock = new Mock<ChangeDetectorRef>({
        markForCheck: () => {},
      }).Object;

      TestBed.configureTestingModule({
        providers: [{ provide: ChangeDetectorRef, useValue: cdrMock }],
      });
      pipe = TestBed.runInInjectionContext(() => new TranslocoDecimalPipe());
    });
    it('should handle null', () => {
      expect(pipe.transform(null)).toBeNull();
    });
    it('should handle undefined', () => {
      expect(pipe.transform(undefined)).toBeUndefined();
    });
    it('should handle {}', () => {
      expect(pipe.transform({} as any)).toBe('');
    });
    it('should handle none number string', () => {
      expect(pipe.transform('none number string')).toBe('');
    });
  });
});
