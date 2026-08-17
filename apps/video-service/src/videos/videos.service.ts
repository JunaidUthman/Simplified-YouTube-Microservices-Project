import { randomUUID } from 'crypto';
import { Video } from './entities/video.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';
import { VideosRepository } from './videos.repository';
import { StorageService } from '../storage/storage.service';
import type { CreateVideoDto } from './dto/create-video.dto';
import type { UpdateVideoDto } from './dto/update-video.dto';
import type { CreateCommentDto } from './dto/create-comment.dto';
import type { CreateLikeDto } from './dto/create-like.dto';

export class HttpException extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

export class VideosService {
  constructor(
    private readonly repository: VideosRepository,
    private readonly storageService: StorageService
  ) {}

  async init(): Promise<void> {
    await this.repository.initTable();
  }

  // ==========================================
  // VIDEOS SERVICE
  // ==========================================

  async createVideo(
    dto: CreateVideoDto,
    userId: string,
    file?: { buffer: Buffer; originalname?: string }
  ): Promise<Video> {
    if (!dto.title || dto.title.trim() === '') {
      throw new BadRequestException('Video title is required');
    }

    let videoUrl = dto.videoUrl || '';

    // Save video file locally if provided
    if (file && file.buffer) {
      const saved = await this.storageService.saveFile(file.buffer, file.originalname);
      videoUrl = saved.url;
    }

    if (!videoUrl) {
      throw new BadRequestException('Video file or videoUrl must be provided');
    }

    const video = new Video({
      id: randomUUID(),
      title: dto.title.trim(),
      description: dto.description || '',
      videoUrl,
      thumbnailUrl: dto.thumbnailUrl || '',
      userId,
      viewsCount: 0,
    });

    return this.repository.createVideo(video);
  }

  async findAllVideos(query: { limit?: string; offset?: string; search?: string }): Promise<{ videos: Video[]; total: number; limit: number; offset: number }> {
    const limit = Math.max(1, parseInt(query.limit || '10', 10));
    const offset = Math.max(0, parseInt(query.offset || '0', 10));
    const search = query.search || '';

    const { videos, total } = await this.repository.findAllVideos(limit, offset, search);
    return { videos, total, limit, offset };
  }

  async findVideoById(id: string, incrementView: boolean = true): Promise<any> {
    const video = await this.repository.findVideoById(id);
    if (!video) {
      throw new NotFoundException(`Video with ID "${id}" not found`);
    }

    if (incrementView) {
      await this.repository.incrementViews(id);
      video.viewsCount += 1;
    }

    const likesSummary = await this.repository.getLikesSummary(id);
    const { total: commentsCount } = await this.repository.findCommentsByVideoId(id, 1, 0);

    return {
      ...video,
      likesCount: likesSummary.likesCount,
      dislikesCount: likesSummary.dislikesCount,
      commentsCount,
    };
  }

  async updateVideo(id: string, dto: UpdateVideoDto, userId: string): Promise<Video> {
    const video = await this.repository.findVideoById(id);
    if (!video) {
      throw new NotFoundException(`Video with ID "${id}" not found`);
    }

    if (video.userId !== userId) {
      throw new ForbiddenException('You are not authorized to update this video');
    }

    const updated = await this.repository.updateVideo(id, {
      title: dto.title !== undefined ? dto.title.trim() : video.title,
      description: dto.description !== undefined ? dto.description : video.description,
      thumbnailUrl: dto.thumbnailUrl !== undefined ? dto.thumbnailUrl : video.thumbnailUrl,
    });

    if (!updated) {
      throw new NotFoundException(`Video with ID "${id}" not found`);
    }

    return updated;
  }

  async removeVideo(id: string, userId: string): Promise<boolean> {
    const video = await this.repository.findVideoById(id);
    if (!video) {
      throw new NotFoundException(`Video with ID "${id}" not found`);
    }

    if (video.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this video');
    }

    // Try deleting local file if stored in local upload folder
    if (video.videoUrl && video.videoUrl.startsWith('/uploads/')) {
      const filename = video.videoUrl.replace('/uploads/', '');
      await this.storageService.deleteFile(filename);
    }

    return this.repository.deleteVideo(id);
  }

  // ==========================================
  // COMMENTS SERVICE
  // ==========================================

  async addComment(videoId: string, dto: CreateCommentDto, userId: string): Promise<Comment> {
    const video = await this.repository.findVideoById(videoId);
    if (!video) {
      throw new NotFoundException(`Video with ID "${videoId}" not found`);
    }

    if (!dto.content || dto.content.trim() === '') {
      throw new BadRequestException('Comment content cannot be empty');
    }

    const comment = new Comment({
      id: randomUUID(),
      videoId,
      userId,
      content: dto.content.trim(),
    });

    return this.repository.createComment(comment);
  }

  async getComments(videoId: string, query: { limit?: string; offset?: string }): Promise<{ comments: Comment[]; total: number; limit: number; offset: number }> {
    const video = await this.repository.findVideoById(videoId);
    if (!video) {
      throw new NotFoundException(`Video with ID "${videoId}" not found`);
    }

    const limit = Math.max(1, parseInt(query.limit || '20', 10));
    const offset = Math.max(0, parseInt(query.offset || '0', 10));

    const { comments, total } = await this.repository.findCommentsByVideoId(videoId, limit, offset);
    return { comments, total, limit, offset };
  }

  async removeComment(commentId: string, userId: string): Promise<boolean> {
    const comment = await this.repository.findCommentById(commentId);
    if (!comment) {
      throw new NotFoundException(`Comment with ID "${commentId}" not found`);
    }

    const video = await this.repository.findVideoById(comment.videoId);

    // Comment owner OR Video owner can delete the comment
    if (comment.userId !== userId && video?.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this comment');
    }

    return this.repository.deleteComment(commentId);
  }

  // ==========================================
  // LIKES SERVICE
  // ==========================================

  async setLike(videoId: string, dto: CreateLikeDto, userId: string): Promise<any> {
    const video = await this.repository.findVideoById(videoId);
    if (!video) {
      throw new NotFoundException(`Video with ID "${videoId}" not found`);
    }

    const isLike = dto.isLike !== undefined ? dto.isLike : true;

    const like = new Like({
      id: randomUUID(),
      videoId,
      userId,
      isLike,
    });

    await this.repository.setLike(like);
    const summary = await this.repository.getLikesSummary(videoId);
    return {
      videoId,
      userLikeStatus: isLike ? 'like' : 'dislike',
      ...summary,
    };
  }

  async removeLike(videoId: string, userId: string): Promise<any> {
    const video = await this.repository.findVideoById(videoId);
    if (!video) {
      throw new NotFoundException(`Video with ID "${videoId}" not found`);
    }

    await this.repository.removeLike(videoId, userId);
    const summary = await this.repository.getLikesSummary(videoId);
    return {
      videoId,
      userLikeStatus: null,
      ...summary,
    };
  }

  async getLikesSummary(videoId: string, userId?: string): Promise<any> {
    const video = await this.repository.findVideoById(videoId);
    if (!video) {
      throw new NotFoundException(`Video with ID "${videoId}" not found`);
    }

    const summary = await this.repository.getLikesSummary(videoId);
    let userLikeStatus: string | null = null;

    if (userId) {
      const userLike = await this.repository.getUserLikeStatus(videoId, userId);
      if (userLike) {
        userLikeStatus = userLike.isLike ? 'like' : 'dislike';
      }
    }

    return {
      videoId,
      userLikeStatus,
      ...summary,
    };
  }
}
