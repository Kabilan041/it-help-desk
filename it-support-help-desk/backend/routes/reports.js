/**
 * Reports & Dashboard Analytics Handlers
 * Paramount Textile Mills (P) Ltd
 */

const db = require('../db');

/**
 * GET /api/reports/dashboard
 */
async function handleGetDashboard(req, res) {
  if (!req.user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Unauthorized.' }));
  }

  try {
    let userFilterSql = '';
    const params = [];
    if (req.user.role === 'employee') {
      userFilterSql = ' WHERE created_by = $1';
      params.push(req.user.id);
    } else if (req.user.role === 'support') {
      // Support lead sees their assigned or unassigned
    }

    // 1. Overall ticket counts
    const countsSql = `
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Open') AS open,
        COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved,
        COUNT(*) FILTER (WHERE status = 'Closed') AS closed,
        COUNT(*) FILTER (WHERE (status IN ('Open', 'In Progress') AND due_date < CURRENT_TIMESTAMP) OR is_overdue = TRUE) AS overdue
      FROM tickets
      ${userFilterSql}
    `;
    const countsRes = await db.query(countsSql, params);

    // 2. Department wise counts
    const deptSql = `
      SELECT d.name, COUNT(t.id) AS count
      FROM departments d
      LEFT JOIN tickets t ON t.department_id = d.id ${req.user.role === 'employee' ? 'AND t.created_by = $1' : ''}
      GROUP BY d.id, d.name
      ORDER BY count DESC, d.name ASC
    `;
    const deptRes = await db.query(deptSql, req.user.role === 'employee' ? [req.user.id] : []);

    // 3. Category wise counts (grouped by division or category)
    const catSql = `
      SELECT c.division, c.name, COUNT(t.id) AS count
      FROM ticket_categories c
      LEFT JOIN tickets t ON t.category_id = c.id ${req.user.role === 'employee' ? 'AND t.created_by = $1' : ''}
      GROUP BY c.id, c.division, c.name
      ORDER BY count DESC
      LIMIT 10
    `;
    const catRes = await db.query(catSql, req.user.role === 'employee' ? [req.user.id] : []);

    // 4. Recent ticket activity
    const activitySql = `
      SELECT t.id, t.ticket_number, t.title, t.priority, t.status, t.created_at, t.updated_at,
             u.name AS creator_name, d.name AS department_name, st.full_name AS assigned_to_name
      FROM tickets t
      JOIN users u ON t.created_by = u.id
      JOIN departments d ON t.department_id = d.id
      LEFT JOIN support_team st ON t.assigned_to = st.id
      ${userFilterSql}
      ORDER BY t.updated_at DESC
      LIMIT 6
    `;
    const activityRes = await db.query(activitySql, params);

    // 5. High-Priority and Critical Tickets
    const highPrioritySql = `
      SELECT t.id, t.ticket_number, t.title, t.priority, t.status, t.created_at, t.due_date,
             u.name AS creator_name, d.name AS department_name, st.full_name AS assigned_to_name
      FROM tickets t
      JOIN users u ON t.created_by = u.id
      JOIN departments d ON t.department_id = d.id
      LEFT JOIN support_team st ON t.assigned_to = st.id
      WHERE t.priority IN ('High', 'Critical') AND t.status IN ('Open', 'In Progress')
      ${req.user.role === 'employee' ? 'AND t.created_by = $1' : ''}
      ORDER BY CASE WHEN t.priority = 'Critical' THEN 1 ELSE 2 END, t.created_at ASC
      LIMIT 5
    `;
    const highPriorityRes = await db.query(highPrioritySql, req.user.role === 'employee' ? [req.user.id] : []);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      counts: countsRes.rows[0],
      departments: deptRes.rows,
      categories: catRes.rows,
      recentActivity: activityRes.rows,
      highPriority: highPriorityRes.rows
    }));
  } catch (err) {
    console.error('[Dashboard Error]', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * GET /api/reports/export (CSV or JSON export with filters)
 */
async function handleExportReport(req, res, queryParams) {
  if (!req.user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Unauthorized.' }));
  }

  const { department_id, support_id, category_id, priority, status, date_from, date_to, format } = queryParams;

  let sql = `
    SELECT t.ticket_number, t.title, t.priority, t.status,
           u.name AS employee_name, u.employee_id, d.name AS department,
           c.name AS category, c.division,
           COALESCE(st.full_name, 'Unassigned') AS assigned_support,
           t.created_at, t.resolved_at, t.closed_at,
           t.resolution_notes
    FROM tickets t
    JOIN users u ON t.created_by = u.id
    JOIN departments d ON t.department_id = d.id
    JOIN ticket_categories c ON t.category_id = c.id
    LEFT JOIN support_team st ON t.assigned_to = st.id
    WHERE 1=1
  `;

  const values = [];
  let paramIdx = 1;

  if (req.user.role === 'employee') {
    sql += ` AND t.created_by = $${paramIdx++}`;
    values.push(req.user.id);
  }

  if (department_id && department_id !== 'All') {
    sql += ` AND t.department_id = $${paramIdx++}`;
    values.push(parseInt(department_id, 10));
  }

  if (support_id && support_id !== 'All') {
    sql += ` AND t.assigned_to = $${paramIdx++}`;
    values.push(parseInt(support_id, 10));
  }

  if (category_id && category_id !== 'All') {
    sql += ` AND t.category_id = $${paramIdx++}`;
    values.push(parseInt(category_id, 10));
  }

  if (priority && priority !== 'All') {
    sql += ` AND t.priority = $${paramIdx++}`;
    values.push(priority);
  }

  if (status && status !== 'All') {
    sql += ` AND t.status = $${paramIdx++}`;
    values.push(status);
  }

  if (date_from) {
    sql += ` AND t.created_at >= $${paramIdx++}`;
    values.push(date_from);
  }

  if (date_to) {
    sql += ` AND t.created_at <= $${paramIdx++}`;
    values.push(date_to + ' 23:59:59');
  }

  sql += ' ORDER BY t.created_at DESC';

  try {
    const result = await db.query(sql, values);

    if (format === 'csv') {
      const headers = ['Ticket Number', 'Title', 'Priority', 'Status', 'Employee', 'Emp ID', 'Department', 'Category', 'Division', 'Assigned To', 'Created Date', 'Resolved Date', 'Resolution Notes'];
      const rows = result.rows.map(r => [
        `"${r.ticket_number}"`,
        `"${(r.title || '').replace(/"/g, '""')}"`,
        `"${r.priority}"`,
        `"${r.status}"`,
        `"${(r.employee_name || '').replace(/"/g, '""')}"`,
        `"${r.employee_id}"`,
        `"${r.department}"`,
        `"${r.category}"`,
        `"${r.division}"`,
        `"${r.assigned_support}"`,
        `"${new Date(r.created_at).toLocaleString()}"`,
        `"${r.resolved_at ? new Date(r.resolved_at).toLocaleString() : ''}"`,
        `"${(r.resolution_notes || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="PTM_HelpDesk_Report_${Date.now()}.csv"`
      });
      return res.end(csvContent);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: result.rows.length, tickets: result.rows }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

module.exports = {
  handleGetDashboard,
  handleExportReport
};
