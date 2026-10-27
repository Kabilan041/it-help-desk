/**
 * Tickets Route Handlers
 * Paramount Textile Mills (P) Ltd
 */

const db = require('../db');
const sse = require('../services/sse');
const email = require('../services/email');

/**
 * Generate sequential ticket number like PTM-2026-1007
 */
async function generateTicketNumber() {
  const year = new Date().getFullYear();
  const prefix = `PTM-${year}-`;
  
  const res = await db.query(
    `SELECT ticket_number FROM tickets 
     WHERE ticket_number LIKE $1 
     ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSeq = 1001;
  if (res.rows.length > 0) {
    const lastNum = res.rows[0].ticket_number;
    const parts = lastNum.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }
  }

  return `${prefix}${nextSeq}`;
}

/**
 * GET /api/departments
 */
async function handleGetDepartments(req, res) {
  try {
    const result = await db.query('SELECT * FROM departments ORDER BY id ASC');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.rows));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * GET /api/categories
 */
async function handleGetCategories(req, res) {
  try {
    const result = await db.query(
      `SELECT c.*, st.full_name AS default_assigned_name, st.extension AS default_assigned_ext
       FROM ticket_categories c
       LEFT JOIN support_team st ON c.default_assigned_to = st.id
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
 * GET /api/tickets
 */
async function handleGetTickets(req, res, queryParams) {
  if (!req.user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Unauthorized.' }));
  }

  const { status, priority, category_id, department_id, search, date_from, date_to, my_tickets } = queryParams;

  let sql = `
    SELECT t.*, 
           u.name AS creator_name, u.employee_id AS creator_employee_id, u.email AS creator_email,
           d.name AS department_name, d.code AS department_code,
           c.name AS category_name, c.division AS category_division,
           st.full_name AS assigned_to_name, st.extension AS assigned_to_extension, st.designation AS assigned_to_designation
    FROM tickets t
    JOIN users u ON t.created_by = u.id
    JOIN departments d ON t.department_id = d.id
    JOIN ticket_categories c ON t.category_id = c.id
    LEFT JOIN support_team st ON t.assigned_to = st.id
    WHERE 1=1
  `;

  const values = [];
  let paramIndex = 1;

  // Role permissions
  if (req.user.role === 'employee' || my_tickets === 'true') {
    sql += ` AND t.created_by = $${paramIndex++}`;
    values.push(req.user.id);
  } else if (req.user.role === 'support') {
    // Support can view all or filter by assigned
    if (queryParams.assigned_only === 'true') {
      sql += ` AND t.assigned_to = $${paramIndex++}`;
      values.push(req.user.support_team_id);
    }
  }

  if (status && status !== 'All') {
    sql += ` AND t.status = $${paramIndex++}`;
    values.push(status);
  }

  if (priority && priority !== 'All') {
    sql += ` AND t.priority = $${paramIndex++}`;
    values.push(priority);
  }

  if (category_id && category_id !== 'All') {
    sql += ` AND t.category_id = $${paramIndex++}`;
    values.push(parseInt(category_id, 10));
  }

  if (department_id && department_id !== 'All') {
    sql += ` AND t.department_id = $${paramIndex++}`;
    values.push(parseInt(department_id, 10));
  }

  if (date_from) {
    sql += ` AND t.created_at >= $${paramIndex++}`;
    values.push(date_from);
  }

  if (date_to) {
    sql += ` AND t.created_at <= $${paramIndex++}`;
    values.push(date_to + ' 23:59:59');
  }

  if (search && search.trim() !== '') {
    sql += ` AND (t.ticket_number ILIKE $${paramIndex} OR t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`;
    values.push(`%${search.trim()}%`);
    paramIndex++;
  }

  sql += ' ORDER BY t.created_at DESC';

  try {
    const result = await db.query(sql, values);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.rows));
  } catch (err) {
    console.error('[Get Tickets Error]', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * POST /api/tickets
 */
async function handleCreateTicket(req, res, body) {
  if (!req.user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Unauthorized.' }));
  }

  const {
    title,
    description,
    department_id,
    category_id,
    priority,
    contact_number,
    due_date
  } = body;

  // Validation
  if (!title || !description || !department_id || !category_id || !priority) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Missing required fields: title, description, department, category, and priority are mandatory.' }));
  }

  try {
    const ticketNumber = await generateTicketNumber();

    // Check routing rules for auto-assignment if available
    let assignedTo = null;
    const ruleRes = await db.query(
      `SELECT support_team_id FROM routing_rules 
       WHERE category_id = $1 AND is_enabled = TRUE 
         AND (priority_level IS NULL OR priority_level = $2)
       LIMIT 1`,
      [parseInt(category_id, 10), priority]
    );

    if (ruleRes.rows.length > 0) {
      assignedTo = ruleRes.rows[0].support_team_id;
    } else {
      // Check category default assignee
      const catRes = await db.query('SELECT default_assigned_to FROM ticket_categories WHERE id = $1', [parseInt(category_id, 10)]);
      if (catRes.rows.length > 0 && catRes.rows[0].default_assigned_to) {
        assignedTo = catRes.rows[0].default_assigned_to;
      }
    }

    // Default SLA due dates if not provided
    let calculatedDueDate = due_date;
    if (!calculatedDueDate) {
      const now = new Date();
      if (priority === 'Critical') now.setHours(now.getHours() + 4);
      else if (priority === 'High') now.setHours(now.getHours() + 12);
      else if (priority === 'Medium') now.setDate(now.getDate() + 2);
      else now.setDate(now.getDate() + 4);
      calculatedDueDate = now.toISOString();
    }

    const insertRes = await db.query(
      `INSERT INTO tickets 
        (ticket_number, title, description, created_by, department_id, category_id, priority, status, contact_number, assigned_to, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Open', $8, $9, $10)
       RETURNING *`,
      [
        ticketNumber,
        title.trim(),
        description.trim(),
        req.user.id,
        parseInt(department_id, 10),
        parseInt(category_id, 10),
        priority,
        contact_number || req.user.extension || req.user.phone,
        assignedTo,
        calculatedDueDate
      ]
    );

    const ticket = insertRes.rows[0];

    // Log initial status history
    await db.query(
      `INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by, comments)
       VALUES ($1, NULL, 'Open', $2, 'Ticket created by employee.')`,
      [ticket.id, req.user.id]
    );

    if (assignedTo) {
      await db.query(
        `INSERT INTO ticket_assignments (ticket_id, assigned_to, assigned_by, notes)
         VALUES ($1, $2, $3, 'Automatically routed based on category policy.')`,
        [ticket.id, assignedTo, req.user.id]
      );
    }

    // Retrieve enriched ticket details
    const fullTicketRes = await db.query(
      `SELECT t.*, 
              u.name AS creator_name, d.name AS department_name, c.name AS category_name,
              st.full_name AS assigned_to_name, st.extension AS assigned_to_extension
       FROM tickets t
       JOIN users u ON t.created_by = u.id
       JOIN departments d ON t.department_id = d.id
       JOIN ticket_categories c ON t.category_id = c.id
       LEFT JOIN support_team st ON t.assigned_to = st.id
       WHERE t.id = $1`,
      [ticket.id]
    );
    const enrichedTicket = fullTicketRes.rows[0];

    // Real-time broadcast via SSE
    sse.broadcastTicketEvent('TICKET_CREATED', enrichedTicket);

    // Email dispatch (if configured)
    email.notifyTicketEvent('CREATED', enrichedTicket);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: `Ticket ${ticketNumber} raised successfully.`,
      ticket: enrichedTicket
    }));
  } catch (err) {
    console.error('[Create Ticket Error]', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * GET /api/tickets/:id
 */
async function handleGetTicketDetails(req, res, ticketId) {
  if (!req.user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Unauthorized.' }));
  }

  try {
    const ticketRes = await db.query(
      `SELECT t.*, 
              u.name AS creator_name, u.employee_id AS creator_employee_id, u.email AS creator_email, u.phone AS creator_phone,
              d.name AS department_name, d.code AS department_code,
              c.name AS category_name, c.division AS category_division,
              st.full_name AS assigned_to_name, st.extension AS assigned_to_extension, st.designation AS assigned_to_designation
       FROM tickets t
       JOIN users u ON t.created_by = u.id
       JOIN departments d ON t.department_id = d.id
       JOIN ticket_categories c ON t.category_id = c.id
       LEFT JOIN support_team st ON t.assigned_to = st.id
       WHERE t.id = $1 OR t.ticket_number = $1`,
      [ticketId]
    );

    if (ticketRes.rows.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Ticket not found.' }));
    }

    const ticket = ticketRes.rows[0];

    // Permission check:
    if (req.user.role === 'employee' && ticket.created_by !== req.user.id) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Forbidden: You are not authorized to view this ticket.' }));
    }

    // Status History
    const historyRes = await db.query(
      `SELECT h.*, u.name AS changed_by_name, u.role AS changed_by_role
       FROM ticket_status_history h
       JOIN users u ON h.changed_by = u.id
       WHERE h.ticket_id = $1
       ORDER BY h.created_at ASC`,
      [ticket.id]
    );

    // Comments: filter internal comments if user is employee
    let commentsSql = `
      SELECT tc.*, u.name AS author_name, u.role AS author_role
      FROM ticket_comments tc
      JOIN users u ON tc.author_id = u.id
      WHERE tc.ticket_id = $1
    `;
    if (req.user.role === 'employee') {
      commentsSql += ' AND tc.is_internal = FALSE';
    }
    commentsSql += ' ORDER BY tc.created_at ASC';
    const commentsRes = await db.query(commentsSql, [ticket.id]);

    // Attachments
    const attachmentsRes = await db.query(
      `SELECT a.id, a.original_name, a.file_size_bytes, a.mime_type, a.created_at, u.name AS uploader_name
       FROM ticket_attachments a
       JOIN users u ON a.uploader_id = u.id
       WHERE a.ticket_id = $1
       ORDER BY a.created_at ASC`,
      [ticket.id]
    );

    // Assignment history
    const assignmentsRes = await db.query(
      `SELECT ta.*, u.name AS assigned_by_name,
              st_from.full_name AS from_name, st_to.full_name AS to_name
       FROM ticket_assignments ta
       JOIN users u ON ta.assigned_by = u.id
       LEFT JOIN support_team st_from ON ta.assigned_from = st_from.id
       LEFT JOIN support_team st_to ON ta.assigned_to = st_to.id
       WHERE ta.ticket_id = $1
       ORDER BY ta.created_at ASC`,
      [ticket.id]
    );

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ticket,
      history: historyRes.rows,
      comments: commentsRes.rows,
      attachments: attachmentsRes.rows,
      assignments: assignmentsRes.rows
    }));
  } catch (err) {
    console.error('[Get Ticket Details Error]', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * PUT /api/tickets/:id/status
 */
async function handleUpdateStatus(req, res, ticketId, body) {
  if (!req.user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Unauthorized.' }));
  }

  const { status, resolution_notes, comments } = body;
  const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

  if (!status || !validStatuses.includes(status)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }));
  }

  try {
    const existingRes = await db.query('SELECT * FROM tickets WHERE id = $1', [parseInt(ticketId, 10)]);
    if (existingRes.rows.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Ticket not found.' }));
    }

    const currentTicket = existingRes.rows[0];

    // Permissions check:
    // Only support and admin can change to In Progress, Resolved
    // Employees can close their own resolved ticket, or request reopen if allowed
    if (req.user.role === 'employee') {
      if (status === 'Closed' && currentTicket.created_by === req.user.id) {
        // permitted
      } else if (status === 'Open' && (currentTicket.status === 'Resolved' || currentTicket.status === 'Closed')) {
        // reopening
      } else {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Employees can only confirm closure or request reopening.' }));
      }
    }

    let resolvedAt = currentTicket.resolved_at;
    let closedAt = currentTicket.closed_at;

    if (status === 'Resolved' && !resolvedAt) {
      resolvedAt = new Date().toISOString();
    }
    if (status === 'Closed' && !closedAt) {
      closedAt = new Date().toISOString();
    }
    if (status === 'Open' || status === 'In Progress') {
      // If reopening
      resolvedAt = null;
      closedAt = null;
    }

    const updateRes = await db.query(
      `UPDATE tickets 
       SET status = $1, 
           resolution_notes = COALESCE($2, resolution_notes),
           resolved_at = $3,
           closed_at = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [status, resolution_notes || null, resolvedAt, closedAt, parseInt(ticketId, 10)]
    );

    const updatedTicket = updateRes.rows[0];

    // Record status history
    await db.query(
      `INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by, comments)
       VALUES ($1, $2, $3, $4, $5)`,
      [updatedTicket.id, currentTicket.status, status, req.user.id, comments || resolution_notes || `Status changed from ${currentTicket.status} to ${status}`]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, target_type, target_id, details)
       VALUES ($1, 'TICKET_STATUS_UPDATED', 'ticket', $2, $3)`,
      [req.user.id, updatedTicket.id.toString(), JSON.stringify({ old: currentTicket.status, new: status })]
    );

    sse.broadcastTicketEvent('TICKET_STATUS_CHANGED', updatedTicket);
    email.notifyTicketEvent('STATUS_CHANGED', updatedTicket);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: `Ticket status updated to ${status}.`, ticket: updatedTicket }));
  } catch (err) {
    console.error('[Update Status Error]', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * PUT /api/tickets/:id/assign
 */
async function handleAssignTicket(req, res, ticketId, body) {
  if (!req.user || req.user.role === 'employee') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Only Support staff and Administrators can assign tickets.' }));
  }

  const { support_team_id, notes } = body;

  try {
    const existingRes = await db.query('SELECT * FROM tickets WHERE id = $1', [parseInt(ticketId, 10)]);
    if (existingRes.rows.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Ticket not found.' }));
    }
    const currentTicket = existingRes.rows[0];

    const targetSupportId = support_team_id ? parseInt(support_team_id, 10) : null;

    const updateRes = await db.query(
      `UPDATE tickets 
       SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [targetSupportId, parseInt(ticketId, 10)]
    );
    const updatedTicket = updateRes.rows[0];

    // Record assignment history
    await db.query(
      `INSERT INTO ticket_assignments (ticket_id, assigned_from, assigned_to, assigned_by, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [updatedTicket.id, currentTicket.assigned_to, targetSupportId, req.user.id, notes || 'Reassigned via Support Console.']
    );

    sse.broadcastTicketEvent('TICKET_ASSIGNED', updatedTicket);
    email.notifyTicketEvent('ASSIGNED', updatedTicket, { notes });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Ticket assigned successfully.', ticket: updatedTicket }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * POST /api/tickets/:id/comments
 */
async function handleAddComment(req, res, ticketId, body) {
  if (!req.user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Unauthorized.' }));
  }

  const { message, is_internal } = body;
  if (!message || message.trim() === '') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Comment message cannot be empty.' }));
  }

  // Employees cannot post internal comments
  const internalFlag = req.user.role === 'employee' ? false : Boolean(is_internal);

  try {
    const insertRes = await db.query(
      `INSERT INTO ticket_comments (ticket_id, author_id, message, is_internal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [parseInt(ticketId, 10), req.user.id, message.trim(), internalFlag]
    );

    const comment = insertRes.rows[0];
    comment.author_name = req.user.name;
    comment.author_role = req.user.role;

    // Trigger update notification
    const ticketRes = await db.query('SELECT * FROM tickets WHERE id = $1', [parseInt(ticketId, 10)]);
    if (ticketRes.rows.length > 0) {
      email.notifyTicketEvent('COMMENT_ADDED', ticketRes.rows[0], {
        author: req.user.name,
        message: message.trim()
      });
    }

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, comment }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

module.exports = {
  handleGetDepartments,
  handleGetCategories,
  handleGetTickets,
  handleCreateTicket,
  handleGetTicketDetails,
  handleUpdateStatus,
  handleAssignTicket,
  handleAddComment
};
