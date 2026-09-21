export type Role = "admin" | "employee" | "comptable";

export type DayType =
  | "normal"
  | "conge"
  | "maladie"
  | "ferie_paye"
  | "ferie_non_paye"
  | "repos";

export type WorkMode = "presentiel" | "teletravail" | null;

export type LeaveType = "conge" | "maladie";

export interface WeekdayHours {
  "0": number; // Sunday
  "1": number; // Monday
  "2": number;
  "3": number;
  "4": number;
  "5": number;
  "6": number; // Saturday
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  function_title: string | null;
  company: string;
  phone: string | null;
  weekly_target_hours: number;
  weekday_hours: WeekdayHours;
  monthly_salary: number;
  conge_days_per_month: number;
  maladie_days_per_month: number;
  active: boolean;
  created_at: string;
}

export type NotificationType =
  | "holiday"
  | "leave_request"
  | "leave_decision"
  | "team_leave"
  | "payslip"
  | "salary"
  | "task"
  | "meeting"
  | "message"
  | "info";

export interface AppNotification {
  id: string;
  profile_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface LeaveBalance {
  id: string;
  profile_id: string;
  year: number;
  leave_type: LeaveType;
  total: number;
  used: number;
}

export interface TimeEntry {
  id: string;
  profile_id: string;
  entry_date: string; // YYYY-MM-DD
  day_type: DayType;
  work_mode: WorkMode;
  start_time: string | null; // HH:MM
  end_time: string | null;
  break_minutes: number;
  break_start: string | null; // HH:MM when a pause is currently running
  hours: number;
  tasks: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeTask {
  id: string;
  profile_id: string;
  task_date: string; // YYYY-MM-DD
  title: string;
  description: string | null;
  is_innovation: boolean;
  done: boolean;
  created_at: string;
  updated_at: string;
}

export type LeaveRequestStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  profile_id: string;
  leave_type: LeaveType;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  comment: string | null;
  status: LeaveRequestStatus;
  admin_comment: string | null;
  created_at: string;
  decided_at: string | null;
}

export type MeetingRecurrence = "none" | "weekly" | "monthly";

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  meeting_link: string | null;
  start_at: string; // ISO timestamp
  end_at: string | null;
  created_by: string;
  recurrence: MeetingRecurrence;
  minutes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  meeting_id: string;
  profile_id: string;
  full_name: string;
}

export interface MeetingAttachment {
  id: string;
  meeting_id: string;
  original_name: string;
  mime_type: string;
  size: number;
  uploaded_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string | null; // null = annonce diffusée à tous
  body: string;
  created_at: string;
  read: boolean;
}

export interface PersonalContact {
  id: string;
  owner_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  note: string | null;
  created_at: string;
}

export interface ConversationSummary {
  profile_id: string;
  full_name: string;
  last_message: string;
  last_at: string;
  unread: number;
}
