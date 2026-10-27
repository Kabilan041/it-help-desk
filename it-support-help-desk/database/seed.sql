-- ==============================================================================
-- PARAMOUNT TEXTILE MILLS (P) LTD - IT SUPPORT HELP DESK
-- INITIAL SEED DATA
-- Default Passwords for all seeded users: "Paramount@123"
-- Salt: "ptm_helpdesk_salt_2026"
-- Generated via Node crypto.scryptSync("Paramount@123", "ptm_helpdesk_salt_2026", 64).toString('hex')
-- Hash: 7c554e2095dcf74291079361a9eb482cba1249b5962536c4ffefca8681b49f9df3bb863bc43d73507119f9fec2be6a25cfda7234ec410f73560b216ce7e01dc5
-- ==============================================================================

-- 1. INSERT DEPARTMENTS
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

-- 2. INSERT USERS (Admin, Support Leads, and Employees)
-- Common hash for 'Paramount@123'
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

-- 3. INSERT SUPPORT TEAM PROFILES
INSERT INTO support_team (user_id, full_name, designation, extension, specialization) VALUES
((SELECT id FROM users WHERE username = 'kabilan'), 'Kabilan', 'SAP/IT Support', '712', 'SAP & General IT'),
((SELECT id FROM users WHERE username = 'vijay'), 'Vijay', 'Functional Support Lead (MM)', '738', 'SAP MM & Procurement'),
((SELECT id FROM users WHERE username = 'abhishek'), 'Abhishek', 'Functional Support Lead-2', '738', 'SAP Functional & Sizing'),
((SELECT id FROM users WHERE username = 'arun'), 'Arun', 'MDM Head', '714', 'Master Data Management'),
((SELECT id FROM users WHERE username = 'gowshik'), 'Gowshik', 'MDM Executive', '713', 'SAP Master Data & Item Codes'),
((SELECT id FROM users WHERE username = 'admin'), 'Veeramuthu', 'IT Admin', '919', 'Server, Network & Systems'),
((SELECT id FROM users WHERE username = 'monisha'), 'Monisha', 'SSTPL Process', '715', 'SSTPL Process & PD Workflows')
ON CONFLICT (user_id) DO NOTHING;

-- 4. INSERT TICKET CATEGORIES (SAP Support & IT Support)
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

-- 5. INITIAL CONFIGURABLE ROUTING RULES
INSERT INTO routing_rules (category_id, support_team_id)
SELECT c.id, s.id
FROM ticket_categories c, support_team s
WHERE c.name = 'SAP MM' AND s.full_name = 'Vijay'
UNION ALL
SELECT c.id, s.id
FROM ticket_categories c, support_team s
WHERE c.name = 'SAP Master Data' AND s.full_name = 'Arun'
UNION ALL
SELECT c.id, s.id
FROM ticket_categories c, support_team s
WHERE c.name = 'Network' AND s.full_name = 'Veeramuthu'
UNION ALL
SELECT c.id, s.id
FROM ticket_categories c, support_team s
WHERE c.name = 'SSTPL Process' AND s.full_name = 'Monisha'
ON CONFLICT DO NOTHING;

