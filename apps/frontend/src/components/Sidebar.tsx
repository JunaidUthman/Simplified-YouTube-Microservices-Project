import React from 'react';
import { Home, Compass, PlaySquare, Clock, ThumbsUp, Flame, Music, Gamepad2, Radio, Trophy, Film } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, activeTab, onSelectTab }) => {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-section">
        <button
          className={`sidebar-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => onSelectTab('home')}
        >
          <Home size={20} />
          <span>Home</span>
        </button>
        <button
          className={`sidebar-item ${activeTab === 'shorts' ? 'active' : ''}`}
          onClick={() => onSelectTab('shorts')}
        >
          <Flame size={20} />
          <span>Shorts</span>
        </button>
        <button
          className={`sidebar-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => onSelectTab('subscriptions')}
        >
          <PlaySquare size={20} />
          <span>Subscriptions</span>
        </button>
      </div>

      <div className="divider" />

      <div className="sidebar-section">
        {!collapsed && <span className="sidebar-title">You</span>}
        <button
          className={`sidebar-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => onSelectTab('history')}
        >
          <Clock size={20} />
          <span>History</span>
        </button>
        <button
          className={`sidebar-item ${activeTab === 'liked' ? 'active' : ''}`}
          onClick={() => onSelectTab('liked')}
        >
          <ThumbsUp size={20} />
          <span>Liked Videos</span>
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="divider" />
          <div className="sidebar-section">
            <span className="sidebar-title">Explore</span>
            <button className="sidebar-item" onClick={() => onSelectTab('trending')}>
              <Compass size={20} />
              <span>Trending</span>
            </button>
            <button className="sidebar-item" onClick={() => onSelectTab('music')}>
              <Music size={20} />
              <span>Music</span>
            </button>
            <button className="sidebar-item" onClick={() => onSelectTab('gaming')}>
              <Gamepad2 size={20} />
              <span>Gaming</span>
            </button>
            <button className="sidebar-item" onClick={() => onSelectTab('live')}>
              <Radio size={20} />
              <span>Live</span>
            </button>
            <button className="sidebar-item" onClick={() => onSelectTab('sports')}>
              <Trophy size={20} />
              <span>Sports</span>
            </button>
            <button className="sidebar-item" onClick={() => onSelectTab('movies')}>
              <Film size={20} />
              <span>Movies</span>
            </button>
          </div>
        </>
      )}
    </aside>
  );
};
