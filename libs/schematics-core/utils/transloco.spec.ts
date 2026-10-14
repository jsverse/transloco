import { EmptyTree } from '@angular-devkit/schematics';

const cliGetGlobalConfig = vi.hoisted(() => vi.fn());

vi.mock('@jsverse/transloco-cli', () => ({
  getGlobalConfig: cliGetGlobalConfig,
}));

// The wrapper caches the config in module state, so each test gets its own copy.
async function loadWrapper() {
  vi.resetModules();

  return import('./transloco');
}

describe('getGlobalConfig', () => {
  beforeEach(() => {
    cliGetGlobalConfig.mockReset();
  });

  it(`GIVEN a config the CLI can read
      WHEN the wrapper is called
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

describe('createGlobalConfig', () => {
  it(`GIVEN a workspace without a config
      WHEN it is created
      THEN the type is imported from @jsverse/transloco`, async () => {
    const { createGlobalConfig } = await loadWrapper();
    const host = new EmptyTree();

    createGlobalConfig(host, ['en', 'es']);

    const config = host.read('transloco.config.ts')!.toString();
    expect(config.split('\n')[0]).toBe(
      `import type { TranslocoGlobalConfig } from '@jsverse/transloco';`,
    );
    expect(config).toContain(`langs: [ 'en', 'es' ]`);
  });
});
