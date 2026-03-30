import type { PermissionMap } from "./permissions";

// ── Database Row Types (what Supabase returns) ─────────────────────────────

export type UserType = "Admin" | "Operator";
export type UserGender = "Male" | "Female" | "Other";
export type UserStatus = "Active" | "Inactive";
export type DocumentType =
  | "resume"
  | "nid_copy"
  | "academic_document"
  | "bank_account"
  | "agreement"
  | "other";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  department_id: string | null;
  name: string;
  description: string | null;
  permissions: PermissionMap;
  created_at: string;
  updated_at: string;
  // joined
  department?: Department | null;
}

export interface User {
  id: string;
  type: UserType;
  status: UserStatus;
  name: string;
  nickname: string | null;
  email: string;
  personal_phone: string | null;
  office_phone: string | null;
  gender: UserGender | null;
  address: string | null;
  date_of_birth: string | null;
  department_id: string | null;
  role_id: string | null;
  joining_date: string | null;
  current_salary: number | null;
  working_procedure: string | null;
  profile_picture: string | null;
  cover_photo: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_relation: string | null;
  created_at: string;
  updated_at: string;
  theme_preference: "light" | "dark" | "system";
  // joined
  department?: Department | null;
  role?: Role | null;
  social_links?: UserSocialLink[];
  documents?: UserDocument[];
}

export interface UserDocument {
  id: string;
  user_id: string;
  type: DocumentType;
  label: string | null;
  storage_path: string;
  created_at: string;
}

export interface UserSocialLink {
  id: string;
  user_id: string;
  platform: string;
  url: string;
  created_at: string;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  activity: string;
  created_at: string;
}

// ── Form Input Types ────────────────────────────────────────────────────────

export interface CreateUserInput {
  name: string;
  nickname?: string;
  email: string;
  password: string;
  type: UserType;
  status?: UserStatus;
  personal_phone?: string;
  office_phone?: string;
  gender?: UserGender;
  address?: string;
  date_of_birth?: string;
  department_id?: string;
  role_id?: string;
  joining_date?: string;
  current_salary?: number;
  working_procedure?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_relation?: string;
}

export interface UpdateUserInput {
  name?: string;
  nickname?: string;
  personal_phone?: string;
  office_phone?: string;
  gender?: UserGender;
  address?: string;
  date_of_birth?: string;
  department_id?: string;
  role_id?: string;
  joining_date?: string;
  current_salary?: number;
  working_procedure?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_relation?: string;
}

export interface CreateDepartmentInput {
  name: string;
  description?: string;
}

export interface CreateRoleInput {
  department_id: string;
  name: string;
  description?: string;
  permissions: PermissionMap;
}

export interface UpdateRolePermissionsInput {
  role_id: string;
  permissions: PermissionMap;
}

// ── Server Action Result type ───────────────────────────────────────────────

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

export type ChatUser = Pick<User, "id" | "name" | "profile_picture">;

export interface ContactableUser extends ChatUser {
  department?: Pick<Department, "name"> | null;
}

export interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  sender: ChatUser;
}

export interface ChatSidebarItem {
  id: string;
  type: string;
  updated_at: string;
  otherUsers: ChatUser[];
  latestMessage: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  isUnread: boolean;
}
// ── Lead Management Types ──────────────────────────────────────────────────

export type LeadSource = "Facebook" | "WhatsApp" | "Web" | "Phone";

export interface Lead {
  id: string;
  cid: string | null;
  name: string;
  status: string;
  source: LeadSource;
  profile_picture: string | null;
  phones: string[];
  address: {
    division?: string;
    district?: string;
    area?: string;
    address?: string;
  };
  project_status: {
    status: string | null;
    subStatus: string | null;
  };
  finance: {
    clientsBudget?: number;
    projectValue?: number;
    soldAmount?: number;
    soldDate?: string;
    totalPayment?: number;
    totalDue?: number;
  };
  page_info: {
    pageId?: string;
    pageName?: string;
    pageProfilePicture?: string;
    fbSenderID?: string;
  } | null;
  whatsapp_info: {
    jid?: string;
    lid?: string;
    pushName?: string;
    verifiedBizName?: string;
    device?: string;
    profilePicture?: string;
  } | null;
  bot_responded: boolean;
  replied_from_system: boolean;
  ai_bot_reply: boolean;
  sales_executive_id: string | null;
  cre_id: string | null;
  last_assigned: string;
  created_at: string;
  updated_at: string;
  // joined
  sales_executive?: User | null;
  cre?: User | null;
  comments?: LeadComment[];
  follow_ups?: LeadFollowUp[];
  meetings?: LeadMeeting[];
  payments?: LeadPayment[];
  call_logs?: LeadCallLog[];
  requirements?: string[];
}

