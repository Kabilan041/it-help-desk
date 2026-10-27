import React from 'react';
import { User } from '../types';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardList, 
  ShieldAlert, 
  FileSpreadsheet, 
  FolderCode, 
  HelpCircle,
  Building2,
  Users
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: User;
  onOpenProjectFiles: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenProjectFiles
}) => {
  const isStaff = currentUser.role === 'support' || currentUser.role === 'admin';

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-white shadow-md text-base tracking-wider">
          PTM
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-white truncate">
            PARAMOUNT TEXTILES
          </div>
          <div className="text-[11px] text-blue-400 font-medium truncate">
            IT & SAP Support Help Desk
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
            currentView === 'dashboard'
              ? 'bg-blue-600 text-white shadow-xs font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => onNavigate('raise-ticket')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
            currentView === 'raise-ticket'
              ? 'bg-blue-600 text-white shadow-xs font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <PlusCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Raise Ticket</span>
        </button>

        <button
          onClick={() => onNavigate('my-tickets')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
            currentView === 'my-tickets'
              ? 'bg-blue-600 text-white shadow-xs font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <ClipboardList className="w-4 h-4 shrink-0" />
          <span>My Tickets</span>
        </button>

        {isStaff && (
          <>
            <div className="pt-4 pb-1 px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Staff & Administration
              </span>
            </div>

            <button
              onClick={() => onNavigate('admin-panel')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'admin-panel'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Admin & Support Panel</span>
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'reports'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>Reports & CSV Export</span>
            </button>
          </>
        )}

        <div className="pt-4 pb-1 px-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            System & Deployment
          </span>
        </div>

        <button
          onClick={onOpenProjectFiles}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
        >
          <FolderCode className="w-4 h-4 shrink-0 text-indigo-400" />
          <span>VS Code / LAN Setup</span>
        </button>
      </nav>

      {/* User Information Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-800 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/30">
            {currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-semibold text-white truncate">
              {currentUser.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                currentUser.role === 'admin' 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                  : currentUser.role === 'support'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {currentUser.role}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {currentUser.employee_id}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
