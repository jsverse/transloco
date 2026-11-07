module.exports = {
  rootTranslationsPath: 'src/assets/i18n',
  langs: ['en', 'de'],
  keysManager: {
    input: 'src/app',
    output: 'locale',
    defaultValue: 'TODO: {{key}}',
    sort: true,
    unflat: true,
    // Read by find alone: inert for extract, and never an error coming from the file.
    addMissingKeys: true,
    emitErrorOnExtraKeys: true,
  },
};
