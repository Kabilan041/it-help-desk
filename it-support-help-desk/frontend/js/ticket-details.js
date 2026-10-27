/**
 * Paramount Textile Mills (P) Ltd - IT SUPPORT HELP DESK
 * Ticket Details & Workflow Controller
 */

let currentTicketId = null;
let currentTicketData = null;
let selectedTargetStatus = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await auth.init({ requireAuth: true });
  if (!user) return;

  const urlParams = new URLSearchParams(window.location.search);
  currentTicketId = urlParams.get('id');

  if (!currentTicketId) {
    alert('No ticket ID specified.');
    window.location.href = 'my-tickets.html';
    return;
  }

  // Show internal note checkbox for support / admin
  if (user.role === 'support' || user.role === 'admin') {
    const internalLabel = document.getElementById('internal-note-label');
    if (internalLabel) internalLabel.style.display = 'flex';
  }

  await loadTicketDetails();
  await loadSupportTeamList();

  // Comment submission listener
  document.getElementById('comment-form').addEventListener('submit', handleAddComment);

  // Status confirm button
  document.getElementById('btn-confirm-status').addEventListener('click', handleConfirmStatusUpdate);

  // Reassignment button
  document.getElementById('btn-reassign').addEventListener('click', handleReassignment);

  // SSE updates
  api.initSSE((event) => {
    if (event.ticket && (event.ticket.id == currentTicketId || event.ticket.ticket_number == currentTicketId)) {
      loadTicketDetails();
    }
  });
});

async function loadTicketDetails() {
  try {
    const data = await api.getTicketDetails(currentTicketId);
    if (!data || !data.ticket) return;

    currentTicketData = data.ticket;
    renderHeader(data.ticket);
    renderDetails(data.ticket);
    renderComments(data.comments || []);
    renderTimeline(data.history || [], data.assignments || []);
    renderAttachments(data.attachments || []);
  } catch (err) {
    console.error('Failed to load ticket:', err);
    showAlert('Error loading ticket details: ' + err.message, 'danger');
  }
}

async function loadSupportTeamList() {
  try {
    const team = await api.getSupportTeam();
    const select = document.getElementById('assign-support-select');
    if (!select || !team) return;

    select.innerHTML = '<option value="">-- Choose Support Engineer --</option>';
    team.forEach(member => {
      const opt = document.createElement('option');
      opt.value = member.id;
      opt.textContent = `${member.full_name} (${member.designation} - Ext: ${member.extension})`;
      select.appendChild(opt);
    });

    if (currentTicketData && currentTicketData.assigned_to) {
      select.value = currentTicketData.assigned_to;
    }
  } catch (err) {
    console.warn('Could not load support team list:', err);
  }
}

function renderHeader(t) {
  document.getElementById('header-ticket-crumb').textContent = `Ticket #${t.ticket_number} — ${t.title}`;
  document.getElementById('badge-ticket-num').textContent = t.ticket_number;

  const statusBadge = document.getElementById('badge-ticket-status');
  statusBadge.className = `badge badge-${t.status.toLowerCase().replace(' ', '-')}`;
  statusBadge.textContent = t.status;

  const priorityBadge = document.getElementById('badge-ticket-priority');
  priorityBadge.className = `priority-badge priority-${t.priority.toLowerCase()}`;
  priorityBadge.textContent = t.priority;

  document.getElementById('ticket-reported-on').textContent = `Reported: ${new Date(t.created_at).toLocaleString()}`;
  document.getElementById('ticket-title-display').textContent = t.title;
}

