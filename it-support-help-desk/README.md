# IT SUPPORT HELP DESK — PARAMOUNT TEXTILE MILLS (P) LTD

A production-grade, internal enterprise web application tailored for **Paramount Textile Mills (P) Ltd**, serving the company's SAP ERP and IT Support Department across 13 mill manufacturing and corporate divisions.

---

## TABLE OF CONTENTS
1. [Overview & Architecture](#1-overview--architecture)
2. [Technology Stack](#2-technology-stack)
3. [Windows & VS Code Beginner Setup Guide](#3-windows--vs-code-beginner-setup-guide)
4. [PostgreSQL & pgAdmin 4 Database Setup](#4-postgresql--pgadmin-4-database-setup)
5. [Configuring Environment Variables (`.env`)](#5-configuring-environment-variables-env)
6. [Starting the Application](#6-starting-the-application)
7. [Default Seed Accounts & Passwords](#7-default-seed-accounts--passwords)
8. [Company LAN / Intranet Deployment Guide](#8-company-lan--intranet-deployment-guide)
9. [REST API Route Documentation](#9-rest-api-route-documentation)
10. [End-to-End Testing Checklist](#10-end-to-end-testing-checklist)
11. [Troubleshooting Common Issues](#11-troubleshooting-common-issues)
12. [Backup & Maintenance Guide](#12-backup--maintenance-guide)

---

## 1. OVERVIEW & ARCHITECTURE

The application enables employees across all mill divisions (Store, Weaving, Sizing, Electrical, Marketing, Madeups-1, Madeups-2, HRD, Accounts, Export, Gate, Sample, PD) to submit and track support tickets.

### Support Team Directory (Configurable):
- **Kabilan** — SAP/IT Support — Intercom Extension: **712**
- **Vijay** — Functional Support Lead (MM) — Intercom Extension: **738**
- **Abhishek** — Functional Support Lead-2 — Intercom Extension: **738**
- **Arun** — MDM Head — Intercom Extension: **714**
- **Gowshik** — MDM Executive — Intercom Extension: **713**
- **Veeramuthu** — IT Admin — Intercom Extension: **919**
- **Monisha** — SSTPL Process — Intercom Extension: **715**

### Core Modules:
- **Dashboard**: Summary metrics, department distribution bar charts, SAP vs IT breakdown, recent activity, and SLA alerts.
- **Raise Ticket**: Auto-generated ticket IDs (`PTM-YYYY-XXXX`), pre-populated employee details, searchable 13 departments, SAP and IT categories, file uploads.
- **My Tickets**: Role-isolated ticket grid with multi-filter search, status badges, and pagination.
- **Ticket Details**: Complete lifecycle (Open → In Progress → Resolved → Closed), audit history trail, internal/public comments, resolution documentation, reassignment controls.
- **Admin & Support Panel**: Central ticket triage, support member editing, category routing configuration, scrypt user account provisioning, and CSV/Excel monthly reports with printable PDF output.

---

## 2. TECHNOLOGY STACK

- **Frontend**: Pure HTML5, CSS3 (Paramount corporate blue theme), native JavaScript (ES6+ `fetch()`). **Zero external frontend frameworks (No React, Angular or Vue in the standalone deployment)**.
- **Backend**: Node.js 24 LTS utilizing **native built-in modules** (`node:http`, `node:crypto`, `node:fs`, `node:path`, `node:url`). **Zero Express or external web framework dependency**.
- **Database**: PostgreSQL with `pg` connection pooling.
- **Authentication**: High-security server-side sessions with password hashing using Node.js built-in `crypto.scrypt`.
- **Real-Time Sync**: Server-Sent Events (SSE) with automatic reconnection.
- **Notifications**: Optional SMTP email integration with graceful fallback when unconfigured.

---

## 3. WINDOWS & VS CODE BEGINNER SETUP GUIDE

### Step 1: Install Node.js (LTS Version)
1. Visit [https://nodejs.org](https://nodejs.org) and download the **Windows Installer (.msi)** for Node.js 22 LTS or 24 LTS.
2. Run the installer, accept default settings, and verify in Command Prompt (`cmd`):
   ```cmd
   node -v
   npm -v
   ```

### Step 2: Install PostgreSQL & pgAdmin 4
1. Download PostgreSQL Windows Installer from [https://www.enterprisedb.com/downloads/postgres-postgresql-downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
2. During installation:
   - Remember the superuser password you enter for user `postgres` (e.g. `postgres` or `admin123`).
   - Default port is `5432`.
   - Ensure **pgAdmin 4** is checked in the installer components.

### Step 3: Open Project in Visual Studio Code
1. Open Visual Studio Code.
2. Click **File > Open Folder...** and select the folder `it-support-help-desk`.
3. Open the integrated terminal in VS Code: **Terminal > New Terminal** (or press `` Ctrl + ` ``).

---

## 4. POSTGRESQL & PGADMIN 4 DATABASE SETUP

### Option A: Using pgAdmin 4 GUI (Recommended for Beginners)
1. Open **pgAdmin 4** from your Windows Start Menu.
2. Enter your master password to unlock the PostgreSQL server.
3. In the left browser tree: Right-click **Databases > Create > Database...**.
   - Database name: `it_helpdesk_db`
   - Click **Save**.
4. Right-click the newly created database `it_helpdesk_db` and select **Query Tool**.
5. Open `database/schema.sql`:
   - Click the folder icon (Open File) in the Query Tool toolbar.
   - Browse to `it-support-help-desk/database/schema.sql` and click **Select**.
   - Click the **Execute / Run (F5 or Play button)** icon.
   - You should see: `"Query returned successfully"`.
6. Open `database/seed.sql`:
   - Open file `it-support-help-desk/database/seed.sql` in the Query Tool.
   - Click the **Execute / Run (F5)** icon.
   - You should see initial departments, users, support staff, categories, and sample tickets created!

### Option B: Using Windows Command Prompt / psql
```cmd
psql -U postgres -c "CREATE DATABASE it_helpdesk_db;"
psql -U postgres -d it_helpdesk_db -f database/schema.sql
psql -U postgres -d it_helpdesk_db -f database/seed.sql
```

---

## 5. CONFIGURING ENVIRONMENT VARIABLES (`.env`)

1. In the root directory `it-support-help-desk/`, copy `.env.example` to `.env`:
   ```cmd
   copy .env.example .env
   ```
2. Open `.env` in VS Code and verify the database password matches your local PostgreSQL setup:
   ```env
   PORT=3000
   HOST=0.0.0.0
   NODE_ENV=development

   PG_HOST=127.0.0.1
   PG_PORT=5432
   PG_DATABASE=it_helpdesk_db
   PG_USER=postgres
   PG_PASSWORD=your_actual_postgres_password
   PG_MAX_POOL=20
   ```

---

## 6. STARTING THE APPLICATION

In the VS Code terminal, run:

```cmd
# 1. Install required PostgreSQL driver package
npm install

# 2. Test database connection
npm run test-db

# 3. Start the application server
npm start
```

You will see:
```text
================================================================
 PARAMOUNT TEXTILE MILLS (P) LTD - IT SUPPORT HELP DESK SERVER
================================================================
 Server running on http://localhost:3000
 Internal LAN access: http://<YOUR_WINDOWS_IP>:3000
 Database: PostgreSQL via node-postgres (pg)
 Authentication: crypto.scrypt + HttpOnly Sessions
 Real-time: Server-Sent Events (SSE) enabled at /api/events
================================================================
```

Now open Google Chrome, Microsoft Edge, or Firefox and navigate to:
**`http://localhost:3000`**

---

## 7. DEFAULT SEED ACCOUNTS & PASSWORDS

All seeded accounts share the default password: **`Paramount@123`**

| Role | Username | Full Name | Department / Specialization | Intercom Extension |
|---|---|---|---|---|
| **Admin** | `admin` | Veeramuthu | IT Admin & Systems | **919** |
| **Support Lead** | `vijay` | Vijay | Functional Support Lead (MM) | **738** |
| **Support Lead** | `kabilan` | Kabilan | SAP & General IT Support | **712** |
| **Support Lead** | `arun` | Arun | MDM Head | **714** |
| **Support Lead** | `gowshik` | Gowshik | MDM Executive | **713** |
| **Support Lead** | `monisha` | Monisha | SSTPL Process | **715** |
| **Support Lead** | `abhishek`| Abhishek | Functional Support Lead-2 | **738** |
| **Employee** | `ramesh` | Ramesh Kannan | Weaving Division | **201** |
| **Employee** | `priya` | Priya Sharma | Accounts Division | **202** |
| **Employee** | `murugan` | Murugan S | Store Division | **203** |

---

## 8. COMPANY LAN / INTRANET DEPLOYMENT GUIDE

To allow other computers on Paramount Textile Mills' internal network (e.g. Yarn Store, Weaving Shed, Accounts, Security Gate) to open the Help Desk:

### Step 1: Bind Host to `0.0.0.0`
In your `.env` file, ensure:
```env
HOST=0.0.0.0
PORT=3000
```
This instructs Node.js to accept incoming HTTP connections on all internal network adapters.

### Step 2: Find Your Host Computer's Local IP Address
In Windows Command Prompt on the host machine:
```cmd
ipconfig
```
Look for **IPv4 Address** under your Ethernet or Wi-Fi adapter (e.g. `192.168.1.150` or `10.0.0.45`).

### Step 3: Configure Windows Defender Firewall for Port 3000
1. Open Windows Start Menu > Search for **"Windows Defender Firewall with Advanced Security"**.
2. Click **Inbound Rules** in the left sidebar > click **New Rule...** on the right.
3. Select **Port** > Click **Next**.
4. Select **TCP** and specify port: **`3000`** > Click **Next**.
5. Select **Allow the connection** > Click **Next**.
6. Check **Domain** and **Private** (do NOT check Public) > Click **Next**.
7. Name the rule: `Paramount Help Desk Port 3000` > Click **Finish**.

### Step 4: Access From Authorized Office Computers
On any other computer connected to the company LAN, open the browser and enter:
```text
http://192.168.1.150:3000
```
*(Replace `192.168.1.150` with your actual host IP address)*.

> **Security Note**: Never forward port 3000 on your company router or expose this port publicly to the external internet. Keep all access strictly confined to the internal office LAN/VPN.

---

## 9. REST API ROUTE DOCUMENTATION

All API endpoints return JSON payloads and standard HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Error`).

### Authentication & Sessions
- `POST /api/auth/login` — Authenticate username/email & password. Returns user object and sets `session_id` HttpOnly cookie.
- `POST /api/auth/logout` — Destroys server-side session and clears cookie.
- `GET /api/auth/me` — Returns current logged-in user details.

### Master Metadata
- `GET /api/departments` — List all 13 mill departments.
- `GET /api/categories` — List SAP Support & IT Support categories with default assignees.

### Ticket Lifecycle
- `GET /api/tickets` — List tickets with permission filtering (Employee sees own; Support/Admin sees queue/assigned). Query parameters: `status`, `priority`, `category_id`, `department_id`, `search`, `date_from`, `date_to`.
- `POST /api/tickets` — Create ticket. Generates sequential `PTM-YYYY-XXXX` number, checks routing rules, logs initial status, notifies via SSE & optional email.
- `GET /api/tickets/:id` — Retrieve full ticket record, status transition timeline, comments, and attachments.
- `PUT /api/tickets/:id/status` — Transition status (`Open` → `In Progress` → `Resolved` → `Closed`). Requires resolution notes when resolving.
- `PUT /api/tickets/:id/assign` — Assign or reassign ticket to support engineer with notes.
- `POST /api/tickets/:id/comments` — Add progress updates or internal notes.

### Analytics & Reports
- `GET /api/reports/dashboard` — Summary card counts, department bars, category distribution, recent activity feed, and overdue tickets.
- `GET /api/reports/export` — Filtered ticket query for monthly reports, with CSV export (`format=csv`).

### Administration
- `GET /api/users` & `POST /api/users` — Admin user management.
- `GET /api/support-team` & `PUT /api/support-team/:id` — Manage support team directory, extensions, and workload.
- `GET /api/routing-rules` & `POST /api/routing-rules` — Configurable category routing rules.

---

## 10. END-TO-END TESTING CHECKLIST

Execute this test verification sequence:

1. **Login Test**:
   - Navigate to `http://localhost:3000/login.html`.
   - Click "Admin (Veeramuthu)" demo button > Click Sign In. Confirm redirect to `dashboard.html`.
   - Log out > Sign in as Employee `ramesh` (Password: `Paramount@123`).
2. **Role Permission Check**:
   - Verify as employee `ramesh`, the "Admin & Support Panel" tab is hidden in the sidebar.
   - Navigate to `my-tickets.html` and verify only tickets submitted by Ramesh are visible.
3. **Raise Ticket Workflow**:
   - Navigate to `raise-ticket.html`.
   - Verify Employee Name ("Ramesh Kannan") and Employee ID ("EMP101") are auto-populated.
   - Select Department ("Weaving"), Division ("SAP Support"), Category ("SAP PP"), Priority ("Critical").
   - Title: `Loom Shed 2 Confirmation Blocked in CO11N`.
   - Description: `Production order 100984 confirmation giving deficit error`.
   - Click "Submit Support Ticket".
   - Confirm instant redirect to `my-tickets.html` showing the newly created ticket.
4. **Support Triage & Resolution**:
   - Log out and log in as `admin` or support lead `vijay`.
   - Open ticket details for the newly created ticket.
   - Click "Mark In Progress" > enter note "Investigating BOM staging in loom shed".
   - Click "Mark Resolved" > enter resolution notes "Staged required yarn quantity via MB1B movement type 311".
   - Confirm resolution details appear in green box with timestamp.
5. **Report & CSV Export**:
   - Go to "Admin & Support Panel" > Click "Reports & Data Export" tab.
   - Select date range and click "Export to CSV".
   - Confirm browser downloads `PTM_HelpDesk_Report_*.csv` file.

---

## 11. TROUBLESHOOTING COMMON ISSUES

### Issue 1: `ECONNREFUSED 127.0.0.1:5432`
- **Cause**: The PostgreSQL Windows Service is not running.
- **Fix**: Press `Windows Key + R`, type `services.msc`, locate `postgresql-x64-XX`, right-click and choose **Start**.

### Issue 2: `password authentication failed for user "postgres"`
- **Cause**: The password in `.env` does not match the password set during PostgreSQL installation.
- **Fix**: Open `.env` and update `PG_PASSWORD` to the correct password.

### Issue 3: Cannot access from other PCs on the company network
- **Cause**: Windows Defender Firewall is blocking inbound connections on port 3000, or Node is bound only to `127.0.0.1`.
- **Fix**: 
  1. Verify `.env` has `HOST=0.0.0.0`.
  2. Follow Section 8 to create an Inbound Firewall Rule for TCP Port 3000.
  3. Verify both PCs are on the same subnet (e.g. `192.168.1.X`).

---

## 12. BACKUP & MAINTENANCE GUIDE

To take daily or weekly backups of the database and uploaded attachments:

### Database Backup Command:
```cmd
pg_dump -U postgres -d it_helpdesk_db -F c -b -v -f "D:\PTM_Backups\it_helpdesk_%date:~-4,4%%date:~-10,2%%date:~-7,2%.backup"
```

### Attachment Backup:
Copy the `it-support-help-desk/uploads/` directory to an external drive or network share.
