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

// ==========================================
// 1. RECRUITMENT & ATS MODULE
// ==========================================
export type JobStatus = 'draft' | 'published' | 'closed';
export type JobEmploymentType = 'full-time' | 'part-time' | 'contract' | 'remote';
export type JobPriority = 'urgent' | 'high' | 'normal' | 'low';
export type CandidateStage =
  | 'applied'
  | 'screening'
  | 'shortlisted'
  | 'assessment'
  | 'interview'
  | 'hr_round'
  | 'offer'
  | 'pre_joining'
  | 'hired'
  | 'rejected';

export interface PipelineStageConfig {
  id: string;
  name: string;
  key: string;
  color: string;
  requires_scorecard: boolean;
  sla_days: number;
}

export interface CustomPipeline {
  id: string;
  name: string;
  department: string;
  is_default: boolean;
  stages: PipelineStageConfig[];
}

export interface JobOpening {
  id: string;
  organization_id: string;
  title: string;
  department: string;
  location: string;
  type: JobEmploymentType;
  experience_level: string;
  salary_range: string;
  positions_count: number;
  priority?: JobPriority;
  target_joining_date?: string;
  hiring_manager?: string;
  description: string;
  requirements: string[];
  skills?: string[];
  status: JobStatus;
  applicants_count: number;
  published_portals?: ('careers_page' | 'linkedin' | 'indeed' | 'naukri')[];
  pipeline_id?: string;
  created_at: string;
}

export interface CandidateTimelineEvent {
  id: string;
  type: 'applied' | 'stage_change' | 'interview_scheduled' | 'scorecard_added' | 'offer_sent' | 'note';
  title: string;
  description: string;
  created_at: string;
  actor_name: string;
}

export interface CandidateEvaluation {
  technical_score: number; // 1-5
  problem_solving_score: number; // 1-5
  communication_score: number; // 1-5
  culture_fit_score: number; // 1-5
  recommendation: 'strong_hire' | 'hire' | 'hold' | 'reject';
  interviewer_notes: string;
  evaluated_at?: string;
  evaluator_name?: string;
}

export interface CandidateAIMatch {
  overall: number; // 0-100%
  skills: number; // 0-100%
  experience: number; // 0-100%
  education: number; // 0-100%
  location: number; // 0-100%
  salary: number; // 0-100%
  strengths: string[];
  gaps: string[];
}

export interface Candidate {
  id: string;
  job_id: string;
  organization_id: string;
  full_name: string;
  email: string;
  phone: string;
  stage: CandidateStage;
  rating: number; // 1-5
  experience_years: number;
  current_company: string;
  expected_salary: string;
  notice_period_days?: number;
  location?: string;
  education?: string;
  skills?: string[];
  source?: string;
  resume_url?: string;
  scorecard_notes?: string;
  ai_match?: CandidateAIMatch;
  evaluation?: CandidateEvaluation;
  timeline?: CandidateTimelineEvent[];
  applied_at: string;
  job?: JobOpening;
}

export interface InterviewSchedule {
  id: string;
  candidate_id: string;
  candidate_name: string;
  job_id: string;
  job_title: string;
  round_name: string;
  interviewer_name: string;
  scheduled_time: string;
  duration_minutes: number;
  meeting_link: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface OfferLetter {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  job_id: string;
  designation: string;
  department: string;
  annual_ctc: number;
  joining_date: string;
  probation_months: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  created_at: string;
}

export interface ManpowerPlan {
  id: string;
  department: string;
  approved_headcount: number;
  current_headcount: number;
  requested_positions: number;
  annual_budget: number;
  budget_spent: number;
  status: 'approved' | 'pending' | 'review';
}

// ==========================================
// 2. EXPENSE & REIMBURSEMENTS MODULE
// ==========================================
export type ExpenseCategory = 'travel' | 'meals' | 'internet' | 'learning' | 'hardware' | 'other';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed';

export interface ExpenseClaim {
  id: string;
  organization_id: string;
  employee_id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  receipt_url?: string | null;
  description: string;
  status: ExpenseStatus;
  spent_at: string;
  approved_by?: string | null;
  approved_at?: string | null;
  comments?: string;
  created_at: string;
  employee?: Employee;
}

// ==========================================
// 3. ASSET & INVENTORY MANAGEMENT
// ==========================================
export type AssetCategory = 'laptop' | 'monitor' | 'phone' | 'tablet' | 'security_token' | 'furniture' | 'accessories' | 'other';
export type AssetStatus = 'in_use' | 'available' | 'maintenance' | 'retired';

export interface CompanyAsset {
  id: string;
  organization_id: string;
  name: string;
  asset_tag: string; // e.g. "SUB-LPT-009"
  category: AssetCategory;
  model: string;
  serial_number: string;
  purchase_date: string;
  value: number;
  assigned_to_id?: string | null;
  assigned_employee_name?: string | null;
  status: AssetStatus;
  notes?: string;
  last_audited_at?: string;
  last_auditor_name?: string;
  salvage_value?: number;
  disposal_reason?: string;
  disposed_at?: string;
  created_at: string;
  assigned_employee?: Employee;
}

// ==========================================
// 4. EMPLOYEE HELPDESK & TICKETS MODULE
// ==========================================
export type TicketCategory = 'it_support' | 'hr_query' | 'payroll_issue' | 'facility' | 'general';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  organization_id: string;
  employee_id: string;
  ticket_number: string; // e.g. "TKT-1042"
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  assigned_to_id?: string | null;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
  assigned_agent?: Profile;
}

