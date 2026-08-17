import React, { useState } from 'react';
import { X, Upload, Video as VideoIcon } from 'lucide-react';
import { api } from '../services/api';
import { Video } from '../types';

interface CreateVideoModalProps {
  token: string;
  onClose: () => void;
  onSuccess: (video: Video) => void;
}

export const CreateVideoModal: React.FC<CreateVideoModalProps> = ({ token, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let finalVideoUrl = videoUrl;
      let videoBase64: string | undefined = undefined;
      let filename: string | undefined = undefined;

      if (file) {
        filename = file.name;
        videoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else if (!videoUrl) {
        finalVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      }

      const created = await api.createVideo(token, {
        title,
        description,
        videoUrl: finalVideoUrl,
        thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=60',
        videoBase64,
        filename,
      });

      onSuccess(created);
    } catch (err: any) {
      setError(err.message || 'Failed to create video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <VideoIcon size={22} style={{ color: '#ff0000' }} />
            <h2 className="modal-title">Upload Video</h2>
          </div>
          <button onClick={onClose} style={{ padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255,0,0,0.15)', color: '#ff4d4d', padding: '10px', borderRadius: '8px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Video Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Add a title that describes your video"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Tell viewers about your video"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Upload Video File (.mp4)</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              style={{ fontSize: '14px', color: '#aaa' }}
            />
          </div>

          <div style={{ textAlign: 'center', fontSize: '12px', color: '#888' }}>OR</div>

          <div className="form-group">
            <label className="form-label">Video URL (Direct MP4 Stream URL)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://commondatastorage.googleapis.com/.../video.mp4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={!!file}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Thumbnail Image URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com/thumbnail.jpg"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Uploading...' : 'Publish Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
