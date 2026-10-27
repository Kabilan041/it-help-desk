/**
 * Type Definitions for Paramount Textile Mills IT Support Help Desk
 */

export type Role = 'employee' | 'support' | 'admin';

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export type Division = 'SAP Support' | 'IT Support';

export interface Department {
  id: number;
  name: string;
  code: string;
  extension?: string;
}

export interface User {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  department_id: number;
  department_name?: string;
  extension?: string;
  phone?: string;
  is_active: boolean;
  support_team_id?: number;
}

export interface SupportTeamMember {
  id: number;
  user_id: number;
  full_name: string;
  designation: string;
  extension: string;
  specialization: string;
  is_active: boolean;
  active_tickets_count?: number;
}

export interface TicketCategory {
  id: number;
  division: Division;
  name: string;
  description: string;
  default_assigned_to?: number;
}

export interface RoutingRule {
  id: number;
  category_id: number;
  support_team_id: number;
  priority_level?: Priority | null;
  is_enabled: boolean;
}

export interface TicketAttachment {
  id: number;
  ticket_id: number;
  original_name: string;
  file_size_bytes: number;
  mime_type: string;
  created_at: string;
  uploader_name: string;
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  author_id: number;
  author_name: string;
  author_role: Role;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface TicketStatusHistory {
  id: number;
  ticket_id: number;
  old_status: TicketStatus | null;
  new_status: TicketStatus;
  changed_by: number;
  changed_by_name: string;
  changed_by_role: Role;
  comments: string;
  created_at: string;
}

export interface TicketAssignmentHistory {
  id: number;
  ticket_id: number;
  from_name: string | null;
  to_name: string | null;
  assigned_by_name: string;
  notes: string;
  created_at: string;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  created_by: number;
  creator_name: string;
  creator_employee_id: string;
  creator_email: string;
  department_id: number;
  department_name: string;
  category_id: number;
  category_name: string;
  category_division: Division;
  priority: Priority;
  status: TicketStatus;
  contact_number: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  assigned_to_extension: string | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  due_date: string;
  is_overdue?: boolean;
  created_at: string;
  updated_at: string;
  attachments?: TicketAttachment[];
  comments?: TicketComment[];
  history?: TicketStatusHistory[];
  assignments?: TicketAssignmentHistory[];
}
