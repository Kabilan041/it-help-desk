/**
 * PARAMOUNT TEXTILE MILLS (P) LTD - IT SUPPORT HELP DESK
 * Enterprise React Application for AI Studio Preview & Interactive Testing
 */

import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  User, 
  SupportTeamMember, 
  Department, 
  TicketCategory, 
  TicketStatus,
  Priority
} from './types';
import { 
  INITIAL_DEPARTMENTS, 
  INITIAL_SUPPORT_TEAM, 
  INITIAL_USERS, 
  INITIAL_CATEGORIES, 
  INITIAL_TICKETS 
} from './mockData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { RaiseTicketView } from './components/RaiseTicketView';
import { MyTicketsView } from './components/MyTicketsView';
import { TicketDetailsView } from './components/TicketDetailsView';
import { AdminPanelView } from './components/AdminPanelView';
import { ProjectFilesModal } from './components/ProjectFilesModal';
import { Lock, UserCheck, ShieldCheck } from 'lucide-react';

export default function App() {
  // Persistence in localStorage
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('ptm_helpdesk_tickets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_TICKETS;
  });

  const [supportTeam, setSupportTeam] = useState<SupportTeamMember[]>(() => {
    const saved = localStorage.getItem('ptm_helpdesk_support_team');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_SUPPORT_TEAM;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ptm_helpdesk_users');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ptm_helpdesk_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    // Default to admin for immediate exploration
    return INITIAL_USERS[0];
  });

  // Current view navigation
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isProjectFilesModalOpen, setIsProjectFilesModalOpen] = useState(false);

  // Login form state (if logged out)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('ptm_helpdesk_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('ptm_helpdesk_support_team', JSON.stringify(supportTeam));
  }, [supportTeam]);

  useEffect(() => {
    localStorage.setItem('ptm_helpdesk_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ptm_helpdesk_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ptm_helpdesk_current_user');
    }
  }, [currentUser]);

  // Next ticket number calculation (PTM-YYYY-XXXX)
  const generateNextTicketNumber = (): string => {
    const year = new Date().getFullYear();
    const existingNums = tickets
      .map(t => {
        const parts = t.ticket_number.split('-');
        return parts.length === 3 ? parseInt(parts[2], 10) : 0;
      })
      .filter(n => !isNaN(n));
    
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 1000;
    return `PTM-${year}-${maxNum + 1}`;
  };

  // Ticket Operations
  const handleCreateTicket = (newTicketData: Partial<Ticket>, file?: File) => {
    const newId = tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1;
    const now = new Date().toISOString();

    const createdTicket: Ticket = {
      id: newId,
      ticket_number: newTicketData.ticket_number || generateNextTicketNumber(),
      title: newTicketData.title || 'Untitled Ticket',
      description: newTicketData.description || '',
      created_by: currentUser?.id || 1,
      creator_name: currentUser?.name || 'Employee',
      creator_employee_id: currentUser?.employee_id || 'EMP000',
      creator_email: currentUser?.email || 'user@paramounttextiles.com',
      department_id: newTicketData.department_id || 1,
      department_name: newTicketData.department_name || 'Store',
      category_id: newTicketData.category_id || 1,
      category_name: newTicketData.category_name || 'General',
      category_division: newTicketData.category_division || 'SAP Support',
      priority: newTicketData.priority || 'Medium',
      status: 'Open',
      contact_number: newTicketData.contact_number || 'Ext 201',
      assigned_to: newTicketData.assigned_to || null,
      assigned_to_name: null,
      assigned_to_extension: null,
      due_date: newTicketData.due_date || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      is_overdue: false,
      created_at: now,
      updated_at: now,
      comments: [],
      history: [
        {
          id: 1,
          ticket_id: newId,
          old_status: null,
          new_status: 'Open',
          changed_by: currentUser?.id || 1,
          changed_by_name: currentUser?.name || 'Employee',
          changed_by_role: currentUser?.role || 'employee',
          comments: 'Ticket submitted via service portal.',
          created_at: now
        }
      ],
      attachments: file ? [
        {
          id: 1,
          ticket_id: newId,
          original_name: file.name,
          file_size_bytes: file.size,
          mime_type: file.type || 'application/octet-stream',
          created_at: now,
          uploader_name: currentUser?.name || 'Employee'
        }
      ] : []
    };

    // If assigned to a support lead, enrich details
    if (createdTicket.assigned_to) {
      const lead = supportTeam.find(s => s.id === createdTicket.assigned_to);
      if (lead) {
        createdTicket.assigned_to_name = lead.full_name;
        createdTicket.assigned_to_extension = lead.extension;
      }
    }

    setTickets(prev => [createdTicket, ...prev]);
    setSelectedTicketId(createdTicket.id);
    setCurrentView('ticket-details');
  };

  const handleUpdateStatus = (ticketId: number, newStatus: TicketStatus, notes?: string) => {
    const now = new Date().toISOString();
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;

      const historyEntry = {
        id: (t.history?.length || 0) + 1,
        ticket_id: t.id,
        old_status: t.status,
        new_status: newStatus,
        changed_by: currentUser?.id || 1,
        changed_by_name: currentUser?.name || 'Staff',
        changed_by_role: currentUser?.role || 'support',
        comments: notes || `Status changed from ${t.status} to ${newStatus}`,
        created_at: now
      };

      return {
        ...t,
        status: newStatus,
        resolution_notes: newStatus === 'Resolved' ? (notes || t.resolution_notes) : t.resolution_notes,
        resolved_at: newStatus === 'Resolved' ? now : (newStatus === 'Open' ? null : t.resolved_at),
        closed_at: newStatus === 'Closed' ? now : (newStatus === 'Open' ? null : t.closed_at),
        updated_at: now,
        history: [...(t.history || []), historyEntry]
      };
    }));
  };

  const handleAssignTicket = (ticketId: number, supportId: number, notes?: string) => {
    const now = new Date().toISOString();
    const lead = supportTeam.find(s => s.id === supportId);

    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;

      const assignmentEntry = {
        id: (t.assignments?.length || 0) + 1,
        ticket_id: t.id,
        from_name: t.assigned_to_name,
        to_name: lead ? lead.full_name : null,
        assigned_by_name: currentUser?.name || 'Staff',
        notes: notes || 'Assigned via support console.',
        created_at: now
      };

      return {
        ...t,
        assigned_to: supportId,
        assigned_to_name: lead ? lead.full_name : null,
        assigned_to_extension: lead ? lead.extension : null,
        updated_at: now,
        assignments: [...(t.assignments || []), assignmentEntry]
      };
    }));
  };

  const handleAddComment = (ticketId: number, message: string, isInternal: boolean) => {
    const now = new Date().toISOString();
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;

      const newComment = {
        id: (t.comments?.length || 0) + 1,
        ticket_id: t.id,
        author_id: currentUser?.id || 1,
        author_name: currentUser?.name || 'Staff',
        author_role: currentUser?.role || 'employee',
        message,
        is_internal: isInternal,
        created_at: now
      };

      return {
        ...t,
        updated_at: now,
        comments: [...(t.comments || []), newComment]
      };
    }));
  };

  const handleUpdateSupportMember = (id: number, data: Partial<SupportTeamMember>) => {
    setSupportTeam(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  };

  const handleCreateUser = (newUserData: Partial<User>) => {
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const user: User = {
      id: newId,
      employee_id: newUserData.employee_id || `EMP${newId}`,
      name: newUserData.name || 'New User',
      email: newUserData.email || 'user@paramounttextiles.com',
      username: newUserData.username || `user${newId}`,
      role: newUserData.role || 'employee',
      department_id: newUserData.department_id || 1,
      department_name: newUserData.department_name || 'Store',
      extension: newUserData.extension || '101',
      phone: newUserData.phone || '',
      is_active: true
    };
    setUsers(prev => [...prev, user]);
  };

  const handleUpdateUser = (id: number, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  };

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const found = users.find(u => 
      u.username.toLowerCase() === loginUsername.trim().toLowerCase() ||
      u.email.toLowerCase() === loginUsername.trim().toLowerCase()
    );

    if (found && found.is_active) {
      setCurrentUser(found);
      setCurrentView('dashboard');
    } else {
      setLoginError('Invalid credentials. Password is Paramount@123 for all demo accounts.');
    }
  };

  // If user signed out, show corporate login view
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-radial from-blue-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-xl bg-linear-to-br from-blue-600 to-blue-800 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md">
              PTM
            </div>
            <h1 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
              Paramount Textile Mills (P) Ltd
            </h1>
            <p className="text-xs font-semibold text-blue-600 tracking-wider">
              IT & SAP SUPPORT HELP DESK
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Username or Corporate Email
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="e.g. admin, vijay, or ramesh"
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-sm"
            >
              Sign In to Service Portal
            </button>
          </form>

          {/* Quick Demo Selector */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-600 block">
              1-Click Demo Accounts (Password: <code>Paramount@123</code>):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCurrentUser(INITIAL_USERS[0])}
                className="p-2 rounded-lg border border-slate-200 hover:bg-blue-50 text-[11px] font-semibold text-slate-700 text-center"
              >
                Admin (919)
              </button>
              <button
                type="button"
                onClick={() => setCurrentUser(INITIAL_USERS[2])}
                className="p-2 rounded-lg border border-slate-200 hover:bg-blue-50 text-[11px] font-semibold text-slate-700 text-center"
              >
                Support (738)
              </button>
              <button
                type="button"
                onClick={() => setCurrentUser(INITIAL_USERS[7])}
                className="p-2 rounded-lg border border-slate-200 hover:bg-blue-50 text-[11px] font-semibold text-slate-700 text-center"
              >
                Employee (201)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Selected ticket for details view
  const currentTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 antialiased overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view !== 'ticket-details') {
            setSelectedTicketId(null);
          }
        }}
        currentUser={currentUser}
        onOpenProjectFiles={() => setIsProjectFilesModalOpen(true)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          onSwitchUser={(user) => {
            setCurrentUser(user);
          }}
          onOpenProjectFiles={() => setIsProjectFilesModalOpen(true)}
          onLogout={() => setCurrentUser(null)}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 p-6 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              tickets={tickets}
              departments={INITIAL_DEPARTMENTS}
              categories={INITIAL_CATEGORIES}
              currentUser={currentUser}
              onSelectTicket={(id) => {
                setSelectedTicketId(id);
                setCurrentView('ticket-details');
              }}
              onNavigateToRaise={() => setCurrentView('raise-ticket')}
              onNavigateToMyTickets={() => setCurrentView('my-tickets')}
            />
          )}

          {currentView === 'raise-ticket' && (
            <RaiseTicketView
              currentUser={currentUser}
              departments={INITIAL_DEPARTMENTS}
              categories={INITIAL_CATEGORIES}
              nextTicketNumber={generateNextTicketNumber()}
              onSubmitTicket={handleCreateTicket}
              onCancel={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'my-tickets' && (
            <MyTicketsView
              tickets={tickets}
              currentUser={currentUser}
              departments={INITIAL_DEPARTMENTS}
              categories={INITIAL_CATEGORIES}
              onSelectTicket={(id) => {
                setSelectedTicketId(id);
                setCurrentView('ticket-details');
              }}
              onNavigateToRaise={() => setCurrentView('raise-ticket')}
            />
          )}

          {currentView === 'ticket-details' && currentTicket && (
            <TicketDetailsView
              ticket={currentTicket}
              currentUser={currentUser}
              supportTeam={supportTeam}
              onBack={() => setCurrentView('my-tickets')}
              onUpdateStatus={handleUpdateStatus}
              onAssignTicket={handleAssignTicket}
              onAddComment={handleAddComment}
            />
          )}

          {(currentView === 'admin-panel' || currentView === 'reports') && (
            <AdminPanelView
              tickets={tickets}
              currentUser={currentUser}
              users={users}
              supportTeam={supportTeam}
              departments={INITIAL_DEPARTMENTS}
              categories={INITIAL_CATEGORIES}
              onSelectTicket={(id) => {
                setSelectedTicketId(id);
                setCurrentView('ticket-details');
              }}
              onUpdateSupportMember={handleUpdateSupportMember}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
            />
          )}
        </main>
      </div>

      {/* Project Files Modal */}
      <ProjectFilesModal
        isOpen={isProjectFilesModalOpen}
        onClose={() => setIsProjectFilesModalOpen(false)}
      />
    </div>
  );
}
