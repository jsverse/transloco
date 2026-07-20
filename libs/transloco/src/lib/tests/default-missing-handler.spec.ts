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
    // We explicitly bind to the global `ngDevMode` because we no
    // longer rely on `prodMode`. `ngDevMode` is a build-time variable
    // defined by Angular CLI since Angular v17, which applies to
    // all versions supported by Transloco.
    // Even though Transloco supports Angular v16+, we don't really
    // care since it has been deprecated for a long time, and this
    // will be no breaking change for existing apps (since we have a `typeof` check).
    const originalNgDevMode = ngDevMode;
    // @ts-expect-error Property 'ngDevMode' does not exist on type 'typeof globalThis'
    globalThis['ngDevMode'] = false;
    assertLog({ prodMode: true }, false);
    // @ts-expect-error Property 'ngDevMode' does not exist on type 'typeof globalThis'
    globalThis['ngDevMode'] = originalNgDevMode;
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
