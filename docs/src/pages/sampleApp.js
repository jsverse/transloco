import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

function SampleApp() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  const iframeStyle = { width: '100%', minHeight: '80vh', marginLeft: '0' };
  return (
    <Layout title={siteConfig.title} description="Transloco official documentation site">
      <main>
        <iframe src="http://transloco-playground.surge.sh" width="100%" frameBorder="0" style={iframeStyle}></iframe>
      </main>
    </Layout>
  );
}

export default SampleApp;
