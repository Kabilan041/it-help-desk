/**
 * Authentication & Password Security Module
 * Paramount Textile Mills (P) Ltd
 * Uses Node.js built-in crypto.scrypt for high-security password hashing.
 */

const crypto = require('node:crypto');
const db = require('./db');

const KEY_LENGTH = 64;
const SESSION_DURATION_HOURS = 12;

/**
 * Hash a plain-text password using crypto.scrypt with a random salt.
 * @param {string} password 
 * @returns {Promise<{hash: string, salt: string}>}
 */
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      resolve({
        hash: derivedKey.toString('hex'),
        salt: salt
      });
    });
  });
}

/**
 * Verify a plain-text password against a stored salt and hash.
 * @param {string} password 
 * @param {string} salt 
 * @param {string} storedHash 
 * @returns {Promise<boolean>}
 */
function verifyPassword(password, salt, storedHash) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      const computedHash = derivedKey.toString('hex');
      // Constant-time comparison to prevent timing attacks
      const match = crypto.timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(storedHash, 'hex')
      );
      resolve(match);
    });
  });
}

/**
 * Create a new user session in PostgreSQL.
 * @param {number} userId 
 * @param {string} ipAddress 
 * @param {string} userAgent 
 * @returns {Promise<{sessionId: string, expiresAt: Date}>}
 */
async function createSession(userId, ipAddress, userAgent) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  await db.query(
    `INSERT INTO sessions (session_id, user_id, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [sessionId, userId, ipAddress || '127.0.0.1', userAgent || '', expiresAt]
  );

  return { sessionId, expiresAt };
}

/**
 * Validate a session ID and return the associated user.
 * @param {string} sessionId 
 * @returns {Promise<object|null>}
 */
async function validateSession(sessionId) {
  if (!sessionId) return null;

  const res = await db.query(
    `SELECT s.session_id, s.expires_at, 
            u.id, u.employee_id, u.name, u.email, u.username, u.role, u.department_id, u.extension, u.phone, u.is_active,
            d.name AS department_name, d.code AS department_code,
            st.id AS support_team_id, st.designation AS support_designation
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN departments d ON u.department_id = d.id
     LEFT JOIN support_team st ON st.user_id = u.id
     WHERE s.session_id = $1 AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = TRUE`,
    [sessionId]
  );

  if (res.rows.length === 0) {
    return null;
  }

  return res.rows[0];
}

/**
 * Destroy a session upon logout.
 * @param {string} sessionId 
 */
async function destroySession(sessionId) {
  if (!sessionId) return;
  await db.query('DELETE FROM sessions WHERE session_id = $1', [sessionId]);
}

/**
 * Clean up expired sessions periodically.
 */
async function cleanExpiredSessions() {
  try {
    await db.query('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP');
  } catch (err) {
    console.error('[Session Cleanup Error]', err.message);
  }
}

// Run cleanup every hour
setInterval(cleanExpiredSessions, 60 * 60 * 1000).unref();

module.exports = {
  hashPassword,
  verifyPassword,
  createSession,
  validateSession,
  destroySession
};
