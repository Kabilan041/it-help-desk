/**
 * Authentication Routes for native Node.js HTTP Server
 * Paramount Textile Mills (P) Ltd
 */

const db = require('../db');
const { verifyPassword, createSession, destroySession } = require('../auth');
const { extractToken } = require('../middleware/auth');

/**
 * Handle POST /api/auth/login
 */
async function handleLogin(req, res, body) {
  const { username, password } = body;

  if (!username || !password) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Username/Email and password are required.' }));
  }

  try {
    const userRes = await db.query(
      `SELECT u.id, u.employee_id, u.name, u.email, u.username, u.password_hash, u.salt, u.role,
              u.department_id, u.extension, u.phone, u.is_active,
              d.name AS department_name, d.code AS department_code,
              st.id AS support_team_id, st.designation AS support_designation
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN support_team st ON st.user_id = u.id
       WHERE (LOWER(u.username) = LOWER($1) OR LOWER(u.email) = LOWER($1))`,
      [username.trim()]
    );

    if (userRes.rows.length === 0) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid username/email or password.' }));
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Account has been deactivated. Please contact IT Administration (Ext 919).' }));
    }

    const isValid = await verifyPassword(password, user.salt, user.password_hash);
    if (!isValid) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid username/email or password.' }));
    }

    // IP and User-Agent
    const ipAddress = req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    // Create session
    const { sessionId, expiresAt } = await createSession(user.id, ipAddress, userAgent);

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, target_type, target_id, ip_address)
       VALUES ($1, 'LOGIN_SUCCESS', 'user', $1, $2)`,
      [user.id, ipAddress]
    );

    // Set HttpOnly cookie
    const isProd = process.env.NODE_ENV === 'production';
    const cookieHeader = `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 3600}${isProd ? '; Secure' : ''}`;

    delete user.password_hash;
    delete user.salt;

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieHeader
    });

    res.end(JSON.stringify({
      success: true,
      message: 'Login successful.',
      token: sessionId,
      user
    }));
  } catch (err) {
    console.error('[Login Error]', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Authentication service temporarily unavailable.' }));
  }
}

/**
 * Handle POST /api/auth/logout
 */
async function handleLogout(req, res) {
  const token = extractToken(req);
  if (token) {
    await destroySession(token);
  }

  const cookieHeader = 'session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Set-Cookie': cookieHeader
  });
  res.end(JSON.stringify({ success: true, message: 'Logged out successfully.' }));
}

/**
 * Handle GET /api/auth/me
 */
async function handleGetCurrentUser(req, res) {
  if (!req.user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not authenticated.' }));
  }

  const userCopy = { ...req.user };
  delete userCopy.password_hash;
  delete userCopy.salt;

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ user: userCopy }));
}

module.exports = {
  handleLogin,
  handleLogout,
  handleGetCurrentUser
};
