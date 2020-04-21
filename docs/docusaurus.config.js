module.exports = {
  title: 'Transloco',
  tagline: '🚀 The internationalization (i18n) library for Angular 😍',
  baseUrl: '/transloco/',
  url: 'https://github.com/ngneat',
  favicon: 'img/favicon.ico',
  organizationName: 'ngneat',
  projectName: 'transloco',
  themeConfig: {
    algolia: {
      appId: 'BH4D9OD16A',
      apiKey: '0fe261e8a7d089862d9a959da892561f',
      indexName: 'transloco'
    },
    navbar: {
      title: 'Home',
      logo: {
        alt: 'Transloco',
        src: 'img/logo.png'
      },
      links: [
        {
          to: 'docs/installation',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left'
        },
        {
          to: 'sampleApp',
          activeBasePath: 'sampleApp',
          label: 'Sample App',
          position: 'left'
        },
        {
          href: 'https://stackblitz.com/edit/ngneat-transloco',
          label: 'Playground',
          position: 'right'
        },
        {
          href: 'https://github.com/ngneat/transloco/',
          label: 'GitHub',
          position: 'right'
        }
      ]
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: 'docs/installation'
            },
            {
              label: 'Translation',
              to: 'docs/translation-in-the-template'
            }
          ]
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/transloco'
            },
            {
              label: 'FAQ',
              href: 'docs/faq'
            }
          ]
        },
        {
          title: 'Social',
          items: [
            {
              label: 'Gitter',
              href: 'https://gitter.im/ngneat-transloco/lobby?source=orgpage'
            },
            {
              label: 'GitHub',
              href: 'https://github.com/ngneat/transloco/'
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/NetanelBasal'
            }
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Transloco, Inc. Built with Docusaurus.`
    },
    prism: {
      theme: require('prism-react-renderer/themes/nightOwlLight')
    },
    sidebarCollapsible: true
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/ngneat/transloco/edit/master/docs'
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css')
        }
      }
    ]
  ]
};
