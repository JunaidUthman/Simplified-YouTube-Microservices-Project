import { JwtService } from './jwt/jwt.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { getAuthConfig } from '../config/auth.config';

export class HttpException extends Error {
  public message: string;
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'HttpException';
    this.message = message;
    this.statusCode = statusCode;
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string = 'Invalid input data') {
    super(message, 400);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Invalid email or password') {
    super(message, 401);
  }
}

export class AuthService {
  private readonly jwtService: JwtService;
  private readonly userServiceUrl: string;
  private readonly expiresIn: number;

  constructor(jwtService?: JwtService, userServiceUrl?: string) {
    const config = getAuthConfig();
    this.jwtService = jwtService || new JwtService(config.jwtSecret, config.jwtExpiresIn);
    this.userServiceUrl = userServiceUrl || config.userServiceUrl;
    this.expiresIn = config.jwtExpiresIn;
  }

  /**
   * Verifies user credentials via User Microservice and returns an HS256 signed JWT token
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    let user: any;

    try {
      // Call User Microservice /users/validate-credentials endpoint
      const response = await fetch(`${this.userServiceUrl}/users/validate-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const resBody: any = await response.json();

      if (response.status === 401 || response.status === 404) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!response.ok || !resBody.data) {
        throw new UnauthorizedException(resBody?.message || 'Authentication failed');
      }

      user = resBody.data;
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      // If user service is unreachable or errors
      throw new UnauthorizedException('Unable to verify user credentials with User Service');
    }

    // Sign HS256 JWT Token
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role || 'user',
    };

    const token = this.jwtService.sign(payload, this.expiresIn);

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: this.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role || 'user',
      },
    };
  }

  /**
   * Verifies a JWT token (bonus helper method for microservices authentication)
   */
  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (err: any) {
      throw new UnauthorizedException(err.message || 'Invalid token');
    }
  }
}
