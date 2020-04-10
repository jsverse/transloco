module.exports = {
  title: 'Transloco - The internationalization (i18n) library for Angular',
  tagline: '🚀 The internationalization (i18n) library for Angular 😍',
  baseUrl: '/transloco/',
  url: 'https://github.com/ngneat',
  favicon: 'img/favicon.ico',
  organizationName: 'ngneat',
  projectName: 'transloco',
  themeConfig: {
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
          editUrl: 'https://github.com/facebook/docusaurus/edit/master/website/'
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css')
        }
      }
    ]
  ]
};
