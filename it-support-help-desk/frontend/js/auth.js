/**
 * Paramount Textile Mills (P) Ltd - IT SUPPORT HELP DESK
 * Client Authentication & Session Guard
 */

const auth = {
  currentUser: null,

  async init(options = { requireAuth: true, allowedRoles: null }) {
    try {
      const res = await api.getMe();
      if (!res || !res.user) {
        if (options.requireAuth) {
          window.location.href = '/login.html';
        }
        return null;
      }

      this.currentUser = res.user;

      // Role check
      if (options.allowedRoles && !options.allowedRoles.includes(this.currentUser.role)) {
        alert('Access denied: You do not have permission to view this page.');
        window.location.href = '/dashboard.html';
        return null;
      }

      this.renderUserUI();
      return this.currentUser;
    } catch (err) {
      if (options.requireAuth) {
        window.location.href = '/login.html';
      }
      return null;
    }
  },

  renderUserUI() {
    const user = this.currentUser;
    if (!user) return;

    const nameEl = document.getElementById('user-full-name');
    const roleEl = document.getElementById('user-role-badge');
    const avatarEl = document.getElementById('user-avatar');
    const deptEl = document.getElementById('user-dept-text');

    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role.toUpperCase();
    if (deptEl) deptEl.textContent = `${user.department_name || 'General'} (Ext: ${user.extension || 'N/A'})`;
    if (avatarEl) {
      avatarEl.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    // Hide or show admin/support only nav items
    const adminLinks = document.querySelectorAll('.admin-only');
    adminLinks.forEach(link => {
      link.style.display = (user.role === 'admin') ? '' : 'none';
    });

    const supportLinks = document.querySelectorAll('.support-admin-only');
    supportLinks.forEach(link => {
      link.style.display = (user.role === 'admin' || user.role === 'support') ? '' : 'none';
    });
  },

  async logout() {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout error', err);
    } finally {
      window.location.href = '/login.html';
    }
  }
};

window.auth = auth;
