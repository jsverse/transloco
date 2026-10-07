module.exports = {
  langs: ['en', 'es'],
  keysManager: {
    input: 'src/app',
    sort: true,
    defaultValue: 'TODO: {{key}}',
    output: 'locale',
    replace: true,
    removeExtraKeys: true,
  },
};
