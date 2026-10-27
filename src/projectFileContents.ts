/**
 * Full file contents dictionary for Paramount Textile Mills IT Support Help Desk
 * Provides full files for copy/download inside the web UI
 */

export interface ProjectFile {
  path: string;
  folder: 'Root' | 'database' | 'backend' | 'backend/routes' | 'backend/middleware' | 'backend/services' | 'frontend' | 'frontend/css' | 'frontend/js';
  filename: string;
  language: string;
  description: string;
  content: string;
}

export const ALL_PROJECT_FILES: ProjectFile[] = [
  // ==========================================
  // ROOT CONFIGURATION
  // ==========================================
  {
    path: 'package.json',
    folder: 'Root',
    filename: 'package.json',
    language: 'json',
    description: 'Node.js project configuration and scripts for running backend.',
    content: `{
  "name": "ptm-it-support-help-desk",
  "version": "1.0.0",
  "description": "IT Support & SAP Help Desk for Paramount Textile Mills (P) Ltd",
  "main": "backend/server.js",
  "scripts": {
    "start": "node backend/server.js",
    "dev": "node --watch backend/server.js",
    "test-db": "node -e \\"require('./backend/db').testConnection()\\""
  },
  "keywords": [
    "helpdesk",
    "sap-support",
    "it-support",
    "paramount-textile-mills",
    "postgresql",
    "vanilla-js"
  ],
  "author": "Paramount Textile Mills (P) Ltd - IT Department",
  "license": "UNLICENSED",
  "private": true,
  "dependencies": {
    "pg": "^8.13.3"
  }
}`
  },
  {
    path: '.env.example',
    folder: 'Root',
    filename: '.env.example',
    language: 'ini',
    description: 'Template for environment variables (copy to .env).',
    content: `# ==============================================================================
# PARAMOUNT TEXTILE MILLS (P) LTD - IT SUPPORT HELP DESK
# Environment Configuration
# Copy this file to .env and configure for your local Windows PC or Company Server
# ==============================================================================

# Server Network Settings
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# PostgreSQL Database Connection Settings (Configure for your local PostgreSQL / pgAdmin 4)
PG_HOST=127.0.0.1
PG_PORT=5432
PG_DATABASE=it_helpdesk_db
PG_USER=postgres
PG_PASSWORD=postgres
PG_MAX_POOL=20

# Optional SMTP Email Notifications Settings
# (Leave blank or unconfigured to safely skip email dispatch without errors)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=it-notifications@paramounttextiles.com
SMTP_PASS=
SMTP_FROM="Paramount IT Help Desk <it-notifications@paramounttextiles.com>"
SUPPORT_ALERT_EMAIL=veeramuthu@paramounttextiles.com`
  },
  {
    path: '.gitignore',
    folder: 'Root',
    filename: '.gitignore',
    language: 'ini',
    description: 'Git ignore rules for secrets and node_modules.',
    content: `# Dependency directories
node_modules/

# Environment files
.env
.env.local

# Uploads directory contents (preserve directory with .gitkeep)
uploads/*
!uploads/.gitkeep

# Operating System files
Thumbs.db
Desktop.ini
.DS_Store

# Log files
*.log
npm-debug.log*`
  },

  // ==========================================
  // DATABASE
  // ==========================================
  {
    path: 'database/schema.sql',
    folder: 'database',
    filename: 'schema.sql',
    language: 'sql',
    description: 'PostgreSQL database schema for all tables, indexes, constraints and audit logs.',
    content: `-- ==============================================================================
-- PARAMOUNT TEXTILE MILLS (P) LTD - IT SUPPORT HELP DESK
-- DATABASE SCHEMA (PostgreSQL 14 / 15 / 16 / 17 compatible)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS ticket_attachments CASCADE;
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS ticket_status_history CASCADE;
DROP TABLE IF EXISTS ticket_assignments CASCADE;
DROP TABLE IF EXISTS routing_rules CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS ticket_categories CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS support_team CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- 1. DEPARTMENTS
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    extension VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('employee', 'support', 'admin')),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    extension VARCHAR(50),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. SUPPORT TEAM PROFILES
CREATE TABLE support_team (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    designation VARCHAR(150) NOT NULL,
    extension VARCHAR(50) NOT NULL,
    specialization VARCHAR(100) DEFAULT 'General IT',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TICKET CATEGORIES
CREATE TABLE ticket_categories (
    id SERIAL PRIMARY KEY,
    division VARCHAR(50) NOT NULL CHECK (division IN ('SAP Support', 'IT Support')),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    default_assigned_to INTEGER REFERENCES support_team(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_division_name UNIQUE (division, name)
);

-- 5. TICKETS
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    category_id INTEGER NOT NULL REFERENCES ticket_categories(id) ON DELETE RESTRICT,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    contact_number VARCHAR(50),
    assigned_to INTEGER REFERENCES support_team(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    is_overdue BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TICKET ASSIGNMENT HISTORY
CREATE TABLE ticket_assignments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    assigned_from INTEGER REFERENCES support_team(id) ON DELETE SET NULL,
    assigned_to INTEGER REFERENCES support_team(id) ON DELETE SET NULL,
    assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TICKET STATUS HISTORY
CREATE TABLE ticket_status_history (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. TICKET COMMENTS
CREATE TABLE ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. TICKET ATTACHMENTS
CREATE TABLE ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    uploader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    original_name VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. CATEGORY ROUTING RULES
CREATE TABLE routing_rules (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES ticket_categories(id) ON DELETE CASCADE,
    support_team_id INTEGER NOT NULL REFERENCES support_team(id) ON DELETE CASCADE,
    priority_level VARCHAR(20) DEFAULT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cat_support UNIQUE (category_id, support_team_id)
);

-- 11. SESSIONS
CREATE TABLE sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. AUDIT LOGS
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(50),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_department_id ON tickets(department_id);
CREATE INDEX idx_tickets_category_id ON tickets(category_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_status_history_ticket_id ON ticket_status_history(ticket_id);
CREATE INDEX idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);`
  },
  {
    path: 'database/seed.sql',
    folder: 'database',
    filename: 'seed.sql',
    language: 'sql',
    description: 'Initial seed data: 13 departments, 7 support leads with extensions, categories & sample tickets.',
    content: `-- ==============================================================================
-- PARAMOUNT TEXTILE MILLS (P) LTD - IT SUPPORT HELP DESK
-- INITIAL SEED DATA
-- Default Passwords for all seeded users: "Paramount@123"
-- Salt: "ptm_helpdesk_salt_2026"
-- ==============================================================================

-- 1. INSERT DEPARTMENTS (13 Mill Units)
INSERT INTO departments (name, code, extension) VALUES
('Store', 'STR', '101'),
('Weaving', 'WVG', '102'),
('Sizing', 'SZG', '103'),
('Electrical', 'ELE', '104'),
('Marketing', 'MKT', '105'),
('Madeups-1', 'MU1', '106'),
('Madeups-2', 'MU2', '107'),
('HRD', 'HRD', '108'),
('Accounts', 'ACC', '109'),
('Export', 'EXP', '110'),
('Gate', 'GTE', '111'),
('Sample', 'SMP', '112'),
('PD', 'PD', '113')
ON CONFLICT (name) DO NOTHING;

-- 2. INSERT USERS (Pass: Paramount@123)
WITH pass_data AS (
    SELECT 
        'ptm_helpdesk_salt_2026' AS salt,
        '7c554e2095dcf74291079361a9eb482cba1249b5962536c4ffefca8681b49f9df3bb863bc43d73507119f9fec2be6a25cfda7234ec410f73560b216ce7e01dc5' AS hash
)
INSERT INTO users (employee_id, name, email, username, password_hash, salt, role, department_id, extension, phone)
SELECT 'ADM001', 'Veeramuthu', 'veeramuthu@paramounttextiles.com', 'admin', hash, salt, 'admin', (SELECT id FROM departments WHERE name = 'Electrical'), '919', '9842000919' FROM pass_data
UNION ALL
SELECT 'SUP001', 'Kabilan', 'kabilan@paramounttextiles.com', 'kabilan', hash, salt, 'support', (SELECT id FROM departments WHERE name = 'PD'), '712', '9842000712' FROM pass_data
UNION ALL
SELECT 'SUP002', 'Vijay', 'vijay@paramounttextiles.com', 'vijay', hash, salt, 'support', (SELECT id FROM departments WHERE name = 'Store'), '738', '9842000738' FROM pass_data
UNION ALL
SELECT 'SUP003', 'Abhishek', 'abhishek@paramounttextiles.com', 'abhishek', hash, salt, 'support', (SELECT id FROM departments WHERE name = 'Store'), '738', '9842000739' FROM pass_data
UNION ALL
SELECT 'SUP004', 'Arun', 'arun@paramounttextiles.com', 'arun', hash, salt, 'support', (SELECT id FROM departments WHERE name = 'PD'), '714', '9842000714' FROM pass_data
UNION ALL
SELECT 'SUP005', 'Gowshik', 'gowshik@paramounttextiles.com', 'gowshik', hash, salt, 'support', (SELECT id FROM departments WHERE name = 'PD'), '713', '9842000713' FROM pass_data
UNION ALL
SELECT 'SUP006', 'Monisha', 'monisha@paramounttextiles.com', 'monisha', hash, salt, 'support', (SELECT id FROM departments WHERE name = 'PD'), '715', '9842000715' FROM pass_data
UNION ALL
SELECT 'EMP101', 'Ramesh Kannan', 'ramesh.k@paramounttextiles.com', 'ramesh', hash, salt, 'employee', (SELECT id FROM departments WHERE name = 'Weaving'), '201', '9842111001' FROM pass_data
UNION ALL
SELECT 'EMP102', 'Priya Sharma', 'priya.s@paramounttextiles.com', 'priya', hash, salt, 'employee', (SELECT id FROM departments WHERE name = 'Accounts'), '202', '9842111002' FROM pass_data
UNION ALL
SELECT 'EMP103', 'Murugan S', 'murugan.s@paramounttextiles.com', 'murugan', hash, salt, 'employee', (SELECT id FROM departments WHERE name = 'Store'), '203', '9842111003' FROM pass_data
UNION ALL
SELECT 'EMP104', 'Anitha Raj', 'anitha.r@paramounttextiles.com', 'anitha', hash, salt, 'employee', (SELECT id FROM departments WHERE name = 'Export'), '204', '9842111004' FROM pass_data
ON CONFLICT (username) DO NOTHING;

-- 3. INSERT SUPPORT TEAM
INSERT INTO support_team (user_id, full_name, designation, extension, specialization) VALUES
((SELECT id FROM users WHERE username = 'kabilan'), 'Kabilan', 'SAP/IT Support', '712', 'SAP & General IT'),
((SELECT id FROM users WHERE username = 'vijay'), 'Vijay', 'Functional Support Lead (MM)', '738', 'SAP MM & Procurement'),
((SELECT id FROM users WHERE username = 'abhishek'), 'Abhishek', 'Functional Support Lead-2', '738', 'SAP Functional & Sizing'),
((SELECT id FROM users WHERE username = 'arun'), 'Arun', 'MDM Head', '714', 'Master Data Management'),
((SELECT id FROM users WHERE username = 'gowshik'), 'Gowshik', 'MDM Executive', '713', 'SAP Master Data & Item Codes'),
((SELECT id FROM users WHERE username = 'admin'), 'Veeramuthu', 'IT Admin', '919', 'Server, Network & Systems'),
((SELECT id FROM users WHERE username = 'monisha'), 'Monisha', 'SSTPL Process', '715', 'SSTPL Process & PD Workflows')
ON CONFLICT (user_id) DO NOTHING;

-- 4. INSERT TICKET CATEGORIES
INSERT INTO ticket_categories (division, name, description) VALUES
-- SAP Support
('SAP Support', 'SAP MM', 'Materials Management, PO, Goods Receipt, Vendor Master issues'),
('SAP Support', 'SAP PP', 'Production Planning, Routing, BOM, Shop Floor execution'),
('SAP Support', 'SAP SD', 'Sales and Distribution, Customer invoicing, Delivery notes'),
('SAP Support', 'SAP QM', 'Quality Management, Inspection lots, Certificate of Analysis'),
('SAP Support', 'SAP WMS', 'Warehouse Management System, Storage bin allocation, Picking'),
('SAP Support', 'SAP Master Data', 'Material master creation, Cost center, GL accounts setup'),
('SAP Support', 'SAP Procurement', 'Purchase requisitions, Approvals, Service PO entry'),
('SAP Support', 'SAP Inventory', 'Stock transfers, Physical verification, Movement types 201/261/311'),
('SAP Support', 'SAP Production', 'Production order confirmation, Variance calculation'),
('SAP Support', 'SAP Sales Order', 'Sales order block removal, Pricing condition adjustment'),

-- IT Support
('IT Support', 'Hardware', 'Desktop, Laptop, SMPS, RAM, Motherboard, Hard drive defects'),
('IT Support', 'Software', 'OS errors, Antivirus, Adobe, WinRAR, Utility installations'),
('IT Support', 'Printer', 'Thermal barcode printer, Laser jet paper jam, Cartridge replacement'),
('IT Support', 'Network', 'LAN cable crimping, Switch port, IP conflict, Internal Firewall connectivity'),
('IT Support', 'Internet', 'Broadband link down, Lease line outage, Proxy authentication'),
('IT Support', 'Email / Outlook', 'PST file corrupt, Outlook sync error, Webmail password reset'),
('IT Support', 'Access / Login', 'Active Directory lockout, Domain join, Folder permissions'),
('IT Support', 'Meeting / Microsoft Teams', 'Conference room display, Teams audio/video, Projector connectivity'),
('IT Support', 'CCTV / DVR', 'Security camera offline, DVR recording check, Gate surveillance stream'),
('IT Support', 'Other IT Issue', 'UPS battery backup, Telephone line EPABX, General queries')
ON CONFLICT (division, name) DO NOTHING;

-- 5. INITIAL TICKETS
INSERT INTO tickets (ticket_number, title, description, created_by, department_id, category_id, priority, status, contact_number, assigned_to, due_date, is_overdue, created_at, updated_at) VALUES
('PTM-2026-1001', 'Barcode printer not generating roll tags at Yarn Store', 'Zebra ZT410 printer in Store division is showing Ribbon Out error despite new ribbon loaded. Weaving yarn issuance halted.', (SELECT id FROM users WHERE username = 'murugan'), (SELECT id FROM departments WHERE name = 'Store'), (SELECT id FROM ticket_categories WHERE name = 'Printer'), 'High', 'In Progress', 'Ext 203 / 9842111003', (SELECT id FROM support_team WHERE full_name = 'Kabilan'), CURRENT_TIMESTAMP + INTERVAL '1 day', FALSE, CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('PTM-2026-1002', 'Goods Receipt MIGO 101 error - Deficit of SL Stock', 'Attempting to post MIGO for PO 450008912 for Cotton Combed Yarn 40s. System throwing error Deficit of SL Stock 420 KGS in Store Location 1000.', (SELECT id FROM users WHERE username = 'murugan'), (SELECT id FROM departments WHERE name = 'Store'), (SELECT id FROM ticket_categories WHERE name = 'SAP MM'), 'Critical', 'Open', 'Ext 203', (SELECT id FROM support_team WHERE full_name = 'Vijay'), CURRENT_TIMESTAMP + INTERVAL '4 hours', FALSE, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('PTM-2026-1003', 'Loom Shed 3 Network Switch drop - Weaving Monitoring PC offline', 'All 4 PCs connected to Sub-Switch 04 in Loom Shed 3 have lost LAN connection. Pinging default gateway 192.168.10.1 times out.', (SELECT id FROM users WHERE username = 'ramesh'), (SELECT id FROM departments WHERE name = 'Weaving'), (SELECT id FROM ticket_categories WHERE name = 'Network'), 'Critical', 'In Progress', 'Ext 201', (SELECT id FROM support_team WHERE full_name = 'Veeramuthu'), CURRENT_TIMESTAMP + INTERVAL '6 hours', FALSE, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '30 minutes')
ON CONFLICT (ticket_number) DO NOTHING;`
  },

  // ==========================================
  // BACKEND
  // ==========================================
  {
    path: 'backend/server.js',
    folder: 'backend',
    filename: 'server.js',
    language: 'javascript',
    description: 'Node.js 24 native HTTP server (no web framework) with routing, SSE, and static serving.',
    content: `const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const db = require('./db');
const { authenticate } = require('./middleware/auth');
const sse = require('./services/sse');
const { handleLogin, handleLogout, handleGetCurrentUser } = require('./routes/auth');
const {
  handleGetDepartments,
  handleGetCategories,
  handleGetTickets,
  handleCreateTicket,
  handleGetTicketDetails,
  handleUpdateStatus,
  handleAssignTicket,
  handleAddComment
} = require('./routes/tickets');
const {
  handleGetUsers,
  handleCreateUser,
  handleUpdateUser,
  handleGetSupportTeam,
  handleUpdateSupportMember,
  handleGetRoutingRules,
  handleSaveRoutingRule
} = require('./routes/users');
const { handleGetDashboard, handleExportReport } = require('./routes/reports');

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 5 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('404 Not Found');
      }
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('500 Internal Server Error');
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN'
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  await authenticate(req);

  // SSE endpoint
  if (pathname === '/api/events' && req.method === 'GET') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Authentication required for SSE stream.' }));
    }
    const clientId = \`client_\${Date.now()}_\${Math.random().toString(36).substring(7)}\`;
    return sse.addClient(clientId, res, req.user);
  }

  // REST API Routes
  if (pathname.startsWith('/api/')) {
    try {
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        return handleLogin(req, res, body);
      }
      if (pathname === '/api/auth/logout' && req.method === 'POST') {
        return handleLogout(req, res);
      }
      if (pathname === '/api/auth/me' && req.method === 'GET') {
        return handleGetCurrentUser(req, res);
      }
      if (pathname === '/api/departments' && req.method === 'GET') {
        return handleGetDepartments(req, res);
      }
      if (pathname === '/api/categories' && req.method === 'GET') {
        return handleGetCategories(req, res);
      }
      if (pathname === '/api/tickets' && req.method === 'GET') {
        return handleGetTickets(req, res, query);
      }
      if (pathname === '/api/tickets' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        return handleCreateTicket(req, res, body);
      }

      const ticketMatch = pathname.match(/^\\/api\\/tickets\\/([A-Za-z0-9_-]+)(?:\\/([a-z]+))?$/);
      if (ticketMatch) {
        const ticketId = ticketMatch[1];
        const subAction = ticketMatch[2];

        if (!subAction && req.method === 'GET') return handleGetTicketDetails(req, res, ticketId);
        if (subAction === 'status' && req.method === 'PUT') {
          const body = await parseJsonBody(req);
          return handleUpdateStatus(req, res, ticketId, body);
        }
        if (subAction === 'assign' && req.method === 'PUT') {
          const body = await parseJsonBody(req);
          return handleAssignTicket(req, res, ticketId, body);
        }
        if (subAction === 'comments' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          return handleAddComment(req, res, ticketId, body);
        }
      }

      if (pathname === '/api/users' && req.method === 'GET') return handleGetUsers(req, res);
      if (pathname === '/api/users' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        return handleCreateUser(req, res, body);
      }
      const userMatch = pathname.match(/^\\/api\\/users\\/(\\d+)$/);
      if (userMatch && req.method === 'PUT') {
        const body = await parseJsonBody(req);
        return handleUpdateUser(req, res, userMatch[1], body);
      }

      if (pathname === '/api/support-team' && req.method === 'GET') return handleGetSupportTeam(req, res);
      const supportMatch = pathname.match(/^\\/api\\/support-team\\/(\\d+)$/);
      if (supportMatch && req.method === 'PUT') {
        const body = await parseJsonBody(req);
        return handleUpdateSupportMember(req, res, supportMatch[1], body);
      }
      if (pathname === '/api/routing-rules' && req.method === 'GET') return handleGetRoutingRules(req, res);
      if (pathname === '/api/routing-rules' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        return handleSaveRoutingRule(req, res, body);
      }

      if (pathname === '/api/reports/dashboard' && req.method === 'GET') return handleGetDashboard(req, res);
      if (pathname === '/api/reports/export' && req.method === 'GET') return handleExportReport(req, res, query);

      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: \`API endpoint not found: \${pathname}\` }));
    } catch (err) {
      console.error('[API Error]', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Internal server error: ' + err.message }));
    }
  }

  // Static Frontend Serving
  let safePath = path.normalize(pathname).replace(/^(\\.\\.[\\/\\\\])+/, '');
  if (safePath === '/' || safePath === '\\\\') safePath = '/dashboard.html';

  const staticFilePath = path.join(FRONTEND_DIR, safePath);
  if (!staticFilePath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(staticFilePath, (err, stats) => {
    if (!err && stats.isFile()) return serveStaticFile(res, staticFilePath);
    const htmlFilePath = staticFilePath + '.html';
    if (fs.existsSync(htmlFilePath)) return serveStaticFile(res, htmlFilePath);
    serveStaticFile(res, path.join(FRONTEND_DIR, 'login.html'));
  });
});

db.testConnection().then(connected => {
  if (!connected) console.warn('[Warning] PostgreSQL connection test failed. Check .env credentials.');
  server.listen(PORT, HOST, () => {
    console.log('================================================================');
    console.log(' PARAMOUNT TEXTILE MILLS (P) LTD - IT SUPPORT HELP DESK SERVER');
    console.log('================================================================');
    console.log(\` Server running on http://\${HOST === '0.0.0.0' ? 'localhost' : HOST}:\${PORT}\`);
    console.log(\` Internal LAN access: http://<YOUR_WINDOWS_IP>:\${PORT}\`);
    console.log(' Database: PostgreSQL via node-postgres (pg)');
    console.log(' Real-time: Server-Sent Events (SSE) enabled at /api/events');
    console.log('================================================================');
  });
});

module.exports = server;`
  },
  {
    path: 'backend/db.js',
    folder: 'backend',
    filename: 'db.js',
    language: 'javascript',
    description: 'PostgreSQL connection pool via node-postgres pg package.',
    content: `const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'it_helpdesk_db',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  max: parseInt(process.env.PG_MAX_POOL || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB Error] Unexpected idle client error:', err.message);
});

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error('[DB Query Error]', { text: text.substring(0, 100), error: error.message });
    throw error;
  }
}

async function getClient() {
  const client = await pool.connect();
  return client;
}

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() AS current_time, current_database() AS db_name');
    console.log(\`[DB Connected] Successfully connected to PostgreSQL: \${res.rows[0].db_name} at \${res.rows[0].current_time}\`);
    return true;
  } catch (err) {
    console.error(\`[DB Connection Failed] \${err.message}\`);
    return false;
  }
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};`
  },
  {
    path: 'backend/auth.js',
    folder: 'backend',
    filename: 'auth.js',
    language: 'javascript',
    description: 'Password hashing with crypto.scrypt and session management.',
    content: `const crypto = require('node:crypto');
const db = require('./db');

const KEY_LENGTH = 64;
const SESSION_DURATION_HOURS = 12;

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      resolve({
        hash: derivedKey.toString('hex'),
        salt: salt
      });
    });
  });
}

function verifyPassword(password, salt, storedHash) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      const computedHash = derivedKey.toString('hex');
      const match = crypto.timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(storedHash, 'hex')
      );
      resolve(match);
    });
  });
}

async function createSession(userId, ipAddress, userAgent) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  await db.query(
    \`INSERT INTO sessions (session_id, user_id, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5)\`,
    [sessionId, userId, ipAddress || '127.0.0.1', userAgent || '', expiresAt]
  );

  return { sessionId, expiresAt };
}

async function validateSession(sessionId) {
  if (!sessionId) return null;

  const res = await db.query(
    \`SELECT s.session_id, s.expires_at, 
            u.id, u.employee_id, u.name, u.email, u.username, u.role, u.department_id, u.extension, u.phone, u.is_active,
            d.name AS department_name, d.code AS department_code,
            st.id AS support_team_id, st.designation AS support_designation
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN departments d ON u.department_id = d.id
     LEFT JOIN support_team st ON st.user_id = u.id
     WHERE s.session_id = $1 AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = TRUE\`,
    [sessionId]
  );

  if (res.rows.length === 0) return null;
  return res.rows[0];
}

async function destroySession(sessionId) {
  if (!sessionId) return;
  await db.query('DELETE FROM sessions WHERE session_id = $1', [sessionId]);
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSession,
  validateSession,
  destroySession
};`
  },

  // ==========================================
  // FRONTEND
  // ==========================================
  {
    path: 'frontend/login.html',
    folder: 'frontend',
    filename: 'login.html',
    language: 'html',
    description: 'Corporate login page with role demo shortcuts.',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - IT SUPPORT HELP DESK | Paramount Textile Mills (P) Ltd</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="login-page">
  <div class="login-card">
    <div class="login-brand">
      <div class="brand-icon" style="margin: 0 auto 12px auto; width: 48px; height: 48px; font-size: 22px;">PTM</div>
      <h2>Paramount Textile Mills (P) Ltd</h2>
      <p>IT SUPPORT & SAP HELP DESK</p>
    </div>

    <div id="login-error" class="alert alert-danger" style="display: none;"></div>

    <form id="login-form">
      <div class="form-group" style="margin-bottom: 16px;">
        <label for="username">Username or Corporate Email <span class="required-star">*</span></label>
        <input type="text" id="username" name="username" placeholder="e.g. admin or employee ID" required autocomplete="username">
      </div>

      <div class="form-group" style="margin-bottom: 20px;">
        <label for="password">Password <span class="required-star">*</span></label>
        <div class="password-input-wrapper">
          <input type="password" id="password" name="password" placeholder="Enter password" required autocomplete="current-password">
          <button type="button" id="toggle-password" class="password-toggle-btn" title="Show / Hide Password">Show</button>
        </div>
      </div>

      <button type="submit" id="btn-submit-login" class="btn btn-primary" style="width: 100%; padding: 11px;">
        Sign In to Help Desk
      </button>
    </form>

    <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
      <p style="font-weight: 600; margin-bottom: 6px; color: #334155;">Internal Demo Accounts (Password: <code>Paramount@123</code>):</p>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="setDemo('admin')">Admin (Veeramuthu)</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="setDemo('vijay')">Support (Vijay - MM)</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="setDemo('ramesh')">Employee (Ramesh - Weaving)</button>
      </div>
      <p style="margin-top: 10px; font-size: 11px; text-align: center;">Authorized internal company access only. Monitored by IT Dept.</p>
    </div>
  </div>

  <script src="js/api.js"></script>
  <script>
    const toggleBtn = document.getElementById('toggle-password');
    const passInput = document.getElementById('password');
    const loginForm = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error');
    const submitBtn = document.getElementById('btn-submit-login');

    toggleBtn.addEventListener('click', () => {
      if (passInput.type === 'password') {
        passInput.type = 'text';
        toggleBtn.textContent = 'Hide';
      } else {
        passInput.type = 'password';
        toggleBtn.textContent = 'Show';
      }
    });

    function setDemo(username) {
      document.getElementById('username').value = username;
      document.getElementById('password').value = 'Paramount@123';
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying credentials...';

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      try {
        const res = await api.login(username, password);
        if (res && res.success) {
          window.location.href = '/dashboard.html';
        }
      } catch (err) {
        errorBox.textContent = err.message || 'Login failed. Please check credentials.';
        errorBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In to Help Desk';
      }
    });
  </script>
</body>
</html>`
  },
  {
    path: 'frontend/css/style.css',
    folder: 'frontend/css',
    filename: 'style.css',
    language: 'css',
    description: 'Corporate blue CSS stylesheet for Help Desk.',
    content: `:root {
  --primary-900: #0c2340;
  --primary-800: #10335e;
  --primary-700: #15457f;
  --primary-600: #1e5ba3;
  --primary-500: #2563eb;
  --primary-400: #60a5fa;
  --primary-100: #dbeafe;
  --primary-50:  #eff6ff;
  
  --secondary-bg: #f8fafc;
  --card-bg: #ffffff;
  --border-color: #e2e8f0;
  --text-main: #1e293b;
  --text-muted: #64748b;
  
  --status-open: #0284c7;
  --status-open-bg: #e0f2fe;
  --status-progress: #d97706;
  --status-progress-bg: #fef3c7;
  --status-resolved: #16a34a;
  --status-resolved-bg: #dcfce7;
  --status-closed: #64748b;
  --status-closed-bg: #f1f5f9;

  --priority-low: #475569;
  --priority-low-bg: #f1f5f9;
  --priority-medium: #0284c7;
  --priority-medium-bg: #e0f2fe;
  --priority-high: #ea580c;
  --priority-high-bg: #ffedd5;
  --priority-critical: #dc2626;
  --priority-critical-bg: #fee2e2;

  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --sidebar-width: 260px;
  --header-height: 64px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-family); background-color: var(--secondary-bg); color: var(--text-main); line-height: 1.5; font-size: 14px; }
