import React, { useState } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const videos = [
  'MYkYcafJdGw', // Installation
  'uCQ8V5q0-HM', // Translation in the template
  'g942amVWre8', // Translation API
  'G810_tZZsoo', // Language API
  'dMPxcp7UVYs', // Scopes
];

function getThumbnailClass(id, selectedId) {
  let className = 'video-thumbnail';
  if (id === selectedId) {
    className += ' selected';
  }

  return className;
}

function VideoGuides() {
  const context = useDocusaurusContext();
  const [videoId, setVideoId] = useState(videos[0]);
  const { siteConfig = {} } = context;

  return (
    <Layout
      description="Transloco the Angular translations library (i18n) video guides"
      keywords={[
        'Angular',
        'Transloco',
        'i18n',
        'translations',
        'translate',
        'video',
        'video guides',
      ]}
      permalink={siteConfig.baseUrl + 'videoGuides'}
    >
      <main>
        <div className="video-preview margin-top--xl margin-bottom--xl">
          <iframe
            style={{ border: 'none' }}
            width="60%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
          <div className="margin-top--md thumbnail-container">
            {videos.map((id) => (
              <div
                style={{ backgroundImage: `url('thumbnails/${id}.jpg')` }}
                key={id}
                className={getThumbnailClass(id, videoId)}
                onClick={() => setVideoId(id)}
              ></div>
            ))}
          </div>
          {/*<span className="text margin-top--md"><a href={'https://www.youtube.com/@ngneat?sub_confirmation=1&feature=subscribe-embed-click'}>Subscribe</a> to the NgNeat official youtube channel</span>*/}
        </div>
      </main>
    </Layout>
  );
}

export default VideoGuides;
