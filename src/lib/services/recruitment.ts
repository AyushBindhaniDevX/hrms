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
  CustomPipeline,
  RejectionReasonCode,
  PipelineStageConfig,
} from '@/types/database';
import { createEmployee } from './employee';
import { sendApplicationReceivedEmail, sendBulkCandidateUpdateEmail, sendRejectionEmail, sendResendEmail } from './resend';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

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
    published_portals: ['careers_page', 'linkedin', 'indeed', 'naukri'],
    pipeline_id: 'pipe_it',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'job_2',
    organization_id: 'subedge_org',
    title: 'Lead Cybersecurity & Compliance Auditor (SOC 2 / HIPAA)',
    department: 'Security & Governance',
    location: 'Bhubaneswar / Remote',
    type: 'remote',
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
    published_portals: ['careers_page', 'linkedin', 'indeed'],
    pipeline_id: 'pipe_sec',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'job_3',
    organization_id: 'subedge_org',
    title: 'Senior Product Designer (Design Systems & Micro-Interactions)',
    department: 'Product & Design',
    location: 'Bengaluru / Hybrid',
    type: 'hybrid',
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
    published_portals: ['careers_page', 'linkedin'],
    pipeline_id: 'pipe_product',
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
    current_location: 'Bengaluru, Karnataka',
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
    linkedin_url: 'https://linkedin.com/in/priyasundaram',
    portfolio_url: 'https://github.com/priyasundaram',
    knockout_passed: true,
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
    current_location: 'Bengaluru, Karnataka',
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
    resume_url: 'https://subedge.vercel.app/resumes/rahul_sharma_cv.pdf',
    linkedin_url: 'https://linkedin.com/in/rahulsharma',
    knockout_passed: true,
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
    current_location: 'Bhubaneswar, Odisha',
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
    resume_url: 'https://subedge.vercel.app/resumes/ananya_verma_cv.pdf',
    linkedin_url: 'https://linkedin.com/in/ananyaverma',
    knockout_passed: true,
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
    current_location: 'Bengaluru, Karnataka',
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
    resume_url: 'https://subedge.vercel.app/resumes/david_wilson_portfolio.pdf',
    portfolio_url: 'https://dribbble.com/davidwilson',
    knockout_passed: true,
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
  {
    id: 'cand_5',
    job_id: 'job_1',
    organization_id: 'subedge_org',
    full_name: 'Vikramaditya Sengupta',
    email: 'vikram.sengupta@example.com',
    phone: '+91 91234 56780',
    current_location: 'Hyderabad, Telangana',
    stage: 'talent_pool',
    rating: 4.8,
    experience_years: 9,
    current_company: 'Oracle Cloud Infrastructure',
    expected_salary: '₹42,00,000',
    notice_period_days: 60,
    location: 'Hyderabad / Remote',
    education: 'B.Tech CS, BITS Pilani',
    skills: ['Go', 'Distributed Systems', 'Kubernetes', 'PostgreSQL', 'Redis'],
    source: 'Naukri',
    resume_url: 'https://subedge.vercel.app/resumes/vikram_cv.pdf',
    linkedin_url: 'https://linkedin.com/in/vikramsengupta',
    knockout_passed: true,
    is_silver_medalist: true,
    talent_pool_tags: ['Silver Medalist', 'Distributed Systems Specialist', 'Fast-Track Lead'],
    scorecard_notes: 'Silver Medalist for Principal Architect role. Top-tier engineering acumen; archived for Q3 High-Capacity Expansion.',
    ai_match: {
      overall: 93,
      skills: 97,
      experience: 98,
      education: 95,
      location: 90,
      salary: 80,
      strengths: ['Deep Go & distributed microservices expert', 'BITS Pilani alumnus'],
      gaps: ['Expected CTC slightly higher than initial budget bracket'],
    },
    applied_at: new Date(Date.now() - 20 * 86400000).toISOString(),
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
// CUSTOM PIPELINE CONFIGURATIONS (MULTI-TRACK)
// ----------------------------------------------------
let CUSTOM_PIPELINES_STORE: CustomPipeline[] = [
  {
    id: 'pipe_it',
    name: 'IT & Cloud Engineering Track',
    department: 'Engineering',
    is_default: true,
    stages: [
      { id: 's1', name: 'Applied', key: 'applied', color: '#64748B', requires_scorecard: false, sla_days: 2 },
      { id: 's2', name: 'HR Recruiter Screening', key: 'screening', color: '#D97706', requires_scorecard: false, sla_days: 3 },
      { id: 's3', name: 'Technical Coding Challenge', key: 'assessment', color: '#8B5CF6', requires_scorecard: true, sla_days: 4 },
      { id: 's4', name: 'System Architecture Interview', key: 'interview', color: '#0D7377', requires_scorecard: true, sla_days: 5 },
      { id: 's5', name: 'Final Offer Sent', key: 'offer', color: '#2563EB', requires_scorecard: false, sla_days: 3 },
      { id: 's6', name: 'Hired & Onboarded', key: 'hired', color: '#10B981', requires_scorecard: false, sla_days: 1 },
    ],
  },
  {
    id: 'pipe_sec',
    name: 'Cybersecurity & Compliance Track',
    department: 'Security & Governance',
    is_default: false,
    stages: [
      { id: 'sec1', name: 'Application Vetting', key: 'applied', color: '#64748B', requires_scorecard: false, sla_days: 2 },
      { id: 'sec2', name: 'SOC 2 & Audit Screening', key: 'screening', color: '#D97706', requires_scorecard: true, sla_days: 3 },
      { id: 'sec3', name: 'Vulnerability Assessment Test', key: 'assessment', color: '#8B5CF6', requires_scorecard: true, sla_days: 4 },
      { id: 'sec4', name: 'CISO Panel Interview', key: 'interview', color: '#0D7377', requires_scorecard: true, sla_days: 5 },
      { id: 'sec5', name: 'Offer Letter', key: 'offer', color: '#2563EB', requires_scorecard: false, sla_days: 3 },
      { id: 'sec6', name: 'Hired & Cleared', key: 'hired', color: '#10B981', requires_scorecard: false, sla_days: 1 },
    ],
  },
  {
    id: 'pipe_product',
    name: 'Product & Design Track',
    department: 'Product & Design',
    is_default: false,
    stages: [
      { id: 'p1', name: 'Portfolio Review', key: 'applied', color: '#64748B', requires_scorecard: false, sla_days: 2 },
      { id: 'p2', name: 'Design Ethos Screening', key: 'screening', color: '#D97706', requires_scorecard: false, sla_days: 3 },
      { id: 'p3', name: 'Design Challenge / Figma', key: 'assessment', color: '#8B5CF6', requires_scorecard: true, sla_days: 4 },
      { id: 'p4', name: 'Design Crit & Lead Panel', key: 'interview', color: '#0D7377', requires_scorecard: true, sla_days: 4 },
      { id: 'p5', name: 'Offer Extended', key: 'offer', color: '#2563EB', requires_scorecard: false, sla_days: 3 },
      { id: 'p6', name: 'Hired 🎉', key: 'hired', color: '#10B981', requires_scorecard: false, sla_days: 1 },
    ],
  },
  {
    id: 'pipe_sales',
    name: 'Sales & Growth Track',
    department: 'Sales & Marketing',
    is_default: false,
    stages: [
      { id: 'sl1', name: 'Resume Vetting', key: 'applied', color: '#64748B', requires_scorecard: false, sla_days: 2 },
      { id: 'sl2', name: 'Discovery Screening', key: 'screening', color: '#D97706', requires_scorecard: false, sla_days: 2 },
      { id: 'sl3', name: 'Mock Pitch & Negotiation', key: 'assessment', color: '#8B5CF6', requires_scorecard: true, sla_days: 3 },
      { id: 'sl4', name: 'VP Growth Interview', key: 'interview', color: '#0D7377', requires_scorecard: true, sla_days: 3 },
      { id: 'sl5', name: 'Offer Letter', key: 'offer', color: '#2563EB', requires_scorecard: false, sla_days: 2 },
      { id: 'sl6', name: 'Hired', key: 'hired', color: '#10B981', requires_scorecard: false, sla_days: 1 },
    ],
  },
];

// ----------------------------------------------------
// SERVICE METHODS: JOBS
// ----------------------------------------------------
export async function getJobs(): Promise<JobOpening[]> {
  try {
    if (db) {
      const q = query(collection(db, 'job_openings'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const firestoreJobs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobOpening));
        // Merge with store to prevent dropping seed entries
        const existingIds = new Set(firestoreJobs.map((j) => j.id));
        const merged = [...firestoreJobs, ...JOBS_STORE.filter((j) => !existingIds.has(j.id))];
        return merged;
      }
    }
  } catch (err) {
    // fallback gracefully to in-memory store
  }
  return [...JOBS_STORE];
}

