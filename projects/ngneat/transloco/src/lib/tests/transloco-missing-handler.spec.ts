import { DefaultHandler } from '../transloco-missing-handler';
import { TranslocoConfig } from '../transloco.config';

describe('TranslocoParser', () => {
  const parser = new DefaultHandler();
  let defaultConfig: TranslocoConfig;

  beforeEach(() => {
    defaultConfig = {
      listenToLangChange: true,
      defaultLang: 'en',
      prodMode: false
    };
  });

  it('should notify a warning message', () => {
    spyOn(console, 'warn');
    const result = parser.handle('myKey', {}, defaultConfig);
    expect(console.warn).toHaveBeenCalled();
    expect(result).toEqual('myKey');
  });

  it('should not notify a warning message for production mode', () => {
    spyOn(console, 'warn');
    const result = parser.handle('myKey', {}, { ...defaultConfig, prodMode: true });
    expect(console.warn).not.toHaveBeenCalled();
    expect(result).toEqual('myKey');
  });
});
