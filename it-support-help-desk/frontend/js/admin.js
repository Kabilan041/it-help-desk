/**
 * Paramount Textile Mills (P) Ltd - IT SUPPORT HELP DESK
 * Admin and Support Panel Controller
 */

let allDepartments = [];
let allSupportTeam = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await auth.init({ requireAuth: true, allowedRoles: ['support', 'admin'] });
  if (!user) return;

  await loadMetadata();
  await loadTicketsTab();
  await loadSupportTeamTab();
  if (user.role === 'admin') {
    await loadUsersTab();
  }

  // Filter listeners for ticket tab
  document.getElementById('btn-admin-apply').addEventListener('click', loadTicketsTab);
  document.getElementById('btn-admin-reset').addEventListener('click', () => {
    document.getElementById('admin-filter-search').value = '';
    document.getElementById('admin-filter-dept').value = 'All';
    document.getElementById('admin-filter-status').value = 'All';
    document.getElementById('admin-filter-priority').value = 'All';
    loadTicketsTab();
  });

  // Support edit form submit
  const supportForm = document.getElementById('form-edit-support');
  if (supportForm) {
    supportForm.addEventListener('submit', handleUpdateSupportMember);
  }

  // User create form submit
  const userForm = document.getElementById('form-create-user');
  if (userForm) {
    userForm.addEventListener('submit', handleCreateUser);
  }

  // Real-time SSE updates
  api.initSSE((event) => {
    loadTicketsTab();
  });
});

function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active-tab'));

  const targetPane = document.getElementById(tabId);
  if (targetPane) targetPane.style.display = 'block';

  const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add('active-tab');

  if (tabId === 'tab-reports') {
    previewReport();
  }
}

async function loadMetadata() {
  try {
    allDepartments = await api.getDepartments() || [];
    allSupportTeam = await api.getSupportTeam() || [];

    // Populate department dropdowns
    const deptFilter = document.getElementById('admin-filter-dept');
    const userDept = document.getElementById('new-emp-dept');
    const reportDept = document.getElementById('report-dept');

    allDepartments.forEach(d => {
      const opt1 = new Option(d.name, d.id);
      const opt2 = new Option(d.name, d.id);
      const opt3 = new Option(d.name, d.id);
      if (deptFilter) deptFilter.appendChild(opt1);
      if (userDept) userDept.appendChild(opt2);
      if (reportDept) reportDept.appendChild(opt3);
    });

    // Populate support dropdown in report
    const reportSupport = document.getElementById('report-support');
    if (reportSupport) {
      allSupportTeam.forEach(s => {
        reportSupport.appendChild(new Option(`${s.full_name} (${s.extension})`, s.id));
      });
    }
  } catch (err) {
    console.error('Metadata error:', err);
  }
}

// ----------------------------------------------------
// TAB 1: TICKETS MANAGEMENT
// ----------------------------------------------------
async function loadTicketsTab() {
  const search = document.getElementById('admin-filter-search').value.trim();
  const department_id = document.getElementById('admin-filter-dept').value;
  const status = document.getElementById('admin-filter-status').value;
  const priority = document.getElementById('admin-filter-priority').value;

  try {
    const tickets = await api.getTickets({
      search,
      department_id,
      status,
      priority
    });

    renderAdminTicketsTable(tickets || []);
  } catch (err) {
    showAlert('Failed to load tickets: ' + err.message, 'danger');
  }
}

function renderAdminTicketsTable(tickets) {
  const tbody = document.getElementById('admin-tickets-tbody');
  const countBadge = document.getElementById('admin-tickets-count');
  if (countBadge) countBadge.textContent = tickets.length;

  if (tickets.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #94a3b8; padding: 24px;">No tickets match filter criteria.</td></tr>';
    return;
  }

  tbody.innerHTML = tickets.map(t => {
    const isOverdue = t.is_overdue || (new Date(t.due_date) < new Date() && t.status !== 'Resolved' && t.status !== 'Closed');
    return `
      <tr style="${isOverdue ? 'background-color: #fff5f5;' : ''}">
        <td>
          <a href="ticket-details.html?id=${t.id}" style="font-family: monospace; font-weight: 700; color: var(--primary-600);">
            ${escapeHtml(t.ticket_number)}
          </a>
        </td>
        <td style="font-weight: 500; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(t.title)}">
          <a href="ticket-details.html?id=${t.id}" style="color: inherit;">
            ${escapeHtml(t.title)}
          </a>
        </td>
        <td>${escapeHtml(t.creator_name)}</td>
        <td>${escapeHtml(t.department_name)}</td>
        <td>${escapeHtml(t.category_name)}</td>
        <td><span class="priority-badge priority-${t.priority.toLowerCase()}">${t.priority}</span></td>
        <td><span class="badge badge-${t.status.toLowerCase().replace(' ', '-')}">${t.status}</span></td>
        <td>
          <strong>${escapeHtml(t.assigned_to_name || 'Unassigned')}</strong>
          ${t.assigned_to_extension ? `<br><small style="color:#64748b;">(Ext: ${t.assigned_to_extension})</small>` : ''}
        </td>
        <td style="font-size: 11.5px; white-space: nowrap;">
          ${t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'}
          ${isOverdue ? '<br><span style="color: #dc2626; font-weight: 700;">OVERDUE</span>' : ''}
        </td>
        <td>
          <a href="ticket-details.html?id=${t.id}" class="btn btn-secondary btn-sm">Triage</a>
        </td>
      </tr>
    `;
  }).join('');
}

