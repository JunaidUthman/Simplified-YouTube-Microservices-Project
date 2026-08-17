import { UsersModule } from './users/users.module';

export class AppModule {
  public usersModule: UsersModule;

  constructor(pgClient?: any) {
    this.usersModule = new UsersModule(pgClient);
  }

  async init() {
    await this.usersModule.init();
  }
}
