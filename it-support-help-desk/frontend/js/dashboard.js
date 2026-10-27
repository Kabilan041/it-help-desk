let rawDashboardData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await auth.init({ requireAuth: true });
  if (!user) return;

  loadDashboardData();

  // Export CSV button handler
  const downloadBtn = document.getElementById('btn-download-csv');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      window.location.href = api.getExportUrl({ format: 'csv' });
    });
  }

  // Real-time search and filter listeners
  const searchInput = document.getElementById('dashboard-search');
  const statusSelect = document.getElementById('dashboard-status');
  const prioritySelect = document.getElementById('dashboard-priority');
  const resetBtn = document.getElementById('btn-dashboard-reset');

  if (searchInput) searchInput.addEventListener('input', applyDashboardFilters);
  if (statusSelect) statusSelect.addEventListener('change', applyDashboardFilters);
  if (prioritySelect) prioritySelect.addEventListener('change', applyDashboardFilters);
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (statusSelect) statusSelect.value = 'All';
      if (prioritySelect) prioritySelect.value = 'All';
      applyDashboardFilters();
    });
  }

  // Initialize SSE for real-time dashboard refresh
  api.initSSE((event) => {
    console.log('[SSE Event Received]', event.type);
    loadDashboardData();
  });
});

async function loadDashboardData() {
  try {
    const data = await api.getDashboard();
    if (!data) return;
    rawDashboardData = data;

    renderStats(data.counts || {});
    renderDepartmentBars(data.departments || []);
    renderCategoryBars(data.categories || []);
    applyDashboardFilters();
  } catch (err) {
    console.error('Failed to load dashboard statistics:', err);
  }
}

function applyDashboardFilters() {
  if (!rawDashboardData) return;
  const search = (document.getElementById('dashboard-search')?.value || '').trim().toLowerCase();
  const status = document.getElementById('dashboard-status')?.value || 'All';
  const priority = document.getElementById('dashboard-priority')?.value || 'All';

  let filteredRecent = rawDashboardData.recentActivity || [];
  let filteredHighPriority = rawDashboardData.highPriority || [];

  if (status !== 'All') {
    filteredRecent = filteredRecent.filter(t => t.status === status);
    filteredHighPriority = filteredHighPriority.filter(t => t.status === status);
  }

  if (priority !== 'All') {
    filteredRecent = filteredRecent.filter(t => t.priority === priority);
    filteredHighPriority = filteredHighPriority.filter(t => t.priority === priority);
  }

  if (search) {
    const match = (t) => (
      (t.ticket_number && t.ticket_number.toLowerCase().includes(search)) ||
      (t.title && t.title.toLowerCase().includes(search)) ||
      (t.creator_name && t.creator_name.toLowerCase().includes(search)) ||
      (t.department_name && t.department_name.toLowerCase().includes(search)) ||
      (t.assigned_to_name && t.assigned_to_name.toLowerCase().includes(search))
    );
    filteredRecent = filteredRecent.filter(match);
    filteredHighPriority = filteredHighPriority.filter(match);
  }

  renderRecentTickets(filteredRecent);
  renderHighPriorityAlerts(filteredHighPriority);
}

function renderStats(counts) {
  document.getElementById('stat-total').textContent = counts.total || 0;
  document.getElementById('stat-open').textContent = counts.open || 0;
  document.getElementById('stat-progress').textContent = counts.in_progress || 0;
  document.getElementById('stat-resolved').textContent = counts.resolved || 0;
  document.getElementById('stat-closed').textContent = counts.closed || 0;
  document.getElementById('stat-overdue').textContent = counts.overdue || 0;
}

