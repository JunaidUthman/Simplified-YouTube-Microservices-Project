import React, { useState } from 'react';
import { Video } from '../types';
import { VideoCard } from './VideoCard';

interface VideoGridProps {
  videos: Video[];
  onSelectVideo: (video: Video) => void;
}

const CATEGORIES = [
  'All',
  'NestJS',
  'Microservices',
  'TypeScript',
  'React',
  'Docker',
  'PostgreSQL',
  'Gaming',
  'Music',
  'Live',
  'Podcasts',
  'Recently Uploaded',
];

export const VideoGrid: React.FC<VideoGridProps> = ({ videos, onSelectVideo }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredVideos =
    selectedCategory === 'All'
      ? videos
      : videos.filter(
          (v) =>
            v.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
            v.description.toLowerCase().includes(selectedCategory.toLowerCase())
        );

  return (
    <div>
      {/* Category Pills */}
      <div className="category-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Video Cards Grid */}
      {filteredVideos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
          <h3>No videos found</h3>
          <p style={{ marginTop: '8px', fontSize: '14px' }}>Try searching for another topic or create a new video!</p>
        </div>
      ) : (
        <div className="video-grid">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} onClick={onSelectVideo} />
          ))}
        </div>
      )}
    </div>
  );
};
