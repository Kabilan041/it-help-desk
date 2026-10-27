import React, { useState } from 'react';
import { Ticket, User, Department, TicketCategory, TicketStatus, Priority } from '../types';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  ChevronRight, 
  Plus, 
  CheckCircle, 
  CheckCircle2,
  Clock, 
  AlertCircle,
  AlertTriangle,
  Calendar,
  Download,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { exportTicketsToCsv } from '../utils/csvExport';

interface MyTicketsViewProps {
  tickets: Ticket[];
  currentUser: User;
  departments: Department[];
  categories: TicketCategory[];
  onSelectTicket: (id: number) => void;
  onNavigateToRaise: () => void;
}

export const MyTicketsView: React.FC<MyTicketsViewProps> = ({
  tickets,
  currentUser,
  departments,
  categories,
  onSelectTicket,
  onNavigateToRaise
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'my' | 'all'>('my');

  const isStaff = currentUser.role === 'support' || currentUser.role === 'admin';

  // Base scope:
  // Employees only ever see their own tickets
  // Support & Admin can switch between 'my' (created by them) and 'all'
  let baseTickets = tickets;
  if (!isStaff || scopeFilter === 'my') {
    baseTickets = tickets.filter(t => t.created_by === currentUser.id);
  }

  // Filter application
  const filteredTickets = baseTickets.filter(t => {
    // Real-time keyword search across all fields
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

    // Status
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;

    // Priority
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;

    // Category
    if (categoryFilter !== 'All' && t.category_id !== Number(categoryFilter)) return false;

    // Department
    if (departmentFilter !== 'All' && t.department_id !== Number(departmentFilter)) return false;

    // Date range
    if (dateFrom) {
      if (new Date(t.created_at) < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59);
      if (new Date(t.created_at) > endOfDay) return false;
    }

    return true;
  });

  const isFiltered = 
    searchTerm.trim() !== '' || 
    statusFilter !== 'All' || 
    priorityFilter !== 'All' || 
    categoryFilter !== 'All' || 
    departmentFilter !== 'All' || 
    dateFrom !== '' || 
    dateTo !== '';

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setCategoryFilter('All');
    setDepartmentFilter('All');
    setDateFrom('');
    setDateTo('');
  };

  // Toast / feedback message for export action
  const [exportFeedback, setExportFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  const handleDownloadCSV = () => {
    if (filteredTickets.length === 0) {
      setExportFeedback({ message: 'No tickets match the current filters to export.', isError: true });
      setTimeout(() => setExportFeedback(null), 3500);
      return;
    }

    const scopePrefix = isStaff && scopeFilter === 'all' ? 'AllMill' : `Emp_${currentUser.employee_id || 'User'}`;
    const result = exportTicketsToCsv(filteredTickets, {
      filenamePrefix: `PTM_HelpDesk_MyTickets_${scopePrefix}`
    });

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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {isStaff && scopeFilter === 'all' ? 'All Mill Tickets Repository' : 'My Service Tickets'}
          </h1>
          <p className="text-xs text-slate-500">
            {currentUser.role === 'employee'
              ? 'Tracking your submitted IT & SAP requests. Securely isolated to your user account.'
              : 'View tickets submitted by your profile or switch scope to all mill units.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {isStaff && (
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold border border-slate-200">
              <button
                type="button"
                onClick={() => setScopeFilter('my')}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  scopeFilter === 'my' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Tickets
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  scopeFilter === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Mill Tickets
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleDownloadCSV}
            title="Download CSV report of currently filtered tickets"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 text-xs font-semibold px-3.5 py-2 rounded-lg shadow-2xs transition-all shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToRaise}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Raise New Ticket</span>
          </button>
        </div>
      </div>

      {/* Real-Time Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600 shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Real-Time Search & Filters
            </h2>
            {isFiltered && (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Filters Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500">
              Showing <strong>{filteredTickets.length}</strong> of <strong>{baseTickets.length}</strong> tickets
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

        {/* Quick Status Tabs (1-Click Real-Time Filtering) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] mr-1">Status:</span>
          {(['All', 'Open', 'In Progress', 'Resolved', 'Closed'] as const).map(st => {
            const count = st === 'All' ? baseTickets.length : baseTickets.filter(t => t.status === st).length;
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{st}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-blue-800 text-blue-100' : 'bg-white/80 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Priority Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] mr-1">Priority:</span>
          {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map(pr => {
            const isSelected = priorityFilter === pr;
            const count = pr === 'All' ? baseTickets.length : baseTickets.filter(t => t.priority === pr).length;
            return (
              <button
                key={pr}
                type="button"
                onClick={() => setPriorityFilter(pr)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                  isSelected
                    ? pr === 'Critical' ? 'bg-red-600 text-white font-semibold' :
                      pr === 'High' ? 'bg-orange-600 text-white font-semibold' :
                      pr === 'Medium' ? 'bg-sky-600 text-white font-semibold' :
                      pr === 'Low' ? 'bg-slate-700 text-white font-semibold' :
                      'bg-slate-800 text-white font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{pr}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-black/20 text-white' : 'bg-white/80 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Extended Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-3 pt-1">
          {/* Keyword Search (5 cols) */}
          <div className="relative lg:col-span-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ticket #, title, description, employee, dept, engineer..."
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

          {/* Department Filter (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Mill Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          {/* Category Filter (4 cols) */}
          <div className="lg:col-span-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Categories (SAP & IT)</option>
              <optgroup label="SAP Support">
                {categories.filter(c => c.division === 'SAP Support').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
              <optgroup label="IT Support">
                {categories.filter(c => c.division === 'IT Support').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Date Range & Inline Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold flex items-center gap-1 text-slate-500 text-[11px]">
              <Calendar className="w-3.5 h-3.5" /> Date Created:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-xs px-2 py-1 rounded-md border border-slate-300 bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-xs px-2 py-1 rounded-md border border-slate-300 bg-white"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer ml-1"
              >
                Clear Dates
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCSV}
              disabled={filteredTickets.length === 0}
              title="Download CSV of current filtered tickets"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Filtered ({filteredTickets.length})</span>
            </button>
          </div>
        </div>

        {/* Active Filter Badges */}
        {isFiltered && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400 font-medium">Applied Filters:</span>
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
            {departmentFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                Dept: <strong>{departments.find(d => d.id === Number(departmentFilter))?.name || departmentFilter}</strong>
                <button
                  type="button"
                  onClick={() => setDepartmentFilter('All')}
                  className="hover:text-red-600 cursor-pointer ml-0.5"
                  title="Remove department filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {categoryFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                Category: <strong>{categories.find(c => c.id === Number(categoryFilter))?.name || categoryFilter}</strong>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('All')}
                  className="hover:text-red-600 cursor-pointer ml-0.5"
                  title="Remove category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(dateFrom || dateTo) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                Date: <strong>{dateFrom || 'Start'} → {dateTo || 'End'}</strong>
                <button
                  type="button"
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="hover:text-red-600 cursor-pointer ml-0.5"
                  title="Remove date filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Ticket Number</th>
                <th className="px-4 py-3.5">Issue Title</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Created Date</th>
                <th className="px-4 py-3.5">Assigned Support Person</th>
                <th className="px-4 py-3.5">Current Status</th>
                <th className="px-4 py-3.5">Last Updated</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-14 text-slate-400">
                    <Search className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
                    <p className="text-sm font-semibold text-slate-700">No tickets match current filters</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {searchTerm 
                        ? `No tickets found matching "${searchTerm}". Try adjusting your keywords or clearing active filters.`
                        : 'No tickets match the selected status, priority, or date range filters.'}
                    </p>
                    {isFiltered && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset All Filters</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTickets.map(t => (
                  <tr 
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {t.ticket_number}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 max-w-[220px] truncate" title={t.title}>
                      {t.title}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {t.department_name}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] text-slate-400 block">{t.category_division}</span>
                      <span className="font-medium text-slate-800">{t.category_name}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                        t.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        t.priority === 'Medium' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {t.assigned_to_name ? (
                        <div>
                          <strong className="text-slate-800">{t.assigned_to_name}</strong>
                          {t.assigned_to_extension && (
                            <span className="text-[10px] text-slate-400 block font-mono">Ext {t.assigned_to_extension}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned (In Queue)</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        t.status === 'Open' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        t.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          t.status === 'Open' ? 'bg-sky-500' :
                          t.status === 'In Progress' ? 'bg-amber-500' :
                          t.status === 'Resolved' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`} />
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(t.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
