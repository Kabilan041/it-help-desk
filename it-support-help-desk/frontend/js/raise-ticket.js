/**
 * Paramount Textile Mills (P) Ltd - IT SUPPORT HELP DESK
 * Raise Ticket Controller
 */

let allCategories = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await auth.init({ requireAuth: true });
  if (!user) return;

  // Auto-populate user info
  document.getElementById('employee-name').value = user.name || '';
  document.getElementById('employee-id').value = user.employee_id || '';
  document.getElementById('reported-time').value = new Date().toLocaleString();
  if (user.extension) {
    document.getElementById('contact-extension').value = `Ext ${user.extension}`;
  } else if (user.phone) {
    document.getElementById('contact-extension').value = user.phone;
  }

  // Preselect user department
  if (user.department_id) {
    const deptSelect = document.getElementById('department-select');
    deptSelect.value = user.department_id;
  }

  // Load categories
  await loadCategories();

  // Division toggle
  const divisionSelect = document.getElementById('category-division-select');
  divisionSelect.addEventListener('change', () => {
    populateCategoryDropdown(divisionSelect.value);
  });

  // Handle form submit
  const form = document.getElementById('raise-ticket-form');
  form.addEventListener('submit', handleFormSubmit);
});

async function loadCategories() {
  try {
    const categories = await api.getCategories();
    allCategories = categories || [];
    populateCategoryDropdown('SAP Support');
  } catch (err) {
    console.error('Error fetching categories:', err);
    // Fallback static categories
    allCategories = [
      { id: 1, division: 'SAP Support', name: 'SAP MM' },
      { id: 2, division: 'SAP Support', name: 'SAP PP' },
      { id: 3, division: 'SAP Support', name: 'SAP SD' },
      { id: 4, division: 'SAP Support', name: 'SAP QM' },
      { id: 5, division: 'SAP Support', name: 'SAP WMS' },
      { id: 6, division: 'SAP Support', name: 'SAP Master Data' },
      { id: 7, division: 'SAP Support', name: 'SAP Procurement' },
      { id: 8, division: 'SAP Support', name: 'SAP Inventory' },
      { id: 9, division: 'SAP Support', name: 'SAP Production' },
      { id: 10, division: 'SAP Support', name: 'SAP Sales Order' },
      { id: 11, division: 'IT Support', name: 'Hardware' },
      { id: 12, division: 'IT Support', name: 'Software' },
      { id: 13, division: 'IT Support', name: 'Printer' },
      { id: 14, division: 'IT Support', name: 'Network' },
      { id: 15, division: 'IT Support', name: 'Internet' },
      { id: 16, division: 'IT Support', name: 'Email / Outlook' },
      { id: 17, division: 'IT Support', name: 'Access / Login' },
      { id: 18, division: 'IT Support', name: 'Meeting / Microsoft Teams' },
      { id: 19, division: 'IT Support', name: 'CCTV / DVR' },
      { id: 20, division: 'IT Support', name: 'Other IT Issue' }
    ];
    populateCategoryDropdown('SAP Support');
  }
}

function populateCategoryDropdown(division) {
  const catSelect = document.getElementById('category-select');
  catSelect.innerHTML = '<option value="">-- Select Category --</option>';

  const filtered = allCategories.filter(c => c.division === division);
  filtered.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    catSelect.appendChild(opt);
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const alertBox = document.getElementById('form-alert');
  const submitBtn = document.getElementById('btn-submit-ticket');

  alertBox.style.display = 'none';

  const departmentId = document.getElementById('department-select').value;
  const categoryId = document.getElementById('category-select').value;
  const priority = document.getElementById('priority-select').value;
  const contact = document.getElementById('contact-extension').value.trim();
  const title = document.getElementById('issue-title').value.trim();
  const description = document.getElementById('issue-description').value.trim();
  const attachmentInput = document.getElementById('ticket-attachment');

  if (!departmentId || !categoryId || !title || !description) {
    showAlert('Please fill in all mandatory fields.', 'danger');
    return;
  }

  // File size validation (10MB limit)
  if (attachmentInput.files && attachmentInput.files[0]) {
    const file = attachmentInput.files[0];
    if (file.size > 10 * 1024 * 1024) {
      showAlert('Attachment file size exceeds 10MB limit. Please upload a smaller file.', 'danger');
      return;
    }
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting Ticket...';

  try {
    const payload = {
      title,
      description,
      department_id: departmentId,
      category_id: categoryId,
      priority,
      contact_number: contact
    };

    const res = await api.createTicket(payload);

    if (res && res.success) {
      showAlert(`✓ Success! Ticket ${res.ticket.ticket_number} created successfully. Redirecting to My Tickets...`, 'success');
      setTimeout(() => {
        window.location.href = `my-tickets.html`;
      }, 1500);
    }
  } catch (err) {
    showAlert(err.message || 'Failed to submit ticket. Please try again.', 'danger');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Support Ticket';
  }
}

function showAlert(message, type) {
  const alertBox = document.getElementById('form-alert');
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.style.display = 'block';
  alertBox.scrollIntoView({ behavior: 'smooth' });
}
