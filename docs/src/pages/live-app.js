import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function LiveApp() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  const iframeStyle = { width: '100%', minHeight: '80vh', marginLeft: '0' };
  return (
    <Layout
      description="Transloco the Angular translations library (i18n) sample app"
      keywords={['Angular', 'Transloco', 'i18n', 'translations', 'translate']}
      permalink={siteConfig.baseUrl + 'live-app'}
    >
      <main>
        <iframe
          src="transloco-playground/index.html"
          width="100%"
          frameBorder="0"
          style={iframeStyle}
        ></iframe>
      </main>
    </Layout>
  );
}
