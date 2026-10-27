import { Department, SupportTeamMember, TicketCategory, User, Ticket } from './types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 1, name: 'Store', code: 'STR', extension: '101' },
  { id: 2, name: 'Weaving', code: 'WVG', extension: '102' },
  { id: 3, name: 'Sizing', code: 'SZG', extension: '103' },
  { id: 4, name: 'Electrical', code: 'ELE', extension: '104' },
  { id: 5, name: 'Marketing', code: 'MKT', extension: '105' },
  { id: 6, name: 'Madeups-1', code: 'MU1', extension: '106' },
  { id: 7, name: 'Madeups-2', code: 'MU2', extension: '107' },
  { id: 8, name: 'HRD', code: 'HRD', extension: '108' },
  { id: 9, name: 'Accounts', code: 'ACC', extension: '109' },
  { id: 10, name: 'Export', code: 'EXP', extension: '110' },
  { id: 11, name: 'Gate', code: 'GTE', extension: '111' },
  { id: 12, name: 'Sample', code: 'SMP', extension: '112' },
  { id: 13, name: 'PD', code: 'PD', extension: '113' }
];

export const INITIAL_SUPPORT_TEAM: SupportTeamMember[] = [
  { id: 1, user_id: 2, full_name: 'Kabilan', designation: 'SAP/IT Support', extension: '712', specialization: 'SAP & General IT', is_active: true, active_tickets_count: 2 },
  { id: 2, user_id: 3, full_name: 'Vijay', designation: 'Functional Support Lead (MM)', extension: '738', specialization: 'SAP MM & Procurement', is_active: true, active_tickets_count: 1 },
  { id: 3, user_id: 4, full_name: 'Abhishek', designation: 'Functional Support Lead-2', extension: '738', specialization: 'SAP Functional & Sizing', is_active: true, active_tickets_count: 0 },
  { id: 4, user_id: 5, full_name: 'Arun', designation: 'MDM Head', extension: '714', specialization: 'Master Data Management', is_active: true, active_tickets_count: 1 },
  { id: 5, user_id: 6, full_name: 'Gowshik', designation: 'MDM Executive', extension: '713', specialization: 'SAP Master Data & Item Codes', is_active: true, active_tickets_count: 0 },
  { id: 6, user_id: 1, full_name: 'Veeramuthu', designation: 'IT Admin', extension: '919', specialization: 'Server, Network & Systems', is_active: true, active_tickets_count: 2 },
  { id: 7, user_id: 7, full_name: 'Monisha', designation: 'SSTPL Process', extension: '715', specialization: 'SSTPL Process & PD Workflows', is_active: true, active_tickets_count: 0 }
];

export const INITIAL_USERS: User[] = [
  { id: 1, employee_id: 'ADM001', name: 'Veeramuthu', email: 'veeramuthu@paramounttextiles.com', username: 'admin', role: 'admin', department_id: 4, department_name: 'Electrical', extension: '919', phone: '9842000919', is_active: true, support_team_id: 6 },
  { id: 2, employee_id: 'SUP001', name: 'Kabilan', email: 'kabilan@paramounttextiles.com', username: 'kabilan', role: 'support', department_id: 13, department_name: 'PD', extension: '712', phone: '9842000712', is_active: true, support_team_id: 1 },
  { id: 3, employee_id: 'SUP002', name: 'Vijay', email: 'vijay@paramounttextiles.com', username: 'vijay', role: 'support', department_id: 1, department_name: 'Store', extension: '738', phone: '9842000738', is_active: true, support_team_id: 2 },
  { id: 4, employee_id: 'SUP003', name: 'Abhishek', email: 'abhishek@paramounttextiles.com', username: 'abhishek', role: 'support', department_id: 1, department_name: 'Store', extension: '738', phone: '9842000739', is_active: true, support_team_id: 3 },
  { id: 5, employee_id: 'SUP004', name: 'Arun', email: 'arun@paramounttextiles.com', username: 'arun', role: 'support', department_id: 13, department_name: 'PD', extension: '714', phone: '9842000714', is_active: true, support_team_id: 4 },
  { id: 6, employee_id: 'SUP005', name: 'Gowshik', email: 'gowshik@paramounttextiles.com', username: 'gowshik', role: 'support', department_id: 13, department_name: 'PD', extension: '713', phone: '9842000713', is_active: true, support_team_id: 5 },
  { id: 7, employee_id: 'SUP006', name: 'Monisha', email: 'monisha@paramounttextiles.com', username: 'monisha', role: 'support', department_id: 13, department_name: 'PD', extension: '715', phone: '9842000715', is_active: true, support_team_id: 7 },
  { id: 8, employee_id: 'EMP101', name: 'Ramesh Kannan', email: 'ramesh.k@paramounttextiles.com', username: 'ramesh', role: 'employee', department_id: 2, department_name: 'Weaving', extension: '201', phone: '9842111001', is_active: true },
  { id: 9, employee_id: 'EMP102', name: 'Priya Sharma', email: 'priya.s@paramounttextiles.com', username: 'priya', role: 'employee', department_id: 9, department_name: 'Accounts', extension: '202', phone: '9842111002', is_active: true },
  { id: 10, employee_id: 'EMP103', name: 'Murugan S', email: 'murugan.s@paramounttextiles.com', username: 'murugan', role: 'employee', department_id: 1, department_name: 'Store', extension: '203', phone: '9842111003', is_active: true },
  { id: 11, employee_id: 'EMP104', name: 'Anitha Raj', email: 'anitha.r@paramounttextiles.com', username: 'anitha', role: 'employee', department_id: 10, department_name: 'Export', extension: '204', phone: '9842111004', is_active: true }
];