/**
 * Fields safe to pass to an INSERT on the leads table.
 * Excludes computed join relations (sales_executive, cre, comments, etc.).
 */
export interface CreateLeadInput {
  name: string;
  source: string;
  phones?: string[];
  status?: string;
  address?: Lead["address"];
  project_status?: Lead["project_status"];
  finance?: Omit<Lead["finance"], "totalPayment" | "totalDue">;
  page_info?: Lead["page_info"];
  whatsapp_info?: Lead["whatsapp_info"];
  bot_responded?: boolean;
  replied_from_system?: boolean;
  ai_bot_reply?: boolean;
  sales_executive_id?: string | null;
  cre_id?: string | null;
  requirements?: string[];
  profile_picture?: string | null;
}

/**
 * Fields safe to pass to an UPDATE on the leads table.
 * Excludes id, cid (system-generated), created_at, and all join relations.
 */
export type UpdateLeadInput = Partial<Omit<CreateLeadInput, "source" | "name">> & {
  name?: string;
  source?: string;
  status?: string;
  updated_at?: string;
};

/**
 * Computed finance totals joined from lead_payments.
 * Replaces the stale JSONB totalPayment/totalDue fields.
 * Returned from the `lead_finance_computed` DB view.
 */
export interface LeadComputedFinance {
  lead_id: string;
  project_value: number;
  sold_amount: number;
  sold_date: string | null;
  clients_budget: number;
  total_payment: number;
  total_due: number;
}

export interface LeadMeeting {
  id: string;
  lead_id: string;
  sales_executive_id: string | null;
  date: string;
  slot: string;
  status: string;
  meeting_flow_status: string | null;
  visit_charge: number;
  /** GPS/address data for travel tracking — shape varies, stored as JSONB */
  locations: Record<string, unknown>;
  /** Audit/metadata fields — stored as JSONB, shape may evolve */
  audit_fields: Record<string, unknown>;
  project_location: "Inside" | "Outside";
  created_at: string;
  updated_at: string;
  // joined
  sales_executive?: User | null;
  lead?: Partial<Lead> | null;
}

export interface LeadPayment {
  id: string;
  lead_id: string;
  recorded_by: string | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  payment_status: string;
  payment_note: string | null;
  created_at: string;
  updated_at: string;
  // joined
  user?: User | null;
}

export interface LeadCallLog {
  id: string;
  lead_id: string;
  recorded_by: string | null;
  recipient_number: string;
  call_type: string;
  status: string;
  call_duration: string | null;
  timestamp: string;
  created_at: string;
  // joined
  user?: User | null;
}

export interface LeadComment {
  id: string;
  lead_id: string;
  comment_by: string;
  comment: string;
  images: string[];
  created_at: string;
  // joined
  user?: User | null;
}

export interface LeadFollowUp {
  id: string;
  lead_id: string;
  assigned_to: string | null;
  type: "Call" | "Physical Meeting";
  status: string;
  time: string;
  comment_id: string | null;
  ten_min_notification_sent: boolean;
  created_at: string;
}

export type FollowUpWithLead = LeadFollowUp & { 
  lead: Lead & { 
    comments?: { 
      comment: string; 
      created_at: string;
      user?: { id: string; name: string; profile_picture: string | null };
    }[] 
  };
  assigned_user?: User | null;
};

export interface MeetingSlot {
  id: string;
  slot_text: string;
  display_order: number;
  is_active: boolean;
}

export interface Salesperson {
  id: string;
  name: string;
  nickname: string | null;
  profile_picture: string | null;
}

export interface SiteSettings {
  id: string;
  company_name: string;
  brand_logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  updated_at: string;
}

export interface UpdateSiteSettingsInput {
  company_name?: string;
  brand_logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}
