// Types for Calendar CRM module

// Agency types
export type Agency = 'biskit';

export const AGENCIES: { id: Agency; name: string; logo?: string }[] = [
  { id: 'biskit', name: 'Biskit Agencia', logo: '/logo-biskit.png' }
];

export const AGENCY_LABELS: Record<Agency, string> = {
  biskit: 'Biskit Agencia'
};

export interface CalendarContact {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberCalendar {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

// 5 estados exactos del calendario
export type CalendarStatus = 
  | 'Pendiente de enviar' 
  | 'Pendiente de aprobación' 
  | 'Editado' 
  | 'Aprobado' 
  | 'Calendario publicado';

export type FeedbackStatus = 'sin_feedback' | 'con_feedback' | 'aprobado';

export type ApprovalStatus = 'pending' | 'approved_no_changes';

export interface ContentCalendar {
  id: string;
  calendar_contact_id: string;
  channel: string;
  month_start: string;
  month_end: string;
  status: CalendarStatus;
  feedback_status: FeedbackStatus | null;
  approval_status?: ApprovalStatus | null;
  approved_at?: string | null;
  approved_via?: string | null;
  pdf_url: string | null;
  pdf_generated_at: string | null;
  agencies: Agency[];
  created_at: string;
  updated_at: string;
  // Joined data
  calendar_contact?: CalendarContact;
  responsibles?: TeamMemberCalendar[];
}

export interface ContentCalendarResponsible {
  id: string;
  calendar_id: string;
  team_member_id: string;
  created_at: string;
  team_member?: TeamMemberCalendar;
}

export type CalendarEditAction = 
  | 'created' 
  | 'updated' 
  | 'pdf_generated' 
  | 'status_changed' 
  | 'note_added' 
  | 'feedback_received' 
  | 'feedback_reviewed'
  | 'feedback_reviewed_approved'
  | 'approved_no_changes'
  | 'approval_notification_sent'
  | 'approval_notification_error'
  | 'email_sent' 
  | 'email_error' 
  | 'calendar_sent'
  | 'document_updated';

export interface ContentCalendarEdit {
  id: string;
  calendar_id: string;
  action: CalendarEditAction;
  details: Record<string, unknown> | null;
  performed_by: string | null;
  template_name: string | null;
  created_at: string;
}

// 5 estados exactos
export const CALENDAR_STATUSES: CalendarStatus[] = [
  'Pendiente de enviar',
  'Pendiente de aprobación',
  'Editado',
  'Aprobado',
  'Calendario publicado'
];

// Colores para cada estado
export const STATUS_COLORS: Record<CalendarStatus, string> = {
  'Pendiente de enviar': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Pendiente de aprobación': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Editado': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Aprobado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'Calendario publicado': 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300'
};

// Helper to validate and cast status from DB
export function parseCalendarStatus(status: string): CalendarStatus {
  if (CALENDAR_STATUSES.includes(status as CalendarStatus)) {
    return status as CalendarStatus;
  }
  // Migrate old statuses
  if (status === 'Pendiente') return 'Pendiente de enviar';
  if (status === 'Enviado') return 'Pendiente de aprobación';
  return 'Pendiente de enviar';
}
