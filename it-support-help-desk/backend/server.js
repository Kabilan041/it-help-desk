/**
 * PARAMOUNT TEXTILE MILLS (P) LTD - IT SUPPORT HELP DESK
 * Core Backend Server (Node.js 24 LTS Native HTTP - Zero external framework)
 * 
 * Supports:
 * - LAN / Intranet binding (0.0.0.0)
 * - PostgreSQL connection pool
 * - RESTful API routing
 * - Server-Sent Events (SSE) for real-time ticket sync
 * - Secure Cookie Session validation & scrypt crypto
 * - Static file serving for Frontend and Uploads
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

// Load environment variables manually from .env if present
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const db = require('./db');
const { authenticate } = require('./middleware/auth');
const sse = require('./services/sse');
const { handleLogin, handleLogout, handleGetCurrentUser } = require('./routes/auth');
const {
  handleGetDepartments,
  handleGetCategories,
  handleGetTickets,
  handleCreateTicket,
  handleGetTicketDetails,
  handleUpdateStatus,
  handleAssignTicket,
  handleAddComment
} = require('./routes/tickets');
const {
  handleGetUsers,
  handleCreateUser,
  handleUpdateUser,
  handleGetSupportTeam,
  handleUpdateSupportMember,
  handleGetRoutingRules,
  handleSaveRoutingRule
} = require('./routes/users');
const { handleGetDashboard, handleExportReport } = require('./routes/reports');

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0'; // 0.0.0.0 allows internal LAN access
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

/**
 * Parse incoming JSON body
 */
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Serve static file
 */
function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('404 Not Found');
      }
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('500 Internal Server Error');
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN'
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Authenticate every request
  await authenticate(req);

  // 1. SSE Real-time stream endpoint
  if (pathname === '/api/events' && req.method === 'GET') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Authentication required for SSE stream.' }));
    }
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return sse.addClient(clientId, res, req.user);
  }

  // 2. REST API ROUTES
  if (pathname.startsWith('/api/')) {
    try {
      // Auth routes
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        return handleLogin(req, res, body);
      }
      if (pathname === '/api/auth/logout' && req.method === 'POST') {
        return handleLogout(req, res);
      }
      if (pathname === '/api/auth/me' && req.method === 'GET') {
        return handleGetCurrentUser(req, res);
      }

      // Metadata routes
      if (pathname === '/api/departments' && req.method === 'GET') {
        return handleGetDepartments(req, res);
      }
      if (pathname === '/api/categories' && req.method === 'GET') {
        return handleGetCategories(req, res);
      }

      // Tickets routes
      if (pathname === '/api/tickets' && req.method === 'GET') {
        return handleGetTickets(req, res, query);
      }
      if (pathname === '/api/tickets' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        return handleCreateTicket(req, res, body);
      }

      // Dynamic ticket paths: /api/tickets/:id/...
      const ticketMatch = pathname.match(/^\/api\/tickets\/([A-Za-z0-9_-]+)(?:\/([a-z]+))?$/);
      if (ticketMatch) {
        const ticketId = ticketMatch[1];
        const subAction = ticketMatch[2];

        if (!subAction && req.method === 'GET') {
          return handleGetTicketDetails(req, res, ticketId);
        }
        if (subAction === 'status' && req.method === 'PUT') {
          const body = await parseJsonBody(req);
          return handleUpdateStatus(req, res, ticketId, body);
        }
        if (subAction === 'assign' && req.method === 'PUT') {
          const body = await parseJsonBody(req);
          return handleAssignTicket(req, res, ticketId, body);
        }
        if (subAction === 'comments' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          return handleAddComment(req, res, ticketId, body);
        }
      }

      // Users and Support Management
      if (pathname === '/api/users' && req.method === 'GET') {
        return handleGetUsers(req, res);
      }
      if (pathname === '/api/users' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        return handleCreateUser(req, res, body);
      }
      const userMatch = pathname.match(/^\/api\/users\/(\d+)$/);
      if (userMatch && req.method === 'PUT') {
        const body = await parseJsonBody(req);
        return handleUpdateUser(req, res, userMatch[1], body);
      }

      // Support team & routing
      if (pathname === '/api/support-team' && req.method === 'GET') {
        return handleGetSupportTeam(req, res);
      }
      const supportMatch = pathname.match(/^\/api\/support-team\/(\d+)$/);
      if (supportMatch && req.method === 'PUT') {
        const body = await parseJsonBody(req);
        return handleUpdateSupportMember(req, res, supportMatch[1], body);
      }
      if (pathname === '/api/routing-rules' && req.method === 'GET') {
        return handleGetRoutingRules(req, res);
      }
      if (pathname === '/api/routing-rules' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        return handleSaveRoutingRule(req, res, body);
      }

      // Reports and dashboard
      if (pathname === '/api/reports/dashboard' && req.method === 'GET') {
        return handleGetDashboard(req, res);
      }
      if (pathname === '/api/reports/export' && req.method === 'GET') {
        return handleExportReport(req, res, query);
      }

      // Unknown API route
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: `API endpoint not found: ${pathname}` }));
    } catch (err) {
      console.error('[API Route Handler Error]', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Internal server error: ' + err.message }));
    }
  }

  // 3. STATIC FRONTEND SERVING
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/dashboard.html';
  }

  const staticFilePath = path.join(FRONTEND_DIR, safePath);

  // Security check: ensure path is within FRONTEND_DIR
  if (!staticFilePath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(staticFilePath, (err, stats) => {
    if (!err && stats.isFile()) {
      return serveStaticFile(res, staticFilePath);
    }

    // Check with .html extension
    const htmlFilePath = staticFilePath + '.html';
    if (fs.existsSync(htmlFilePath)) {
      return serveStaticFile(res, htmlFilePath);
    }

    // Default to login.html or 404
    serveStaticFile(res, path.join(FRONTEND_DIR, 'login.html'));
  });
});

// Test PostgreSQL connection and start server
db.testConnection().then(connected => {
  if (!connected) {
    console.warn('[Warning] PostgreSQL connection test failed. Ensure PostgreSQL service is started and .env credentials match.');
  }
  
  server.listen(PORT, HOST, () => {
    console.log('================================================================');
    console.log(' PARAMOUNT TEXTILE MILLS (P) LTD - IT SUPPORT HELP DESK SERVER');
    console.log('================================================================');
    console.log(` Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(` Internal LAN access: http://<YOUR_WINDOWS_IP>:${PORT}`);
    console.log(' Database: PostgreSQL via node-postgres (pg)');
    console.log(' Authentication: crypto.scrypt + HttpOnly Sessions');
    console.log(' Real-time: Server-Sent Events (SSE) enabled at /api/events');
    console.log('================================================================');
  });
});

module.exports = server;