function renderDetails(t) {
  document.getElementById('display-creator-name').textContent = t.creator_name || 'N/A';
  document.getElementById('display-creator-empid').textContent = t.creator_employee_id ? `(${t.creator_employee_id})` : '';
  document.getElementById('display-department').textContent = t.department_name || 'N/A';
  document.getElementById('display-contact').textContent = t.contact_number || 'N/A';
  document.getElementById('display-category').textContent = `${t.category_division || ''} - ${t.category_name || ''}`;
  
  const assignedEl = document.getElementById('display-assigned-to');
  if (t.assigned_to_name) {
    assignedEl.textContent = `${t.assigned_to_name} (Ext ${t.assigned_to_extension || 'N/A'})`;
  } else {
    assignedEl.textContent = 'Unassigned (General Queue)';
    assignedEl.style.color = '#64748b';
  }

  const dueEl = document.getElementById('display-due-date');
  if (t.due_date) {
    dueEl.textContent = new Date(t.due_date).toLocaleString();
    if (t.is_overdue || (new Date(t.due_date) < new Date() && t.status !== 'Resolved' && t.status !== 'Closed')) {
      dueEl.innerHTML += ' <span style="color: #dc2626; font-weight: 700;">[OVERDUE]</span>';
    }
  } else {
    dueEl.textContent = 'Standard SLA';
  }

  document.getElementById('display-description').textContent = t.description;

  // Resolution section
  const resSec = document.getElementById('resolution-section');
  if (t.status === 'Resolved' || t.status === 'Closed' || t.resolution_notes) {
    resSec.style.display = 'block';
    document.getElementById('display-resolution-notes').textContent = t.resolution_notes || 'Issue marked resolved.';
    document.getElementById('display-resolved-at').textContent = t.resolved_at ? `Resolved on: ${new Date(t.resolved_at).toLocaleString()}` : '';
  } else {
    resSec.style.display = 'none';
  }
}

