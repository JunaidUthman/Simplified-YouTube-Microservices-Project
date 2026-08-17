import { Video, type VideoProps } from './entities/video.entity';
import { Comment, type CommentProps } from './entities/comment.entity';
import { Like, type LikeProps } from './entities/like.entity';

export class VideosRepository {
  private videos: Map<string, Video> = new Map();
  private comments: Map<string, Comment> = new Map();
  private likes: Map<string, Like> = new Map(); // key: `${videoId}:${userId}`
  private isPgConnected = false;
  private pgClient: any = null;

  constructor(pgClient?: any) {
    if (pgClient) {
      this.pgClient = pgClient;
      this.isPgConnected = true;
    }
  }

  async initTable(): Promise<void> {
    if (!this.isPgConnected || !this.pgClient) return;

    const query = `
      CREATE TABLE IF NOT EXISTS videos (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        video_url TEXT NOT NULL,
        thumbnail_url TEXT DEFAULT '',
        user_id VARCHAR(36) NOT NULL,
        views_count INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR(36) PRIMARY KEY,
        video_id VARCHAR(36) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        user_id VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS likes (
        id VARCHAR(36) PRIMARY KEY,
        video_id VARCHAR(36) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        user_id VARCHAR(36) NOT NULL,
        is_like BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_video_user_like UNIQUE (video_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
      CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id);
      CREATE INDEX IF NOT EXISTS idx_likes_video_id ON likes(video_id);
    `;

    try {
      await this.pgClient.query(query);
    } catch (err) {
      console.warn('PostgreSQL table creation warning in Video Service, using in-memory store:', (err as Error).message);
      this.isPgConnected = false;
    }
  }

  // ==========================================
  // VIDEOS CRUD
  // ==========================================

  async createVideo(video: Video): Promise<Video> {
    if (this.isPgConnected && this.pgClient) {
      const query = `
        INSERT INTO videos (id, title, description, video_url, thumbnail_url, user_id, views_count, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;
      const values = [
        video.id,
        video.title,
        video.description,
        video.videoUrl,
        video.thumbnailUrl,
        video.userId,
        video.viewsCount,
        video.createdAt,
        video.updatedAt,
      ];
      const res = await this.pgClient.query(query, values);
      return this.mapRowToVideo(res.rows[0]);
    }

    this.videos.set(video.id, video);
    return video;
  }

  async findAllVideos(limit: number = 10, offset: number = 0, search: string = ''): Promise<{ videos: Video[]; total: number }> {
    if (this.isPgConnected && this.pgClient) {
      let whereClause = '';
      const params: any[] = [];

      if (search) {
        whereClause = `WHERE title ILIKE $1 OR description ILIKE $1`;
        params.push(`%${search}%`);
      }

      const countRes = await this.pgClient.query(`SELECT COUNT(*) FROM videos ${whereClause}`, params);
      const total = parseInt(countRes.rows[0].count, 10);

      const limitParamIndex = params.length + 1;
      const offsetParamIndex = params.length + 2;
      params.push(limit, offset);

      const query = `
        SELECT * FROM videos ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex};
      `;
      const res = await this.pgClient.query(query, params);
      const videos = res.rows.map((row: any) => this.mapRowToVideo(row));

      return { videos, total };
    }

    let all = Array.from(this.videos.values());
    if (search) {
      const term = search.toLowerCase();
      all = all.filter(
        (v) => v.title.toLowerCase().includes(term) || v.description.toLowerCase().includes(term)
      );
    }
    all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = all.length;
    const paginated = all.slice(offset, offset + limit);
    return { videos: paginated, total };
  }

  async findVideoById(id: string): Promise<Video | null> {
    if (this.isPgConnected && this.pgClient) {
      const res = await this.pgClient.query(`SELECT * FROM videos WHERE id = $1`, [id]);
      if (res.rows.length === 0) return null;
      return this.mapRowToVideo(res.rows[0]);
    }

    return this.videos.get(id) || null;
  }

  async incrementViews(id: string): Promise<void> {
    if (this.isPgConnected && this.pgClient) {
      await this.pgClient.query(`UPDATE videos SET views_count = views_count + 1 WHERE id = $1`, [id]);
      return;
    }

    const video = this.videos.get(id);
    if (video) {
      video.viewsCount += 1;
    }
  }

  async updateVideo(id: string, updateData: Partial<VideoProps>): Promise<Video | null> {
    const existing = await this.findVideoById(id);
    if (!existing) return null;

    const updatedVideo = new Video({
      ...existing,
      ...updateData,
      id,
      updatedAt: new Date(),
    });

    if (this.isPgConnected && this.pgClient) {
      const query = `
        UPDATE videos
        SET title = $1, description = $2, thumbnail_url = $3, updated_at = $4
        WHERE id = $5
        RETURNING *;
      `;
      const values = [
        updatedVideo.title,
        updatedVideo.description,
        updatedVideo.thumbnailUrl,
        updatedVideo.updatedAt,
        id,
      ];
      const res = await this.pgClient.query(query, values);
      return this.mapRowToVideo(res.rows[0]);
    }

    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }

  async deleteVideo(id: string): Promise<boolean> {
    const existing = await this.findVideoById(id);
    if (!existing) return false;

    if (this.isPgConnected && this.pgClient) {
      await this.pgClient.query(`DELETE FROM videos WHERE id = $1`, [id]);
      return true;
    }

    // Delete associated comments and likes from in-memory
    Array.from(this.comments.entries()).forEach(([cId, c]) => {
      if (c.videoId === id) this.comments.delete(cId);
    });
    Array.from(this.likes.entries()).forEach(([lKey, l]) => {
      if (l.videoId === id) this.likes.delete(lKey);
    });

    return this.videos.delete(id);
  }

  // ==========================================
  // COMMENTS CRUD
  // ==========================================

  async createComment(comment: Comment): Promise<Comment> {
    if (this.isPgConnected && this.pgClient) {
      const query = `
        INSERT INTO comments (id, video_id, user_id, content, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const values = [
        comment.id,
        comment.videoId,
        comment.userId,
        comment.content,
        comment.createdAt,
        comment.updatedAt,
      ];
      const res = await this.pgClient.query(query, values);
      return this.mapRowToComment(res.rows[0]);
    }

    this.comments.set(comment.id, comment);
    return comment;
  }

