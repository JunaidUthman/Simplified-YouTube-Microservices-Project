export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  role?: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  userId: string;
  channelName?: string;
  channelAvatar?: string;
  viewsCount: number;
  likesCount?: number;
  dislikesCount?: number;
  commentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  username?: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface LikesSummary {
  likesCount: number;
  dislikesCount: number;
  userLikeStatus?: 'like' | 'dislike' | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