a { color: var(--primary-600); text-decoration: none; }
a:hover { text-decoration: underline; }

.app-container { display: flex; min-height: 100vh; }
.sidebar { width: var(--sidebar-width); background-color: var(--primary-900); color: #ffffff; display: flex; flex-direction: column; flex-shrink: 0; }
.sidebar-brand { padding: 20px 18px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); background-color: rgba(0, 0, 0, 0.15); }
.brand-icon { width: 38px; height: 38px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; color: #fff; }
.brand-title { font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
.brand-subtitle { font-size: 11px; color: #94a3b8; }
.sidebar-nav { list-style: none; padding: 16px 10px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
.nav-link { display: flex; align-items: center; gap: 12px; padding: 10px 14px; color: #cbd5e1; border-radius: 6px; font-size: 13.5px; font-weight: 500; }
.nav-link:hover { background-color: rgba(255, 255, 255, 0.08); color: #ffffff; }
.nav-link.active { background-color: var(--primary-600); color: #ffffff; font-weight: 600; }
.sidebar-footer { padding: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1); background-color: rgba(0, 0, 0, 0.2); }
.user-avatar { width: 36px; height: 36px; background-color: var(--primary-700); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.btn-logout { width: 100%; padding: 8px; background-color: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: #cbd5e1; border-radius: 6px; cursor: pointer; }
.btn-logout:hover { background-color: #ef4444; border-color: #ef4444; color: #fff; }

.main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.top-header { height: var(--header-height); background-color: #ffffff; border-bottom: 1px solid var(--border-color); padding: 0 28px; display: flex; align-items: center; justify-content: space-between; }
.content-body { padding: 24px 28px; flex: 1; max-width: 1400px; width: 100%; margin: 0 auto; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { background: #ffffff; padding: 18px 20px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; }
.stat-header { font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
.stat-value { font-size: 26px; font-weight: 700; color: var(--text-main); }
.stat-card.open .stat-value { color: var(--status-open); }
.stat-card.progress .stat-value { color: var(--status-progress); }
.stat-card.resolved .stat-value { color: var(--status-resolved); }
.stat-card.closed .stat-value { color: var(--status-closed); }
.stat-card.overdue .stat-value { color: #dc2626; }

.card { background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 24px; overflow: hidden; }
.card-header { padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; background-color: #fafbfd; }
.card-title { font-size: 15px; font-weight: 600; color: var(--primary-900); }
.card-body { padding: 20px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
.btn-primary { background-color: var(--primary-600); color: #ffffff; }
.btn-primary:hover { background-color: var(--primary-700); }
.btn-secondary { background-color: #ffffff; border-color: var(--border-color); color: var(--text-main); }
.btn-sm { padding: 5px 10px; font-size: 12px; }

.data-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
.data-table th { background-color: #f8fafc; padding: 12px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid var(--border-color); }
.data-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; }

.badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border-radius: 4px; font-size: 11.5px; font-weight: 600; }
.badge-open { background-color: var(--status-open-bg); color: var(--status-open); }
.badge-in-progress { background-color: var(--status-progress-bg); color: var(--status-progress); }
.badge-resolved { background-color: var(--status-resolved-bg); color: var(--status-resolved); }
.badge-closed { background-color: var(--status-closed-bg); color: var(--status-closed); }

.priority-badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
.priority-low { background: var(--priority-low-bg); color: var(--priority-low); }
.priority-medium { background: var(--priority-medium-bg); color: var(--priority-medium); }
.priority-high { background: var(--priority-high-bg); color: var(--priority-high); }
.priority-critical { background: var(--priority-critical-bg); color: var(--priority-critical); }

.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 20%, #1e40af, #0c2340 85%); padding: 20px; }
.login-card { width: 100%; max-width: 440px; background: #ffffff; border-radius: 12px; padding: 36px 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); }`
  },
  {
    path: 'frontend/js/api.js',
    folder: 'frontend/js',
    filename: 'api.js',
    language: 'javascript',
    description: 'Native fetch API client for Help Desk endpoints.',
    content: `const API_BASE = '/api';

const api = {
  async request(endpoint, options = {}) {
    const defaultHeaders = { 'Accept': 'application/json' };
    if (!(options.body instanceof FormData)) defaultHeaders['Content-Type'] = 'application/json';

    const config = { ...options, headers: { ...defaultHeaders, ...options.headers } };

    try {
      const response = await fetch(\`\${API_BASE}\${endpoint}\`, config);
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        window.location.href = '/login.html';
        return null;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || \`Request failed with status \${response.status}\`);
      return data;
    } catch (err) {
      console.error(\`API Error [\${endpoint}]:\`, err);
      throw err;
    }
  },

  login(username, password) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  },
  logout() { return this.request('/auth/logout', { method: 'POST' }); },
  getMe() { return this.request('/auth/me'); },
  getDepartments() { return this.request('/departments'); },
  getCategories() { return this.request('/categories'); },
  getTickets(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(\`/tickets?\${qs}\`);
  },
  createTicket(payload) {
    return this.request('/tickets', { method: 'POST', body: JSON.stringify(payload) });
  },
  getTicketDetails(ticketId) { return this.request(\`/tickets/\${ticketId}\`); },
  updateTicketStatus(ticketId, payload) {
    return this.request(\`/tickets/\${ticketId}/status\`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  assignTicket(ticketId, payload) {
    return this.request(\`/tickets/\${ticketId}/assign\`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  addComment(ticketId, payload) {
    return this.request(\`/tickets/\${ticketId}/comments\`, { method: 'POST', body: JSON.stringify(payload) });
  },
  getDashboard() { return this.request('/reports/dashboard'); },
  getExportUrl(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return \`\${API_BASE}/reports/export?\${qs}\`;
  },
  getUsers() { return this.request('/users'); },
  createUser(payload) { return this.request('/users', { method: 'POST', body: JSON.stringify(payload) }); },
  updateUser(id, payload) { return this.request(\`/users/\${id}\`, { method: 'PUT', body: JSON.stringify(payload) }); },
  getSupportTeam() { return this.request('/support-team'); },
  updateSupportMember(id, payload) {
    return this.request(\`/support-team/\${id}\`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  getRoutingRules() { return this.request('/routing-rules'); },
  saveRoutingRule(payload) { return this.request('/routing-rules', { method: 'POST', body: JSON.stringify(payload) }); },

  initSSE(onEvent) {
    if (!window.EventSource) return null;
    try {
      const evtSource = new EventSource(\`\${API_BASE}/events\`);
      evtSource.onmessage = (e) => {
        try { onEvent(JSON.parse(e.data)); } catch (err) {}
      };
      return evtSource;
    } catch (err) {
      return null;
    }
  }
};

window.api = api;`
  }
];
