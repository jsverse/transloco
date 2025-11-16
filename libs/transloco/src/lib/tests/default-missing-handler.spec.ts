import { DefaultMissingHandler } from '../transloco-missing-handler';
import { defaultConfig, TranslocoConfig } from '../transloco.config';

describe('TranslocoMissingHandler', () => {
  const parser = new DefaultMissingHandler();
  const _defaultConfig: TranslocoConfig = {
    ...defaultConfig,
    reRenderOnLangChange: true,
  };

  function assertLog(config?: Partial<TranslocoConfig>, shouldLog = true) {
    spyOn(console, 'warn');
    const result = parser.handle('myKey', { ..._defaultConfig, ...config });
    shouldLog
      ? expect(console.warn).toHaveBeenCalled()
      : expect(console.warn).not.toHaveBeenCalled();
    expect(result).toEqual('myKey');
  }

  it(`GIVEN default config
      WHEN handling a missing key
      THEN should notify a warning message`, () => {
    assertLog();
  });

  it(`GIVEN production mode is enabled
      WHEN handling a missing key
      THEN should not notify a warning message`, () => {
    assertLog({ prodMode: true }, false);
  });

  it(`GIVEN logMissingKey is set to false
      WHEN handling a missing key
      THEN should not notify a warning message`, () => {
    assertLog(
      {
        missingHandler: {
          ..._defaultConfig.missingHandler,
          logMissingKey: false,
        },
      },
      false,
    );
  });
});
