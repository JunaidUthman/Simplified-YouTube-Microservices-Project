import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { JwtService } from './jwt.service';

describe('JwtService (HS256 Symmetric Algorithm)', () => {
  const secret = 'my_super_secret_test_key_123';
  const jwtService = new JwtService(secret, 3600);

  it('should sign a payload and produce a valid 3-part HS256 JWT token', () => {
    const payload = { sub: 'user-123', email: 'test@yt.com', username: 'testuser', role: 'user' };
    const token = jwtService.sign(payload);

    assert.strictEqual(typeof token, 'string');
    const parts = token.split('.');
    assert.strictEqual(parts.length, 3);
  });

  it('should verify a valid HS256 JWT token and return the payload', () => {
    const payload = { sub: 'user-123', email: 'test@yt.com', username: 'testuser', role: 'user' };
    const token = jwtService.sign(payload);

    const decoded = jwtService.verify(token);

    assert.strictEqual(decoded.sub, 'user-123');
    assert.strictEqual(decoded.email, 'test@yt.com');
    assert.strictEqual(decoded.username, 'testuser');
    assert.strictEqual(decoded.role, 'user');
    assert.ok(decoded.exp! > decoded.iat!);
  });

  it('should fail verification if the token signature is tampered with', () => {
    const payload = { sub: 'user-123', email: 'test@yt.com', username: 'testuser', role: 'user' };
    const token = jwtService.sign(payload);
    const parts = token.split('.');
    const tamperedToken = `${parts[0]}.${parts[1]}.invalid_signature`;

    assert.throws(() => {
      jwtService.verify(tamperedToken);
    }, /Invalid token signature/);
  });

  it('should fail verification if token is signed with a different secret', () => {
    const foreignJwtService = new JwtService('wrong_secret_key');
    const token = foreignJwtService.sign({ sub: 'user-123', email: 'test@yt.com', username: 'testuser', role: 'user' });

    assert.throws(() => {
      jwtService.verify(token);
    }, /Invalid token signature/);
  });

  it('should fail verification if token is expired', () => {
    const shortTtlService = new JwtService(secret, -10); // Expired 10 seconds ago
    const expiredToken = shortTtlService.sign({ sub: 'user-123', email: 'test@yt.com', username: 'testuser', role: 'user' });

    assert.throws(() => {
      jwtService.verify(expiredToken);
    }, /Token has expired/);
  });
});
