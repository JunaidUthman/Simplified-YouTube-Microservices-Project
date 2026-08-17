import React, { useState } from 'react';
import { Menu, Search, Mic, Plus, User as UserIcon, LogOut, Bell } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onToggleSidebar: () => void;
  onSearch: (term: string) => void;
  onOpenAuth: () => void;
  onOpenCreate: () => void;
  onLogout: () => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onToggleSidebar,
  onSearch,
  onOpenAuth,
  onOpenCreate,
  onLogout,
  onGoHome,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <nav className="navbar">
      {/* Left section: Menu & Logo */}
      <div className="nav-left">
        <button className="menu-btn" onClick={onToggleSidebar} title="Toggle menu">
          <Menu size={20} />
        </button>
        <button onClick={onGoHome} className="logo-container" style={{ textDecoration: 'none' }}>
          <svg className="logo-icon" width="30" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <span>JunaidTube</span>
          <span className="country-code">TN</span>
        </button>
      </div>

      {/* Center section: Search Bar */}
      <div className="nav-center">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="search-btn" title="Search">
            <Search size={18} />
          </button>
        </form>
        <button className="mic-btn" title="Search with your voice">
          <Mic size={18} />
        </button>
      </div>

      {/* Right section: Actions & Profile */}
      <div className="nav-right">
        {user ? (
          <>
            <button className="create-btn" onClick={onOpenCreate}>
              <Plus size={18} />
              <span>Create</span>
            </button>

            <button className="menu-btn" title="Notifications">
              <Bell size={20} />
            </button>

            <div style={{ position: 'relative' }}>
              <button
                className="user-avatar"
                onClick={() => setShowDropdown(!showDropdown)}
                title={user.username}
              >
                {user.username.charAt(0).toUpperCase()}
              </button>

              {showDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    backgroundColor: '#282828',
                    borderRadius: '12px',
                    padding: '12px',
                    minWidth: '200px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    zIndex: 2000,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{user.username}</span>
                      <span style={{ color: '#aaa', fontSize: '12px' }}>{user.email}</span>
                    </div>
                  </div>
                  <div className="divider" />
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onLogout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#ff4d4d',
                      fontSize: '14px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button className="sign-in-btn" onClick={onOpenAuth}>
            <UserIcon size={18} />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </nav>
  );
};
