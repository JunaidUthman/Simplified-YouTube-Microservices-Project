import React from 'react';
import { Video } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface VideoCardProps {
  video: Video;
  onClick: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="video-card" onClick={() => onClick(video)}>
      <div className="thumbnail-container">
        <img
          src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=60'}
          alt={video.title}
          className="thumbnail-img"
        />
        <span className="duration-badge">12:34</span>
      </div>

      <div className="video-info">
        <img
          src={video.channelAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${video.userId}`}
          alt={video.channelName || 'Creator'}
          className="channel-avatar"
        />

        <div className="video-details">
          <h3 className="video-title" title={video.title}>
            {video.title}
          </h3>

          <div className="channel-name">
            <span>{video.channelName || `User_${video.userId.substring(0, 5)}`}</span>
            <CheckCircle2 size={14} style={{ color: '#aaa' }} />
          </div>

          <div className="video-meta">
            <span>{formatViews(video.viewsCount)}</span>
            <span> • </span>
            <span>{formatTimeAgo(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
