import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { AppModule } from './app.module';
import { HttpException } from './users/users.service';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function bootstrap() {
  const appModule = new AppModule();
  await appModule.init();

  const controller = appModule.usersModule.controller;

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

    // Parse query params into plain object
    const query: Record<string, string> = {};
    parsedUrl.searchParams.forEach((val, key) => {
      query[key] = val;
    });

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
      // Health Check
      if (pathname === '/health' && method === 'GET') {
        return sendJson(200, { status: 'ok', service: 'user-service', timestamp: new Date() });
      }

      // API Routes
      // POST /users - Create User
      if (pathname === '/users' && method === 'POST') {
        const body = await getBody();
        const result = await controller.create(body);
        return sendJson(201, { statusCode: 201, data: result });
      }

      // GET /users - List Users
      if (pathname === '/users' && method === 'GET') {
        const result = await controller.findAll(query);
        return sendJson(200, { statusCode: 200, ...result });
      }

      // GET /users/email/:email - Find by Email
      const emailMatch = pathname.match(/^\/users\/email\/(.+)$/);
      if (emailMatch && method === 'GET') {
        const email = decodeURIComponent(emailMatch[1]);
        const result = await controller.findByEmail(email);
        return sendJson(200, { statusCode: 200, data: result });
      }

      // GET /users/:id - Find by ID
      // PATCH /users/:id - Update
      // DELETE /users/:id - Delete
      const idMatch = pathname.match(/^\/users\/([a-zA-Z0-9-]+)$/);
      if (idMatch) {
        const id = idMatch[1];
        if (method === 'GET') {
          const result = await controller.findOne(id);
          return sendJson(200, { statusCode: 200, data: result });
        }
        if (method === 'PATCH' || method === 'PUT') {
          const body = await getBody();
          const result = await controller.update(id, body);
          return sendJson(200, { statusCode: 200, data: result });
        }
        if (method === 'DELETE') {
          const result = await controller.remove(id);
          return sendJson(200, { statusCode: 200, ...result });
        }
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
    console.log(`🚀 [User Microservice] running on http://localhost:${PORT}`);
    console.log(`📌 Endpoints available:`);
    console.log(`   - POST   /users`);
    console.log(`   - GET    /users`);
    console.log(`   - GET    /users/:id`);
    console.log(`   - GET    /users/email/:email`);
    console.log(`   - PATCH  /users/:id`);
    console.log(`   - DELETE /users/:id`);
    console.log(`   - GET    /health`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start User Service:', err);
});
