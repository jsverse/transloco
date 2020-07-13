import React, { useState } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const videos = [
  'MYkYcafJdGw', // Installation
  'uCQ8V5q0-HM', // Translation in the template
  'g942amVWre8', // Translation API
  'G810_tZZsoo', // Language API
  'dMPxcp7UVYs' // Scopes
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
    <Layout title={siteConfig.title}>
      <main>
        <div className="video-preview margin-top--xl margin-bottom--xl">
          <iframe
            width="60%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
          <div className="margin-top--md thumbnail-container">
            {videos.map(id => (
              <div
                style={{ backgroundImage: `url('thumbnails/${id}.jpg')` }}
                key={id}
                className={getThumbnailClass(id, videoId)}
                onClick={() => setVideoId(id)}
              ></div>
            ))}
          </div>
          <p className="text margin-top--md">Liked these videos? subscribe to the channel for more great content!</p>
        </div>
      </main>
    </Layout>
  );
}

export default VideoGuides;
