import { VideosRepository } from './videos/videos.repository';
import { VideosService } from './videos/videos.service';
import { VideosController } from './videos/videos.controller';
import { StorageService } from './storage/storage.service';
import { JwtService } from './auth/jwt.service';

export class AppModule {
  public repository: VideosRepository;
  public storageService: StorageService;
  public videosService: VideosService;
  public controller: VideosController;
  public jwtService: JwtService;

  constructor(pgClient?: any) {
    this.repository = new VideosRepository(pgClient);
    this.storageService = new StorageService();
    this.videosService = new VideosService(this.repository, this.storageService);
    this.controller = new VideosController(this.videosService);
    this.jwtService = new JwtService();
  }

  async init() {
    await this.videosService.init();
  }
}
