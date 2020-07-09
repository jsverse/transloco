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
    description: <>Keep your templates clean and DRY using the Transloco structural directive</>
  },
  {
    title: <>Support for Lazy Load</>,
    imageUrl: 'img/2.svg',
    description: <>Load translation files on-demand using Transloco's built-in scope feature</>
  },
  {
    title: <>Rich Plugins</>,
    imageUrl: 'img/3.svg',
    description: (
      <>
        Transloco has a rich plugins ecosystem that provides the tools you need for both development and production
        environments
      </>
    )
  },
  {
    title: <>Support for Multiple Fallbacks</>,
    imageUrl: 'img/4.svg',
    description: (
      <>Extensive support for fallbacks. Multiple fallbacks for failed requests and missing keys replacement</>
    )
  },
  {
    title: <>Support for SSR</>,
    imageUrl: 'img/5.svg',
    description: <>Pre-render your translations with Angular SSR and Transloco!</>
  },
  {
    title: <>L10N</>,
    imageUrl: 'img/6.svg',
    description: (
      <>
        Localize your app with Transloco. Transloco provides the <b>transloco-locale</b> package which provides pipes
        such as <code>Date</code>,<code>Number</code>,<code>Currency</code> and more!
      </>
    )
  }
];

function Feature({ imageUrl, title, description }) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={classnames('col col--4 feature-container', styles.feature)}>
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

function logo() {
  return (
    <svg width="300px" height="172px" viewBox="0 0 430 246" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <g id="transloco" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Artboard-Copy-7" transform="translate(-108.000000, -47.000000)">
          <g id="Group-2" transform="translate(107.000000, 47.000000)">
            <text
              id="{"
              font-family="EuphemiaUCAS-Bold, Euphemia UCAS"
              font-size="61"
              font-weight="bold"
              fill="currentColor"
            >
              <tspan x="0" y="234">
                {'{'}
              </tspan>
            </text>
            <text
              id="}"
              font-family="EuphemiaUCAS-Bold, Euphemia UCAS"
              font-size="61"
              font-weight="bold"
              fill="currentColor"
            >
              <tspan x="407" y="233">
                }
              </tspan>
            </text>
            <text
              id="TransLoco"
              font-family="KohinoorTelugu-Light, Kohinoor Telugu"
              font-size="71"
              font-weight="300"
              fill="currentColor"
            >
              <tspan x="32" y="238">
                TRANSLOCO
              </tspan>
            </text>
            <g id="Group" transform="translate(89.000000, 0.000000)" fill-rule="nonzero">
              <polygon
                id="Left"
                fill="#06c4f1"
                points="7.0353809 105.341554 7.0353809 18.7817553 125 18.7817553 127.218066 12.1233092 -9.9475983e-14 12.1233092 -9.9475983e-14 112 101.610802 112 103 105.341554"
              ></polygon>
              <path
                id="大"
                d="M34.3318283,49.5343004 L56.2780429,49.5343004 C56.6254764,46.5232103 56.8570987,43.4542146 56.9150043,40.2115021 L56.9150043,35 L63.0529957,35 L63.0529957,38.8217682 C63.0529957,42.5856309 62.8213734,46.1757768 62.4160343,49.5343004 L85.6361717,49.5343004 L85.6361717,55.4406695 L63.8057682,55.4406695 C67.97497,67.5429356 75.676412,76.8657339 86.968,83.46697 L83.1462318,88.4468498 C72.2599828,81.7298026 64.5585408,72.4070043 60.1577167,60.4784549 C56.2201373,73.3913991 48.4607897,82.8879142 36.8796738,88.968 L33,83.872309 C44.696927,78.1975622 52.1088412,68.7010472 55.2357425,55.4406695 L34.3318283,55.4406695 L34.3318283,49.5343004 Z"
                stroke="#06c4f1"
                stroke-width="2"
                fill="#06c4f1"
              ></path>
              <polygon id="Line" fill="currentColor" points="143.107571 0 103 148 106.734351 148 147 0"></polygon>
              <polygon
                id="T"
                fill="#ec079e"
                points="212.918945 62.0029297 196.208984 62.0029297 196.208984 109.324707 186.675293 109.324707 186.675293 62.0029297 170 62.0029297 170 55 212.918945 55"
              ></polygon>
              <polygon
                id="Right"
                fill="#ec079e"
                transform="translate(188.953072, 82.000000) scale(-1, -1) translate(-188.953072, -82.000000) "
                points="132.110043 125.333333 132.110043 38.6666667 251.591417 38.6666667 252.906144 32 125 32 125 132 229.064186 132 230.906144 125.333333"
              ></polygon>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout title={siteConfig.title} description="Transloco official documentation site">
      <header className={classnames('hero', styles.heroBanner)}>
        <div className="container">
          {logo()}
          <p className="margin-top--md hero__subtitle">{siteConfig.tagline}</p>
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
