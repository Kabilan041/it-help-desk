import React, { useState } from 'react';
import { Ticket, User, Department, TicketCategory } from '../types';
import { 
  Inbox, 
  Clock, 
  CheckCircle2, 
  Archive, 
  AlertTriangle, 
  Flame, 
  TrendingUp, 
  Layers, 
  ArrowRight,
  Filter,
  Plus,
  Download,
  Search,
  X,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { exportTicketsToCsv } from '../utils/csvExport';

interface DashboardViewProps {
  tickets: Ticket[];
  departments: Department[];
  categories: TicketCategory[];
  currentUser: User;
  onSelectTicket: (id: number) => void;
  onNavigateToRaise: () => void;
  onNavigateToMyTickets: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tickets,
  departments,
  categories,
  currentUser,
  onSelectTicket,
  onNavigateToRaise,
  onNavigateToMyTickets
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<'All' | 'SAP Support' | 'IT Support'>('All');

  // Filter based on role if employee
  const visibleTickets = currentUser.role === 'employee'
    ? tickets.filter(t => t.created_by === currentUser.id)
    : tickets;

  // Real-time filtered tickets matching all active criteria
  const filteredTickets = visibleTickets.filter(t => {
    // Division filter
    if (selectedDivisionFilter !== 'All' && t.category_division !== selectedDivisionFilter) {
      return false;
    }

    // Status filter (including special 'Overdue' filter)
    if (statusFilter !== 'All') {
      if (statusFilter === 'Overdue') {
        const isOverdue = t.is_overdue || (t.status !== 'Resolved' && t.status !== 'Closed' && new Date(t.due_date) < new Date());
        if (!isOverdue) return false;
      } else if (t.status !== statusFilter) {
        return false;
      }
    }

    // Priority filter
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) {
      return false;
    }

    // Keyword search (real-time across ticket #, title, description, employee, dept, category, assigned engineer)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match = 
        t.ticket_number.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.creator_name.toLowerCase().includes(q) ||
        (t.creator_employee_id && t.creator_employee_id.toLowerCase().includes(q)) ||
        t.department_name.toLowerCase().includes(q) ||
        t.category_name.toLowerCase().includes(q) ||
        (t.assigned_to_name && t.assigned_to_name.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const isFiltered = searchTerm.trim() !== '' || statusFilter !== 'All' || priorityFilter !== 'All' || selectedDivisionFilter !== 'All';

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setSelectedDivisionFilter('All');
  };

  // Status Metrics (reflecting current active scope)
  const totalCount = filteredTickets.length;
  const openCount = filteredTickets.filter(t => t.status === 'Open').length;
  const progressCount = filteredTickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = filteredTickets.filter(t => t.status === 'Resolved').length;
  const closedCount = filteredTickets.filter(t => t.status === 'Closed').length;
  const overdueCount = filteredTickets.filter(t => 
    t.is_overdue || (t.status !== 'Resolved' && t.status !== 'Closed' && new Date(t.due_date) < new Date())
  ).length;

  // Department Distribution (All 13 departments)
  const deptCounts = departments.map(d => ({
    name: d.name,
    count: filteredTickets.filter(t => t.department_id === d.id).length
  })).sort((a, b) => b.count - a.count);

  const maxDeptCount = Math.max(...deptCounts.map(d => d.count), 1);

  // Category Distribution
  const categoryCounts = categories.map(c => ({
    name: c.name,
    division: c.division,
    count: filteredTickets.filter(t => t.category_id === c.id).length
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  const maxCategoryCount = Math.max(...categoryCounts.map(c => c.count), 1);

  // Recent Activity (show up to 10 matching if filtered, else 5 most recent)
  const recentTickets = [...filteredTickets]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, isFiltered ? 10 : 5);

  // High Priority / Critical alerts
  const urgentTickets = filteredTickets.filter(t => 
    (t.priority === 'Critical' || t.priority === 'High') && 
    (t.status === 'Open' || t.status === 'In Progress')
  );

  // Toast / feedback message for export action
  const [exportFeedback, setExportFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  const handleDownloadCSV = () => {
    if (filteredTickets.length === 0) {
      setExportFeedback({ message: 'No tickets available in current view to export.', isError: true });
      setTimeout(() => setExportFeedback(null), 3500);
      return;
    }

    const divisionPrefix = selectedDivisionFilter === 'All' ? 'AllDivisions' : selectedDivisionFilter.replace(/\s+/g, '');
    const prefix = currentUser.role === 'employee'
      ? `PTM_HelpDesk_Employee_${currentUser.employee_id || 'Tickets'}`
      : `PTM_HelpDesk_Dashboard_${divisionPrefix}`;

    const result = exportTicketsToCsv(filteredTickets, { filenamePrefix: prefix });
    if (result.success) {
      setExportFeedback({
        message: `Successfully exported ${result.count} ticket${result.count === 1 ? '' : 's'} to ${result.filename} for offline reporting.`
      });
      setTimeout(() => setExportFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Confirmation Feedback */}
      {exportFeedback && (
        <div 
          role="status"
          aria-live="polite"
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-semibold shadow-xs transition-all ${
            exportFeedback.isError
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {exportFeedback.isError ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{exportFeedback.message}</span>
          </div>
          <button
            onClick={() => setExportFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 font-semibold cursor-pointer px-1.5 py-0.5 rounded hover:bg-black/5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-6 shadow-sm border border-blue-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30 mb-2">
            Paramount Textile Mills (P) Ltd &bull; IT & SAP Service Portal
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {currentUser.role === 'employee' 
              ? `You are logged in as Employee (${currentUser.department_name} Division). Track your tickets or raise assistance requests.`
              : currentUser.role === 'support'
              ? `Support Console active. Resolving SAP and IT issues for mill operations.`
              : `Administrator Master Console. Full system oversight across 13 manufacturing divisions.`
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadCSV}
            title="Download CSV report of currently displayed dashboard tickets"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white text-xs font-semibold px-4 py-2.5 rounded-lg border border-white/20 shadow-xs backdrop-blur-xs transition-all hover:border-white/40 cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-200" />
            <span>Download CSV</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToRaise}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all hover:shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Raise New Ticket</span>
          </button>
        </div>
      </div>

      {/* Real-Time Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600 shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Real-Time Search & Filter Bar
            </h2>
            {isFiltered && (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Active Filter
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500">
              Showing <strong>{filteredTickets.length}</strong> of <strong>{visibleTickets.length}</strong> tickets
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Keyword Search (5 cols) */}
          <div className="relative lg:col-span-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ticket #, title, employee, dept, engineer..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
                title="Clear search keyword"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Overdue">Overdue (SLA Exceeded)</option>
            </select>
          </div>

          {/* Priority Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Division Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={selectedDivisionFilter}
              onChange={(e) => setSelectedDivisionFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Divisions</option>
              <option value="SAP Support">SAP Support</option>
              <option value="IT Support">IT Support</option>
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {isFiltered && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400 font-medium">Active Filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                Keyword: <strong className="text-slate-900">"{searchTerm}"</strong>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="hover:text-red-600 cursor-pointer ml-0.5"
                  title="Remove keyword filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {statusFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                Status: <strong>{statusFilter}</strong>
                <button
                  type="button"
                  onClick={() => setStatusFilter('All')}
                  className="hover:text-red-600 cursor-pointer ml-0.5"
                  title="Remove status filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {priorityFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                Priority: <strong>{priorityFilter}</strong>
                <button
                  type="button"
                  onClick={() => setPriorityFilter('All')}
                  className="hover:text-red-600 cursor-pointer ml-0.5"
                  title="Remove priority filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedDivisionFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                Division: <strong>{selectedDivisionFilter}</strong>
                <button
                  type="button"
                  onClick={() => setSelectedDivisionFilter('All')}
                  className="hover:text-red-600 cursor-pointer ml-0.5"
                  title="Remove division filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards with Click-to-Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total */}
        <div 
          onClick={() => setStatusFilter('All')}
          title="Click to show all tickets"
          className={`bg-white rounded-xl p-4 border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-slate-400 ${
            statusFilter === 'All' ? 'border-slate-300 ring-2 ring-blue-500/30' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
            <Inbox className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Logged requests</div>
        </div>

        {/* Open */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'Open' ? 'All' : 'Open')}
          title="Click to filter by Open status"
          className={`bg-white rounded-xl p-4 border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-sky-300 ${
            statusFilter === 'Open' ? 'border-sky-300 ring-2 ring-sky-500 bg-sky-50/40' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Open</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-sky-600 mt-2">{openCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {statusFilter === 'Open' ? '● Filtered Active' : 'Awaiting review'}
          </div>
        </div>

        {/* In Progress */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'In Progress' ? 'All' : 'In Progress')}
          title="Click to filter by In Progress status"
          className={`bg-white rounded-xl p-4 border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-amber-300 ${
            statusFilter === 'In Progress' ? 'border-amber-300 ring-2 ring-amber-500 bg-amber-50/40' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{progressCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {statusFilter === 'In Progress' ? '● Filtered Active' : 'Under investigation'}
          </div>
        </div>

        {/* Resolved */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'Resolved' ? 'All' : 'Resolved')}
          title="Click to filter by Resolved status"
          className={`bg-white rounded-xl p-4 border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-emerald-300 ${
            statusFilter === 'Resolved' ? 'border-emerald-300 ring-2 ring-emerald-500 bg-emerald-50/40' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{resolvedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {statusFilter === 'Resolved' ? '● Filtered Active' : 'Fix implemented'}
          </div>
        </div>

        {/* Closed */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'Closed' ? 'All' : 'Closed')}
          title="Click to filter by Closed status"
          className={`bg-white rounded-xl p-4 border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-slate-400 ${
            statusFilter === 'Closed' ? 'border-slate-400 ring-2 ring-slate-500 bg-slate-100' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Closed</span>
            <Archive className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700 mt-2">{closedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {statusFilter === 'Closed' ? '● Filtered Active' : 'Confirmed closed'}
          </div>
        </div>

        {/* Overdue */}
        <div 
          onClick={() => setStatusFilter(prev => prev === 'Overdue' ? 'All' : 'Overdue')}
          title="Click to filter by Overdue SLA status"
          className={`bg-white rounded-xl p-4 border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-red-300 ${
            statusFilter === 'Overdue' ? 'border-red-300 ring-2 ring-red-500 bg-red-100/60' : 'border-red-200 bg-red-50/30'
          }`}
        >
          <div className="flex items-center justify-between text-red-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 mt-2">{overdueCount}</div>
          <div className="text-[11px] text-red-500 mt-1 font-medium">
            {statusFilter === 'Overdue' ? '● Filtered Active' : 'SLA Exceeded'}
          </div>
        </div>
      </div>

      {/* Two-Column Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by Mill Department (13 Units) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Tickets by Department (13 Mill Divisions)
              </h2>
              <p className="text-[11px] text-slate-500">Distribution across Store, Weaving, Sizing, Accounts, etc.</p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              13 Departments
            </span>
          </div>

          <div className="p-5 space-y-2.5 max-h-[360px] overflow-y-auto">
            {deptCounts.map(d => {
              const percent = Math.round((d.count / maxDeptCount) * 100);
              return (
                <div key={d.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{d.name}</span>
                    <span className="font-bold text-slate-900">{d.count} tickets</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tickets by Category (SAP Support & IT Support) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Tickets by Category (SAP & IT)
              </h2>
              <p className="text-[11px] text-slate-500">ERP functional modules & hardware/networking distribution</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
              {(['All', 'SAP Support', 'IT Support'] as const).map(div => (
                <button
                  key={div}
                  onClick={() => setSelectedDivisionFilter(div)}
                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                    selectedDivisionFilter === div
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {div === 'All' ? 'All' : div.replace(' Support', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-2.5 max-h-[360px] overflow-y-auto">
            {categoryCounts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No tickets recorded in this category division.</p>
            ) : (
              categoryCounts.map(c => {
                const percent = Math.round((c.count / maxCategoryCount) * 100);
                const isSap = c.division === 'SAP Support';
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isSap ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isSap ? 'SAP' : 'IT'}
                        </span>
                        {c.name}
                      </span>
                      <span className="font-bold text-slate-900">{c.count} tickets</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSap ? 'bg-linear-to-r from-sky-500 to-blue-600' : 'bg-linear-to-r from-emerald-500 to-teal-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity & Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Ticket Activity (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {isFiltered ? `Filtered Tickets Activity (${recentTickets.length})` : 'Recent Ticket Activity'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                title="Download CSV of all active dashboard tickets"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download CSV</span>
              </button>
              <button
                type="button"
                onClick={onNavigateToMyTickets}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Ticket #</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      <Search className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">No tickets match current filters</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {searchTerm ? `No results found for "${searchTerm}"` : 'Try clearing status, priority, or division filters.'}
                      </p>
                      {isFiltered && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Filters</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  recentTickets.map(t => (
                    <tr 
                      key={t.id}
                      onClick={() => onSelectTicket(t.id)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">
                        {t.ticket_number}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate">
                        {t.title}
                      </td>
                      <td className="px-4 py-3">{t.department_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                          t.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                          t.priority === 'Medium' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'Open' ? 'bg-sky-100 text-sky-800' :
                          t.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                          t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {t.assigned_to_name ? (
                          <span className="font-medium text-slate-800">{t.assigned_to_name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* High-Priority / Critical Alerts (1 Col) */}
        <div className="bg-white rounded-xl border border-red-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-red-100 bg-red-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-900 font-bold text-xs uppercase tracking-wider">
              <Flame className="w-4 h-4 text-red-600" />
              <span>Critical / High Priority</span>
            </div>
            <span className="text-[10px] font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
              {urgentTickets.length} Active
            </span>
          </div>

          <div className="p-4 space-y-3">
            {urgentTickets.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No Critical Bottlenecks</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All high priority issues are resolved.</p>
              </div>
            ) : (
              urgentTickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  className="p-3 rounded-lg border border-red-200 bg-red-50/30 hover:bg-red-50 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-red-800">
                      {t.ticket_number}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-red-600 text-white">
                      {t.priority}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 line-clamp-1">
                    {t.title}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-red-100">
                    <span>Dept: <strong className="text-slate-700">{t.department_name}</strong></span>
                    <span>Assigned: <strong className="text-blue-800">{t.assigned_to_name || 'Unassigned'}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
