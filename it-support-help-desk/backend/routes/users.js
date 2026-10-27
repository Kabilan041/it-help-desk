/**
 * Users and Support Team Management Route Handlers
 * Paramount Textile Mills (P) Ltd
 */

const db = require('../db');
const { hashPassword } = require('../auth');

/**
 * GET /api/users
 */
async function handleGetUsers(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Access denied: Administrator privileges required.' }));
  }

  try {
    const result = await db.query(
      `SELECT u.id, u.employee_id, u.name, u.email, u.username, u.role, u.department_id,
              u.extension, u.phone, u.is_active, u.created_at,
              d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       ORDER BY u.created_at DESC`
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.rows));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * POST /api/users
 */
async function handleCreateUser(req, res, body) {
  if (!req.user || req.user.role !== 'admin') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Administrator privileges required.' }));
  }

  const { employee_id, name, email, username, password, role, department_id, extension, phone } = body;

  if (!employee_id || !name || !email || !username || !password || !role) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Missing mandatory fields: employee_id, name, email, username, password, and role.' }));
  }

  try {
    const { hash, salt } = await hashPassword(password);

    const result = await db.query(
      `INSERT INTO users 
        (employee_id, name, email, username, password_hash, salt, role, department_id, extension, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, employee_id, name, email, username, role, department_id, extension, phone, is_active, created_at`,
      [employee_id, name, email, username, hash, salt, role, department_id || null, extension || null, phone || null]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, target_type, target_id, details)
       VALUES ($1, 'USER_CREATED', 'user', $2, $3)`,
      [req.user.id, result.rows[0].id.toString(), JSON.stringify({ username, role })]
    );

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, user: result.rows[0] }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * PUT /api/users/:id
 */
async function handleUpdateUser(req, res, userId, body) {
  if (!req.user || req.user.role !== 'admin') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Administrator privileges required.' }));
  }

  const { name, email, role, department_id, extension, phone, is_active } = body;

  try {
    const result = await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           role = COALESCE($3, role),
           department_id = COALESCE($4, department_id),
           extension = COALESCE($5, extension),
           phone = COALESCE($6, phone),
           is_active = COALESCE($7, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, employee_id, name, email, username, role, department_id, extension, phone, is_active`,
      [name, email, role, department_id, extension, phone, is_active, parseInt(userId, 10)]
    );

    if (result.rows.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'User not found.' }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, user: result.rows[0] }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * GET /api/support-team
 */
async function handleGetSupportTeam(req, res) {
  try {
    const result = await db.query(
      `SELECT st.*, u.email, u.phone,
              COUNT(t.id) FILTER (WHERE t.status IN ('Open', 'In Progress')) AS active_tickets_count
       FROM support_team st
       JOIN users u ON st.user_id = u.id
       LEFT JOIN tickets t ON t.assigned_to = st.id
       GROUP BY st.id, u.email, u.phone
       ORDER BY st.full_name ASC`
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.rows));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * PUT /api/support-team/:id
 */
async function handleUpdateSupportMember(req, res, memberId, body) {
  if (!req.user || req.user.role !== 'admin') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Administrator privileges required.' }));
  }

  const { full_name, designation, extension, specialization, is_active } = body;

  try {
    const result = await db.query(
      `UPDATE support_team
       SET full_name = COALESCE($1, full_name),
           designation = COALESCE($2, designation),
           extension = COALESCE($3, extension),
           specialization = COALESCE($4, specialization),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [full_name, designation, extension, specialization, is_active, parseInt(memberId, 10)]
    );

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, member: result.rows[0] }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * GET /api/routing-rules
 */
async function handleGetRoutingRules(req, res) {
  try {
    const result = await db.query(
      `SELECT rr.*, c.name AS category_name, c.division AS category_division,
              st.full_name AS support_name, st.extension AS support_extension
       FROM routing_rules rr
       JOIN ticket_categories c ON rr.category_id = c.id
       JOIN support_team st ON rr.support_team_id = st.id
       ORDER BY c.division ASC, c.name ASC`
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.rows));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * POST /api/routing-rules
 */
async function handleSaveRoutingRule(req, res, body) {
  if (!req.user || req.user.role !== 'admin') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Administrator privileges required.' }));
  }

  const { category_id, support_team_id, priority_level, is_enabled } = body;

  try {
    const result = await db.query(
      `INSERT INTO routing_rules (category_id, support_team_id, priority_level, is_enabled)
       VALUES ($1, $2, $3, COALESCE($4, TRUE))
       ON CONFLICT (category_id, support_team_id)
       DO UPDATE SET priority_level = EXCLUDED.priority_level, is_enabled = EXCLUDED.is_enabled
       RETURNING *`,
      [parseInt(category_id, 10), parseInt(support_team_id, 10), priority_level || null, is_enabled]
    );

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, rule: result.rows[0] }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

module.exports = {
  handleGetUsers,
  handleCreateUser,
  handleUpdateUser,
  handleGetSupportTeam,
  handleUpdateSupportMember,
  handleGetRoutingRules,
  handleSaveRoutingRule
};
