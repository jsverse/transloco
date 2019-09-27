import { DefaultHandler, MissingHandlerOptions } from '../transloco-missing-handler';

describe('TranslocoMissingHandler', () => {
  const handler = new DefaultHandler();
  let missingHandlerOptions: MissingHandlerOptions;

  beforeEach(() => {
    missingHandlerOptions = {
      useFallback: false,
      prodMode: false
    };
  });

  it('should notify a warning message', () => {
    spyOn(console, 'warn');
    const result = handler.handle('myKey', missingHandlerOptions);
    expect(console.warn).toHaveBeenCalled();
    expect(result).toEqual('myKey');
  });

  it('should return the fallback value for missing translation', () => {
    const result = handler.handle('myKey', {
      ...missingHandlerOptions,
      useFallback: true,
      fallback: { myKey: 'fallback' }
    });
    expect(result).toEqual('fallback');
  });

  it('should not notify a warning message for production mode', () => {
    spyOn(console, 'warn');
    const result = handler.handle('myKey', { ...missingHandlerOptions, prodMode: true });
    expect(console.warn).not.toHaveBeenCalled();
    expect(result).toEqual('myKey');
  });
});
