import React from 'react';
import { User, Role } from '../types';
import { INITIAL_USERS } from '../mockData';
import { Radio, FolderGit2, LogOut, ShieldCheck, UserCheck } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onOpenProjectFiles: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  onOpenProjectFiles,
  onLogout
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span>PostgreSQL Active (Live Sync)</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="text-xs text-slate-500 hidden sm:block">
          Internal Intranet: <span className="font-mono font-medium text-slate-700">192.168.1.150:3000</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Role Tester Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs border border-slate-200">
          <span className="text-slate-500 font-medium px-2 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> Demo Switcher:
          </span>
          <button
            onClick={() => onSwitchUser(INITIAL_USERS[0])} // Admin (Veeramuthu)
            className={`px-2 py-1 rounded font-medium transition-all ${
              currentUser.username === 'admin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Veeramuthu - IT Admin (Full Control)"
          >
            Admin (Ext 919)
          </button>
          <button
            onClick={() => onSwitchUser(INITIAL_USERS[2])} // Support (Vijay MM)
            className={`px-2 py-1 rounded font-medium transition-all ${
              currentUser.username === 'vijay'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Vijay - Functional Support Lead (MM) (Ext 738)"
          >
            Support (Ext 738)
          </button>
          <button
            onClick={() => onSwitchUser(INITIAL_USERS[7])} // Employee (Ramesh Kannan)
            className={`px-2 py-1 rounded font-medium transition-all ${
              currentUser.username === 'ramesh'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Ramesh Kannan - Weaving Division (Ext 201)"
          >
            Employee (Ext 201)
          </button>
        </div>

        {/* Standalone Project Files & Setup Guide Modal Button */}
        <button
          onClick={onOpenProjectFiles}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-xs"
          title="Inspect standalone native Node.js 24 and PostgreSQL files for VS Code on Windows"
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>VS Code / Windows Files</span>
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-100">
            {currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              {currentUser.department_name} &bull; Ext {currentUser.extension || 'N/A'}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
