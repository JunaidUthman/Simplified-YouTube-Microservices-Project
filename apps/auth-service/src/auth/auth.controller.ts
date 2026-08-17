import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async health() {
    return { status: 'up' };
  }

  async login(loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  async verify(token: string) {
    return this.authService.verifyToken(token);
  }
}
