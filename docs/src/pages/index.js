import React from 'react';
import classnames from 'classnames';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const features = [
  {
    title: <>Clean and DRY templates</>,
    imageUrl: 'img/1.svg',
    description: (
      <>
        Docusaurus was designed from the ground up to be easily installed and used to get your website up and running
        quickly.
      </>
    )
  },
  {
    title: <>Support for Lazy Load</>,
    imageUrl: 'img/2.svg',
    description: (
      <>
        Docusaurus lets you focus on your docs, and we&apos;ll do the chores. Go ahead and move your docs into the{' '}
        <code>docs</code> directory.
      </>
    )
  },
  {
    title: <>Rich Plugins</>,
    imageUrl: 'img/3.svg',
    description: (
      <>
        Extend or customize your website layout by reusing React. Docusaurus can be extended while reusing the same
        header and footer.
      </>
    )
  },
  {
    title: <>Support for Multiple Fallbacks</>,
    imageUrl: 'img/4.svg',
    description: (
      <>
        Extend or customize your website layout by reusing React. Docusaurus can be extended while reusing the same
        header and footer.
      </>
    )
  },
  {
    title: <>Support for SSR</>,
    imageUrl: 'img/5.svg',
    description: (
      <>
        Extend or customize your website layout by reusing React. Docusaurus can be extended while reusing the same
        header and footer.
      </>
    )
  },
  {
    title: <>L10N</>,
    imageUrl: 'img/6.svg',
    description: (
      <>
        Extend or customize your website layout by reusing React. Docusaurus can be extended while reusing the same
        header and footer.
      </>
    )
  }
];

function Feature({ imageUrl, title, description }) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={classnames('col col--4', styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout title={`Hello from ${siteConfig.title}`} description="Description will go into a meta tag in <head />">
      <header className={classnames('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={classnames('button button--outline button--secondary button--lg', styles.getStarted)}
              to={useBaseUrl('docs/installation')}
            >
              Get Started
            </Link>
            <iframe src="https://ghbtns.com/github-btn.html?user=ngneat&repo=transloco&type=star&count=true&size=large"></iframe>
          </div>
        </div>
      </header>
      <div className="container description">
        Transloco is an internationalization (i18n) library for Angular. It allows you to define translations for your
        content in different languages and switch between them easily in runtime. It exposes a rich API to manage
        translations efficiently and cleanly. It provides multiple plugins that will improve your development
        experience. Here is a small taste of the features it offers:
      </div>
      <main>
        {features && features.length && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}

export default Home;