export const INITIAL_CATEGORIES: TicketCategory[] = [
  // SAP Support
  { id: 1, division: 'SAP Support', name: 'SAP MM', description: 'Materials Management, PO, Goods Receipt, Vendor Master issues', default_assigned_to: 2 },
  { id: 2, division: 'SAP Support', name: 'SAP PP', description: 'Production Planning, Routing, BOM, Shop Floor execution' },
  { id: 3, division: 'SAP Support', name: 'SAP SD', description: 'Sales and Distribution, Customer invoicing, Delivery notes' },
  { id: 4, division: 'SAP Support', name: 'SAP QM', description: 'Quality Management, Inspection lots, Certificate of Analysis' },
  { id: 5, division: 'SAP Support', name: 'SAP WMS', description: 'Warehouse Management System, Storage bin allocation, Picking' },
  { id: 6, division: 'SAP Support', name: 'SAP Master Data', description: 'Material master creation, Cost center, GL accounts setup', default_assigned_to: 4 },
  { id: 7, division: 'SAP Support', name: 'SAP Procurement', description: 'Purchase requisitions, Approvals, Service PO entry' },
  { id: 8, division: 'SAP Support', name: 'SAP Inventory', description: 'Stock transfers, Physical verification, Movement types' },
  { id: 9, division: 'SAP Support', name: 'SAP Production', description: 'Production order confirmation, Variance calculation' },
  { id: 10, division: 'SAP Support', name: 'SAP Sales Order', description: 'Sales order block removal, Pricing condition adjustment' },

  // IT Support
  { id: 11, division: 'IT Support', name: 'Hardware', description: 'Desktop, Laptop, SMPS, RAM, Motherboard, Hard drive defects' },
  { id: 12, division: 'IT Support', name: 'Software', description: 'OS errors, Antivirus, Adobe, WinRAR, Utility installations' },
  { id: 13, division: 'IT Support', name: 'Printer', description: 'Thermal barcode printer, Laser jet paper jam, Cartridge replacement', default_assigned_to: 1 },
  { id: 14, division: 'IT Support', name: 'Network', description: 'LAN cable crimping, Switch port, IP conflict, Internal Firewall connectivity', default_assigned_to: 6 },
  { id: 15, division: 'IT Support', name: 'Internet', description: 'Broadband link down, Lease line outage, Proxy authentication' },
  { id: 16, division: 'IT Support', name: 'Email / Outlook', description: 'PST file corrupt, Outlook sync error, Webmail password reset' },
  { id: 17, division: 'IT Support', name: 'Access / Login', description: 'Active Directory lockout, Domain join, Folder permissions' },
  { id: 18, division: 'IT Support', name: 'Meeting / Microsoft Teams', description: 'Conference room display, Teams audio/video, Projector connectivity' },
  { id: 19, division: 'IT Support', name: 'CCTV / DVR', description: 'Security camera offline, DVR recording check, Gate surveillance stream' },
  { id: 20, division: 'IT Support', name: 'Other IT Issue', description: 'UPS battery backup, Telephone line EPABX, General queries' }
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 1,
    ticket_number: 'PTM-2026-1001',
    title: 'Barcode printer not generating roll tags at Yarn Store',
    description: 'Zebra ZT410 printer in Store division is showing Ribbon Out error despite new ribbon loaded. Weaving yarn issuance halted.',
    created_by: 10,
    creator_name: 'Murugan S',
    creator_employee_id: 'EMP103',
    creator_email: 'murugan.s@paramounttextiles.com',
    department_id: 1,
    department_name: 'Store',
    category_id: 13,
    category_name: 'Printer',
    category_division: 'IT Support',
    priority: 'High',
    status: 'In Progress',
    contact_number: 'Ext 203 / 9842111003',
    assigned_to: 1,
    assigned_to_name: 'Kabilan',
    assigned_to_extension: '712',
    due_date: '2026-10-27T14:00:00Z',
    is_overdue: false,
    created_at: '2026-10-26T06:30:00Z',
    updated_at: '2026-10-26T08:15:00Z',
    comments: [
      { id: 1, ticket_id: 1, author_id: 2, author_name: 'Kabilan', author_role: 'support', message: 'Checked Zebra printer calibration. Found sensor dust accumulation. Cleaning thermal print head now.', is_internal: false, created_at: '2026-10-26T07:15:00Z' },
      { id: 2, ticket_id: 1, author_id: 10, author_name: 'Murugan S', author_role: 'employee', message: 'Please expedite if possible as 4 yarn packing trucks are waiting at Bay 2.', is_internal: false, created_at: '2026-10-26T07:45:00Z' }
    ],
    history: [
      { id: 1, ticket_id: 1, old_status: null, new_status: 'Open', changed_by: 10, changed_by_name: 'Murugan S', changed_by_role: 'employee', comments: 'Ticket logged.', created_at: '2026-10-26T06:30:00Z' },
      { id: 2, ticket_id: 1, old_status: 'Open', new_status: 'In Progress', changed_by: 2, changed_by_name: 'Kabilan', changed_by_role: 'support', comments: 'Engineer on site with cleaning supplies.', created_at: '2026-10-26T07:10:00Z' }
    ]
  },
  {
    id: 2,
    ticket_number: 'PTM-2026-1002',
    title: 'Goods Receipt MIGO 101 error - Deficit of SL Stock',
    description: 'Attempting to post MIGO for PO 450008912 for Cotton Combed Yarn 40s. System throwing error Deficit of SL Stock 420 KGS in Store Location 1000.',
    created_by: 10,
    creator_name: 'Murugan S',
    creator_employee_id: 'EMP103',
    creator_email: 'murugan.s@paramounttextiles.com',
    department_id: 1,
    department_name: 'Store',
    category_id: 1,
    category_name: 'SAP MM',
    category_division: 'SAP Support',
    priority: 'Critical',
    status: 'Open',
    contact_number: 'Ext 203',
    assigned_to: 2,
    assigned_to_name: 'Vijay',
    assigned_to_extension: '738',
    due_date: '2026-10-26T18:00:00Z',
    is_overdue: false,
    created_at: '2026-10-26T08:00:00Z',
    updated_at: '2026-10-26T08:00:00Z',
    comments: [
      { id: 3, ticket_id: 2, author_id: 3, author_name: 'Vijay', author_role: 'support', message: 'Checking MM inventory balance for storage location 1000 in SAP MMBE.', is_internal: false, created_at: '2026-10-26T08:05:00Z' }
    ],
    history: [
      { id: 3, ticket_id: 2, old_status: null, new_status: 'Open', changed_by: 10, changed_by_name: 'Murugan S', changed_by_role: 'employee', comments: 'Critical SAP MM issue raised.', created_at: '2026-10-26T08:00:00Z' }
    ]
  },
  {
    id: 3,
    ticket_number: 'PTM-2026-1003',
    title: 'Loom Shed 3 Network Switch drop - Weaving Monitoring PC offline',
    description: 'All 4 PCs connected to Sub-Switch 04 in Loom Shed 3 have lost LAN connection. Pinging default gateway 192.168.10.1 times out.',
    created_by: 8,
    creator_name: 'Ramesh Kannan',
    creator_employee_id: 'EMP101',
    creator_email: 'ramesh.k@paramounttextiles.com',
    department_id: 2,
    department_name: 'Weaving',
    category_id: 14,
    category_name: 'Network',
    category_division: 'IT Support',
    priority: 'Critical',
    status: 'In Progress',
    contact_number: 'Ext 201',
    assigned_to: 6,
    assigned_to_name: 'Veeramuthu',
    assigned_to_extension: '919',
    due_date: '2026-10-26T14:30:00Z',
    is_overdue: false,
    created_at: '2026-10-26T07:00:00Z',
    updated_at: '2026-10-26T08:30:00Z',
    comments: [
      { id: 4, ticket_id: 3, author_id: 1, author_name: 'Veeramuthu', author_role: 'admin', message: 'Core rack port 18 shows link down. Tracing optic patch cable in Weaving corridor.', is_internal: true, created_at: '2026-10-26T07:20:00Z' }
    ],
    history: [
      { id: 4, ticket_id: 3, old_status: null, new_status: 'Open', changed_by: 8, changed_by_name: 'Ramesh Kannan', changed_by_role: 'employee', comments: 'Loom shed LAN offline.', created_at: '2026-10-26T07:00:00Z' },
      { id: 5, ticket_id: 3, old_status: 'Open', new_status: 'In Progress', changed_by: 1, changed_by_name: 'Veeramuthu', changed_by_role: 'admin', comments: 'Technician inspecting switch enclosure.', created_at: '2026-10-26T07:15:00Z' }
    ]
  },
  {
    id: 4,
    ticket_number: 'PTM-2026-1004',
    title: 'New Material Master Code creation for Organic Ring Spun Yarn',
    description: 'Need new SAP material code under Textile Raw Materials group for Organic Cotton 60s Compact Yarn for upcoming Export order.',
    created_by: 11,
    creator_name: 'Anitha Raj',
    creator_employee_id: 'EMP104',
    creator_email: 'anitha.r@paramounttextiles.com',
    department_id: 10,
    department_name: 'Export',
    category_id: 6,
    category_name: 'SAP Master Data',
    category_division: 'SAP Support',
    priority: 'Medium',
    status: 'Resolved',
    contact_number: 'Ext 204',
    assigned_to: 5,
    assigned_to_name: 'Gowshik',
    assigned_to_extension: '713',
    resolution_notes: 'Material code MAT-ORG-60C created in SAP with all accounting, valuation, and sales views populated.',
    resolved_at: '2026-10-25T16:30:00Z',
    due_date: '2026-10-25T18:00:00Z',
    is_overdue: false,
    created_at: '2026-10-24T10:00:00Z',
    updated_at: '2026-10-25T16:30:00Z',
    history: [
      { id: 6, ticket_id: 4, old_status: 'Open', new_status: 'Resolved', changed_by: 6, changed_by_name: 'Gowshik', changed_by_role: 'support', comments: 'Code generated in MM01.', created_at: '2026-10-25T16:30:00Z' }
    ]
  },
  {
    id: 5,
    ticket_number: 'PTM-2026-1005',
    title: 'Outlook PST sync error on Accounts Desk 2',
    description: 'Outlook 2021 constantly prompting for credentials and showing 0x8004010F mailbox unavailable.',
    created_by: 9,
    creator_name: 'Priya Sharma',
    creator_employee_id: 'EMP102',
    creator_email: 'priya.s@paramounttextiles.com',
    department_id: 9,
    department_name: 'Accounts',
    category_id: 16,
    category_name: 'Email / Outlook',
    category_division: 'IT Support',
    priority: 'Low',
    status: 'Closed',
    contact_number: 'Ext 202',
    assigned_to: 1,
    assigned_to_name: 'Kabilan',
    assigned_to_extension: '712',
    resolution_notes: 'Ran scanpst.exe tool on Outlook archive and refreshed Office 365 token.',
    resolved_at: '2026-10-23T11:00:00Z',
    closed_at: '2026-10-23T15:00:00Z',
    due_date: '2026-10-24T12:00:00Z',
    is_overdue: false,
    created_at: '2026-10-22T09:00:00Z',
    updated_at: '2026-10-23T15:00:00Z'
  },
  {
    id: 6,
    ticket_number: 'PTM-2026-1006',
    title: 'Gate CCTV Camera 04 stream distorted',
    description: 'Main Weighbridge camera showing rolling black lines. Gate security cannot capture vehicle number plates.',
    created_by: 1,
    creator_name: 'Veeramuthu',
    creator_employee_id: 'ADM001',
    creator_email: 'veeramuthu@paramounttextiles.com',
    department_id: 11,
    department_name: 'Gate',
    category_id: 19,
    category_name: 'CCTV / DVR',
    category_division: 'IT Support',
    priority: 'High',
    status: 'Open',
    contact_number: 'Ext 111',
    assigned_to: 6,
    assigned_to_name: 'Veeramuthu',
    assigned_to_extension: '919',
    due_date: '2026-10-25T12:00:00Z',
    is_overdue: true,
    created_at: '2026-10-24T14:00:00Z',
    updated_at: '2026-10-24T14:00:00Z'
  }
];
