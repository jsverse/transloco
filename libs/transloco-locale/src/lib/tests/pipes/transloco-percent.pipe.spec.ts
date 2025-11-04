import { SpectatorPipe } from '@ngneat/spectator';

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
    it('should handle null', () => {
      spectator = pipeFactory(getPipeTpl(null));
      expect(spectator.element).toHaveText('');
    });
    it('should handle {}', () => {
      spectator = pipeFactory(getPipeTpl({}));
      expect(spectator.element).toHaveText('');
    });
    it('should handle none number string', () => {
      spectator = pipeFactory(getPipeTpl('none number string'));
      expect(spectator.element).toHaveText('');
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
      getPipeTpl('1', '{ useGrouping: true, maximumFractionDigits: 3 }'),
    );
    const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
    expect(useGrouping).toBeTrue();
    expect(maximumFractionDigits).toEqual(3);
  });

  it('should return previous result with same config', () => {
    spectator = pipeFactory(
      `{{ data | translocoPercent:config }}`,
      {
        hostProps: {
          data: '123',
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
      data: '123',
      config: { useGrouping: false, maximumFractionDigits: 3 }
    });
    const second = spectator.element.textContent;

    expect(intlSpy).not.toHaveBeenCalled();
    expect(second).toBe(first);
  });
});
