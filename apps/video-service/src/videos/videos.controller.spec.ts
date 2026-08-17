import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { VideosRepository } from './videos.repository';
import { StorageService } from '../storage/storage.service';

describe('VideosController', () => {
  let repository: VideosRepository;
  let storageService: StorageService;
  let service: VideosService;
  let controller: VideosController;

  const mockUserId = 'user-123';

  beforeEach(async () => {
    repository = new VideosRepository();
    storageService = new StorageService('./uploads-test-ctrl');
    service = new VideosService(repository, storageService);
    controller = new VideosController(service);
    await service.init();
  });

  it('should delegate createVideo to service', async () => {
    const res = await controller.createVideo(
      { title: 'Controller Test Video', videoUrl: 'http://example.com/ctrl.mp4' },
      mockUserId
    );
    assert.equal(res.title, 'Controller Test Video');
    assert.equal(res.userId, mockUserId);
  });

  it('should delegate findAll to service', async () => {
    await controller.createVideo({ title: 'Vid 1', videoUrl: 'http://example.com/1.mp4' }, mockUserId);
    const res = await controller.findAll({});
    assert.equal(res.total, 1);
  });

  it('should delegate comment and like operations', async () => {
    const video = await controller.createVideo({ title: 'Vid 2', videoUrl: 'http://example.com/2.mp4' }, mockUserId);

    const comment = await controller.addComment(video.id, { content: 'Cool' }, mockUserId);
    assert.equal(comment.content, 'Cool');

    const likeRes = await controller.setLike(video.id, { isLike: true }, mockUserId);
    assert.equal(likeRes.likesCount, 1);
  });
});
