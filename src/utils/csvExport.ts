import { Ticket } from '../types';

/**
 * Escapes and formats a field for RFC 4180 compliant CSV output.
 * Wraps values with double quotes if they contain commas, double quotes, or newlines.
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }
  const str = String(val);
  // Replace internal double quotes with double-double quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export interface ExportCsvOptions {
  filenamePrefix?: string;
  reportTitle?: string;
}

/**
 * Exports an array of Ticket objects as a downloadable CSV file.
 * Automatically adds UTF-8 BOM so Microsoft Excel correctly parses UTF-8 encoding.
 */
export function exportTicketsToCsv(
  tickets: Ticket[],
  options: ExportCsvOptions = {}
): { success: boolean; count: number; filename: string } {
  if (!tickets || tickets.length === 0) {
    return { success: false, count: 0, filename: '' };
  }

  const prefix = options.filenamePrefix || 'PTM_HelpDesk_Tickets';
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10);
  const timeStamp = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `${prefix}_${dateStamp}_${timeStamp}.csv`;

  const headers = [
    'Ticket Number',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Department',
    'Category Division',
    'Category Name',
    'Raised By Employee',
    'Employee ID',
    'Corporate Email',
    'Contact Number / Extension',
    'Assigned Support Engineer',
    'Support Intercom Ext',
    'Due Date / SLA',
    'SLA Overdue',
    'Created At',
    'Last Updated At',
    'Resolved At',
    'Resolution Notes',
    'Comments Count'
  ];

  const rows = tickets.map((t) => {
    const isOverdue =
      t.is_overdue ||
      (t.status !== 'Resolved' && t.status !== 'Closed' && new Date(t.due_date) < new Date());

    return [
      escapeCsvValue(t.ticket_number),
      escapeCsvValue(t.title),
      escapeCsvValue(t.description),
      escapeCsvValue(t.status),
      escapeCsvValue(t.priority),
      escapeCsvValue(t.department_name),
      escapeCsvValue(t.category_division),
      escapeCsvValue(t.category_name),
      escapeCsvValue(t.creator_name),
      escapeCsvValue(t.creator_employee_id),
      escapeCsvValue(t.creator_email),
      escapeCsvValue(t.contact_number),
      escapeCsvValue(t.assigned_to_name || 'Unassigned'),
      escapeCsvValue(t.assigned_to_extension ? `Ext ${t.assigned_to_extension}` : ''),
      escapeCsvValue(t.due_date ? new Date(t.due_date).toLocaleString() : ''),
      escapeCsvValue(isOverdue ? 'Yes' : 'No'),
      escapeCsvValue(new Date(t.created_at).toLocaleString()),
      escapeCsvValue(new Date(t.updated_at).toLocaleString()),
      escapeCsvValue(t.resolved_at ? new Date(t.resolved_at).toLocaleString() : ''),
      escapeCsvValue(t.resolution_notes || ''),
      escapeCsvValue(t.comments?.length || 0)
    ].join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility
  const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

  // Trigger download via Blob
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, count: tickets.length, filename };
}
