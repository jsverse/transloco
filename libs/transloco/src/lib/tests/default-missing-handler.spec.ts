import { DefaultHandler } from '../transloco-missing-handler';
import { defaultConfig, TranslocoConfig } from '../transloco.config';

describe('TranslocoMissingHandler', () => {
  const parser = new DefaultHandler();
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

  it('should notify a warning message', () => {
    assertLog();
  });

  it('should not notify a warning message for production mode', () => {
    assertLog({ prodMode: true }, false);
  });

  it('should not notify a warning message when logMissingKey is false', () => {
    assertLog(
      {
        missingHandler: {
          ..._defaultConfig.missingHandler,
          logMissingKey: false,
        },
      },
      false
    );
  });
});
