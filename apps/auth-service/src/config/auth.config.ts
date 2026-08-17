export interface AuthConfig {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: number; // in seconds
  userServiceUrl: string;
}

export const getAuthConfig = (): AuthConfig => ({
  port: parseInt(process.env.PORT || '3002', 10),
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_youtube_platform_2026',
  jwtExpiresIn: parseInt(process.env.JWT_EXPIRES_IN || '86400', 10), // default 24h
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://user-service:3001',
});
