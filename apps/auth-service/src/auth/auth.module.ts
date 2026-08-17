import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

export class AuthModule {
  public controller: AuthController;
  public service: AuthService;

  constructor() {
    this.service = new AuthService();
    this.controller = new AuthController(this.service);
  }
}