  async findCommentsByVideoId(videoId: string, limit: number = 20, offset: number = 0): Promise<{ comments: Comment[]; total: number }> {
    if (this.isPgConnected && this.pgClient) {
      const countRes = await this.pgClient.query(`SELECT COUNT(*) FROM comments WHERE video_id = $1`, [videoId]);
      const total = parseInt(countRes.rows[0].count, 10);

      const query = `
        SELECT * FROM comments
        WHERE video_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3;
      `;
      const res = await this.pgClient.query(query, [videoId, limit, offset]);
      const comments = res.rows.map((row: any) => this.mapRowToComment(row));
      return { comments, total };
    }

    const all = Array.from(this.comments.values())
      .filter((c) => c.videoId === videoId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = all.length;
    const paginated = all.slice(offset, offset + limit);
    return { comments: paginated, total };
  }

  async findCommentById(id: string): Promise<Comment | null> {
    if (this.isPgConnected && this.pgClient) {
      const res = await this.pgClient.query(`SELECT * FROM comments WHERE id = $1`, [id]);
      if (res.rows.length === 0) return null;
      return this.mapRowToComment(res.rows[0]);
    }

    return this.comments.get(id) || null;
  }

  async deleteComment(id: string): Promise<boolean> {
    const existing = await this.findCommentById(id);
    if (!existing) return false;

    if (this.isPgConnected && this.pgClient) {
      await this.pgClient.query(`DELETE FROM comments WHERE id = $1`, [id]);
      return true;
    }

    return this.comments.delete(id);
  }

  // ==========================================
  // LIKES CRUD
  // ==========================================

  async setLike(like: Like): Promise<Like> {
    const key = `${like.videoId}:${like.userId}`;

    if (this.isPgConnected && this.pgClient) {
      const query = `
        INSERT INTO likes (id, video_id, user_id, is_like, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (video_id, user_id)
        DO UPDATE SET is_like = EXCLUDED.is_like
        RETURNING *;
      `;
      const values = [like.id, like.videoId, like.userId, like.isLike, like.createdAt];
      const res = await this.pgClient.query(query, values);
      return this.mapRowToLike(res.rows[0]);
    }

    this.likes.set(key, like);
    return like;
  }

  async removeLike(videoId: string, userId: string): Promise<boolean> {
    const key = `${videoId}:${userId}`;

    if (this.isPgConnected && this.pgClient) {
      const res = await this.pgClient.query(
        `DELETE FROM likes WHERE video_id = $1 AND user_id = $2`,
        [videoId, userId]
      );
      return (res.rowCount || 0) > 0;
    }

    return this.likes.delete(key);
  }

  async getLikesSummary(videoId: string): Promise<{ likesCount: number; dislikesCount: number }> {
    if (this.isPgConnected && this.pgClient) {
      const query = `
        SELECT
          COUNT(*) FILTER (WHERE is_like = true) as likes_count,
          COUNT(*) FILTER (WHERE is_like = false) as dislikes_count
        FROM likes
        WHERE video_id = $1;
      `;
      const res = await this.pgClient.query(query, [videoId]);
      return {
        likesCount: parseInt(res.rows[0].likes_count || '0', 10),
        dislikesCount: parseInt(res.rows[0].dislikes_count || '0', 10),
      };
    }

    let likesCount = 0;
    let dislikesCount = 0;

    for (const like of this.likes.values()) {
      if (like.videoId === videoId) {
        if (like.isLike) likesCount++;
        else dislikesCount++;
      }
    }

    return { likesCount, dislikesCount };
  }

  async getUserLikeStatus(videoId: string, userId: string): Promise<Like | null> {
    const key = `${videoId}:${userId}`;

    if (this.isPgConnected && this.pgClient) {
      const res = await this.pgClient.query(
        `SELECT * FROM likes WHERE video_id = $1 AND user_id = $2`,
        [videoId, userId]
      );
      if (res.rows.length === 0) return null;
      return this.mapRowToLike(res.rows[0]);
    }

    return this.likes.get(key) || null;
  }

  // Helper mappers
  private mapRowToVideo(row: any): Video {
    return new Video({
      id: row.id,
      title: row.title,
      description: row.description,
      videoUrl: row.video_url,
      thumbnailUrl: row.thumbnail_url,
      userId: row.user_id,
      viewsCount: parseInt(row.views_count, 10),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  private mapRowToComment(row: any): Comment {
    return new Comment({
      id: row.id,
      videoId: row.video_id,
      userId: row.user_id,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  private mapRowToLike(row: any): Like {
    return new Like({
      id: row.id,
      videoId: row.video_id,
      userId: row.user_id,
      isLike: row.is_like,
      createdAt: row.created_at,
    });
  }

  async clear(): Promise<void> {
    if (this.isPgConnected && this.pgClient) {
      await this.pgClient.query(`DELETE FROM likes`);
      await this.pgClient.query(`DELETE FROM comments`);
      await this.pgClient.query(`DELETE FROM videos`);
      return;
    }
    this.videos.clear();
    this.comments.clear();
    this.likes.clear();
  }
}
