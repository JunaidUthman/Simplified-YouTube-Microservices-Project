import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { createReadStream, existsSync, statSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';


import { AppModule } from './app.module';
import { getDatabaseConfig } from './config/database.config';
import { HttpException, UnauthorizedException } from './videos/videos.service';

const PORT = parseInt(process.env.PORT || '3003', 10);

async function bootstrap() {
  const dbConfig = getDatabaseConfig();
  let pgClient: any = null;

  try {
    const pool = new Pool(dbConfig);
    // Test connection
    const client = await pool.connect();
    client.release();
    pgClient = pool;
    console.log(`✅ [Video Service] Connected to PostgreSQL at ${dbConfig.host}:${dbConfig.port}`);
  } catch (err: any) {
    console.warn(`⚠️ [Video Service] Could not connect to PostgreSQL (${err.message}). Using in-memory fallback.`);
  }

  const appModule = new AppModule(pgClient);
  await appModule.init();

  const controller = appModule.controller;
  const jwtService = appModule.jwtService;
  const storageService = appModule.storageService;

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname.replace(/\/$/, '') || '/';
    const method = req.method?.toUpperCase();

    // Parse query params
    const query: Record<string, string> = {};
    parsedUrl.searchParams.forEach((val, key) => {
      query[key] = val;
    });

    const sendJson = (statusCode: number, data: any) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    // Helper to read request body (JSON or buffer)
    const getBody = (): Promise<{ json?: any; buffer?: Buffer }> => {
      return new Promise((resolve) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        req.on('end', () => {
          const buffer = Buffer.concat(chunks);
          if (buffer.length === 0) return resolve({});

          try {
            const json = JSON.parse(buffer.toString('utf8'));
            resolve({ json, buffer });
          } catch {
            resolve({ buffer });
          }
        });
      });
    };

    // Helper to extract and verify JWT user
    const authenticate = (): { userId: string; email: string; username: string; role: string } => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing or invalid Authorization header');
      }

      const token = authHeader.substring(7).trim();
      try {
        const payload = jwtService.verify(token);
        return {
          userId: payload.sub,
          email: payload.email,
          username: payload.username,
          role: payload.role,
        };
      } catch (err: any) {
        throw new UnauthorizedException(`Invalid or expired token: ${err.message}`);
      }
    };

    try {
      // Health Check
      if (pathname === '/health' && method === 'GET') {
        return sendJson(200, { status: 'ok', service: 'video-service', timestamp: new Date() });
      }

      // Serve uploaded static video files with range streaming
      const uploadsMatch = pathname.match(/^\/uploads\/(.+)$/);
      if (uploadsMatch && method === 'GET') {
        const filename = uploadsMatch[1];
        const filePath = storageService.getFilePath(filename);

        if (!filePath) {
          return sendJson(404, { statusCode: 404, error: 'Not Found', message: 'File not found' });
        }

        const stat = statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunksize = end - start + 1;
          const file = createReadStream(filePath, { start, end });

          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
          });
          file.pipe(res);
          return;
        } else {
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
          });
          createReadStream(filePath).pipe(res);
          return;
        }
      }

      // ================= API ROUTES =================

      // POST /videos - Create Video (Protected)
      if (pathname === '/videos' && method === 'POST') {
        const user = authenticate();
        const { json, buffer } = await getBody();

        let dto: any = json || {};
        let fileData: { buffer: Buffer; originalname?: string } | undefined = undefined;

        // Handle base64 encoded video file inside json if provided
        if (json?.videoBase64) {
          const base64Data = json.videoBase64.replace(/^data:video\/\w+;base64,/, '');
          fileData = {
            buffer: Buffer.from(base64Data, 'base64'),
            originalname: json.filename || 'video.mp4',
          };
        } else if (!json && buffer && buffer.length > 0) {
          fileData = { buffer, originalname: 'video.mp4' };
          dto = { title: query.title || 'Untitled Video', description: query.description || '' };
        }

        const result = await controller.createVideo(dto, user.userId, fileData);
        return sendJson(201, { statusCode: 201, data: result });
      }

      // GET /videos - List Videos (Public)
      if (pathname === '/videos' && method === 'GET') {
        const result = await controller.findAll(query);
        return sendJson(200, { statusCode: 200, ...result });
      }

      // Routes matching /videos/:id/comments
      const commentsMatch = pathname.match(/^\/videos\/([a-zA-Z0-9-]+)\/comments$/);
      if (commentsMatch) {
        const videoId = commentsMatch[1];
        if (method === 'GET') {
          // GET /videos/:id/comments (Public)
          const result = await controller.getComments(videoId, query);
          return sendJson(200, { statusCode: 200, ...result });
        }
        if (method === 'POST') {
          // POST /videos/:id/comments (Protected)
          const user = authenticate();
          const { json } = await getBody();
          const result = await controller.addComment(videoId, json || {}, user.userId);
          return sendJson(201, { statusCode: 201, data: result });
        }
      }

      // DELETE /comments/:id (Protected)
      const deleteCommentMatch = pathname.match(/^\/comments\/([a-zA-Z0-9-]+)$/);
      if (deleteCommentMatch && method === 'DELETE') {
        const commentId = deleteCommentMatch[1];
        const user = authenticate();
        const result = await controller.removeComment(commentId, user.userId);
        return sendJson(200, { statusCode: 200, ...result });
      }

      // Routes matching /videos/:id/likes
      const likesMatch = pathname.match(/^\/videos\/([a-zA-Z0-9-]+)\/likes$/);
      if (likesMatch) {
        const videoId = likesMatch[1];
        if (method === 'GET') {
          // GET /videos/:id/likes (Public, optional auth to get userLikeStatus)
          let userId: string | undefined = undefined;
          if (req.headers.authorization) {
            try {
              const u = authenticate();
              userId = u.userId;
            } catch {}
          }
          const result = await controller.getLikesSummary(videoId, userId);
          return sendJson(200, { statusCode: 200, data: result });
        }
        if (method === 'POST') {
          // POST /videos/:id/likes (Protected)
          const user = authenticate();
          const { json } = await getBody();
          const result = await controller.setLike(videoId, json || {}, user.userId);
          return sendJson(200, { statusCode: 200, data: result });
        }
        if (method === 'DELETE') {
          // DELETE /videos/:id/likes (Protected)
          const user = authenticate();
          const result = await controller.removeLike(videoId, user.userId);
          return sendJson(200, { statusCode: 200, data: result });
        }
      }

      // GET /videos/:id - Find by ID (Public)
      // PATCH / PUT /videos/:id - Update (Protected - Owner)
      // DELETE /videos/:id - Delete (Protected - Owner)
      const idMatch = pathname.match(/^\/videos\/([a-zA-Z0-9-]+)$/);
      if (idMatch) {
        const id = idMatch[1];
        if (method === 'GET') {
          const result = await controller.findOne(id);
          return sendJson(200, { statusCode: 200, data: result });
        }
        if (method === 'PATCH' || method === 'PUT') {
          const user = authenticate();
          const { json } = await getBody();
          const result = await controller.update(id, json || {}, user.userId);
          return sendJson(200, { statusCode: 200, data: result });
        }
        if (method === 'DELETE') {
          const user = authenticate();
          const result = await controller.remove(id, user.userId);
          return sendJson(200, { statusCode: 200, ...result });
        }
      }

      // Fallback 404
      return sendJson(404, { statusCode: 404, error: 'Not Found', message: `Cannot ${method} ${pathname}` });
    } catch (err: any) {
      const statusCode = err?.statusCode || (err instanceof HttpException ? err.statusCode : 500);
      const message = err?.message || 'An unexpected error occurred';
      const errorName = err?.name || 'Error';

      if (statusCode >= 500) {
        console.error('Unhandled server error in Video Service:', err);
      }

      return sendJson(statusCode, {
        statusCode,
        error: errorName,
        message,
      });
    }

  });

  server.listen(PORT, () => {
    console.log(`🚀 [Video Microservice] running on http://localhost:${PORT}`);
    console.log(`📌 Endpoints available:`);
    console.log(`   - GET    /health`);
    console.log(`   - GET    /videos`);
    console.log(`   - POST   /videos (Protected)`);
    console.log(`   - GET    /videos/:id`);
    console.log(`   - PATCH  /videos/:id (Protected)`);
    console.log(`   - DELETE /videos/:id (Protected)`);
    console.log(`   - GET    /videos/:id/comments`);
    console.log(`   - POST   /videos/:id/comments (Protected)`);
    console.log(`   - DELETE /comments/:id (Protected)`);
    console.log(`   - GET    /videos/:id/likes`);
    console.log(`   - POST   /videos/:id/likes (Protected)`);
    console.log(`   - DELETE /videos/:id/likes (Protected)`);
    console.log(`   - GET    /uploads/:filename`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start Video Service:', err);
});
