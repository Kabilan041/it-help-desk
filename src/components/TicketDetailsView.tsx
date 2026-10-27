import React, { useState } from 'react';
import { Ticket, User, SupportTeamMember, TicketStatus, Role } from '../types';
import { 
  ArrowLeft, 
  Clock, 
  User as UserIcon, 
  Building, 
  Phone, 
  Tag, 
  Calendar, 
  Send, 
  Paperclip, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Lock, 
  History, 
  UserCheck
} from 'lucide-react';

interface TicketDetailsViewProps {
  ticket: Ticket;
  currentUser: User;
  supportTeam: SupportTeamMember[];
  onBack: () => void;
  onUpdateStatus: (ticketId: number, newStatus: TicketStatus, notes?: string) => void;
  onAssignTicket: (ticketId: number, supportId: number, notes?: string) => void;
  onAddComment: (ticketId: number, message: string, isInternal: boolean) => void;
}

export const TicketDetailsView: React.FC<TicketDetailsViewProps> = ({
  ticket,
  currentUser,
  supportTeam,
  onBack,
  onUpdateStatus,
  onAssignTicket,
  onAddComment
}) => {
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [statusAction, setStatusAction] = useState<TicketStatus | null>(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [selectedSupportId, setSelectedSupportId] = useState<number>(ticket.assigned_to || (supportTeam[0]?.id ?? 1));
  const [reassignNotes, setReassignNotes] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);

  const isStaff = currentUser.role === 'support' || currentUser.role === 'admin';
  const isCreator = ticket.created_by === currentUser.id;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(ticket.id, commentText.trim(), isStaff ? isInternalComment : false);
    setCommentText('');
    setIsInternalComment(false);
  };

  const handleConfirmStatusChange = () => {
    if (!statusAction) return;
    if (statusAction === 'Resolved' && !statusNotes.trim()) {
      alert('Please provide resolution details before marking this ticket as Resolved.');
      return;
    }
    onUpdateStatus(ticket.id, statusAction, statusNotes.trim());
    setStatusAction(null);
    setStatusNotes('');
  };

  const handleConfirmReassign = () => {
    onAssignTicket(ticket.id, Number(selectedSupportId), reassignNotes.trim() || 'Reassigned from Support Console');
    setShowReassignModal(false);
    setReassignNotes('');
  };

  // Filter internal comments for employees
  const visibleComments = (ticket.comments || []).filter(c => {
    if (currentUser.role === 'employee' && c.is_internal) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tickets List</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ticket</span>
          </button>
        </div>
      </div>

      {/* Main Ticket Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Ticket Title & Badges Bar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              {ticket.ticket_number}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              ticket.status === 'Open' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
              ticket.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                ticket.status === 'Open' ? 'bg-sky-500' :
                ticket.status === 'In Progress' ? 'bg-amber-500' :
                ticket.status === 'Resolved' ? 'bg-emerald-500' : 'bg-slate-400'
              }`} />
              {ticket.status}
            </span>
            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
              ticket.priority === 'Critical' ? 'bg-red-100 text-red-800 border border-red-200' :
              ticket.priority === 'High' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
              ticket.priority === 'Medium' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
              'bg-slate-100 text-slate-800 border border-slate-200'
            }`}>
              {ticket.priority} Priority
            </span>
          </div>

          <span className="text-xs text-slate-500">
            Reported on {new Date(ticket.created_at).toLocaleString()}
          </span>
        </div>

        {/* Title & Metadata Details */}
        <div className="p-6 space-y-6">
          <h1 className="text-lg font-bold text-slate-900 leading-snug">
            {ticket.title}
          </h1>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Reported By</span>
              <span className="font-semibold text-slate-800">{ticket.creator_name}</span>
              <span className="text-[10px] text-slate-500 block font-mono">{ticket.creator_employee_id}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
              <span className="font-semibold text-slate-800">{ticket.department_name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Intercom / Phone</span>
              <span className="font-semibold text-slate-800">{ticket.contact_number}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
              <span className="font-semibold text-slate-800">{ticket.category_name}</span>
              <span className="text-[10px] text-slate-500 block">{ticket.category_division}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Engineer</span>
              {ticket.assigned_to_name ? (
                <div>
                  <span className="font-bold text-blue-700">{ticket.assigned_to_name}</span>
                  {ticket.assigned_to_extension && (
                    <span className="text-[10px] text-slate-500 block font-mono">Ext {ticket.assigned_to_extension}</span>
                  )}
                </div>
              ) : (
                <span className="text-slate-400 italic">Unassigned (Queue)</span>
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">SLA Target Due</span>
              <span className={`font-semibold ${ticket.is_overdue ? 'text-red-600' : 'text-slate-800'}`}>
                {new Date(ticket.due_date).toLocaleDateString()}
              </span>
              {ticket.is_overdue && (
                <span className="text-[10px] font-bold text-red-600 block uppercase">Overdue</span>
              )}
            </div>
          </div>

          {/* Full Issue Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Full Issue Description
            </h3>
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-sans">
              {ticket.description}
            </div>
          </div>

          {/* Resolution Details Box (if resolved/closed) */}
          {(ticket.status === 'Resolved' || ticket.status === 'Closed' || ticket.resolution_notes) && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Resolution Details & Solution Applied</span>
              </div>
              <p className="text-emerald-950 font-medium whitespace-pre-wrap pl-5">
                {ticket.resolution_notes || 'Issue verified and marked resolved by support engineer.'}
              </p>
              {ticket.resolved_at && (
                <p className="text-[11px] text-emerald-700 pl-5 pt-1">
                  Resolved timestamp: {new Date(ticket.resolved_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Attachments Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Attachments ({ticket.attachments ? ticket.attachments.length : 0})
            </h3>
            {(!ticket.attachments || ticket.attachments.length === 0) ? (
              <p className="text-xs text-slate-400 italic">No attachments uploaded for this ticket.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{att.original_name}</span>
                    <span className="text-slate-400 text-[10px]">({Math.round(att.file_size_bytes / 1024)} KB)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Workflow Action Bar */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-600 mr-1">Workflow Action:</span>

            {isStaff && ticket.status === 'Open' && (
              <button
                onClick={() => onUpdateStatus(ticket.id, 'In Progress', 'Support lead commenced troubleshooting.')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Mark In Progress
              </button>
            )}

            {isStaff && (ticket.status === 'Open' || ticket.status === 'In Progress') && (
              <button
                onClick={() => setStatusAction('Resolved')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Mark Resolved
              </button>
            )}

            {(ticket.status === 'Resolved' || isStaff) && ticket.status !== 'Closed' && (
              <button
                onClick={() => onUpdateStatus(ticket.id, 'Closed', 'Ticket confirmed resolved and closed.')}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Confirm Closure
              </button>
            )}

            {(ticket.status === 'Resolved' || ticket.status === 'Closed') && (
              <button
                onClick={() => setStatusAction('Open')}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Reopen Ticket
              </button>
            )}

            {isStaff && (
              <button
                onClick={() => setShowReassignModal(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Reassign Support</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resolution / Reopen Input Modal Prompt */}
      {statusAction && (
        <div className="p-4 rounded-xl bg-white border-2 border-blue-400 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {statusAction === 'Resolved' ? 'Document Resolution Details' : 'Reason for Reopening Ticket'}
            </h4>
            <button
              onClick={() => setStatusAction(null)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              Cancel
            </button>
          </div>

          <textarea
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            rows={3}
            placeholder={
              statusAction === 'Resolved'
                ? 'Detail root cause, steps taken, and confirmation of fix applied...'
                : 'Explain why the issue persists after resolution...'
            }
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            required
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStatusAction(null)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmStatusChange}
              className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
            >
              Confirm Status Change
            </button>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="p-4 rounded-xl bg-white border-2 border-indigo-400 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Reassign Ticket to Support Lead
            </h4>
            <button
              onClick={() => setShowReassignModal(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Support Engineer</label>
              <select
                value={selectedSupportId}
                onChange={(e) => setSelectedSupportId(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white"
              >
                {supportTeam.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.designation}) — Ext {m.extension}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reassignment Notes</label>
              <input
                type="text"
                value={reassignNotes}
                onChange={(e) => setReassignNotes(e.target.value)}
                placeholder="Reason for reassignment..."
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowReassignModal(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReassign}
              className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
            >
              Apply Reassignment
            </button>
          </div>
        </div>
      )}

      {/* Two-Column Grid: Comments (Left) & Audit History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comments & Troubleshooting Notes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Comments & Troubleshooting Updates ({visibleComments.length})
            </span>
          </div>

          <div className="p-4 flex-1 space-y-3 max-h-[420px] overflow-y-auto">
            {visibleComments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No comments recorded yet.</p>
            ) : (
              visibleComments.map(c => (
                <div
                  key={c.id}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    c.is_internal
                      ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      {c.author_name} 
                      <span className="font-normal text-slate-500 capitalize">({c.author_role})</span>
                      {c.is_internal && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900 uppercase">
                          <Lock className="w-2.5 h-2.5" /> Internal IT Note
                        </span>
                      )}
                    </span>
                    <span>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{c.message}</div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Input */}
          <form onSubmit={handleCommentSubmit} className="p-3.5 border-t border-slate-200 bg-slate-50 space-y-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              placeholder="Add troubleshooting update, status clarification or response..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              required
            />
            <div className="flex items-center justify-between">
              {isStaff ? (
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Mark as Internal IT Note (hidden from employee)</span>
                </label>
              ) : <div />}

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors ml-auto"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Note</span>
              </button>
            </div>
          </form>
        </div>

        {/* Audit History Trail */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Status Lifecycle & Audit Trail</span>
            </span>
          </div>

          <div className="p-5 max-h-[480px] overflow-y-auto">
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-5 text-xs">
              {(ticket.history || []).map(h => (
                <div key={h.id} className="relative group">
                  <div className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900">
                      {h.old_status ? `Status: ${h.old_status} → ${h.new_status}` : `Ticket Created (${h.new_status})`}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      by <strong className="text-slate-700">{h.changed_by_name}</strong> &bull; {new Date(h.created_at).toLocaleString()}
                    </div>
                    {h.comments && (
                      <div className="mt-1 p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-700 italic">
                        "{h.comments}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