-- 6. SAMPLE INITIAL TICKETS
INSERT INTO tickets (ticket_number, title, description, created_by, department_id, category_id, priority, status, contact_number, assigned_to, due_date, is_overdue, created_at, updated_at) VALUES
(
    'PTM-2026-1001',
    'Barcode printer not generating roll tags at Yarn Store',
    'Zebra ZT410 printer in Store division is showing Ribbon Out error despite new ribbon loaded. Weaving yarn issuance halted.',
    (SELECT id FROM users WHERE username = 'murugan'),
    (SELECT id FROM departments WHERE name = 'Store'),
    (SELECT id FROM ticket_categories WHERE name = 'Printer'),
    'High',
    'In Progress',
    'Ext 203 / 9842111003',
    (SELECT id FROM support_team WHERE full_name = 'Kabilan'),
    CURRENT_TIMESTAMP + INTERVAL '1 day',
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '3 hours',
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
),
(
    'PTM-2026-1002',
    'Goods Receipt MIGO 101 error - Deficit of SL Stock',
    'Attempting to post MIGO for PO 450008912 for Cotton Combed Yarn 40s. System throwing error Deficit of SL Stock 420 KGS in Store Location 1000.',
    (SELECT id FROM users WHERE username = 'murugan'),
    (SELECT id FROM departments WHERE name = 'Store'),
    (SELECT id FROM ticket_categories WHERE name = 'SAP MM'),
    'Critical',
    'Open',
    'Ext 203',
    (SELECT id FROM support_team WHERE full_name = 'Vijay'),
    CURRENT_TIMESTAMP + INTERVAL '4 hours',
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '1 hour',
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
),
(
    'PTM-2026-1003',
    'Loom Shed 3 Network Switch drop - Weaving Monitoring PC offline',
    'All 4 PCs connected to Sub-Switch 04 in Loom Shed 3 have lost LAN connection. Pinging default gateway 192.168.10.1 times out.',
    (SELECT id FROM users WHERE username = 'ramesh'),
    (SELECT id FROM departments WHERE name = 'Weaving'),
    (SELECT id FROM ticket_categories WHERE name = 'Network'),
    'Critical',
    'In Progress',
    'Ext 201',
    (SELECT id FROM support_team WHERE full_name = 'Veeramuthu'),
    CURRENT_TIMESTAMP + INTERVAL '6 hours',
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    CURRENT_TIMESTAMP - INTERVAL '30 minutes'
),
(
    'PTM-2026-1004',
    'New Material Master Code creation for Organic Ring Spun Yarn',
    'Need new SAP material code under Textile Raw Materials group for Organic Cotton 60s Compact Yarn for upcoming Export order.',
    (SELECT id FROM users WHERE username = 'anitha'),
    (SELECT id FROM departments WHERE name = 'Export'),
    (SELECT id FROM ticket_categories WHERE name = 'SAP Master Data'),
    'Medium',
    'Resolved',
    'Ext 204',
    (SELECT id FROM support_team WHERE full_name = 'Gowshik'),
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '4 hours'
),
(
    'PTM-2026-1005',
    'Outlook PST sync error on Accounts Desk 2',
    'Outlook 2021 constantly prompting for credentials and showing 0x8004010F mailbox unavailable.',
    (SELECT id FROM users WHERE username = 'priya'),
    (SELECT id FROM departments WHERE name = 'Accounts'),
    (SELECT id FROM ticket_categories WHERE name = 'Email / Outlook'),
    'Low',
    'Closed',
    'Ext 202',
    (SELECT id FROM support_team WHERE full_name = 'Kabilan'),
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    'PTM-2026-1006',
    'Gate CCTV Camera 04 stream distorted',
    'Main Weighbridge camera showing rolling black lines. Gate security cannot capture vehicle number plates.',
    (SELECT id FROM users WHERE username = 'admin'),
    (SELECT id FROM departments WHERE name = 'Gate'),
    (SELECT id FROM ticket_categories WHERE name = 'CCTV / DVR'),
    'High',
    'Open',
    'Ext 111',
    (SELECT id FROM support_team WHERE full_name = 'Veeramuthu'),
    CURRENT_TIMESTAMP - INTERVAL '5 hours',
    TRUE,
    CURRENT_TIMESTAMP - INTERVAL '28 hours',
    CURRENT_TIMESTAMP - INTERVAL '28 hours'
)
ON CONFLICT (ticket_number) DO NOTHING;

-- 7. INITIAL TICKET STATUS HISTORY
INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by, comments)
SELECT t.id, 'Open', 'In Progress', (SELECT id FROM users WHERE username = 'kabilan'), 'Technician dispatched to Store with replacement thermal head.'
FROM tickets t WHERE t.ticket_number = 'PTM-2026-1001'
UNION ALL
SELECT t.id, 'In Progress', 'Resolved', (SELECT id FROM users WHERE username = 'gowshik'), 'Material code MAT-ORG-60C created in SAP with all accounting and valuation views.'
FROM tickets t WHERE t.ticket_number = 'PTM-2026-1004'
UNION ALL
SELECT t.id, 'Resolved', 'Closed', (SELECT id FROM users WHERE username = 'admin'), 'Employee confirmed mailbox working normally.'
FROM tickets t WHERE t.ticket_number = 'PTM-2026-1005';

-- 8. INITIAL COMMENTS
INSERT INTO ticket_comments (ticket_id, author_id, message, is_internal)
SELECT t.id, (SELECT id FROM users WHERE username = 'kabilan'), 'Checked Zebra printer calibration. Found sensor dust accumulation. Cleaning thermal print head now.', FALSE
FROM tickets t WHERE t.ticket_number = 'PTM-2026-1001'
UNION ALL
SELECT t.id, (SELECT id FROM users WHERE username = 'murugan'), 'Please expedite if possible as 4 yarn packing trucks are waiting at Bay 2.', FALSE
FROM tickets t WHERE t.ticket_number = 'PTM-2026-1001'
UNION ALL
SELECT t.id, (SELECT id FROM users WHERE username = 'vijay'), 'Checking MM inventory balance for storage location 1000 in SAP MMBE.', FALSE
FROM tickets t WHERE t.ticket_number = 'PTM-2026-1002';
