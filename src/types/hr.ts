// HR System Types

export type ApplicationStatus = 
  | 'received'
  | 'screening'
  | 'interview_scheduled'
  | 'trial_scheduled'
  | 'offer_sent'
  | 'hired'
  | 'rejected'
  | 'reserve';

export const FINAL_STATUSES: ApplicationStatus[] = ['hired', 'rejected', 'reserve'];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  received: 'Ontvangen',
  screening: 'Screening',
  interview_scheduled: 'Interview gepland',
  trial_scheduled: 'Proefdienst gepland',
  offer_sent: 'Voorstel verstuurd',
  hired: 'Aangenomen',
  rejected: 'Afgewezen',
  reserve: 'Reserve',
};

export type ActionType = 
  | 'call'
  | 'whatsapp'
  | 'email'
  | 'interview_scheduled'
  | 'trial_scheduled'
  | 'offer_sent'
  | 'hired'
  | 'rejected'
  | 'reserve'
  | 'note'
  | 'housing_assigned'
  | 'document_sent';

export const ACTION_LABELS: Record<ActionType, string> = {
  call: 'Gebeld',
  whatsapp: 'WhatsApp verstuurd',
  email: 'E-mail verstuurd',
  interview_scheduled: 'Interview ingepland',
  trial_scheduled: 'Proefdienst ingepland',
  offer_sent: 'Voorstel verstuurd',
  hired: 'Aangenomen',
  rejected: 'Afgewezen',
  reserve: 'Naar reserve',
  note: 'Notitie toegevoegd',
  housing_assigned: 'Huisvesting toegewezen',
  document_sent: 'Document verstuurd',
};

export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  cv_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  candidate_id: string;
  season: string | null;
  position: string;
  target_location: string | null;
  source: string | null;
  status: ApplicationStatus;
  priority: number;
  // Workflow fields
  owner_user_id: string | null;
  next_action_type: string | null;
  next_action_at: string | null;
  last_contact_at: string | null;
  // Onboarding checklist
  housing_required: boolean;
  housing_arranged: boolean;
  onboarding_docs_sent: boolean;
  house_rules_sent: boolean;
  contract_signed: boolean;
  start_date: string | null;
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined data
  candidate?: Candidate;
}

export interface ApplicationStatusLog {
  id: string;
  application_id: string;
  previous_status: string | null;
  new_status: string;
  action_type: string;
  notes: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface Accommodation {
  id: string;
  name: string;
  address: string | null;
  location: string | null;
  capacity: number;
  description: string | null;
  amenities: string[] | null;
  house_rules_template_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccommodationOccupancy {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  current_occupancy: number;
  available_spots: number;
}

export interface AccommodationAssignment {
  id: string;
  accommodation_id: string;
  candidate_id: string;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'ended';
  notes: string | null;
  created_at: string;
  created_by: string | null;
  // Joined data
  candidate?: Candidate;
  accommodation?: Accommodation;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'onboarding' | 'house_rules' | 'contract';
  location: string | null;
  accommodation_id: string | null;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SentDocument {
  id: string;
  application_id: string;
  template_id: string;
  channel: 'email' | 'whatsapp' | 'download';
  generated_content: string;
  document_url: string | null;
  sent_at: string;
  sent_by: string | null;
  acknowledged_at: string | null;
  // Joined data
  template?: DocumentTemplate;
}

// Inbox tab types
export type InboxTab = 'new' | 'today' | 'overdue';

// Form types
export interface CandidateFormData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  notes?: string;
}

export interface ApplicationFormData {
  candidate_id: string;
  season?: string;
  position: string;
  target_location?: string;
  source?: string;
  priority?: number;
  owner_user_id: string;
  next_action_type: string;
  next_action_at: string;
}

export interface AccommodationFormData {
  name: string;
  address?: string;
  location?: string;
  capacity: number;
  description?: string;
  amenities?: string[];
}

// Action bar config
export interface ActionConfig {
  type: ActionType;
  label: string;
  icon: string;
  statusChange?: ApplicationStatus;
  nextActionDays?: number;
  isFinal?: boolean;
}

export const ACTION_CONFIGS: ActionConfig[] = [
  { type: 'call', label: 'Bel gedaan', icon: 'Phone', nextActionDays: 3 },
  { type: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle', nextActionDays: 1 },
  { type: 'email', label: 'Mail verstuurd', icon: 'Mail', nextActionDays: 3 },
  { type: 'interview_scheduled', label: 'Gesprek gepland', icon: 'Calendar', statusChange: 'interview_scheduled' },
  { type: 'trial_scheduled', label: 'Proefdienst gepland', icon: 'CalendarCheck', statusChange: 'trial_scheduled' },
  { type: 'offer_sent', label: 'Voorstel versturen', icon: 'FileText', statusChange: 'offer_sent', nextActionDays: 5 },
  { type: 'hired', label: 'Aangenomen', icon: 'CheckCircle', statusChange: 'hired', isFinal: true },
  { type: 'rejected', label: 'Afgewezen', icon: 'XCircle', statusChange: 'rejected', isFinal: true },
  { type: 'reserve', label: 'Reserve', icon: 'Clock', statusChange: 'reserve', isFinal: true },
];
