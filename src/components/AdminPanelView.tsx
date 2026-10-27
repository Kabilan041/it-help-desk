import React, { useState } from 'react';
import { 
  Ticket, 
  User, 
  SupportTeamMember, 
  Department, 
  TicketCategory, 
  RoutingRule, 
  Priority, 
  TicketStatus,
  Role
} from '../types';
import { 
  Users, 
  ShieldCheck, 
  FileSpreadsheet, 
  UserPlus, 
  Edit, 
  Check, 
  Download, 
  Printer, 
  Search, 
  Phone, 
  AlertCircle,
  FolderTree
} from 'lucide-react';

interface AdminPanelViewProps {
  tickets: Ticket[];
  currentUser: User;
  users: User[];
  supportTeam: SupportTeamMember[];
  departments: Department[];
  categories: TicketCategory[];
  onSelectTicket: (id: number) => void;
  onUpdateSupportMember: (id: number, data: Partial<SupportTeamMember>) => void;
  onCreateUser: (user: Partial<User>) => void;
  onUpdateUser: (id: number, data: Partial<User>) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  tickets,
  currentUser,
  users,
  supportTeam,
  departments,
  categories,
  onSelectTicket,
  onUpdateSupportMember,
  onCreateUser,
  onUpdateUser
}) => {
  const [activeTab, setActiveTab] = useState<'triage' | 'team' | 'users' | 'reports'>('triage');

  // Support Team Editing State
  const [editingMember, setEditingMember] = useState<SupportTeamMember | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editExtension, setEditExtension] = useState('');
  const [editSpecialization, setEditSpecialization] = useState('');

  // User Creation State
  const [newEmpId, setNewEmpId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('Paramount@123');
  const [newRole, setNewRole] = useState<Role>('employee');
  const [newDeptId, setNewDeptId] = useState<number>(1);
  const [newExt, setNewExt] = useState('');
  const [userCreatedMsg, setUserCreatedMsg] = useState('');

  // Reports Filter State
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportDeptId, setReportDeptId] = useState<string>('All');
  const [reportSupportId, setReportSupportId] = useState<string>('All');
  const [reportStatus, setReportStatus] = useState<string>('All');
  const [reportPriority, setReportPriority] = useState<string>('All');

  // Handle Edit Support Member
  const startEditMember = (m: SupportTeamMember) => {
    setEditingMember(m);
    setEditFullName(m.full_name);
    setEditDesignation(m.designation);
    setEditExtension(m.extension);
    setEditSpecialization(m.specialization);
  };

  const saveEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    onUpdateSupportMember(editingMember.id, {
      full_name: editFullName.trim(),
      designation: editDesignation.trim(),
      extension: editExtension.trim(),
      specialization: editSpecialization.trim()
    });
    setEditingMember(null);
  };

  // Handle User Create
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpId || !newName || !newUsername) return;

    const selectedDept = departments.find(d => d.id === Number(newDeptId));
    onCreateUser({
      employee_id: newEmpId.trim(),
      name: newName.trim(),
      email: newEmail.trim() || `${newUsername}@paramounttextiles.com`,
      username: newUsername.trim().toLowerCase(),
      role: newRole,
      department_id: Number(newDeptId),
      department_name: selectedDept?.name,
      extension: newExt.trim(),
      is_active: true
    });

    setUserCreatedMsg(`User account ${newUsername} created with scrypt password hashing.`);
    setNewEmpId('');
    setNewName('');
    setNewEmail('');
    setNewUsername('');
    setNewExt('');
    setTimeout(() => setUserCreatedMsg(''), 4000);
  };

  // Filtered tickets for report
  const reportFilteredTickets = tickets.filter(t => {
    if (reportDeptId !== 'All' && t.department_id !== Number(reportDeptId)) return false;
    if (reportSupportId !== 'All' && t.assigned_to !== Number(reportSupportId)) return false;
    if (reportStatus !== 'All' && t.status !== reportStatus) return false;
    if (reportPriority !== 'All' && t.priority !== reportPriority) return false;
    if (reportDateFrom && new Date(t.created_at) < new Date(reportDateFrom)) return false;
    if (reportDateTo) {
      const end = new Date(reportDateTo);
      end.setHours(23, 59, 59);
      if (new Date(t.created_at) > end) return false;
    }
    return true;
  });

  // Export to CSV Function
  const exportCSV = () => {
    const headers = ['Ticket #', 'Title', 'Priority', 'Status', 'Employee', 'Emp ID', 'Department', 'Category', 'Division', 'Assigned Engineer', 'Created Date', 'Resolved Date', 'Resolution Notes'];
    const rows = reportFilteredTickets.map(t => [
      `"${t.ticket_number}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${t.creator_name.replace(/"/g, '""')}"`,
      `"${t.creator_employee_id}"`,
      `"${t.department_name}"`,
      `"${t.category_name}"`,
      `"${t.category_division}"`,
      `"${t.assigned_to_name || 'Unassigned'}"`,
      `"${new Date(t.created_at).toLocaleString()}"`,
      `"${t.resolved_at ? new Date(t.resolved_at).toLocaleString() : ''}"`,
      `"${(t.resolution_notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PTM_HelpDesk_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">IT Administration & Support Management Console</h1>
        <p className="text-xs text-slate-500">
          Paramount Textile Mills (P) Ltd &bull; Mill-wide triage, team roster, user provisioning & audit reports
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('triage')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'triage'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Ticket Triage & SLA Queue
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'team'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Support Team Directory (7 Leads)
        </button>
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            User Accounts & Roles
          </button>
        )}
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'reports'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Monthly Reports & CSV Export
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: TICKET TRIAGE & SLA QUEUE                         */}
      {/* ========================================================= */}
      {activeTab === 'triage' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Mill Tickets Priority Triage Queue ({tickets.length})
              </h2>
              <p className="text-[11px] text-slate-500">Review SLA deadlines, overdue flags, and assign engineers</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Ticket #</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Raised By</th>
                  <th className="px-4 py-3">Dept</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Lead</th>
                  <th className="px-4 py-3">Target Due</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tickets.map(t => {
                  const isOverdue = t.is_overdue || (new Date(t.due_date) < new Date() && t.status !== 'Resolved' && t.status !== 'Closed');
                  return (
                    <tr 
                      key={t.id}
                      onClick={() => onSelectTicket(t.id)}
                      className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                        isOverdue ? 'bg-red-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {t.ticket_number}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 max-w-[200px] truncate" title={t.title}>
                        {t.title}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-slate-800">{t.creator_name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{t.creator_employee_id}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{t.department_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{t.category_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                          t.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                          t.priority === 'Medium' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'Open' ? 'bg-sky-100 text-sky-800' :
                          t.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                          t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {t.assigned_to_name ? (
                          <div>
                            <strong className="text-slate-800">{t.assigned_to_name}</strong>
                            <span className="text-[10px] text-slate-400 block font-mono">Ext {t.assigned_to_extension}</span>
                          </div>
                        ) : (
                          <span className="text-red-500 font-semibold italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[11px]">
                        <span className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}>
                          {new Date(t.due_date).toLocaleDateString()}
                        </span>
                        {isOverdue && (
                          <span className="text-[9px] font-bold text-red-600 block uppercase">Overdue</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicket(t.id);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          Triage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SUPPORT TEAM DIRECTORY (7 Initial Leads)           */}
      {/* ========================================================= */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Support Team Directory Table (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Paramount Support Team Directory (Configurable Extensions)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Includes Kabilan, Vijay, Abhishek, Arun, Gowshik, Veeramuthu, Monisha
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Support Lead</th>
                    <th className="px-4 py-3">Designation / Role</th>
                    <th className="px-4 py-3">Intercom Ext</th>
                    <th className="px-4 py-3">Domain Specialization</th>
                    <th className="px-4 py-3">Status</th>
                    {currentUser.role === 'admin' && (
                      <th className="px-4 py-3 text-right">Edit</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {supportTeam.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {m.full_name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{m.designation}</td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        Ext {m.extension}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{m.specialization}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {m.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {currentUser.role === 'admin' && (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => startEditMember(m)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            Edit Ext
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Support Member Form (1 Col) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {editingMember ? `Edit ${editingMember.full_name}` : 'Select a Support Lead to Edit'}
            </h3>

            {editingMember ? (
              <form onSubmit={saveEditMember} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Designation</label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Intercom Extension</label>
                  <input
                    type="text"
                    value={editExtension}
                    onChange={(e) => setEditExtension(e.target.value)}
                    placeholder="e.g. 712, 738, 919"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Domain Specialization</label>
                  <input
                    type="text"
                    value={editSpecialization}
                    onChange={(e) => setEditSpecialization(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-400">
                Click "Edit Ext" next to any support engineer (e.g. Kabilan, Vijay, Monisha) to modify their extension or assignment scope without hardcoding.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: USER ACCOUNTS (ADMIN ONLY)                         */}
      {/* ========================================================= */}
      {activeTab === 'users' && currentUser.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Authorized Company User Accounts ({users.length})
                </h2>
                <p className="text-[11px] text-slate-500">
                  Managed accounts &bull; No public registration &bull; scrypt password security
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Emp ID</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Ext / Phone</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{u.employee_id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{u.name}</td>
                      <td className="px-4 py-3 text-slate-600">{u.username}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-red-100 text-red-800' :
                          u.role === 'support' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">{u.department_name || 'N/A'}</td>
                      <td className="px-4 py-3 font-mono text-[11px]">{u.extension ? `Ext ${u.extension}` : u.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create User Form (1 Col) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>Register Authorized Employee</span>
            </h3>

            {userCreatedMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {userCreatedMsg}
              </div>
            )}

            <form onSubmit={handleUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Employee ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value)}
                  placeholder="e.g. EMP105"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. S. Murugesan"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Username <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. murugesan"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Corporate Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. murugesan@paramounttextiles.com"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Role Permission <span className="text-red-500">*</span></label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                >
                  <option value="employee">Employee (View/Raise Own Tickets)</option>
                  <option value="support">Support Lead (Triage & Resolve Tickets)</option>
                  <option value="admin">IT Administrator (Full Control)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Department</label>
                <select
                  value={newDeptId}
                  onChange={(e) => setNewDeptId(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Intercom Extension</label>
                <input
                  type="text"
                  value={newExt}
                  onChange={(e) => setNewExt(e.target.value)}
                  placeholder="e.g. 205"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors mt-2"
              >
                Create Account (scrypt Hashed)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: MONTHLY REPORTS & DATA EXPORT                      */}
      {/* ========================================================= */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Help Desk Monthly Audit & Performance Reports
              </h2>
              <p className="text-xs text-slate-500">
                Query records, filter by department, support engineer, status, and download CSV / Excel
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export to CSV</span>
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export to Excel</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print-Friendly PDF</span>
              </button>
            </div>
          </div>

          {/* Filter Bar for Reports */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Start Date</label>
              <input
                type="date"
                value={reportDateFrom}
                onChange={(e) => setReportDateFrom(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">End Date</label>
              <input
                type="date"
                value={reportDateTo}
                onChange={(e) => setReportDateTo(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Department</label>
              <select
                value={reportDeptId}
                onChange={(e) => setReportDeptId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="All">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Support Member</label>
              <select
                value={reportSupportId}
                onChange={(e) => setReportSupportId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="All">All Engineers</option>
                {supportTeam.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.extension})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={reportStatus}
                onChange={(e) => setReportStatus(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Priority</label>
              <select
                value={reportPriority}
                onChange={(e) => setReportPriority(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Report Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-700">Matched Tickets</span>
              <div className="text-xl font-bold text-blue-900 mt-0.5">{reportFilteredTickets.length}</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-700">Open & In Progress</span>
              <div className="text-xl font-bold text-amber-900 mt-0.5">
                {reportFilteredTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700">Resolved / Closed</span>
              <div className="text-xl font-bold text-emerald-900 mt-0.5">
                {reportFilteredTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <span className="text-[10px] uppercase font-bold text-red-700">Overdue SLA</span>
              <div className="text-xl font-bold text-red-900 mt-0.5">
                {reportFilteredTickets.filter(t => t.is_overdue || (new Date(t.due_date) < new Date() && t.status !== 'Resolved' && t.status !== 'Closed')).length}
              </div>
            </div>
          </div>

          {/* Report Preview Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Paramount Textile Mills (P) Ltd &bull; Service Report Preview ({reportFilteredTickets.length} Rows)
              </span>
              <span className="text-slate-500">
                Generated {new Date().toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Ticket #</th>
                    <th className="px-4 py-3">Issue Title</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Assigned Lead</th>
                    <th className="px-4 py-3">Reported</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportFilteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400">
                        No tickets match the selected report filter parameters.
                      </td>
                    </tr>
                  ) : (
                    reportFilteredTickets.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-blue-700">{t.ticket_number}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{t.title}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-700">{t.priority}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-700">{t.status}</span>
                        </td>
                        <td className="px-4 py-3">{t.creator_name}</td>
                        <td className="px-4 py-3">{t.department_name}</td>
                        <td className="px-4 py-3">{t.category_name}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{t.assigned_to_name || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