// ----------------------------------------------------
// TAB 2: SUPPORT TEAM & ROUTING
// ----------------------------------------------------
async function loadSupportTeamTab() {
  try {
    allSupportTeam = await api.getSupportTeam() || [];
    renderSupportTeamTable(allSupportTeam);

    const rules = await api.getRoutingRules() || [];
    renderRoutingRulesTable(rules);
  } catch (err) {
    console.error('Failed to load support team:', err);
  }
}

function renderSupportTeamTable(team) {
  const tbody = document.getElementById('support-team-tbody');
  if (!tbody) return;

  tbody.innerHTML = team.map(m => `
    <tr>
      <td style="font-weight: 600;">${escapeHtml(m.full_name)}</td>
      <td>${escapeHtml(m.designation)}</td>
      <td><span style="font-family: monospace; font-weight: 700; color: #1e40af;">Ext ${escapeHtml(m.extension)}</span></td>
      <td>${escapeHtml(m.specialization || 'General IT')}</td>
      <td><span class="badge" style="background: #eff6ff; color: #1d4ed8;">${m.active_tickets_count || 0} Tickets</span></td>
      <td>
        <span class="badge ${m.is_active ? 'badge-resolved' : 'badge-closed'}">
          ${m.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td class="admin-only">
        <button type="button" class="btn btn-secondary btn-sm" onclick='editSupportMember(${JSON.stringify(m)})'>Edit</button>
      </td>
    </tr>
  `).join('');
}

function renderRoutingRulesTable(rules) {
  const tbody = document.getElementById('routing-rules-tbody');
  if (!tbody) return;

  tbody.innerHTML = rules.map(r => `
    <tr>
      <td><span style="font-size: 11px; padding: 2px 6px; border-radius: 3px; background: #e0f2fe; color: #0284c7; font-weight: 600;">${escapeHtml(r.category_division)}</span></td>
      <td style="font-weight: 600;">${escapeHtml(r.category_name)}</td>
      <td><strong>${escapeHtml(r.support_name)}</strong></td>
      <td><span style="font-family: monospace; font-weight: 600;">Ext ${escapeHtml(r.support_extension)}</span></td>
      <td><span class="badge badge-resolved">Enabled</span></td>
    </tr>
  `).join('');
}

function editSupportMember(m) {
  document.getElementById('edit-support-id').value = m.id;
  document.getElementById('edit-support-name').value = m.full_name;
  document.getElementById('edit-support-designation').value = m.designation;
  document.getElementById('edit-support-ext').value = m.extension;
  document.getElementById('edit-support-spec').value = m.specialization || '';
  document.getElementById('edit-support-active').checked = m.is_active;

  document.getElementById('team-form-title').textContent = `Editing: ${m.full_name}`;
  document.getElementById('form-edit-support').scrollIntoView({ behavior: 'smooth' });
}

function resetSupportForm() {
  document.getElementById('form-edit-support').reset();
  document.getElementById('edit-support-id').value = '';
  document.getElementById('team-form-title').textContent = 'Edit Support Member';
}

async function handleUpdateSupportMember(e) {
  e.preventDefault();
  const id = document.getElementById('edit-support-id').value;
  if (!id) {
    alert('Please click "Edit" on a support member in the table first.');
    return;
  }

  const payload = {
    full_name: document.getElementById('edit-support-name').value.trim(),
    designation: document.getElementById('edit-support-designation').value.trim(),
    extension: document.getElementById('edit-support-ext').value.trim(),
    specialization: document.getElementById('edit-support-spec').value.trim(),
    is_active: document.getElementById('edit-support-active').checked
  };

  try {
    const res = await api.updateSupportMember(id, payload);
    if (res && res.success) {
      showAlert('✓ Support member updated successfully.', 'success');
      resetSupportForm();
      await loadSupportTeamTab();
    }
  } catch (err) {
    showAlert('Failed to update support member: ' + err.message, 'danger');
  }
}

