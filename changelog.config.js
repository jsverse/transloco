const types = {
  feat: {
    description: 'A new feature',
    emoji: '🎸',
    value: 'feat',
  },
  fix: {
    description: 'A bug fix',
    emoji: '🐛',
    value: 'fix',
  },
  test: {
    description: 'Adding missing tests',
    emoji: '💍',
    value: 'test',
  },
  chore: {
    description: 'Build process or auxiliary tool changes',
    emoji: '🤖',
    value: 'chore',
  },
  docs: {
    description: 'Documentation only changes',
    emoji: '✏️',
    value: 'docs',
  },
  refactor: {
    description: 'A code change that neither fixes a bug or adds a feature',
    emoji: '💡',
    value: 'refactor',
  },
  ci: {
    description: 'CI related changes',
    emoji: '🎡',
    value: 'ci',
  },
  style: {
    description: 'Markup, white-space, formatting, missing semi-colons...',
    emoji: '💄',
    value: 'style',
  },
};

module.exports = {
  disableEmoji: false,
  list: Object.keys(types),
  maxMessageLength: 64,
  minMessageLength: 3,
  questions: [
    'type',
    'scope',
    'subject',
    'body',
    'breaking',
    'issues',
    'lerna',
  ],
  scopes: [
    '',
    'transloco',
    'keys-manager',
    'locale',
    'messageformat',
    'optimize',
    'persist-lang',
    'persist-translations',
    'preload-langs',
    'scoped-libs',
    'utils',
    'validator',
    'schematics',
  ],
  types,
};
