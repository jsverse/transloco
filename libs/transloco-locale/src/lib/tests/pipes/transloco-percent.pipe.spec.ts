import { SpectatorPipe } from '@ngneat/spectator';
import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Mock } from 'ts-mocks';

import { TranslocoPercentPipe } from '../../pipes';
import { LOCALE_CONFIG_MOCK, provideTranslocoLocaleConfigMock } from '../mocks';
import { createLocalePipeFactory, pipeTplFactory } from '../utils';

describe('TranslocoPercentPipe', () => {
  let intlSpy: jasmine.Spy<(typeof Intl)['NumberFormat']>;
  let spectator: SpectatorPipe<TranslocoPercentPipe>;
  const getPipeTpl = pipeTplFactory('translocoPercent');
  const pipeFactory = createLocalePipeFactory(TranslocoPercentPipe);

  function getIntlCallArgs() {
    const [locale, options] = intlSpy.calls.argsFor(0);

    return [locale!, options!] as const;
  }

  beforeEach(() => {
    intlSpy = spyOn(Intl, 'NumberFormat').and.callThrough();
  });

  it('should transform number to locale format number', () => {
    spectator = pipeFactory(getPipeTpl(1));
    expect(spectator.element).toHaveText('100%');
  });

  it('should transform string to locale format number', () => {
    spectator = pipeFactory(getPipeTpl('1'));
    expect(spectator.element).toHaveText('100%');
  });

  describe('None transformable values', () => {
    let pipe: TranslocoPercentPipe;
    let cdrMock: ChangeDetectorRef;

    beforeEach(() => {
      cdrMock = new Mock<ChangeDetectorRef>({
        markForCheck: () => {},
      }).Object;

      TestBed.configureTestingModule({
        providers: [{ provide: ChangeDetectorRef, useValue: cdrMock }],
      });
      pipe = TestBed.runInInjectionContext(() => new TranslocoPercentPipe());
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

  it('should use default config options', () => {
    spectator = pipeFactory(getPipeTpl('1'), {
      providers: [provideTranslocoLocaleConfigMock(LOCALE_CONFIG_MOCK)],
    });
    const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
    expect(useGrouping).toBeFalse();
    expect(maximumFractionDigits).toEqual(2);
  });

  it('should use passed digit options instead of default options', () => {
    spectator = pipeFactory(
      getPipeTpl('1', '{ useGrouping: true, maximumFractionDigits: 3 }')
    );
    const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
    expect(useGrouping).toBeTrue();
    expect(maximumFractionDigits).toEqual(3);
  });
});
