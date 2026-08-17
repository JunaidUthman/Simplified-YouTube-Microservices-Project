import { VideosService } from './videos.service';
import type { CreateVideoDto } from './dto/create-video.dto';
import type { UpdateVideoDto } from './dto/update-video.dto';
import type { CreateCommentDto } from './dto/create-comment.dto';
import type { CreateLikeDto } from './dto/create-like.dto';

export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  // ==================== VIDEOS ====================

  async createVideo(
    dto: CreateVideoDto,
    userId: string,
    file?: { buffer: Buffer; originalname?: string }
  ) {
    return this.videosService.createVideo(dto, userId, file);
  }

  async findAll(query: Record<string, string>) {
    return this.videosService.findAllVideos(query);
  }

  async findOne(id: string) {
    return this.videosService.findVideoById(id, true);
  }

  async update(id: string, dto: UpdateVideoDto, userId: string) {
    return this.videosService.updateVideo(id, dto, userId);
  }

  async remove(id: string, userId: string) {
    const success = await this.videosService.removeVideo(id, userId);
    return { success, message: 'Video deleted successfully' };
  }

  // ==================== COMMENTS ====================

  async addComment(videoId: string, dto: CreateCommentDto, userId: string) {
    return this.videosService.addComment(videoId, dto, userId);
  }

  async getComments(videoId: string, query: Record<string, string>) {
    return this.videosService.getComments(videoId, query);
  }

  async removeComment(commentId: string, userId: string) {
    const success = await this.videosService.removeComment(commentId, userId);
    return { success, message: 'Comment deleted successfully' };
  }

  // ==================== LIKES ====================

  async setLike(videoId: string, dto: CreateLikeDto, userId: string) {
    return this.videosService.setLike(videoId, dto, userId);
  }

  async removeLike(videoId: string, userId: string) {
    return this.videosService.removeLike(videoId, userId);
  }

  async getLikesSummary(videoId: string, userId?: string) {
    return this.videosService.getLikesSummary(videoId, userId);
  }
}
