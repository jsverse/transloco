export const optionDefinitions = [
  {
    name: 'project',
    type: String,
    description: 'Name of the targeted project',
  },
  {
    name: 'config',
    alias: 'c',
    type: String,
    description: 'Path to a custom transloco config',
  },
  {
    name: 'input',
    alias: 'i',
    type: String,
    description:
      'The source directory for all files using the translation keys',
  },
  {
    name: 'output',
    alias: 'o',
    type: String,
    description: 'The target directory for all generated translation files',
  },
  {
    name: 'langs',
    alias: 'l',
    type: String,
    multiple: true,
    description: 'The languages files to generate',
  },
  {
    name: 'file-format',
    alias: 'f',
    type: String,
    description:
      'The translation file format (`json`, `pot`) default is `json`',
  },
  {
    name: 'marker',
    alias: 'm',
    type: String,
    description: `The marker sign for dynamic values`,
  },
  {
    name: 'replace',
    alias: 'r',
    type: Boolean,
    description:
      'Replace the contents of a translation file (if it exists) with the generated one (default value is false, in which case files are merged)',
  },
  {
    name: 'remove-extra-keys',
    alias: 'R',
    type: Boolean,
    description: 'Remove extra keys from existing translation files',
  },
  {
    name: 'sort',
    alias: 's',
    type: Boolean,
    description: `Sort keys using the sort() method`,
  },
  {
    name: 'unflat',
    alias: 'u',
    type: Boolean,
    description: `Unflat the translation file`,
  },
  {
    name: 'default-value',
    alias: 'd',
    type: String,
    description: `The default value of a generated key`,
  },
  {
    name: 'add-missing-keys',
    alias: 'a',
    type: Boolean,
    description:
      'Add missing keys that were found by the detective (default value is false)',
  },
  {
    name: 'emit-error-on-extra-keys',
    alias: 'e',
    type: Boolean,
    description:
      'Emit an error and exit the process if extra keys were found (defaults to `false`)',
  },
  {
    name: 'translations-path',
    alias: 'p',
    type: String,
    description: 'Where are the main translation files',
  },
  { name: 'help', alias: 'h', type: Boolean, description: 'Help me, please!' },
];

export const sections = [
  {
    header: '🔥 Transloco Keys Manager',
    content: 'Extract and find missing keys',
  },
  {
    header: 'Actions',
    content: [
      '$ transloco-keys-manager extract',
      '$ transloco-keys-manager find',
    ],
  },
  {
    header: 'Options',
    optionList: optionDefinitions,
  },
];
