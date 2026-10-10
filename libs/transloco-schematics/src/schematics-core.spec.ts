const cliGetGlobalConfig = vi.hoisted(() => vi.fn());

vi.mock('@jsverse/transloco-cli', () => ({
  getGlobalConfig: cliGetGlobalConfig,
}));

// The wrapper caches the config in module state, so each test gets its own copy.
async function loadWrapper() {
  vi.resetModules();

  return import('../schematics-core/utils/transloco');
}

describe('schematics-core getGlobalConfig', () => {
  beforeEach(() => {
    cliGetGlobalConfig.mockReset();
  });

  it(`GIVEN a config the CLI can read
      WHEN the wrapper shipped with the schematics is called
      THEN it returns what @jsverse/transloco-cli's getGlobalConfig returned`, async () => {
    cliGetGlobalConfig.mockReturnValue({ langs: ['en', 'es'] });
    const { getGlobalConfig } = await loadWrapper();

    expect(getGlobalConfig()).toEqual({ langs: ['en', 'es'] });
    expect(cliGetGlobalConfig).toHaveBeenCalledTimes(1);
  });

  it(`GIVEN the wrapper was already called
      WHEN it is called again
      THEN the config is served from the cache`, async () => {
    cliGetGlobalConfig.mockReturnValue({ defaultLang: 'en' });
    const { getGlobalConfig } = await loadWrapper();

    getGlobalConfig();
    getGlobalConfig();

    expect(cliGetGlobalConfig).toHaveBeenCalledTimes(1);
  });
});
