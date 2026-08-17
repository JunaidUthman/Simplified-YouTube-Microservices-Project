import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt/jwt.service';

describe('AuthController Unit Tests', () => {
  let controller: AuthController;
  let authService: AuthService;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService('test_secret', 3600);
    authService = new AuthService(jwtService);
    controller = new AuthController(authService);
  });

  it('should return health status up', async () => {
    const health = await controller.health();
    assert.deepStrictEqual(health, { status: 'up' });
  });

  it('should call controller.login and return token response', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => {
      return {
        status: 200,
        ok: true,
        json: async () => ({
          statusCode: 200,
          data: { id: 'u1', email: 'user@yt.com', username: 'user1', fullName: 'User One', role: 'user' },
        }),
      } as any;
    };

    try {
      const res = await controller.login({ email: 'user@yt.com', password: 'Password123!' });
      assert.ok(res.accessToken);
      assert.strictEqual(res.user.email, 'user@yt.com');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('should verify token correctly', async () => {
    const token = jwtService.sign({ sub: 'u1', email: 'user@yt.com', username: 'user1', role: 'user' });
    const decoded = await controller.verify(token);
    assert.strictEqual(decoded.sub, 'u1');
  });
});