function renderComments(comments) {
  const container = document.getElementById('comments-list');
  const countBadge = document.getElementById('comments-count');
  if (countBadge) countBadge.textContent = `${comments.length} Notes`;

  if (comments.length === 0) {
    container.innerHTML = '<p style="color: #94a3b8; font-size: 12px; text-align: center; padding: 12px;">No comments or troubleshooting notes recorded yet.</p>';
    return;
  }

  container.innerHTML = comments.map(c => {
    const isInternal = c.is_internal;
    return `
      <div class="comment-card ${isInternal ? 'internal' : ''}">
        <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: #64748b; margin-bottom: 4px;">
          <span>
            <strong>${escapeHtml(c.author_name)}</strong> 
            <span style="text-transform: capitalize;">(${c.author_role})</span>
            ${isInternal ? '<span style="background: #fef3c7; color: #b45309; padding: 1px 5px; border-radius: 3px; font-weight: 700; margin-left: 6px;">INTERNAL NOTE</span>' : ''}
          </span>
          <span>${new Date(c.created_at).toLocaleString()}</span>
        </div>
        <div style="font-size: 13px; color: #1e293b; white-space: pre-wrap;">${escapeHtml(c.message)}</div>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

function renderTimeline(history, assignments) {
  const container = document.getElementById('status-timeline');
  if (!container) return;

  const events = [];

  history.forEach(h => {
    events.push({
      date: new Date(h.created_at),
      title: h.old_status ? `Status changed: ${h.old_status} → ${h.new_status}` : `Ticket Created as ${h.new_status}`,
      author: h.changed_by_name,
      comments: h.comments
    });
  });

  assignments.forEach(a => {
    events.push({
      date: new Date(a.created_at),
      title: a.to_name ? `Assigned to ${a.to_name}` : 'Unassigned',
      author: a.assigned_by_name,
      comments: a.notes
    });
  });

  // Sort chronological
  events.sort((a, b) => b.date - a.date);

  if (events.length === 0) {
    container.innerHTML = '<p style="color: #94a3b8; font-size: 12px;">No lifecycle events logged.</p>';
    return;
  }

  container.innerHTML = events.map(e => `
    <div class="timeline-item">
      <div class="timeline-header">
        <strong>${escapeHtml(e.title)}</strong> by ${escapeHtml(e.author || 'System')} &bull; <span style="font-size: 11px;">${e.date.toLocaleString()}</span>
      </div>
      ${e.comments ? `<div style="font-size: 12px; color: #475569; background: #ffffff; padding: 6px 10px; border-radius: 4px; border: 1px solid #f1f5f9;">${escapeHtml(e.comments)}</div>` : ''}
    </div>
  `).join('');
}

function renderAttachments(attachments) {
  const container = document.getElementById('attachments-container');
  if (!container) return;

  if (attachments.length === 0) {
    container.innerHTML = '<p style="color: #94a3b8; font-size: 12px;">No attachments uploaded for this ticket.</p>';
    return;
  }

  container.innerHTML = attachments.map(a => `
    <div style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; font-size: 12px; display: flex; align-items: center; gap: 8px;">
      <span>📎</span>
      <span style="font-weight: 500;">${escapeHtml(a.original_name)}</span>
      <span style="color: #94a3b8; font-size: 11px;">(${Math.round(a.file_size_bytes / 1024)} KB)</span>
    </div>
  `).join('');
}

function promptStatusChange(status) {
  selectedTargetStatus = status;
  const container = document.getElementById('status-reason-container');
  const label = document.getElementById('status-note-label');
  const input = document.getElementById('status-note-input');

  container.style.display = 'block';
  input.value = '';

  if (status === 'Resolved') {
    label.textContent = 'Resolution Details (Mandatory):';
    input.placeholder = 'Provide exact root cause and solution implemented...';
  } else if (status === 'Open') {
    label.textContent = 'Reason for Reopening:';
    input.placeholder = 'Explain why the issue is still persisting...';
  } else {
    label.textContent = 'Progress Comments:';
    input.placeholder = 'Notes on current troubleshooting state...';
  }

  input.focus();
}

function cancelStatusChange() {
  selectedTargetStatus = null;
  document.getElementById('status-reason-container').style.display = 'none';
}

async function handleConfirmStatusUpdate() {
  if (!selectedTargetStatus) return;

  const notes = document.getElementById('status-note-input').value.trim();
  if (selectedTargetStatus === 'Resolved' && !notes) {
    alert('Please enter resolution details before marking this ticket as Resolved.');
    return;
  }

  try {
    const payload = {
      status: selectedTargetStatus,
      resolution_notes: selectedTargetStatus === 'Resolved' ? notes : null,
      comments: notes || `Status updated to ${selectedTargetStatus}`
    };

    const res = await api.updateTicketStatus(currentTicketId, payload);
    if (res && res.success) {
      showAlert(`✓ Ticket status updated to ${selectedTargetStatus}.`, 'success');
      cancelStatusChange();
      await loadTicketDetails();
    }
  } catch (err) {
    showAlert('Failed to update status: ' + err.message, 'danger');
  }
}

async function handleReassignment() {
  const select = document.getElementById('assign-support-select');
  const supportId = select.value;

  if (!supportId) {
    alert('Please select a support engineer from the list.');
    return;
  }

  try {
    const res = await api.assignTicket(currentTicketId, {
      support_team_id: supportId,
      notes: 'Manually reassigned from Ticket Details console.'
    });

    if (res && res.success) {
      showAlert('✓ Ticket successfully reassigned.', 'success');
      await loadTicketDetails();
    }
  } catch (err) {
    showAlert('Reassignment failed: ' + err.message, 'danger');
  }
}

async function handleAddComment(e) {
  e.preventDefault();
  const input = document.getElementById('new-comment-text');
  const checkInternal = document.getElementById('check-internal-note');
  const submitBtn = document.getElementById('btn-post-comment');

  const message = input.value.trim();
  if (!message) return;

  submitBtn.disabled = true;

  try {
    await api.addComment(currentTicketId, {
      message,
      is_internal: checkInternal ? checkInternal.checked : false
    });

    input.value = '';
    if (checkInternal) checkInternal.checked = false;
    await loadTicketDetails();
  } catch (err) {
    showAlert('Failed to post comment: ' + err.message, 'danger');
  } finally {
    submitBtn.disabled = false;
  }
}

function showAlert(message, type) {
  const alertBox = document.getElementById('details-alert');
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
