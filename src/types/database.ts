// Database types matching Supabase schema

export type UserRole = 'employee' | 'hr' | 'admin';
export type EmploymentStatus = 'active' | 'inactive' | 'terminated';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type PayrollStatus = 'draft' | 'processed' | 'paid';
export type PayrollPeriodStatus = 'open' | 'processing' | 'closed';

export interface Organization {
  id: string;
  name: string;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  session_id?: string;
  last_login_ip?: string;
  last_active?: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  manager_id?: string | null;
  created_at: string;
  // Joined
  manager?: Employee;
  employee_count?: number;
}

export interface Employee {
  id: string;
  profile_id: string;
  employee_code: string | null;
  department_id: string | null;
  designation: string | null;
  joining_date: string | null;
  workplace_id: string | null;
  manager_id?: string | null;
  basic_salary: number;
  employment_status: EmploymentStatus;
  onboarding_completed: boolean;
  home_address?: string | null;
  bank_details?: {
    bank_name: string;
    account_number: string;
    routing_number: string;
  } | null;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship?: string;
  } | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
  department?: Department;
  workplace?: Workplace;
  manager?: Employee;
  direct_reports?: Employee[];
}

export interface Workplace {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  workplace_id: string | null;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  clock_in_latitude: number | null;
  clock_in_longitude: number | null;
  clock_out_latitude: number | null;
  clock_out_longitude: number | null;
  clock_in_verified: boolean;
  clock_out_verified: boolean;
  working_minutes: number;
  status: AttendanceStatus;
  breaks?: { start: string; end: string | null; reason: string }[];
  created_at: string;
  updated_at: string;
  // Joined
  employee?: Employee;
}

export interface LeaveType {
  id: string;
  organization_id: string;
  name: string;
  annual_days: number;
  is_paid: boolean;
  created_at: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
  // Joined
  leave_type?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days: number;
  is_half_day: boolean;
  reason: string | null;
  status: LeaveRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  leave_type?: LeaveType;
  employee?: Employee;
  reviewer?: Profile;
}

export interface PayrollPeriod {
  id: string;
  organization_id: string;
  month: number;
  year: number;
  status: PayrollPeriodStatus;
  processed_at: string | null;
  created_at: string;
}

export interface Payroll {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  basic_salary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  lop_days: number;
  lop_amount: number;
  gross_salary: number;
  net_salary: number;
  status: PayrollStatus;
  created_at: string;
  updated_at: string;
  // Joined
  employee?: Employee;
  payroll_period?: PayrollPeriod;
}

export interface Payslip {
  id: string;
  payroll_id: string;
  employee_id: string;
  payslip_number: string;
  period_month: number;
  period_year: number;
  file_url: string | null;
  created_at: string;
  // Joined
  payroll?: Payroll;
  employee?: Employee;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  // Joined
  user?: Profile;
}

export interface Notification {
  id: string;
  profile_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

// RPC Response types
export interface GeofenceResponse {
  success: boolean;
  message?: string;
  error?: string;
  attendance_id?: string;
  status?: AttendanceStatus;
  distance_meters?: number;
  clock_in?: string;
  clock_out?: string;
  working_minutes?: number;
}

export interface LeaveProcessResponse {
  success: boolean;
  message?: string;
  error?: string;
  status?: LeaveRequestStatus;
}

// Performance & OKRs Management Types
export type GoalCategory = 'company' | 'department' | 'individual';
export type GoalPriority = 'low' | 'medium' | 'high';
export type GoalStatus = 'not_started' | 'in_progress' | 'on_track' | 'at_risk' | 'completed';

export interface KeyResult {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  completed?: boolean;
}

export interface Goal {
  id: string;
  organization_id: string;
  employee_id?: string | null;
  department_id?: string | null;
  title: string;
  description: string | null;
  category: GoalCategory;
  priority: GoalPriority;
  status: GoalStatus;
  progress: number; // 0 - 100
  start_date: string;
  target_date: string;
  key_results: KeyResult[];
  created_at: string;
  updated_at: string;
  // Joined
  employee?: Employee;
  department?: Department;
}

export type AppraisalStatus = 'self_review' | 'manager_review' | 'completed';
export type AppraisalRecommendation = 'promotion' | 'salary_increment' | 'maintain' | 'pip';

export interface PerformanceRatingBreakdown {
  technical_skills: number; // 1-5
  productivity: number; // 1-5
  communication: number; // 1-5
  leadership: number; // 1-5
  teamwork: number; // 1-5
}

export interface AppraisalReview {
  id: string;
  organization_id: string;
  employee_id: string;
  reviewer_id?: string | null;
  cycle_name: string;
  period: string; // e.g. "Q1 2026", "Annual 2026"
  status: AppraisalStatus;
  self_rating: number; // 1-5
  self_comments?: string | null;
  self_submitted_at?: string | null;
  manager_rating?: number | null; // 1-5
  manager_comments?: string | null;
  manager_submitted_at?: string | null;
  ratings_breakdown?: PerformanceRatingBreakdown | null;
  overall_score?: number | null; // out of 100 or 5.0
  recommendation?: AppraisalRecommendation | null;
  created_at: string;
  updated_at: string;
  // Joined
  employee?: Employee;
  reviewer?: Profile;
}

export type KudosBadge = 'star' | 'team_player' | 'innovator' | 'leadership' | 'rockstar' | 'problem_solver';

export interface Kudos {
  id: string;
  organization_id: string;
  sender_id: string;
  receiver_id: string;
  badge: KudosBadge;
  message: string;
  created_at: string;
  // Joined
  sender?: Profile;
  receiver?: Profile;
}

