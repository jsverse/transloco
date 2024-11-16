module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/angular-compatibility',
        'getting-started/config-options',
        {
          type: 'category',
          label: 'Migration',
          items: ['migration/ngx', 'migration/angular'],
        },
      ],
    },
    {
      type: 'doc',
      id: 'translation-in-the-template',
    },
    {
      type: 'doc',
      id: 'translation-api',
    },
    {
      type: 'doc',
      id: 'language-api',
    },
    {
      type: 'category',
      label: 'Lazy Load Translation Files',
      items: ['lazy-load/scope-configuration', 'lazy-load/inline-loaders'],
    },
    {
      type: 'doc',
      id: 'unit-testing',
    },
    {
      type: 'doc',
      id: 'ssr-support',
    },
    {
      type: 'doc',
      id: 'multi-lang',
    },
    {
      type: 'doc',
      id: 'additional-functionality',
    },
    {
      type: 'doc',
      id: 'loading-template',
    },
    {
      type: 'doc',
      id: 'transpiler',
    },
    {
      type: 'doc',
      id: 'hack',
    },
    {
      type: 'category',
      label: 'Tools',
      items: [
        {
          type: 'link',
          label: 'Keys Manager',
          href: 'https://github.com/jsverse/transloco-keys-manager',
        },
        'tools/validator',
        'tools/optimize',
        'tools/comments',
        'tools/scope-lib-extractor',
      ],
    },
    {
      type: 'category',
      label: 'Plugins',
      items: [
        'plugins/message-format',
        'plugins/persist-translations',
        'plugins/persist-lang',
        'plugins/preload-langs',
        'plugins/locale',
        'plugins/third-party',
      ],
    },
    {
      type: 'category',
      label: 'Schematics',
      items: [
        'schematics/ng-add',
        'schematics/scope',
        'schematics/join',
        'schematics/split',
        'schematics/upgrade',
        'schematics/component',
      ],
    },
    {
      type: 'category',
      label: 'Recipes',
      items: [
        'recipes/prefetch',
        'recipes/xliff',
        'recipes/google-translate-integration',
      ],
    },
    {
      type: 'doc',
      id: 'blog-posts',
    },
    {
      type: 'doc',
      id: 'faq',
    },
  ],
};
