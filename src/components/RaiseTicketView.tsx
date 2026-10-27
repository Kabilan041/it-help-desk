import React, { useState } from 'react';
import { User, Department, TicketCategory, Priority, Division, Ticket } from '../types';
import { Send, Paperclip, X, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface RaiseTicketViewProps {
  currentUser: User;
  departments: Department[];
  categories: TicketCategory[];
  nextTicketNumber: string;
  onSubmitTicket: (ticket: Partial<Ticket>, file?: File) => void;
  onCancel: () => void;
}

export const RaiseTicketView: React.FC<RaiseTicketViewProps> = ({
  currentUser,
  departments,
  categories,
  nextTicketNumber,
  onSubmitTicket,
  onCancel
}) => {
  const [departmentId, setDepartmentId] = useState<number>(currentUser.department_id || 1);
  const [contactNumber, setContactNumber] = useState<string>(currentUser.extension ? `Ext ${currentUser.extension}` : currentUser.phone || '');
  const [division, setDivision] = useState<Division>('SAP Support');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [priority, setPriority] = useState<Priority>('Medium');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const [deptSearch, setDeptSearch] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string>('');

  // Filter categories by chosen division
  const filteredCategories = categories.filter(c => c.division === division);

  // Filter departments by search
  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) || 
    d.code.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // 10MB limit
      if (file.size > 10 * 1024 * 1024) {
        setFileError('File size exceeds 10MB limit. Please upload a smaller file.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill in both the issue title and detailed description.');
      return;
    }

    setIsSubmitting(true);

    const selectedDept = departments.find(d => d.id === Number(departmentId));
    const selectedCat = categories.find(c => c.id === Number(categoryId));

    const newTicket: Partial<Ticket> = {
      ticket_number: nextTicketNumber,
      title: title.trim(),
      description: description.trim(),
      created_by: currentUser.id,
      creator_name: currentUser.name,
      creator_employee_id: currentUser.employee_id,
      creator_email: currentUser.email,
      department_id: Number(departmentId),
      department_name: selectedDept ? selectedDept.name : 'General',
      category_id: Number(categoryId),
      category_name: selectedCat ? selectedCat.name : 'General Support',
      category_division: division,
      priority,
      status: 'Open',
      contact_number: contactNumber || 'N/A',
      assigned_to: selectedCat?.default_assigned_to || null,
      due_date: new Date(Date.now() + (priority === 'Critical' ? 4 : priority === 'High' ? 12 : 48) * 3600 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setTimeout(() => {
      onSubmitTicket(newTicket, selectedFile || undefined);
      setIsSubmitting(false);
      setSubmitSuccess(`Ticket ${nextTicketNumber} submitted successfully!`);
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header crumb */}
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel & Back</span>
          </button>
          <h1 className="text-xl font-bold text-slate-900">Raise Support Service Ticket</h1>
          <p className="text-xs text-slate-500">
            Submit mill breakdown or ERP transaction requests to Paramount IT & SAP Help Desk
          </p>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Ticket Registration Details
          </span>
          <span className="text-xs text-slate-400">
            * All fields are verified on submit
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Top auto-populated row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Generated Ticket Ref</span>
              <span className="font-mono font-bold text-blue-700 text-sm">{nextTicketNumber}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Reported By</span>
              <span className="font-semibold text-slate-800">{currentUser.name}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Employee ID</span>
              <span className="font-mono font-semibold text-slate-700">{currentUser.employee_id}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Reported Timestamp</span>
              <span className="font-medium text-slate-700">{new Date().toLocaleString()}</span>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Department with Search */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mill Department <span className="text-red-500">*</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code}) {d.extension ? `- Ext ${d.extension}` : ''}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                13 Mill Divisions: Store, Weaving, Sizing, Electrical, Marketing, Madeups-1, Madeups-2, HRD, Accounts, Export, Gate, Sample, PD.
              </span>
            </div>

            {/* Intercom Extension / Contact */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Intercom Extension / Mobile Contact <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. Ext 201 or 9842111001"
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                For support technicians to call back immediately
              </span>
            </div>

            {/* Division Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Support Service Division <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDivision('SAP Support');
                    const first = categories.find(c => c.division === 'SAP Support');
                    if (first) setCategoryId(first.id);
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                    division === 'SAP Support'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  SAP Support (ERP)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDivision('IT Support');
                    const first = categories.find(c => c.division === 'IT Support');
                    if (first) setCategoryId(first.id);
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                    division === 'IT Support'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  IT Support (Systems/LAN)
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ticket Category ({division}) <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              >
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Priority Level & SLA Impact <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['Low', 'Medium', 'High', 'Critical'] as const).map(p => (
                  <label
                    key={p}
                    className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                      priority === p
                        ? p === 'Critical'
                          ? 'bg-red-50 border-red-500 text-red-900 ring-2 ring-red-500/20'
                          : p === 'High'
                          ? 'bg-orange-50 border-orange-500 text-orange-900 ring-2 ring-orange-500/20'
                          : 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase">{p}</span>
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={priority === p}
                        onChange={() => setPriority(p)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">
                      {p === 'Critical' ? '< 4 Hrs (Production halt)' :
                       p === 'High' ? '< 12 Hrs (Major process impact)' :
                       p === 'Medium' ? '24 - 48 Hrs (Normal issue)' : 'Non-urgent query'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Short Issue Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Short Issue Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. MIGO 101 error Deficit of SL Stock 420kg, or Zebra roll tag ribbon fault"
                className="w-full text-xs rounded-lg border border-slate-300 px-3.5 py-2.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                required
                maxLength={200}
              />
            </div>

            {/* Detailed Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Detailed Issue Description & Steps to Reproduce <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Detail symptoms, error message codes, transaction T-Codes (e.g. ME21N, MIGO, CO11N, VA01), device serial number, or exact mill machine location..."
                className="w-full text-xs rounded-lg border border-slate-300 p-3 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed font-sans"
                required
              />
            </div>

            {/* File Attachment Upload */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Attachment (Screenshots, Error logs, Invoices - Max 10MB)
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-400 bg-slate-50/50 transition-colors">
                <input
                  type="file"
                  id="ticket-file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.log"
                />
                <label
                  htmlFor="ticket-file"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-xs text-slate-600"
                >
                  <Paperclip className="w-5 h-5 text-slate-400" />
                  <span className="font-semibold text-blue-600 hover:underline">
                    Click to browse file
                  </span>
                  <span className="text-[11px] text-slate-400">
                    PNG, JPG, PDF, XLSX, DOCX up to 10MB
                  </span>
                </label>

                {selectedFile && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-500 hover:text-red-700 ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {fileError && (
                  <p className="text-xs text-red-600 mt-2 font-medium">{fileError}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
