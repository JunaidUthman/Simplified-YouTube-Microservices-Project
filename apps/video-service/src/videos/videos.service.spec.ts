import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { VideosService, ForbiddenException, NotFoundException, BadRequestException } from './videos.service';
import { VideosRepository } from './videos.repository';
import { StorageService } from '../storage/storage.service';

describe('VideosService', () => {
  let repository: VideosRepository;
  let storageService: StorageService;
  let service: VideosService;

  const mockUserId1 = 'user-uuid-1111-1111';
  const mockUserId2 = 'user-uuid-2222-2222';

  beforeEach(async () => {
    repository = new VideosRepository();
    storageService = new StorageService('./uploads-test');
    service = new VideosService(repository, storageService);
    await service.init();
  });

  describe('Videos CRUD', () => {
    it('should create a video successfully with videoUrl', async () => {
      const video = await service.createVideo(
        {
          title: 'My First Video',
          description: 'A cool video about NestJS',
          videoUrl: 'http://example.com/video.mp4',
        },
        mockUserId1
      );

      assert.ok(video.id);
      assert.equal(video.title, 'My First Video');
      assert.equal(video.userId, mockUserId1);
      assert.equal(video.viewsCount, 0);
    });

    it('should throw BadRequestException if title is missing', async () => {
      await assert.rejects(
        async () => {
          await service.createVideo({ title: '', videoUrl: 'http://example.com/video.mp4' }, mockUserId1);
        },
        (err: any) => err instanceof BadRequestException
      );
    });

    it('should list videos with pagination', async () => {
      await service.createVideo({ title: 'Vid 1', videoUrl: 'http://example.com/1.mp4' }, mockUserId1);
      await service.createVideo({ title: 'Vid 2', videoUrl: 'http://example.com/2.mp4' }, mockUserId1);

      const result = await service.findAllVideos({ limit: '10', offset: '0' });
      assert.equal(result.total, 2);
      assert.equal(result.videos.length, 2);
    });

    it('should find video by ID and increment view count', async () => {
      const created = await service.createVideo(
        { title: 'Test View Count', videoUrl: 'http://example.com/v.mp4' },
        mockUserId1
      );

      const found = await service.findVideoById(created.id, true);
      assert.equal(found.id, created.id);
      assert.equal(found.viewsCount, 1);
      assert.equal(found.likesCount, 0);
      assert.equal(found.commentsCount, 0);
    });

    it('should allow owner to update video', async () => {
      const video = await service.createVideo(
        { title: 'Original Title', videoUrl: 'http://example.com/v.mp4' },
        mockUserId1
      );

      const updated = await service.updateVideo(video.id, { title: 'Updated Title' }, mockUserId1);
      assert.equal(updated.title, 'Updated Title');
    });

    it('should throw ForbiddenException when non-owner tries to update video', async () => {
      const video = await service.createVideo(
        { title: 'Owner Video', videoUrl: 'http://example.com/v.mp4' },
        mockUserId1
      );

      await assert.rejects(
        async () => {
          await service.updateVideo(video.id, { title: 'Hacked Title' }, mockUserId2);
        },
        (err: any) => err instanceof ForbiddenException
      );
    });

    it('should allow owner to remove video', async () => {
      const video = await service.createVideo(
        { title: 'Delete Me', videoUrl: 'http://example.com/v.mp4' },
        mockUserId1
      );

      const deleted = await service.removeVideo(video.id, mockUserId1);
      assert.equal(deleted, true);

      await assert.rejects(
        async () => {
          await service.findVideoById(video.id);
        },
        (err: any) => err instanceof NotFoundException
      );
    });
  });

  describe('Comments CRUD', () => {
    it('should add comment to a video', async () => {
      const video = await service.createVideo(
        { title: 'Commentable Video', videoUrl: 'http://example.com/v.mp4' },
        mockUserId1
      );

      const comment = await service.addComment(video.id, { content: 'Great video!' }, mockUserId2);
      assert.ok(comment.id);
      assert.equal(comment.videoId, video.id);
      assert.equal(comment.userId, mockUserId2);
      assert.equal(comment.content, 'Great video!');
    });

    it('should list comments for a video', async () => {
      const video = await service.createVideo(
        { title: 'Comment List Video', videoUrl: 'http://example.com/v.mp4' },
        mockUserId1
      );

      await service.addComment(video.id, { content: 'First' }, mockUserId1);
      await service.addComment(video.id, { content: 'Second' }, mockUserId2);

      const res = await service.getComments(video.id, { limit: '10' });
      assert.equal(res.total, 2);
    });

    it('should allow comment author to delete comment', async () => {
      const video = await service.createVideo(
        { title: 'Vid', videoUrl: 'http://example.com/v.mp4' },
        mockUserId1
      );
      const comment = await service.addComment(video.id, { content: 'Nice' }, mockUserId2);

      const deleted = await service.removeComment(comment.id, mockUserId2);
      assert.equal(deleted, true);
    });
  });

  describe('Likes CRUD', () => {
    it('should like and dislike a video and calculate summary', async () => {
      const video = await service.createVideo(
        { title: 'Likable Video', videoUrl: 'http://example.com/v.mp4' },
        mockUserId1
      );

      // User 1 likes
      await service.setLike(video.id, { isLike: true }, mockUserId1);
      // User 2 dislikes
      await service.setLike(video.id, { isLike: false }, mockUserId2);

      const summary = await service.getLikesSummary(video.id, mockUserId1);
      assert.equal(summary.likesCount, 1);
      assert.equal(summary.dislikesCount, 1);
      assert.equal(summary.userLikeStatus, 'like');
    });

    it('should remove a like', async () => {
      const video = await service.createVideo(
        { title: 'Video', videoUrl: 'http://example.com/v.mp4' },
        mockUserId1
      );

      await service.setLike(video.id, { isLike: true }, mockUserId1);
      const afterRemove = await service.removeLike(video.id, mockUserId1);

      assert.equal(afterRemove.likesCount, 0);
      assert.equal(afterRemove.userLikeStatus, null);
    });
  });
});
