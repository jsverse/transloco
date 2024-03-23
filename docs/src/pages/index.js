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
    imageUrl: 'img/clean.svg',
    description: <>Keep your templates clean and DRY using the Transloco structural directive</>
  },
  {
    title: <>Support for Lazy Load</>,
    imageUrl: 'img/sloth.svg',
    description: <>Load translation files on-demand using Transloco's built-in scope feature</>
  },
  {
    title: <>Rich Plugins</>,
    imageUrl: 'img/plugin.svg',
    description: (
      <>
        Transloco has a rich plugins ecosystem that provides the tools you need for both development and production
        environments
      </>
    )
  },
  {
    title: <>Support for Multiple Fallbacks</>,
    imageUrl: 'img/fallback.svg',
    description: (
      <>Extensive support for fallbacks. Multiple fallbacks for failed requests and missing keys replacement</>
    )
  },
  {
    title: <>Support for SSR</>,
    imageUrl: 'img/server.svg',
    description: <>Pre-render your translations with Angular SSR and Transloco!</>
  },
  {
    title: <>L10N</>,
    imageUrl: 'img/local.svg',
    description: (
      <>
        Localize your app with Transloco. Transloco provides the <b>transloco-locale</b> package which provides pipes
        such as <code>Date</code>,<code>Number</code>,<code>Currency</code> and more!
      </>
    )
  }
];

const videoGuides = {
  title: "We've got you covered",
  imageUrl: 'img/academic-hat.png',
  description: (
    <p>
      To help you get started, we made the Transloco Guide! watch the videos, follow the docs, and you will master
      Transloco in no time!
    </p>
  )
};

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
      <g id="transloco" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="Artboard-Copy-7" transform="translate(-108.000000, -47.000000)">
          <g id="Group-2" transform="translate(107.000000, 47.000000)">
            <text id="{" fontFamily="Arial" fontSize="61" fontWeight="300" fill="currentColor">
              <tspan x="0" y="234">
                {'{'}
              </tspan>
            </text>
            <text id="}" fontFamily="Arial" fontSize="61" fontWeight="300" fill="currentColor">
              <tspan x="407" y="233">
                }
              </tspan>
            </text>
            <text id="TransLoco" fontFamily="Arial" fontSize="59" fontWeight="300" fill="currentColor">
              <tspan x="32" y="238">
                TRANSLOCO
              </tspan>
            </text>
            <g id="Group" transform="translate(89.000000, 0.000000)" fillRule="nonzero">
              <polygon
                id="Left"
                fill="#06c4f1"
                points="7.0353809 105.341554 7.0353809 18.7817553 125 18.7817553 127.218066 12.1233092 -9.9475983e-14 12.1233092 -9.9475983e-14 112 101.610802 112 103 105.341554"
              ></polygon>
              <path
                id="大"
                d="M34.3318283,49.5343004 L56.2780429,49.5343004 C56.6254764,46.5232103 56.8570987,43.4542146 56.9150043,40.2115021 L56.9150043,35 L63.0529957,35 L63.0529957,38.8217682 C63.0529957,42.5856309 62.8213734,46.1757768 62.4160343,49.5343004 L85.6361717,49.5343004 L85.6361717,55.4406695 L63.8057682,55.4406695 C67.97497,67.5429356 75.676412,76.8657339 86.968,83.46697 L83.1462318,88.4468498 C72.2599828,81.7298026 64.5585408,72.4070043 60.1577167,60.4784549 C56.2201373,73.3913991 48.4607897,82.8879142 36.8796738,88.968 L33,83.872309 C44.696927,78.1975622 52.1088412,68.7010472 55.2357425,55.4406695 L34.3318283,55.4406695 L34.3318283,49.5343004 Z"
                stroke="#06c4f1"
                strokeWidth="2"
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

