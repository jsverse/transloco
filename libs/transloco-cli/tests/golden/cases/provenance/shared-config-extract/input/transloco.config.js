module.exports = {
  rootTranslationsPath: 'src/assets/i18n',
  langs: ['en', 'es'],
  keysManager: {
    input: 'src/app',
    sort: true,
    defaultValue: 'TODO: {{key}}',
    // Read by extract alone
    output: 'locale',
    replace: true,
    removeExtraKeys: true,
    // Read by find alone
    addMissingKeys: true,
    emitErrorOnExtraKeys: true,
  },
};
