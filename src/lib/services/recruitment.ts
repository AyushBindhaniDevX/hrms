/**
 * Full Enterprise Recruitment & ATS Service
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import {
  JobOpening,
  Candidate,
  CandidateStage,
  CandidateEvaluation,
  InterviewSchedule,
  OfferLetter,
  ManpowerPlan,
} from '@/types/database';
import { createEmployee } from './employee';
import { sendResendEmail } from './resend';

// ----------------------------------------------------
// SEED JOBS REQUISITIONS
// ----------------------------------------------------
let JOBS_STORE: JobOpening[] = [
  {
    id: 'job_1',
    organization_id: 'subedge_org',
    title: 'Principal Full Stack Architect (Mobile & Cloud)',
    department: 'Engineering',
    location: 'Bengaluru / Hybrid',
    type: 'full-time',
    priority: 'urgent',
    experience_level: '6 - 10 Years',
    salary_range: '₹28,00,000 - ₹38,00,000',
    positions_count: 2,
    target_joining_date: '2026-04-15',
    hiring_manager: 'Ayush B. (Head of Technology)',
    description: 'Lead high-concurrency microservices, real-time geofenced attendance pipelines, and mobile apps for enterprise HCM clients.',
    requirements: ['React Native / Expo', 'TypeScript', 'Node.js & Go Microservices', 'Distributed Cloud Architecture'],
    skills: ['React Native', 'TypeScript', 'Node.js', 'Go', 'AWS / GCP', 'PostgreSQL'],
    status: 'published',
    applicants_count: 28,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'job_2',
    organization_id: 'subedge_org',
    title: 'Lead Cybersecurity & Compliance Auditor (SOC 2 / HIPAA)',
    department: 'Security & Governance',
    location: 'Bhubaneswar / Remote',
    type: 'full-time',
    priority: 'high',
    experience_level: '4 - 8 Years',
    salary_range: '₹20,00,000 - ₹28,00,000',
    positions_count: 1,
    target_joining_date: '2026-04-01',
    hiring_manager: 'CISO Office',
    description: 'Ensure SOC 2 Type II, HIPAA and ISO 27001 regulatory readiness, perform continuous vulnerability audits, and manage IAM.',
    requirements: ['SOC 2 Type II Audits', 'HIPAA Health Data Privacy', 'Threat Modelling', 'Cloud Security'],
    skills: ['SOC 2', 'HIPAA', 'ISO 27001', 'SIEM', 'Penetration Testing'],
    status: 'published',
    applicants_count: 19,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'job_3',
    organization_id: 'subedge_org',
    title: 'Senior Product Designer (Design Systems & Micro-Interactions)',
    department: 'Product & Design',
    location: 'Bengaluru',
    type: 'full-time',
    priority: 'normal',
    experience_level: '3 - 6 Years',
    salary_range: '₹16,00,000 - ₹22,00,000',
    positions_count: 1,
    target_joining_date: '2026-05-01',
    hiring_manager: 'Design Lead',
    description: 'Create world-class enterprise SaaS layouts, rich micro-animations, glassmorphism UI, and maintain company design token libraries.',
    requirements: ['Figma Expert', 'Design Systems', 'Mobile UX', 'Micro-Interactions'],
    skills: ['Figma', 'UI/UX', 'Design Tokens', 'Prototyping', 'Design Systems'],
    status: 'published',
    applicants_count: 32,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

// ----------------------------------------------------
// SEED CANDIDATES (CANDIDATE 360 & AI MATCH)
// ----------------------------------------------------
let CANDIDATES_STORE: Candidate[] = [
  {
    id: 'cand_1',
    job_id: 'job_1',
    organization_id: 'subedge_org',
    full_name: 'Priya Sundaram',
    email: 'priya.sundaram@example.com',
    phone: '+91 98765 43210',
    stage: 'interview',
    rating: 5,
    experience_years: 7,
    current_company: 'Infosys Innovation Labs',
    expected_salary: '₹32,00,000',
    notice_period_days: 15,
    location: 'Bengaluru',
    education: 'B.Tech in Computer Science, NIT Trichy',
    skills: ['React Native', 'TypeScript', 'Node.js', 'Go', 'GraphQL', 'AWS'],
    source: 'LinkedIn Direct',
    resume_url: 'https://subedge.vercel.app/resumes/priya_sundaram_cv.pdf',
    scorecard_notes: 'Exceptional system architecture and TypeScript depth. Solved live concurrency challenge with 100% test coverage.',
    ai_match: {
      overall: 94,
      skills: 96,
      experience: 92,
      education: 95,
      location: 100,
      salary: 88,
      strengths: ['Expert in React Native & TypeScript', '15 days immediate notice period', 'Strong microservices background'],
      gaps: ['Minor: Less experience with Google Cloud compared to AWS'],
    },
    evaluation: {
      technical_score: 5,
      problem_solving_score: 5,
      communication_score: 4.5,
      culture_fit_score: 5,
      recommendation: 'strong_hire',
      interviewer_notes: 'Top 1% technical candidate. Recommend fast-tracking to final managerial round.',
      evaluator_name: 'Ayush B. (Principal Architect)',
      evaluated_at: '2026-03-08',
    },
    timeline: [
      { id: 't1', type: 'applied', title: 'Application Received', description: 'Applied via LinkedIn Direct referral', actor_name: 'System', created_at: '2026-03-02' },
      { id: 't2', type: 'stage_change', title: 'Screening Passed', description: 'Recruiter verified CTC & Notice period', actor_name: 'Recruiter Lead', created_at: '2026-03-04' },
      { id: 't3', type: 'interview_scheduled', title: 'Technical Round 1 Scheduled', description: 'Live coding on React Native architecture', actor_name: 'Ayush B.', created_at: '2026-03-06' },
      { id: 't4', type: 'scorecard_added', title: 'Scorecard Submitted: 4.9 / 5.0', description: 'Strong Hire recommendation given', actor_name: 'Ayush B.', created_at: '2026-03-08' },
    ],
    applied_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'cand_2',
    job_id: 'job_1',
    organization_id: 'subedge_org',
    full_name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+91 98451 23456',
    stage: 'assessment',
    rating: 4,
    experience_years: 5.5,
    current_company: 'Wipro Digital',
    expected_salary: '₹26,00,000',
    notice_period_days: 30,
    location: 'Bengaluru',
    education: 'B.E in Information Technology, PES University',
    skills: ['React Native', 'JavaScript', 'Node.js', 'Redux', 'REST APIs'],
    source: 'Career Portal',
    scorecard_notes: 'Good coding foundations. Currently completing take-home architecture test.',
    ai_match: {
      overall: 84,
      skills: 82,
      experience: 85,
      education: 88,
      location: 100,
      salary: 95,
      strengths: ['Great match for salary bracket', 'Solid React ecosystem experience'],
      gaps: ['Needs stronger Go / backend microservices depth'],
    },
    applied_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'cand_3',
    job_id: 'job_2',
    organization_id: 'subedge_org',
    full_name: 'Ananya Verma',
    email: 'ananya.verma@example.com',
    phone: '+91 97123 45678',
    stage: 'offer',
    rating: 5,
    experience_years: 6.5,
    current_company: 'Paladion Security Networks',
    expected_salary: '₹24,00,000',
    notice_period_days: 30,
    location: 'Bhubaneswar / Remote',
    education: 'M.Tech in Cybersecurity, IIT Bhubaneswar',
    skills: ['SOC 2', 'HIPAA', 'ISO 27001', 'SIEM', 'Cloud IAM', 'VAPT'],
    source: 'Employee Referral',
    scorecard_notes: 'Formal offer letter generated for Lead Security Auditor.',
    ai_match: {
      overall: 96,
      skills: 98,
      experience: 95,
      education: 98,
      location: 95,
      salary: 90,
      strengths: ['Master’s in Cybersec from Tier 1 IIT', 'Direct experience leading SOC 2 Type II audit certifications'],
      gaps: ['None identified'],
    },
    evaluation: {
      technical_score: 5,
      problem_solving_score: 5,
      communication_score: 5,
      culture_fit_score: 5,
      recommendation: 'strong_hire',
      interviewer_notes: 'Outstanding candidate. Offered position immediately.',
      evaluator_name: 'CISO Office',
      evaluated_at: '2026-03-05',
    },
    applied_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'cand_4',
    job_id: 'job_3',
    organization_id: 'subedge_org',
    full_name: 'David Wilson',
    email: 'david.wilson@example.com',
    phone: '+91 99887 76655',
    stage: 'screening',
    rating: 4,
    experience_years: 4,
    current_company: 'Freelance Lead UI Designer',
    expected_salary: '₹18,00,000',
    notice_period_days: 0,
    location: 'Bengaluru',
    education: 'B.Des in Interaction Design, NID',
    skills: ['Figma', 'UI/UX', 'Design Tokens', 'Prototyping', 'Framer'],
    source: 'Indeed',
    ai_match: {
      overall: 89,
      skills: 94,
      experience: 82,
      education: 95,
      location: 100,
      salary: 90,
      strengths: ['Immediate joining (0 notice period)', 'Stunning portfolio design system'],
      gaps: ['Slightly fewer years in large enterprise environments'],
    },
    applied_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// ----------------------------------------------------
// SEED INTERVIEW SCHEDULES
// ----------------------------------------------------
let INTERVIEWS_STORE: InterviewSchedule[] = [
  {
    id: 'int_1',
    candidate_id: 'cand_1',
    candidate_name: 'Priya Sundaram',
    job_id: 'job_1',
    job_title: 'Principal Full Stack Architect',
    round_name: 'Technical Round 2: System Concurrency',
    interviewer_name: 'Ayush B. (Principal Architect)',
    scheduled_time: '2026-03-10T14:30:00Z',
    duration_minutes: 60,
    meeting_link: 'https://meet.google.com/sub-tech-arch',
    status: 'scheduled',
    notes: 'Focus on distributed lock design and geofencing caching.',
  },
  {
    id: 'int_2',
    candidate_id: 'cand_2',
    candidate_name: 'Rahul Sharma',
    job_id: 'job_1',
    job_title: 'Principal Full Stack Architect',
    round_name: 'Technical Screening & Code Review',
    interviewer_name: 'Engineering Lead',
    scheduled_time: '2026-03-11T11:00:00Z',
    duration_minutes: 45,
    meeting_link: 'https://meet.google.com/sub-code-eval',
    status: 'scheduled',
  },
];

// ----------------------------------------------------
// SEED OFFERS
// ----------------------------------------------------
let OFFERS_STORE: OfferLetter[] = [
  {
    id: 'off_1',
    candidate_id: 'cand_3',
    candidate_name: 'Ananya Verma',
    candidate_email: 'ananya.verma@example.com',
    job_id: 'job_2',
    designation: 'Lead Cybersecurity & Compliance Auditor',
    department: 'Security & Governance',
    annual_ctc: 2400000,
    joining_date: '2026-04-01',
    probation_months: 3,
    status: 'sent',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// ----------------------------------------------------
// SEED MANPOWER PLANS
// ----------------------------------------------------
let MANPOWER_STORE: ManpowerPlan[] = [
  {
    id: 'mp_1',
    department: 'Engineering',
    approved_headcount: 24,
    current_headcount: 18,
    requested_positions: 6,
    annual_budget: 15000000,
    budget_spent: 10800000,
    status: 'approved',
  },
  {
    id: 'mp_2',
    department: 'Security & Governance',
    approved_headcount: 8,
    current_headcount: 5,
    requested_positions: 3,
    annual_budget: 7500000,
    budget_spent: 4200000,
    status: 'approved',
  },
  {
    id: 'mp_3',
    department: 'Product & Design',
    approved_headcount: 6,
    current_headcount: 4,
    requested_positions: 2,
    annual_budget: 4500000,
    budget_spent: 2800000,
    status: 'approved',
  },
];

// ----------------------------------------------------
// SERVICE METHODS
// ----------------------------------------------------
export async function getJobs(): Promise<JobOpening[]> {
  return [...JOBS_STORE];
}

export async function createJob(job: Omit<JobOpening, 'id' | 'applicants_count' | 'created_at'>): Promise<JobOpening> {
  const newJob: JobOpening = {
    ...job,
    id: `job_${Date.now()}`,
    applicants_count: 0,
    created_at: new Date().toISOString(),
  };
  JOBS_STORE.unshift(newJob);
  return newJob;
}

export async function getCandidates(jobId?: string): Promise<Candidate[]> {
  if (jobId) {
    return CANDIDATES_STORE.filter((c) => c.job_id === jobId);
  }
  return [...CANDIDATES_STORE];
}

export async function getCandidateById(candidateId: string): Promise<Candidate | undefined> {
  return CANDIDATES_STORE.find((c) => c.id === candidateId);
}

export async function updateCandidateStage(candidateId: string, stage: CandidateStage): Promise<Candidate> {
  const candidate = CANDIDATES_STORE.find((c) => c.id === candidateId);
  if (!candidate) throw new Error('Candidate not found');
  candidate.stage = stage;
  if (!candidate.timeline) candidate.timeline = [];
  candidate.timeline.unshift({
    id: `t_${Date.now()}`,
    type: 'stage_change',
    title: `Stage Updated to: ${stage.replace('_', ' ').toUpperCase()}`,
    description: `Candidate advanced to ${stage} stage by HR Recruitment team`,
    actor_name: 'HR Recruiter',
    created_at: new Date().toISOString(),
  });
  return candidate;
}

export async function submitCandidateEvaluation(candidateId: string, evaluation: CandidateEvaluation): Promise<Candidate> {
  const candidate = CANDIDATES_STORE.find((c) => c.id === candidateId);
  if (!candidate) throw new Error('Candidate not found');
  candidate.evaluation = evaluation;
  const avg = (evaluation.technical_score + evaluation.problem_solving_score + evaluation.communication_score + evaluation.culture_fit_score) / 4;
  candidate.rating = Math.round(avg * 10) / 10;
  if (!candidate.timeline) candidate.timeline = [];
  candidate.timeline.unshift({
    id: `t_${Date.now()}`,
    type: 'scorecard_added',
    title: `Evaluation Submitted: ${candidate.rating} ★ (${evaluation.recommendation.replace('_', ' ').toUpperCase()})`,
    description: evaluation.interviewer_notes,
    actor_name: evaluation.evaluator_name || 'Interviewer',
    created_at: new Date().toISOString(),
  });
  return candidate;
}

export async function getInterviews(): Promise<InterviewSchedule[]> {
  return [...INTERVIEWS_STORE];
}

export async function scheduleInterview(data: Omit<InterviewSchedule, 'id'>): Promise<InterviewSchedule> {
  const newInt: InterviewSchedule = {
    ...data,
    id: `int_${Date.now()}`,
  };
  INTERVIEWS_STORE.unshift(newInt);

  // Update candidate timeline
  const candidate = CANDIDATES_STORE.find((c) => c.id === data.candidate_id);
  if (candidate) {
    if (!candidate.timeline) candidate.timeline = [];
    candidate.timeline.unshift({
      id: `t_${Date.now()}`,
      type: 'interview_scheduled',
      title: `Interview Scheduled: ${data.round_name}`,
      description: `With ${data.interviewer_name} at ${new Date(data.scheduled_time).toLocaleString()}`,
      actor_name: 'HR Coordinator',
      created_at: new Date().toISOString(),
    });

    try {
      const { sendInterviewInviteEmail } = await import('./resend');
      await sendInterviewInviteEmail(
        candidate.email,
        candidate.full_name,
        data.round_name,
        data.scheduled_time,
        data.meeting_link
      );
    } catch (mailErr) {
      console.warn('Resend interview email warning:', mailErr);
    }
  }

  return newInt;
}

export async function getOffers(): Promise<OfferLetter[]> {
  return [...OFFERS_STORE];
}

export async function generateOffer(data: Omit<OfferLetter, 'id' | 'created_at'>): Promise<OfferLetter> {
  const newOffer: OfferLetter = {
    ...data,
    id: `off_${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  OFFERS_STORE.unshift(newOffer);

  // Update candidate stage to offer
  const candidate = CANDIDATES_STORE.find((c) => c.id === data.candidate_id);
  if (candidate) {
    candidate.stage = 'offer';
    if (!candidate.timeline) candidate.timeline = [];
    candidate.timeline.unshift({
      id: `t_${Date.now()}`,
      type: 'offer_sent',
      title: `Offer Generated: ₹${(data.annual_ctc / 100000).toFixed(1)} LPA`,
      description: `Designation: ${data.designation} · Joining: ${data.joining_date}`,
      actor_name: 'HR Head',
      created_at: new Date().toISOString(),
    });
  }

  // Send Resend notification via dedicated template
  try {
    const { sendOfferLetterEmail } = await import('./resend');
    await sendOfferLetterEmail(
      data.candidate_email,
      data.candidate_name,
      data.designation,
      data.annual_ctc,
      data.joining_date
    );
  } catch (mailErr) {
    console.warn('Resend offer email warning:', mailErr);
  }

  return newOffer;
}

export async function getManpowerPlans(): Promise<ManpowerPlan[]> {
  return [...MANPOWER_STORE];
}

/**
 * 1-Click Handoff: Converts a hired candidate directly into an Active Employee Record
 */
export async function convertCandidateToEmployee(candidateId: string): Promise<{ success: boolean; employeeId: string }> {
  const candidate = CANDIDATES_STORE.find((c) => c.id === candidateId);
  if (!candidate) throw new Error('Candidate not found');

  const empCode = `SUB-EMP-${Math.floor(100 + Math.random() * 900)}`;

  try {
    await createEmployee({
      email: candidate.email,
      password: 'TemporaryPassword123!',
      full_name: candidate.full_name,
      phone: candidate.phone,
      role: 'employee',
      organization_id: 'subedge_org',
      employee_code: empCode,
      designation: candidate.job?.title || 'Specialist',
      basic_salary: 150000,
    });
  } catch (err) {
    console.warn('Simulated employee creation in offline/demo mode:', err);
  }

  candidate.stage = 'hired';
  return { success: true, employeeId: empCode };
}
