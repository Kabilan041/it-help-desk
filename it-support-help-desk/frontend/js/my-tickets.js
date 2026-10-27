/**
 * Paramount Textile Mills (P) Ltd - IT SUPPORT HELP DESK
 * My Tickets Controller
 */

let currentFilters = {
  status: 'All',
  priority: 'All',
  search: '',
  date_from: '',
  date_to: ''
};

document.addEventListener('DOMContentLoaded', async () => {
  const user = await auth.init({ requireAuth: true });
  if (!user) return;

  loadTickets();

  // Filter actions
  const applyFilter = () => {
    currentFilters.search = document.getElementById('filter-search').value.trim();
    currentFilters.status = document.getElementById('filter-status').value;
    currentFilters.priority = document.getElementById('filter-priority').value;
    currentFilters.date_from = document.getElementById('filter-date-from').value;
    currentFilters.date_to = document.getElementById('filter-date-to').value;
    loadTickets();
  };

  document.getElementById('btn-apply-filter').addEventListener('click', applyFilter);

  // Real-time live filtering on input and select changes
  const searchInput = document.getElementById('filter-search');
  const statusSelect = document.getElementById('filter-status');
  const prioritySelect = document.getElementById('filter-priority');
  let debounceTimer = null;

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentFilters.search = searchInput.value.trim();
        loadTickets();
      }, 200);
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      currentFilters.status = statusSelect.value;
      loadTickets();
    });
  }

  if (prioritySelect) {
    prioritySelect.addEventListener('change', () => {
      currentFilters.priority = prioritySelect.value;
      loadTickets();
    });
  }

  document.getElementById('btn-reset-filter').addEventListener('click', () => {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-status').value = 'All';
    document.getElementById('filter-priority').value = 'All';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    currentFilters = { status: 'All', priority: 'All', search: '', date_from: '', date_to: '' };
    loadTickets();
  });

  // Download CSV button handler
  const downloadBtn = document.getElementById('btn-download-csv');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const exportParams = {
        my_tickets: 'true',
        format: 'csv',
        ...currentFilters
      };
      window.location.href = api.getExportUrl(exportParams);
    });
  }

  // Real-time updates via SSE
  api.initSSE((event) => {
    loadTickets();
  });
});

async function loadTickets() {
  const syncEl = document.getElementById('sync-status-text');
  if (syncEl) syncEl.textContent = 'Syncing...';

  try {
    const params = {
      my_tickets: 'true',
      ...currentFilters
    };

    const tickets = await api.getTickets(params);
    renderTicketsTable(tickets || []);

    if (syncEl) {
      syncEl.textContent = `Live updated ${new Date().toLocaleTimeString()}`;
    }
  } catch (err) {
    console.error('Failed to load tickets:', err);
    if (syncEl) syncEl.textContent = 'Sync error';
  }
}

function renderTicketsTable(tickets) {
  const tbody = document.getElementById('my-tickets-tbody');
  const countBadge = document.getElementById('ticket-count-badge');
  if (countBadge) countBadge.textContent = tickets.length;

  if (tickets.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; color: #94a3b8; padding: 36px 20px;">
          <p style="font-size: 15px; font-weight: 500; color: #64748b; margin-bottom: 6px;">No tickets found matching your filter criteria.</p>
          <a href="raise-ticket.html" class="btn btn-primary btn-sm" style="margin-top: 8px;">Raise New Ticket</a>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = tickets.map(t => {
    const createdDate = new Date(t.created_at).toLocaleDateString() + ' ' + new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedDate = new Date(t.updated_at).toLocaleDateString() + ' ' + new Date(t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const statusClass = t.status.toLowerCase().replace(' ', '-');
    const priorityClass = t.priority.toLowerCase();

    return `
      <tr>
        <td>
          <a href="ticket-details.html?id=${t.id}" style="font-family: monospace; font-weight: 700; color: var(--primary-600);">
            ${escapeHtml(t.ticket_number)}
          </a>
        </td>
        <td style="font-weight: 600; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          <a href="ticket-details.html?id=${t.id}" style="color: inherit;" title="${escapeHtml(t.title)}">
            ${escapeHtml(t.title)}
          </a>
        </td>
        <td>${escapeHtml(t.department_name || '')}</td>
        <td>
          <span style="font-size: 11px; color: #64748b;">${escapeHtml(t.category_division || '')}:</span><br>
          <strong>${escapeHtml(t.category_name || '')}</strong>
        </td>
        <td>
          <span class="priority-badge priority-${priorityClass}">${t.priority}</span>
        </td>
        <td style="font-size: 12px; color: #64748b; white-space: nowrap;">${createdDate}</td>
        <td>
          ${t.assigned_to_name ? `<strong>${escapeHtml(t.assigned_to_name)}</strong> <span style="font-size: 11px; color: #64748b;">(Ext: ${t.assigned_to_extension || ''})</span>` : '<span style="color: #94a3b8; font-style: italic;">Unassigned (In Queue)</span>'}
        </td>
        <td>
          <span class="badge badge-${statusClass}">
            <span style="width: 6px; height: 6px; border-radius: 50%; background-color: currentColor; display: inline-block;"></span>
            ${t.status}
          </span>
        </td>
        <td style="font-size: 12px; color: #64748b; white-space: nowrap;">${updatedDate}</td>
        <td>
          <a href="ticket-details.html?id=${t.id}" class="btn btn-secondary btn-sm">
            View Details
          </a>
        </td>
      </tr>
    `;
  }).join('');
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
