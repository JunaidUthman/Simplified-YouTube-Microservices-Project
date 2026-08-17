import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { AppModule } from './app.module';
import { HttpException } from './auth/auth.service';

const PORT = parseInt(process.env.PORT || '3002', 10);

async function bootstrap() {
  const appModule = new AppModule();
  const controller = appModule.authModule.controller;

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname.replace(/\/$/, '') || '/';
    const method = req.method?.toUpperCase();

    // Helper to read JSON body
    const getBody = (): Promise<any> => {
      return new Promise((resolve) => {
        let bodyStr = '';
        req.on('data', (chunk) => (bodyStr += chunk));
        req.on('end', () => {
          if (!bodyStr) return resolve({});
          try {
            resolve(JSON.parse(bodyStr));
          } catch {
            resolve({});
          }
        });
      });
    };

    const sendJson = (statusCode: number, data: any) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    try {
      // Health Check: GET /health -> { "status": "up" }
      if (pathname === '/health' && method === 'GET') {
        const health = await controller.health();
        return sendJson(200, health);
      }

      // POST /login or POST /auth/login - Authenticate user & issue HS256 JWT
      if ((pathname === '/login' || pathname === '/auth/login') && method === 'POST') {
        const body = await getBody();
        const result = await controller.login(body);
        return sendJson(200, { statusCode: 200, data: result });
      }

      // POST /verify or POST /auth/verify - Verify JWT Token
      if ((pathname === '/verify' || pathname === '/auth/verify') && method === 'POST') {
        const body = await getBody();
        const authHeader = req.headers.authorization;
        const token = body.token || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);
        
        if (!token) {
          return sendJson(400, { statusCode: 400, error: 'Bad Request', message: 'Token is required' });
        }

        const decoded = await controller.verify(token);
        return sendJson(200, { statusCode: 200, valid: true, data: decoded });
      }

      // Fallback 404
      return sendJson(404, { statusCode: 404, error: 'Not Found', message: `Cannot ${method} ${pathname}` });
    } catch (err: any) {
      if (err instanceof HttpException) {
        return sendJson(err.statusCode, {
          statusCode: err.statusCode,
          error: err.name,
          message: err.message,
        });
      }
      console.error('Unhandled server error:', err);
      return sendJson(500, {
        statusCode: 500,
        error: 'Internal Server Error',
        message: err?.message || 'An unexpected error occurred',
      });
    }
  });

  server.listen(PORT, () => {
    console.log(`🚀 [Auth Microservice] running on http://localhost:${PORT}`);
    console.log(`📌 Endpoints available:`);
    console.log(`   - POST /login (or /auth/login)`);
    console.log(`   - POST /verify (or /auth/verify)`);
    console.log(`   - GET  /health`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start Auth Service:', err);
});