export async function createJob(job: Omit<JobOpening, 'id' | 'applicants_count' | 'created_at'>): Promise<JobOpening> {
  const newJob: JobOpening = {
    ...job,
    id: `job_${Date.now()}`,
    applicants_count: 0,
    created_at: new Date().toISOString(),
    published_portals: job.published_portals || ['careers_page', 'linkedin', 'indeed'],
  };

  JOBS_STORE.unshift(newJob);

  try {
    if (db) {
      await setDoc(doc(db, 'job_openings', newJob.id), {
        ...newJob,
        created_at: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Firestore job write skipped/cached:', err);
  }

  return newJob;
}

export async function toggleJobPortalPublishing(
  jobId: string,
  portal: 'careers_page' | 'linkedin' | 'indeed' | 'naukri',
  enabled: boolean
): Promise<JobOpening> {
  const job = JOBS_STORE.find((j) => j.id === jobId);
  if (!job) throw new Error('Job not found');

  if (!job.published_portals) job.published_portals = ['careers_page'];

  if (enabled && !job.published_portals.includes(portal)) {
    job.published_portals.push(portal);
  } else if (!enabled && job.published_portals.includes(portal)) {
    job.published_portals = job.published_portals.filter((p) => p !== portal);
  }

  try {
    if (db) {
      await updateDoc(doc(db, 'job_openings', jobId), {
        published_portals: job.published_portals,
      });
    }
  } catch (err) {
    // silent fallback
  }

  return { ...job };
}

// ----------------------------------------------------
// SERVICE METHODS: CANDIDATES
// ----------------------------------------------------
export async function getCandidates(jobId?: string): Promise<Candidate[]> {
  try {
    if (db) {
      const q = jobId
        ? query(collection(db, 'candidates'), where('job_id', '==', jobId), orderBy('applied_at', 'desc'))
        : query(collection(db, 'candidates'), orderBy('applied_at', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const firestoreCandidates = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Candidate));
        const existingIds = new Set(firestoreCandidates.map((c) => c.id));
        const merged = [...firestoreCandidates, ...CANDIDATES_STORE.filter((c) => !existingIds.has(c.id))];
        return jobId ? merged.filter((c) => c.job_id === jobId) : merged;
      }
    }
  } catch (err) {
    // fallback gracefully
  }

  if (jobId) {
    return CANDIDATES_STORE.filter((c) => c.job_id === jobId);
  }
  return [...CANDIDATES_STORE];
}

export async function getCandidateById(candidateId: string): Promise<Candidate | undefined> {
  const cand = CANDIDATES_STORE.find((c) => c.id === candidateId);
  if (cand) return cand;

  try {
    if (db) {
      const snap = await getDoc(doc(db, 'candidates', candidateId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Candidate;
      }
    }
  } catch (err) {
    // fallback
  }
  return undefined;
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

  try {
    if (db) {
      await updateDoc(doc(db, 'candidates', candidateId), {
        stage,
        timeline: candidate.timeline,
      });
    }
  } catch (err) {
    // offline fallback
  }

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

  try {
    if (db) {
      await updateDoc(doc(db, 'candidates', candidateId), {
        evaluation,
        rating: candidate.rating,
        timeline: candidate.timeline,
      });
    }
  } catch (err) {
    // fallback
  }

  return candidate;
}

// ----------------------------------------------------
// PUBLIC CAREER PORTAL APPLICATION INGESTION
// ----------------------------------------------------
export async function submitJobApplication(
  data: Omit<Candidate, 'id' | 'stage' | 'rating' | 'applied_at'>
): Promise<Candidate> {
  const newCandId = `cand_${Date.now()}`;
  
  // Calculate AI match rating based on experience & skill matches
  const job = JOBS_STORE.find((j) => j.id === data.job_id);
  const matchedSkills = (data.skills || []).filter((s) =>
    (job?.skills || []).some((js) => js.toLowerCase().includes(s.toLowerCase()))
  );
  const skillMatchPct = job?.skills?.length
    ? Math.min(100, Math.round((matchedSkills.length / job.skills.length) * 100) + 40)
    : 88;

  const isKnockoutPassed = data.knockout_passed !== false;

  const newCand: Candidate = {
    ...data,
    id: newCandId,
    stage: isKnockoutPassed ? 'applied' : 'rejected',
    rating: isKnockoutPassed ? 4.5 : 2.0,
    applied_at: new Date().toISOString(),
    source: data.source || 'Subedge Career Portal',
    knockout_passed: isKnockoutPassed,
    rejection_reason: !isKnockoutPassed ? 'knockout_failed' : undefined,
    timeline: [
      {
        id: `t_${Date.now()}`,
        type: 'applied',
        title: 'Direct Application Received via Career Portal',
        description: `Applicant submitted profile for ${job?.title || 'Open Requisition'}. Work location: ${data.current_location || 'Not specified'}. Notice period: ${data.notice_period_days ?? 30} days.`,
        actor_name: 'Subedge Career Portal',
        created_at: new Date().toISOString(),
      },
    ],
    ai_match: {
      overall: isKnockoutPassed ? Math.min(96, skillMatchPct + 8) : 45,
      skills: skillMatchPct,
      experience: (data.experience_years || 4) >= 4 ? 92 : 75,
      education: 90,
      location: 100,
      salary: 85,
      strengths: [
        'Direct application via Subedge Career Portal',
        `Experience: ${data.experience_years || 0} years`,
        `Notice Period: ${data.notice_period_days ?? 30} days`,
      ],
      gaps: isKnockoutPassed ? ['To be verified in initial technical screen'] : ['Knockout screening criteria was not fulfilled'],
    },
  };

  CANDIDATES_STORE.unshift(newCand);

  // Increment applicants count on job
  if (job) job.applicants_count += 1;

  // Direct Ingestion to Firestore
  try {
    if (db) {
      await setDoc(doc(db, 'candidates', newCandId), {
        ...newCand,
        created_at: serverTimestamp(),
      });
      if (job) {
        await updateDoc(doc(db, 'job_openings', job.id), {
          applicants_count: job.applicants_count,
        });
      }
    }
  } catch (firestoreErr) {
    console.warn('Firestore candidate direct ingestion warning:', firestoreErr);
  }

  // Automatic Resend Trigger: Dispatch confirmation receipt email
  try {
    await sendApplicationReceivedEmail(
      data.email,
      data.full_name,
      job?.title || 'Applied Position'
    );
  } catch (mailErr) {
    console.warn('Resend application receipt email dispatch warning:', mailErr);
  }

  return newCand;
}

// ----------------------------------------------------
// BULK ACTIONS: ADVANCE, REJECT, NOTIFY
// ----------------------------------------------------
export async function bulkAdvanceCandidates(candidateIds: string[], targetStage: CandidateStage): Promise<void> {
  for (const id of candidateIds) {
    const c = CANDIDATES_STORE.find((cand) => cand.id === id);
    if (c) {
      c.stage = targetStage;
      if (!c.timeline) c.timeline = [];
      c.timeline.unshift({
        id: `t_${Date.now()}`,
        type: 'stage_change',
        title: `Bulk Stage Update: ${targetStage.toUpperCase()}`,
        description: `Moved via Recruiter Bulk Action tool`,
        actor_name: 'Recruiter Admin',
        created_at: new Date().toISOString(),
      });

      try {
        if (db) {
          await updateDoc(doc(db, 'candidates', id), {
            stage: targetStage,
            timeline: c.timeline,
          });
        }
      } catch (e) {
        // offline fallback
      }
    }
  }
}

export async function bulkRejectCandidates(
  candidateIds: string[],
  reasonCode: RejectionReasonCode,
  reasonNotes?: string,
  sendEmail: boolean = true
): Promise<void> {
  for (const id of candidateIds) {
    const c = CANDIDATES_STORE.find((cand) => cand.id === id);
    if (c) {
      c.stage = 'rejected';
      c.rejection_reason = reasonCode;
      c.rejection_notes = reasonNotes;
      if (!c.timeline) c.timeline = [];
      c.timeline.unshift({
        id: `t_${Date.now()}`,
        type: 'rejected',
        title: `Application Closed: ${reasonCode.replace('_', ' ').toUpperCase()}`,
        description: reasonNotes || `Rejected by Recruiter with reason: ${reasonCode}`,
        actor_name: 'Recruiter Admin',
        created_at: new Date().toISOString(),
      });

      try {
        if (db) {
          await updateDoc(doc(db, 'candidates', id), {
            stage: 'rejected',
            rejection_reason: reasonCode,
            rejection_notes: reasonNotes,
            timeline: c.timeline,
          });
        }
      } catch (e) {
        // fallback
      }

      if (sendEmail) {
        try {
          const job = JOBS_STORE.find((j) => j.id === c.job_id);
          await sendRejectionEmail(c.email, c.full_name, job?.title || 'Open Position', reasonNotes);
        } catch (mailErr) {
          console.warn('Rejection email error:', mailErr);
        }
      }
    }
  }
}

export async function bulkSendCandidateNotifications(
  candidateIds: string[],
  subject: string,
  message: string
): Promise<void> {
  for (const id of candidateIds) {
    const c = CANDIDATES_STORE.find((cand) => cand.id === id);
    if (c) {
      try {
        await sendBulkCandidateUpdateEmail(c.email, c.full_name, subject, message);
      } catch (err) {
        console.warn('Bulk notification dispatch error:', err);
      }
    }
  }
}

// ----------------------------------------------------
// TALENT POOL & SILVER-MEDALIST ARCHIVE
// ----------------------------------------------------
export async function archiveToTalentPool(
  candidateId: string,
  tags: string[],
  isSilverMedalist: boolean = false
): Promise<Candidate> {
  const candidate = CANDIDATES_STORE.find((c) => c.id === candidateId);
  if (!candidate) throw new Error('Candidate not found');

  candidate.stage = 'talent_pool';
  candidate.is_silver_medalist = isSilverMedalist;
  candidate.talent_pool_tags = Array.from(new Set([...(candidate.talent_pool_tags || []), ...tags]));

  if (!candidate.timeline) candidate.timeline = [];
  candidate.timeline.unshift({
    id: `t_${Date.now()}`,
    type: 'talent_pool',
    title: isSilverMedalist ? 'Archived to Silver-Medalist Talent Pool' : 'Added to Future Talent Pool',
    description: `Tags: ${candidate.talent_pool_tags.join(', ')}`,
    actor_name: 'Recruiter Admin',
    created_at: new Date().toISOString(),
  });

  try {
    if (db) {
      await updateDoc(doc(db, 'candidates', candidateId), {
        stage: 'talent_pool',
        is_silver_medalist: isSilverMedalist,
        talent_pool_tags: candidate.talent_pool_tags,
        timeline: candidate.timeline,
      });
    }
  } catch (err) {
    // fallback
  }

  return candidate;
}

export async function restoreFromTalentPool(
  candidateId: string,
  targetStage: CandidateStage = 'screening'
): Promise<Candidate> {
  const candidate = CANDIDATES_STORE.find((c) => c.id === candidateId);
  if (!candidate) throw new Error('Candidate not found');

  candidate.stage = targetStage;
  if (!candidate.timeline) candidate.timeline = [];
  candidate.timeline.unshift({
    id: `t_${Date.now()}`,
    type: 'stage_change',
    title: `Restored from Talent Pool to: ${targetStage.toUpperCase()}`,
    description: `Candidate reactivated for active pipeline evaluation.`,
    actor_name: 'Recruiter Admin',
    created_at: new Date().toISOString(),
  });

  try {
    if (db) {
      await updateDoc(doc(db, 'candidates', candidateId), {
        stage: targetStage,
        timeline: candidate.timeline,
      });
    }
  } catch (err) {
    // fallback
  }

  return candidate;
}

export async function getTalentPoolCandidates(): Promise<Candidate[]> {
  return CANDIDATES_STORE.filter((c) => c.stage === 'talent_pool' || c.is_silver_medalist);
}

// ----------------------------------------------------
// CUSTOM PIPELINE BUILDER ENGINE
// ----------------------------------------------------
export async function getCustomPipelines(): Promise<CustomPipeline[]> {
  return [...CUSTOM_PIPELINES_STORE];
}

export async function createCustomPipeline(pipeline: Omit<CustomPipeline, 'id'>): Promise<CustomPipeline> {
  const newPipe: CustomPipeline = {
    ...pipeline,
    id: `pipe_${Date.now()}`,
  };
  CUSTOM_PIPELINES_STORE.push(newPipe);
  return newPipe;
}

export async function updateCustomPipeline(
  pipelineId: string,
  updates: Partial<CustomPipeline>
): Promise<CustomPipeline> {
  const idx = CUSTOM_PIPELINES_STORE.findIndex((p) => p.id === pipelineId);
  if (idx === -1) throw new Error('Pipeline not found');

  CUSTOM_PIPELINES_STORE[idx] = {
    ...CUSTOM_PIPELINES_STORE[idx],
    ...updates,
  };
  return CUSTOM_PIPELINES_STORE[idx];
}

export async function deleteCustomPipeline(pipelineId: string): Promise<void> {
  CUSTOM_PIPELINES_STORE = CUSTOM_PIPELINES_STORE.filter((p) => p.id !== pipelineId);
}

export async function addStageToPipeline(
  pipelineId: string,
  stage: Omit<PipelineStageConfig, 'id'>
): Promise<CustomPipeline> {
  const pipe = CUSTOM_PIPELINES_STORE.find((p) => p.id === pipelineId);
  if (!pipe) throw new Error('Pipeline not found');

  const newStage: PipelineStageConfig = {
    ...stage,
    id: `stg_${Date.now()}`,
  };
  pipe.stages.push(newStage);
  return { ...pipe };
}

export async function removeStageFromPipeline(
  pipelineId: string,
  stageId: string
): Promise<CustomPipeline> {
  const pipe = CUSTOM_PIPELINES_STORE.find((p) => p.id === pipelineId);
  if (!pipe) throw new Error('Pipeline not found');

  pipe.stages = pipe.stages.filter((s) => s.id !== stageId);
  return { ...pipe };
}

export async function reorderPipelineStages(
  pipelineId: string,
  fromIndex: number,
  toIndex: number
): Promise<CustomPipeline> {
  const pipe = CUSTOM_PIPELINES_STORE.find((p) => p.id === pipelineId);
  if (!pipe) throw new Error('Pipeline not found');

  const [movedStage] = pipe.stages.splice(fromIndex, 1);
  pipe.stages.splice(toIndex, 0, movedStage);
  return { ...pipe };
}

// ----------------------------------------------------
// INTERVIEWS, OFFERS & MANPOWER
// ----------------------------------------------------
export async function getInterviews(): Promise<InterviewSchedule[]> {
  return [...INTERVIEWS_STORE];
}

export async function scheduleInterview(data: Omit<InterviewSchedule, 'id'>): Promise<InterviewSchedule> {
  const newInt: InterviewSchedule = {
    ...data,
    id: `int_${Date.now()}`,
  };
  INTERVIEWS_STORE.unshift(newInt);

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
