import React, { useState, useEffect } from 'react';
import { Video, Comment, LikesSummary, User } from '../types';
import { api } from '../services/api';
import { ThumbsUp, ThumbsDown, Share2, Bookmark, CheckCircle2, Trash2, Send } from 'lucide-react';
import { VideoCard } from './VideoCard';

interface WatchPageProps {
  video: Video;
  user: User | null;
  token: string | null;
  relatedVideos: Video[];
  onSelectVideo: (video: Video) => void;
  onOpenAuth: () => void;
  onOpenShare: (video: Video) => void;
}

export const WatchPage: React.FC<WatchPageProps> = ({
  video,
  user,
  token,
  relatedVideos,
  onSelectVideo,
  onOpenAuth,
  onOpenShare,
}) => {
  const [likesSummary, setLikesSummary] = useState<LikesSummary>({
    likesCount: video.likesCount || 120,
    dislikesCount: video.dislikesCount || 3,
    userLikeStatus: null,
  });
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);

    // Fetch video comments & likes summary
    api.getComments(video.id).then(setComments).catch(console.error);
    api.getLikesSummary(video.id, token || undefined).then(setLikesSummary).catch(console.error);
  }, [video.id, token]);

  const handleLike = async () => {
    if (!token || !user) {
      onOpenAuth();
      return;
    }

    try {
      if (likesSummary.userLikeStatus === 'like') {
        await api.removeLike(token, video.id);
        setLikesSummary((prev) => ({
          ...prev,
          likesCount: Math.max(0, prev.likesCount - 1),
          userLikeStatus: null,
        }));
      } else {
        await api.setLike(token, video.id, true);
        setLikesSummary((prev) => ({
          ...prev,
          likesCount: prev.likesCount + 1,
          dislikesCount: prev.userLikeStatus === 'dislike' ? Math.max(0, prev.dislikesCount - 1) : prev.dislikesCount,
          userLikeStatus: 'like',
        }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update like');
    }
  };

  const handleDislike = async () => {
    if (!token || !user) {
      onOpenAuth();
      return;
    }

    try {
      if (likesSummary.userLikeStatus === 'dislike') {
        await api.removeLike(token, video.id);
        setLikesSummary((prev) => ({
          ...prev,
          dislikesCount: Math.max(0, prev.dislikesCount - 1),
          userLikeStatus: null,
        }));
      } else {
        await api.setLike(token, video.id, false);
        setLikesSummary((prev) => ({
          ...prev,
          dislikesCount: prev.dislikesCount + 1,
          likesCount: prev.userLikeStatus === 'like' ? Math.max(0, prev.likesCount - 1) : prev.likesCount,
          userLikeStatus: 'dislike',
        }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update dislike');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!token || !user) {
      onOpenAuth();
      return;
    }

    try {
      const added = await api.addComment(token, video.id, newComment);
      const formatted: Comment = {
        ...added,
        username: user.username,
        userAvatar: user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
      };

      setComments([formatted, ...comments]);
      setNewComment('');
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!token) return;
    try {
      await api.deleteComment(token, commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  return (
    <div className="watch-container">
      {/* Primary Video Player & Details Area */}
      <div className="watch-primary">
        {/* Video Player */}
        <div className="player-wrapper">
          <video
            src={video.videoUrl}
            controls
            autoPlay
            className="video-player"
            poster={video.thumbnailUrl}
          />
        </div>

        {/* Video Title */}
        <h1 className="watch-title">{video.title}</h1>

        {/* Channel & Actions Bar */}
        <div className="watch-channel-bar">
          {/* Channel Avatar & Subscribe */}
          <div className="channel-left">
            <img
              src={video.channelAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${video.userId}`}
              alt={video.channelName || 'Creator'}
              className="channel-avatar"
              style={{ width: '40px', height: '40px' }}
            />
            <div className="channel-sub-info">
              <span className="channel-sub-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {video.channelName || `User_${video.userId.substring(0, 5)}`}
                <CheckCircle2 size={14} style={{ color: '#aaa' }} />
              </span>
              <span className="sub-count">128K subscribers</span>
            </div>
            <button
              className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
              onClick={() => setIsSubscribed(!isSubscribed)}
              style={{ marginLeft: '12px' }}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>

          {/* Action Buttons (Like/Dislike, Share, Save) */}
          <div className="actions-right">
            <div className="like-dislike-group">
              <button
                className={`like-btn ${likesSummary.userLikeStatus === 'like' ? 'active' : ''}`}
                onClick={handleLike}
                title="I like this"
              >
                <ThumbsUp size={18} />
                <span>{likesSummary.likesCount}</span>
              </button>
              <div className="group-divider" />
              <button
                className={`dislike-btn ${likesSummary.userLikeStatus === 'dislike' ? 'active' : ''}`}
                onClick={handleDislike}
                title="I dislike this"
              >
                <ThumbsDown size={18} />
                {likesSummary.dislikesCount > 0 && <span>{likesSummary.dislikesCount}</span>}
              </button>
            </div>

            <button className="action-pill-btn" onClick={() => onOpenShare(video)}>
              <Share2 size={18} />
              <span>Share</span>
            </button>

            <button className="action-pill-btn" onClick={() => alert('Saved to Watch Later')}>
              <Bookmark size={18} />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Description Box */}
        <div className="description-box" onClick={() => setDescExpanded(!descExpanded)}>
          <div className="desc-header">
            <span>{video.viewsCount.toLocaleString()} views</span>
            <span>•</span>
            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
          </div>
          <p style={{ whiteSpace: 'pre-line' }}>
            {descExpanded
              ? video.description
              : video.description.length > 150
              ? video.description.substring(0, 150) + '... Show more'
              : video.description}
          </p>
        </div>

        {/* Comments Section */}
        <div className="comments-section">
          <div className="comments-header">
            <span className="comments-count">{comments.length} Comments</span>
          </div>

          {/* Add Comment Input */}
          <div className="comment-input-container">
            <div className="user-avatar">
              {user ? user.username.charAt(0).toUpperCase() : '?'}
            </div>
            <form onSubmit={handleAddComment} className="comment-input-box">
              <textarea
                className="comment-textarea"
                placeholder={user ? 'Add a comment...' : 'Sign in to add a comment'}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!user}
              />
              {user && (
                <div className="comment-actions">
                  <button type="button" className="btn-cancel" onClick={() => setNewComment('')}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-comment">
                    Comment
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <img
                  src={comment.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${comment.userId}`}
                  alt={comment.username || 'User'}
                  className="channel-avatar"
                />
                <div className="comment-content">
                  <div className="comment-author">
                    <span>@{comment.username || `User_${comment.userId.substring(0, 4)}`}</span>
                    <span className="comment-time">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="comment-text">{comment.content}</p>
                </div>
                {user && user.id === comment.userId && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    style={{ color: '#aaa', padding: '4px' }}
                    title="Delete comment"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Up Next Video Sidebar */}
      <div className="watch-secondary">
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Up Next</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {relatedVideos
            .filter((v) => v.id !== video.id)
            .map((relVideo) => (
              <VideoCard key={relVideo.id} video={relVideo} onClick={onSelectVideo} />
            ))}
        </div>
      </div>
    </div>
  );
};
