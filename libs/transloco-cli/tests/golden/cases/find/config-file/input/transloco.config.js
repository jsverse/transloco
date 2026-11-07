module.exports = {
  rootTranslationsPath: 'i18n',
  keysManager: {
    input: 'src',
    emitErrorOnExtraKeys: true,
    // Read by extract alone: inert for find, and never an error coming from the file.
    output: 'unused',
    replace: true,
    removeExtraKeys: true,
  },
};
