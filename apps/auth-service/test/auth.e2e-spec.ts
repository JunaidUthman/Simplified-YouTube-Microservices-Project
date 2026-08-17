import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AppModule } from '../src/app.module';

describe('Auth Service End-to-End (E2E) API Tests', () => {
  let appModule: AppModule;

  beforeEach(() => {
    appModule = new AppModule();
  });

  it('Health Check should return status up', async () => {
    const res = await appModule.authModule.controller.health();
    assert.deepStrictEqual(res, { status: 'up' });
  });

  it('Login & Token Verification Flow', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => {
      return {
        status: 200,
        ok: true,
        json: async () => ({
          statusCode: 200,
          data: {
            id: 'e2e-user-id',
            email: 'e2e@yt.com',
            username: 'e2euser',
            fullName: 'E2E User',
            role: 'user',
          },
        }),
      } as any;
    };

    try {
      const loginRes = await appModule.authModule.controller.login({
        email: 'e2e@yt.com',
        password: 'Password123!',
      });

      assert.ok(loginRes.accessToken);
      assert.strictEqual(loginRes.tokenType, 'Bearer');

      const verifiedPayload = await appModule.authModule.controller.verify(loginRes.accessToken);
      assert.strictEqual(verifiedPayload.sub, 'e2e-user-id');
      assert.strictEqual(verifiedPayload.email, 'e2e@yt.com');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
