import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AuthService, BadRequestException, UnauthorizedException } from './auth.service';
import { JwtService } from './jwt/jwt.service';

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  const secret = 'test_secret_key_2026';

  beforeEach(() => {
    jwtService = new JwtService(secret, 3600);
    authService = new AuthService(jwtService, 'http://localhost:3001');
  });

  describe('login', () => {
    it('should throw BadRequestException if email or password missing', async () => {
      await assert.rejects(async () => {
        await authService.login({ email: '', password: '' });
      }, BadRequestException);

      await assert.rejects(async () => {
        await authService.login({ email: 'test@yt.com', password: '' });
      }, BadRequestException);
    });

    it('should issue an HS256 JWT token when credentials are valid', async () => {
      // Mock fetch global for testing User Service call
      const originalFetch = global.fetch;
      global.fetch = async (url: any, opts: any) => {
        return {
          status: 200,
          ok: true,
          json: async () => ({
            statusCode: 200,
            data: {
              id: 'user-uuid-1',
              email: 'john@yt.com',
              username: 'johndoe',
              fullName: 'John Doe',
              role: 'user',
            },
          }),
        } as any;
      };

      try {
        const result = await authService.login({
          email: 'john@yt.com',
          password: 'Password123!',
        });

        assert.ok(result.accessToken);
        assert.strictEqual(result.tokenType, 'Bearer');
        assert.strictEqual(result.user.email, 'john@yt.com');

        // Verify token decoding
        const decoded = jwtService.verify(result.accessToken);
        assert.strictEqual(decoded.sub, 'user-uuid-1');
        assert.strictEqual(decoded.email, 'john@yt.com');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should throw UnauthorizedException if User Service returns 401/404', async () => {
      const originalFetch = global.fetch;
      global.fetch = async () => {
        return {
          status: 401,
          ok: false,
          json: async () => ({ statusCode: 401, message: 'Invalid credentials' }),
        } as any;
      };

      try {
        await assert.rejects(async () => {
          await authService.login({ email: 'wrong@yt.com', password: 'wrongpassword' });
        }, UnauthorizedException);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('verifyToken', () => {
    it('should verify and return payload for a valid token', () => {
      const token = jwtService.sign({ sub: 'user-777', email: 'test@yt.com', username: 'testuser', role: 'admin' });
      const decoded = authService.verifyToken(token);
      assert.strictEqual(decoded.sub, 'user-777');
      assert.strictEqual(decoded.role, 'admin');
    });

    it('should throw UnauthorizedException for an invalid token', () => {
      assert.throws(() => {
        authService.verifyToken('invalid.token.str');
      }, UnauthorizedException);
    });
  });
});
