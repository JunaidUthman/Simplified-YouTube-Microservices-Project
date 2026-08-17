import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

export class UsersModule {
  public controller: UsersController;
  public service: UsersService;
  public repository: UsersRepository;

  constructor(pgClient?: any) {
    this.repository = new UsersRepository(pgClient);
    this.service = new UsersService(this.repository);
    this.controller = new UsersController(this.service);
  }

  async init() {
    await this.repository.initTable();
  }
}
