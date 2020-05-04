import React from 'react';
import classnames from 'classnames';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

function SampleApp() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  const iframeStyle = { width: '100%', minHeight: '80vh' };
  return (
    <Layout title={siteConfig.title} description="Transloco official documentation site">
      <main>
        <iframe src="https://transloco.netlify.app/home" width="100%" frameBorder="0" style={iframeStyle}></iframe>
      </main>
    </Layout>
  );
}

export default SampleApp;
