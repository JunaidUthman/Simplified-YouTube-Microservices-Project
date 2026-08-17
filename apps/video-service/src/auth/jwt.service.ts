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

  constructor(secret?: string) {
    this.secret = secret || process.env.JWT_SECRET || 'super_secret_jwt_key_youtube_platform_2026';
  }

  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf8');
  }

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
    } catch (e: any) {
      if (e.message?.includes('Unsupported algorithm')) throw e;
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
