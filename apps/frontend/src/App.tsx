import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { VideoGrid } from './components/VideoGrid';
import { WatchPage } from './components/WatchPage';
import { CreateVideoModal } from './components/CreateVideoModal';
import { AuthModal } from './components/AuthModal';
import { ShareModal } from './components/ShareModal';
import { Video, User } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('yt_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('yt_token'));

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [shareVideo, setShareVideo] = useState<Video | null>(null);

  // Fetch videos on mount or when search query changes
  useEffect(() => {
    api.getVideos(searchQuery).then(setVideos).catch(console.error);
  }, [searchQuery]);

  const handleLoginSuccess = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('yt_token', newToken);
    localStorage.setItem('yt_user', JSON.stringify(newUser));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('yt_token');
    localStorage.removeItem('yt_user');
  };

  const handleVideoCreated = (newVideo: Video) => {
    setVideos([newVideo, ...videos]);
    setShowCreateModal(false);
    setActiveVideo(newVideo);
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSearch={(term) => {
          setSearchQuery(term);
          setActiveVideo(null);
        }}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenCreate={() => setShowCreateModal(true)}
        onLogout={handleLogout}
        onGoHome={() => {
          setActiveVideo(null);
          setSearchQuery('');
        }}
      />

      {/* Main Content Layout */}
      <div className="main-content-wrapper">
        <Sidebar
          collapsed={sidebarCollapsed}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setActiveVideo(null);
          }}
        />

        <main className="main-content">
          {activeVideo ? (
            <WatchPage
              video={activeVideo}
              user={user}
              token={token}
              relatedVideos={videos}
              onSelectVideo={setActiveVideo}
              onOpenAuth={() => setShowAuthModal(true)}
              onOpenShare={setShareVideo}
            />
          ) : (
            <VideoGrid videos={videos} onSelectVideo={setActiveVideo} />
          )}
        </main>
      </div>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {showCreateModal && token && (
        <CreateVideoModal
          token={token}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleVideoCreated}
        />
      )}

      {shareVideo && (
        <ShareModal video={shareVideo} onClose={() => setShareVideo(null)} />
      )}
    </div>
  );
};

export default App;