function renderDepartmentBars(departments) {
  const container = document.getElementById('dept-chart-container');
  if (!container) return;

  if (departments.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 12px;">No department activity recorded yet.</p>';
    return;
  }

  const maxCount = Math.max(...departments.map(d => parseInt(d.count, 10)), 1);

  container.innerHTML = departments.map(d => {
    const count = parseInt(d.count, 10);
    const percent = Math.round((count / maxCount) * 100);
    return `
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
          <span style="font-weight: 500;">${escapeHtml(d.name)}</span>
          <span style="font-weight: 600; color: var(--primary-700);">${count}</span>
        </div>
        <div style="width: 100%; height: 7px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
          <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #1d4ed8); border-radius: 4px;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderCategoryBars(categories) {
  const container = document.getElementById('cat-chart-container');
  if (!container) return;

  if (categories.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 12px;">No category records found.</p>';
    return;
  }

  const maxCount = Math.max(...categories.map(c => parseInt(c.count, 10)), 1);

  container.innerHTML = categories.map(c => {
    const count = parseInt(c.count, 10);
    const percent = Math.round((count / maxCount) * 100);
    const isSap = c.division === 'SAP Support';
    const barColor = isSap ? '#0284c7' : '#059669';

    return `
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
          <span>
            <span style="font-size: 10px; padding: 1px 4px; border-radius: 3px; background: ${isSap ? '#e0f2fe' : '#d1fae5'}; color: ${isSap ? '#0369a1' : '#065f46'}; font-weight: 600; margin-right: 4px;">${escapeHtml(c.division)}</span>
            <span style="font-weight: 500;">${escapeHtml(c.name)}</span>
          </span>
          <span style="font-weight: 600; color: #1e293b;">${count}</span>
        </div>
        <div style="width: 100%; height: 7px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
          <div style="width: ${percent}%; height: 100%; background: ${barColor}; border-radius: 4px;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRecentTickets(tickets) {
  const tbody = document.getElementById('recent-tickets-tbody');
  if (!tbody) return;

  if (tickets.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px;">No tickets found.</td></tr>';
    return;
  }

  tbody.innerHTML = tickets.map(t => `
    <tr>
      <td>
        <a href="ticket-details.html?id=${t.id}" style="font-family: monospace; font-weight: 600;">
          ${escapeHtml(t.ticket_number)}
        </a>
      </td>
      <td style="font-weight: 500; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        <a href="ticket-details.html?id=${t.id}" style="color: inherit;">
          ${escapeHtml(t.title)}
        </a>
      </td>
      <td>${escapeHtml(t.department_name || '')}</td>
      <td>
        <span class="priority-badge priority-${t.priority.toLowerCase()}">${t.priority}</span>
      </td>
      <td>
        <span class="badge badge-${t.status.toLowerCase().replace(' ', '-')}">${t.status}</span>
      </td>
      <td>${escapeHtml(t.assigned_to_name || 'Unassigned')}</td>
    </tr>
  `).join('');
}

function renderHighPriorityAlerts(alerts) {
  const container = document.getElementById('high-priority-list');
  if (!container) return;

  if (alerts.length === 0) {
    container.innerHTML = '<p style="color: #15803d; font-size: 12.5px; background: #f0fdf4; padding: 12px; border-radius: 6px;">✓ All high-priority items resolved or normal status.</p>';
    return;
  }

  container.innerHTML = alerts.map(a => `
    <div style="padding: 12px; border-radius: 6px; background: #fff5f5; border: 1px solid #fed7d7; display: flex; flex-direction: column; gap: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <a href="ticket-details.html?id=${a.id}" style="font-family: monospace; font-weight: 700; color: #991b1b;">
          ${escapeHtml(a.ticket_number)}
        </a>
        <span class="priority-badge priority-${a.priority.toLowerCase()}">${a.priority}</span>
      </div>
      <div style="font-weight: 600; font-size: 13px; color: #1e293b;">
        <a href="ticket-details.html?id=${a.id}" style="color: inherit;">
          ${escapeHtml(a.title)}
        </a>
      </div>
      <div style="font-size: 11.5px; color: #64748b; display: flex; justify-content: space-between; margin-top: 4px;">
        <span>Dept: ${escapeHtml(a.department_name)}</span>
        <span>Assigned: <strong>${escapeHtml(a.assigned_to_name || 'Unassigned')}</strong></span>
      </div>
    </div>
  `).join('');
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