// ==========================================
// 5. LEARNING & DEVELOPMENT (L&D) MODULE
// ==========================================
export interface TrainingCourse {
  id: string;
  organization_id: string;
  title: string;
  category: string;
  description: string;
  duration_minutes: number;
  modules_count: number;
  is_mandatory: boolean;
  instructor: string;
  rating: number;
  thumbnail_url?: string;
  enrolled_count: number;
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  employee_id: string;
  progress_percent: number;
  is_completed: boolean;
  completed_at?: string | null;
  score?: number;
  certificate_id?: string;
  course?: TrainingCourse;
}

// ==========================================
// 6. DOCUMENT VAULT & POLICY MANAGEMENT
// ==========================================
export type DocumentCategory = 'policy' | 'contract' | 'tax_form' | 'handbook' | 'certificate';

export interface CompanyDocument {
  id: string;
  organization_id: string;
  title: string;
  category: DocumentCategory;
  file_size_kb: number;
  version: string;
  file_url: string;
  requires_signature: boolean;
  signatures_count: number;
  uploaded_by: string;
  created_at: string;
}

// ==========================================
// 7. SHIFT SCHEDULING & ROSTERS
// ==========================================
export interface WorkShift {
  id: string;
  organization_id: string;
  name: string; // e.g. "General Day", "Morning Rotational", "Night Shift"
  start_time: string; // "09:00"
  end_time: string; // "18:00"
  color: string;
  allowance_per_day: number;
}

export interface ShiftSchedule {
  id: string;
  employee_id: string;
  shift_id: string;
  date: string; // "YYYY-MM-DD"
  is_overtime: boolean;
  shift?: WorkShift;
  employee?: Employee;
}

// ==========================================
// 8. PULSE SURVEYS & ENPS MODULE
// ==========================================
export interface PulseSurvey {
  id: string;
  organization_id: string;
  title: string;
  question: string;
  type: 'rating_1_5' | 'enps_1_10' | 'yes_no';
  status: 'active' | 'closed';
  responses_count: number;
  average_score: number;
  created_at: string;
}

// ==========================================
// 9. REWARDS & RECOGNITION STORE
// ==========================================
export interface RewardItem {
  id: string;
  organization_id: string;
  title: string;
  points_required: number;
  category: 'gift_card' | 'gadget' | 'merch' | 'experience';
  stock: number;
  description: string;
}

export interface RewardClaim {
  id: string;
  employee_id: string;
  reward_id: string;
  points_spent: number;
  status: 'pending' | 'delivered';
  claimed_at: string;
  reward?: RewardItem;
}

// ==========================================
// 10. WORKFLOW AUTOMATION & RESEND EMAIL
// ==========================================
export type AutomationTrigger =
  | 'on_employee_created'
  | 'on_leave_approved'
  | 'on_leave_rejected'
  | 'on_ticket_resolved'
  | 'on_appraisal_submitted'
  | 'on_expense_approved';

export interface AutomationRule {
  id: string;
  organization_id: string;
  name: string;
  trigger: AutomationTrigger;
  action_type: 'send_resend_email' | 'sync_calendar' | 'create_task' | 'send_push';
  is_active: boolean;
  target_recipient: string; // 'employee' | 'manager' | 'hr'
  template_subject: string;
  executions_count: number;
  last_executed_at?: string | null;
}