function docsButton() {
  return button({
    text: (
      <div className={classnames(styles.buttons)}>
        <svg
          className="margin-right--sm"
          fill="currentColor"
          enableBackground="new 0 0 512 512"
          height="18"
          viewBox="0 0 512 512"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g>
            <path d="m446.605 124.392-119.997-119.997c-2.801-2.802-6.624-4.395-10.608-4.395h-210c-24.813 0-45 20.187-45 45v422c0 24.813 20.187 45 45 45h300c24.813 0 45-20.187 45-45v-332c0-4.09-1.717-7.931-4.395-10.608zm-115.605-73.179 68.787 68.787h-53.787c-8.271 0-15-6.729-15-15zm75 430.787h-300c-8.271 0-15-6.729-15-15v-422c0-8.271 6.729-15 15-15h195v75c0 24.813 20.187 45 45 45h75v317c0 8.271-6.729 15-15 15z" />
            <path d="m346 212h-180c-8.284 0-15 6.716-15 15s6.716 15 15 15h180c8.284 0 15-6.716 15-15s-6.716-15-15-15z" />
            <path d="m346 272h-180c-8.284 0-15 6.716-15 15s6.716 15 15 15h180c8.284 0 15-6.716 15-15s-6.716-15-15-15z" />
            <path d="m346 332h-180c-8.284 0-15 6.716-15 15s6.716 15 15 15h180c8.284 0 15-6.716 15-15s-6.716-15-15-15z" />
            <path d="m286 392h-120c-8.284 0-15 6.716-15 15s6.716 15 15 15h120c8.284 0 15-6.716 15-15s-6.716-15-15-15z" />
          </g>
        </svg>
        <span>Read The Docs</span>
      </div>
    ),
    className: 'getting-started',
    to: useBaseUrl('docs/getting-started/installation')
  });
}

function youtubeButton(className) {
  return button({
    text: (
      <>
        <div className={classnames(styles.buttons)}>
          <svg height="18" width="13" fill="currentColor" className="margin-right--sm">
            <polygon points="0,3 0,16 13,9" />
          </svg>
          <span>Watch The Guide️</span>
        </div>
      </>
    ),
    className: `youtube margin-left--sm ${className}`,
    to: useBaseUrl('videoGuides')
  });
}

function button(props) {
  const { className, text, ...rest } = props;
  return (
    <Link
      className={classnames('button button--outline button--secondary button--lg', styles.getStarted, className)}
      {...rest}
    >
      {text}
    </Link>
  );
}

function starButton() {
  return (          <div
    className="star-btn button button--secondary button--lg margin-left--sm"
  >
    <a
      href="https://github.com/jsverse/transloco"
      rel="noopener"
      target="_blank"
      aria-label="Star jsverse/transloco on GitHub"
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <svg
        viewBox="0 0 16 16"
        width="16"
        height="16"
        className="octicon octicon-mark-github"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
        ></path>
      </svg>
      &nbsp;<span>Star</span>
    </a>
  </div>);
}

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout
      description="Transloco the Angular translations library (i18n) official documentation site"
      keywords={['Angular', 'Transloco', 'i18n', 'translations', 'translate']}
      permalink={siteConfig.baseUrl}
    >
      <header className={classnames('hero', styles.heroBanner)}>
        <div className="container">
          {logo()}
          <p className="margin-top--md hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            {docsButton()}
            {youtubeButton()}
            {starButton()}
          </div>
        </div>
      </header>
      <div className="container description">
        Transloco allows you to define translations for your content in different languages and switch between them
        easily in runtime. It exposes a rich API to manage translations efficiently and cleanly. It provides multiple
        plugins that will improve your development experience. <br />
        Here is a small taste of the features it offers:
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
      <div className="main video-container">
        <div className="feature-container">
          <div className="title">
            <img src={videoGuides.imageUrl} alt={videoGuides.title} />
            <h2>{videoGuides.title}</h2>
          </div>
          {videoGuides.description}
          <div className="actions">
            {docsButton()}
            {youtubeButton()}
          </div>
        </div>
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/MYkYcafJdGw"
          frameBorder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </Layout>
  );
}

export default Home;
