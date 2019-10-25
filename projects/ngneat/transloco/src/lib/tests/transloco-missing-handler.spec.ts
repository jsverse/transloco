import { DefaultHandler } from '../transloco-missing-handler';
import { defaultConfig, TranslocoConfig } from '../transloco.config';

describe('TranslocoMissingHandler', () => {
  const parser = new DefaultHandler();
  let _defaultConfig: TranslocoConfig = {
    ...defaultConfig,
    reRenderOnLangChange: true
  };

  it('should notify a warning message', () => {
    spyOn(console, 'warn');
    const result = parser.handle('myKey', _defaultConfig);
    expect(console.warn).toHaveBeenCalled();
    expect(result).toEqual('myKey');
  });

  it('should not notify a warning message for production mode', () => {
    spyOn(console, 'warn');
    const result = parser.handle('myKey', { ..._defaultConfig, prodMode: true });
    expect(console.warn).not.toHaveBeenCalled();
    expect(result).toEqual('myKey');
  });

  it('should not notify a warning message when logMissingKey is false', () => {
    spyOn(console, 'warn');
    const result = parser.handle('myKey', {
      ..._defaultConfig,
      ...{
        missingHandler: {
          ..._defaultConfig.missingHandler,
          logMissingKey: false
        }
      }
    });
    expect(console.warn).not.toHaveBeenCalled();
    expect(result).toEqual('myKey');
  });
});
