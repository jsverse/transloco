import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__dirname),
    requestTimeout: 60000,
    defaultCommandTimeout: 6000,
    specPattern: '**/*.spec.ts',
    modifyObstructiveCode: false,
    video: false,
    chromeWebSecurity: false,
    viewportWidth: 1536,
    viewportHeight: 960,
  },
});
