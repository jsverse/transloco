import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    // Compiled output that can be generated locally alongside the .ts sources
    // (see libs/transloco-utils/.gitignore); it must not be linted.
    ignores: [
      '**/transloco-utils/src/**/*.js',
      '**/transloco-utils/src/**/*.js.map',
    ],
  },
];
