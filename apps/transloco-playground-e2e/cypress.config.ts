import { defineConfig } from 'cypress';
import plugins from './src/plugins/index';

module.exports = defineConfig({
  fileServerFolder: '.',
  fixturesFolder: './src/fixtures',
  modifyObstructiveCode: false,
  video: false,
  chromeWebSecurity: false,
  viewportWidth: 1536,
  viewportHeight: 960,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents() {
      return plugins();
    },
    specPattern: './src/integration/**/*.spec.ts',
    supportFile: './src/support/index.ts',
    baseUrl: 'http://localhost:4200',
  },
})
