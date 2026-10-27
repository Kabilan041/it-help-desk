/**
 * Authentication Middleware for native Node.js HTTP server
 * Paramount Textile Mills (P) Ltd
 */

const { validateSession } = require('../auth');

/**
 * Parse cookies from request headers
 * @param {object} req 
 * @returns {object}
 */
function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;

  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const key = parts.shift().trim();
      const value = decodeURIComponent(parts.join('='));
      list[key] = value;
    });
  }

  return list;
}

/**
 * Extract session token from cookies or Authorization Bearer header
 * @param {object} req 
 * @returns {string|null}
 */
function extractToken(req) {
  const cookies = parseCookies(req);
  if (cookies.session_id) {
    return cookies.session_id;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Authenticate request and attach req.user if valid.
 * @param {object} req 
 * @returns {Promise<object|null>} user object or null
 */
async function authenticate(req) {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return null;
  }

  try {
    const user = await validateSession(token);
    req.user = user;
    return user;
  } catch (err) {
    console.error('[Auth Middleware Error]', err.message);
    req.user = null;
    return null;
  }
}

/**
 * Helper to enforce authentication. Sends 401 JSON if unauthenticated.
 * @param {object} req 
 * @param {object} res 
 * @returns {boolean} true if authenticated, false if rejected
 */
function requireAuth(req, res) {
  if (!req.user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized: Please log in to access this resource.' }));
    return false;
  }
  return true;
}

/**
 * Helper to enforce specific roles (e.g. ['support', 'admin']).
 * @param {object} req 
 * @param {object} res 
 * @param {string[]} allowedRoles 
 * @returns {boolean} true if permitted, false if forbidden
 */
function requireRole(req, res, allowedRoles) {
  if (!requireAuth(req, res)) return false;

  if (!allowedRoles.includes(req.user.role)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden: Insufficient privileges for this operation.' }));
    return false;
  }
  return true;
}

module.exports = {
  parseCookies,
  extractToken,
  authenticate,
  requireAuth,
  requireRole
};
