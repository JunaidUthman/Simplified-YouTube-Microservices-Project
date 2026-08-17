import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Video } from '../types';

interface ShareModalProps {
  video: Video;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ video, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/video/${video.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Share Video</h2>
          <button onClick={onClose} style={{ padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: '#aaa' }}>{video.title}</p>

          <div className="search-box" style={{ width: '100%' }}>
            <input type="text" className="search-input" value={shareUrl} readOnly style={{ borderRadius: '8px 0 0 8px' }} />
            <button className="search-btn" onClick={handleCopy} style={{ borderRadius: '0 8px 8px 0', width: '80px' }}>
              {copied ? <Check size={18} style={{ color: '#4caf50' }} /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
