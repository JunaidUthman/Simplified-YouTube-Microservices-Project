import { AuthModule } from './auth/auth.module';

export class AppModule {
  public authModule: AuthModule;

  constructor() {
    this.authModule = new AuthModule();
  }
}