// ----------------------------------------------------
// TAB 3: USER ACCOUNTS
// ----------------------------------------------------
async function loadUsersTab() {
  try {
    const users = await api.getUsers() || [];
    renderUsersTable(users);
  } catch (err) {
    console.error('Failed to load users:', err);
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  tbody.innerHTML = users.map(u => `
    <tr>
      <td style="font-family: monospace; font-weight: 600;">${escapeHtml(u.employee_id)}</td>
      <td style="font-weight: 600;">${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.username)}</td>
      <td><span class="user-role-badge">${escapeHtml(u.role)}</span></td>
      <td>${escapeHtml(u.department_name || 'N/A')}</td>
      <td>${escapeHtml(u.extension || u.phone || '-')}</td>
      <td>
        <span class="badge ${u.is_active ? 'badge-resolved' : 'badge-closed'}">
          ${u.is_active ? 'Active' : 'Disabled'}
        </span>
      </td>
    </tr>
  `).join('');
}

async function handleCreateUser(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('btn-submit-user');
  submitBtn.disabled = true;

  const payload = {
    employee_id: document.getElementById('new-emp-id').value.trim(),
    name: document.getElementById('new-emp-name').value.trim(),
    email: document.getElementById('new-emp-email').value.trim(),
    username: document.getElementById('new-emp-username').value.trim(),
    password: document.getElementById('new-emp-pass').value,
    role: document.getElementById('new-emp-role').value,
    department_id: document.getElementById('new-emp-dept').value || null,
    extension: document.getElementById('new-emp-ext').value.trim() || null
  };

  try {
    const res = await api.createUser(payload);
    if (res && res.success) {
      showAlert(`✓ User ${payload.username} created with scrypt password security.`, 'success');
      document.getElementById('form-create-user').reset();
      await loadUsersTab();
    }
  } catch (err) {
    showAlert('Failed to create user: ' + err.message, 'danger');
  } finally {
    submitBtn.disabled = false;
  }
}

// ----------------------------------------------------
// TAB 4: REPORTS & EXPORTS
// ----------------------------------------------------
function getReportParams() {
  return {
    date_from: document.getElementById('report-date-from').value,
    date_to: document.getElementById('report-date-to').value,
    department_id: document.getElementById('report-dept').value,
    support_id: document.getElementById('report-support').value,
    status: document.getElementById('report-status').value,
    priority: document.getElementById('report-priority').value
  };
}

async function previewReport() {
  const params = getReportParams();
  const tbody = document.getElementById('report-preview-tbody');
  const periodText = document.getElementById('report-period-text');

  if (params.date_from || params.date_to) {
    periodText.textContent = `Period: ${params.date_from || 'Beginning'} to ${params.date_to || 'Present'}`;
  } else {
    periodText.textContent = 'Period: All Historical Records';
  }

  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`/api/reports/export?${qs}`);
    const data = await res.json();

    const tickets = data.tickets || [];
    if (tickets.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px; color: #94a3b8;">No records found matching report parameters.</td></tr>';
      return;
    }

    tbody.innerHTML = tickets.map(t => `
      <tr>
        <td style="font-family: monospace; font-weight: 600;">${escapeHtml(t.ticket_number)}</td>
        <td style="font-weight: 500;">${escapeHtml(t.title)}</td>
        <td><span class="priority-badge priority-${t.priority.toLowerCase()}">${t.priority}</span></td>
        <td><span class="badge badge-${t.status.toLowerCase().replace(' ', '-')}">${t.status}</span></td>
        <td>${escapeHtml(t.employee_name)}</td>
        <td>${escapeHtml(t.department)}</td>
        <td>${escapeHtml(t.category)}</td>
        <td>${escapeHtml(t.assigned_support)}</td>
        <td style="font-size: 11.5px; white-space: nowrap;">${new Date(t.created_at).toLocaleDateString()}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Preview error:', err);
  }
}

function exportData(format) {
  const params = {
    ...getReportParams(),
    format: 'csv'
  };
  const qs = new URLSearchParams(params).toString();
  window.location.href = `/api/reports/export?${qs}`;
}

function showAlert(message, type) {
  const alertBox = document.getElementById('admin-alert');
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.style.display = 'block';
  alertBox.scrollIntoView({ behavior: 'smooth' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.switchTab = switchTab;
window.editSupportMember = editSupportMember;
window.resetSupportForm = resetSupportForm;
window.previewReport = previewReport;
window.exportData = exportData;
