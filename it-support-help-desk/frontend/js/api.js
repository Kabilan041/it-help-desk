/**
 * Paramount Textile Mills (P) Ltd - IT SUPPORT HELP DESK
 * Frontend REST API Client (100% native fetch)
 */

const API_BASE = '/api';

const api = {
  // Helper for all HTTP requests
  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Accept': 'application/json',
    };

    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);

      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        // Redirect to login if unauthenticated
        window.location.href = '/login.html';
        return null;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth endpoints
  login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  logout() {
    return this.request('/auth/logout', { method: 'POST' });
  },

  getMe() {
    return this.request('/auth/me');
  },

  // Metadata
  getDepartments() {
    return this.request('/departments');
  },

  getCategories() {
    return this.request('/categories');
  },

  // Tickets
  getTickets(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/tickets?${qs}`);
  },

  createTicket(payload) {
    return this.request('/tickets', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getTicketDetails(ticketId) {
    return this.request(`/tickets/${ticketId}`);
  },

  updateTicketStatus(ticketId, payload) {
    return this.request(`/tickets/${ticketId}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  assignTicket(ticketId, payload) {
    return this.request(`/tickets/${ticketId}/assign`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  addComment(ticketId, payload) {
    return this.request(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Analytics & Reports
  getDashboard() {
    return this.request('/reports/dashboard');
  },

  getExportUrl(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return `${API_BASE}/reports/export?${qs}`;
  },

  // Admin & Support Management
  getUsers() {
    return this.request('/users');
  },

  createUser(payload) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateUser(id, payload) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  getSupportTeam() {
    return this.request('/support-team');
  },

  updateSupportMember(id, payload) {
    return this.request(`/support-team/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  getRoutingRules() {
    return this.request('/routing-rules');
  },

  saveRoutingRule(payload) {
    return this.request('/routing-rules', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Real-Time Server-Sent Events (SSE)
  initSSE(onEvent) {
    if (!window.EventSource) return null;
    try {
      const evtSource = new EventSource(`${API_BASE}/events`);
      evtSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          onEvent(data);
        } catch (err) {
          console.warn('SSE parse error:', err);
        }
      };
      evtSource.onerror = (err) => {
        console.warn('SSE connection interrupted, fallback to polling if needed.', err);
      };
      return evtSource;
    } catch (err) {
      console.warn('Failed to start SSE:', err);
      return null;
    }
  }
};

window.api = api;
