import { createHmac } from 'crypto';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

export class JwtService {
  private readonly secret: string;
  private readonly defaultExpiresIn: number;

  constructor(secret: string, defaultExpiresIn: number = 86400) {
    this.secret = secret;
    this.defaultExpiresIn = defaultExpiresIn;
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  /**
   * Signs a payload using HMAC-SHA256 (HS256 symmetric algorithm)
   */
  public sign(payload: JwtPayload, expiresInSeconds?: number): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const ttl = expiresInSeconds || this.defaultExpiresIn;

    const fullPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + ttl,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));

    const tokenData = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac('sha256', this.secret)
      .update(tokenData)
      .digest('base64url');

    return `${tokenData}.${signature}`;
  }

  /**
   * Verifies an HS256 signed JWT token
   */
  public verify(token: string): JwtPayload {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT structure');
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Verify Header algorithm
    try {
      const header = JSON.parse(this.base64UrlDecode(encodedHeader));
      if (header.alg !== 'HS256') {
        throw new Error(`Unsupported algorithm: ${header.alg}. Expected HS256.`);
      }
    } catch {
      throw new Error('Invalid JWT header');
    }

    // Verify HMAC-SHA256 signature
    const tokenData = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = createHmac('sha256', this.secret)
      .update(tokenData)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }

    // Parse and verify expiration
    const payload: JwtPayload = JSON.parse(this.base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      throw new Error('Token has expired');
    }

    return payload;
  }
}
