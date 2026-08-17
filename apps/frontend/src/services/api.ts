import { Video, Comment, LikesSummary, User } from '../types';
import { INITIAL_MOCK_VIDEOS } from './mockData';

const USER_SERVICE_URL = 'http://localhost:3001';
const AUTH_SERVICE_URL = 'http://localhost:3002';
const VIDEO_SERVICE_URL = 'http://localhost:3003';

export const api = {
  // ================= AUTH & USER =================
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(err.message || 'Invalid credentials');
    }

    const data = await res.json();
    const token = data.accessToken;

    // Decode token payload (sub, email, username, role)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const user: User = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${payload.username}`,
    };

    return { token, user };
  },

  async register(email: string, username: string, fullName: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${USER_SERVICE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, fullName, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(err.message || 'Registration failed');
    }

    // Auto login after registration
    return this.login(email, password);
  },

  // ================= VIDEOS =================
  async getVideos(search: string = ''): Promise<Video[]> {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${VIDEO_SERVICE_URL}/videos${query}`);

      if (!res.ok) throw new Error('Failed to fetch videos from server');

      const data = await res.json();
      const serverVideos: Video[] = data.videos || [];

      // Combine server videos with mock videos for fallback UI demo
      const formattedServerVideos = serverVideos.map((v) => ({
        ...v,
        videoUrl: v.videoUrl.startsWith('/uploads/') ? `${VIDEO_SERVICE_URL}${v.videoUrl}` : v.videoUrl,
        channelName: v.channelName || `Creator_${v.userId.substring(0, 5)}`,
        channelAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${v.userId}`,
        likesCount: v.likesCount || 0,
        dislikesCount: v.dislikesCount || 0,
        commentsCount: v.commentsCount || 0,
      }));

      // Filter mock videos if search term is provided
      let mockFiltered = INITIAL_MOCK_VIDEOS;
      if (search) {
        const term = search.toLowerCase();
        mockFiltered = INITIAL_MOCK_VIDEOS.filter(
          (m) => m.title.toLowerCase().includes(term) || m.description.toLowerCase().includes(term)
        );
      }

      return [...formattedServerVideos, ...mockFiltered];
    } catch (err) {
      console.warn('Backend video service offline, falling back to demo videos:', err);
      if (search) {
        const term = search.toLowerCase();
        return INITIAL_MOCK_VIDEOS.filter(
          (m) => m.title.toLowerCase().includes(term) || m.description.toLowerCase().includes(term)
        );
      }
      return INITIAL_MOCK_VIDEOS;
    }
  },

  async getVideoById(id: string): Promise<Video> {
    try {
      const res = await fetch(`${VIDEO_SERVICE_URL}/videos/${id}`);
      if (!res.ok) throw new Error('Video not found');

      const data = await res.json();
      const v: Video = data.data;

      return {
        ...v,
        videoUrl: v.videoUrl.startsWith('/uploads/') ? `${VIDEO_SERVICE_URL}${v.videoUrl}` : v.videoUrl,
        channelName: v.channelName || `Creator_${v.userId.substring(0, 5)}`,
        channelAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${v.userId}`,
      };
    } catch {
      const mock = INITIAL_MOCK_VIDEOS.find((m) => m.id === id);
      if (mock) return mock;
      throw new Error('Video not found');
    }
  },

  async createVideo(token: string, payload: { title: string; description: string; videoUrl: string; thumbnailUrl: string; videoBase64?: string; filename?: string }): Promise<Video> {
    const res = await fetch(`${VIDEO_SERVICE_URL}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to create video' }));
      throw new Error(err.message || 'Failed to create video');
    }

    const data = await res.json();
    const v: Video = data.data;
    return {
      ...v,
      videoUrl: v.videoUrl.startsWith('/uploads/') ? `${VIDEO_SERVICE_URL}${v.videoUrl}` : v.videoUrl,
    };
  },

  // ================= COMMENTS =================
  async getComments(videoId: string): Promise<Comment[]> {
    try {
      const res = await fetch(`${VIDEO_SERVICE_URL}/videos/${videoId}/comments`);
      if (!res.ok) return [];

      const data = await res.json();
      const serverComments: Comment[] = data.comments || [];

      return serverComments.map((c) => ({
        ...c,
        username: c.username || `User_${c.userId.substring(0, 4)}`,
        userAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${c.userId}`,
      }));
    } catch {
      return [
        {
          id: 'c-1',
          videoId,
          userId: 'u-1',
          username: 'TechEnthusiast',
          userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          content: 'This microservices structure is so clean! Great tutorial.',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'c-2',
          videoId,
          userId: 'u-2',
          username: 'DevStudio',
          userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
          content: 'Thanks for explaining NestJS REST inter-service communication clearly.',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
  },

  async addComment(token: string, videoId: string, content: string): Promise<Comment> {
    const res = await fetch(`${VIDEO_SERVICE_URL}/videos/${videoId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to add comment' }));
      throw new Error(err.message || 'Failed to add comment');
    }

    const data = await res.json();
    return data.data;
  },

  async deleteComment(token: string, commentId: string): Promise<void> {
    const res = await fetch(`${VIDEO_SERVICE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to delete comment');
    }
  },

  // ================= LIKES =================
  async getLikesSummary(videoId: string, token?: string): Promise<LikesSummary> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${VIDEO_SERVICE_URL}/videos/${videoId}/likes`, { headers });
      if (!res.ok) throw new Error('Failed to get likes');

      const data = await res.json();
      return data.data || { likesCount: 0, dislikesCount: 0, userLikeStatus: null };
    } catch {
      return { likesCount: 42, dislikesCount: 1, userLikeStatus: null };
    }
  },

  async setLike(token: string, videoId: string, isLike: boolean): Promise<void> {
    const res = await fetch(`${VIDEO_SERVICE_URL}/videos/${videoId}/likes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isLike }),
    });

    if (!res.ok) {
      throw new Error('Failed to update like status');
    }
  },

  async removeLike(token: string, videoId: string): Promise<void> {
    const res = await fetch(`${VIDEO_SERVICE_URL}/videos/${videoId}/likes`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to remove like status');
    }
  },
};
