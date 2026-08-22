/**
 * Recruitment & ATS Service
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { JobOpening, Candidate, CandidateStage } from '@/types/database';

let JOBS_STORE: JobOpening[] = [
  {
    id: 'job_1',
    organization_id: 'subedge_org',
    title: 'Senior Full Stack Engineer (React Native & Node)',
    department: 'Engineering',
    location: 'Bengaluru / Hybrid',
    type: 'full-time',
    experience_level: '4 - 7 Years',
    salary_range: '₹18,00,000 - ₹26,00,000',
    positions_count: 3,
    description: 'Lead mobile and cloud microservices architecture for Oasis Enterprise HRMS and client digital suites.',
    requirements: ['React Native / Expo', 'TypeScript', 'Node.js / Go', 'PostgreSQL / Firestore'],
    status: 'published',
    applicants_count: 24,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'job_2',
    organization_id: 'subedge_org',
    title: 'Cybersecurity & Governance Specialist',
    department: 'Security & Compliance',
    location: 'Bhubaneswar / Remote',
    type: 'full-time',
    experience_level: '3 - 6 Years',
    salary_range: '₹14,00,000 - ₹20,00,000',
    positions_count: 2,
    description: 'Ensure SOC 2, HIPAA, and ISO 27001 readiness across client infrastructures.',
    requirements: ['SOC 2 Type II Auditing', 'SIEM & Threat Monitoring', 'Penetration Testing', 'Cloud IAM'],
    status: 'published',
    applicants_count: 18,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'job_3',
    organization_id: 'subedge_org',
    title: 'Product Designer (UI/UX)',
    department: 'Product & Design',
    location: 'Bengaluru',
    type: 'full-time',
    experience_level: '2 - 5 Years',
    salary_range: '₹12,00,000 - ₹18,00,000',
    positions_count: 1,
    description: 'Design world-class web and mobile interfaces with rich micro-interactions and sleek dark/light design systems.',
    requirements: ['Figma Master', 'Design Systems', 'Prototyping', 'User Research'],
    status: 'published',
    applicants_count: 31,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

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
    experience_years: 5.5,
    current_company: 'Infosys Tech Labs',
    expected_salary: '₹22 LPA',
    scorecard_notes: 'Exceptional TypeScript knowledge and system architecture skills. Completed live coding round with 100% score.',
    applied_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'cand_2',
    job_id: 'job_1',
    organization_id: 'subedge_org',
    full_name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+91 98451 23456',
    stage: 'screening',
    rating: 4,
    experience_years: 4,
    current_company: 'Wipro Digital',
    expected_salary: '₹19 LPA',
    scorecard_notes: 'Strong React Native background. Passed automated screening test.',
    applied_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'cand_3',
    job_id: 'job_2',
    organization_id: 'subedge_org',
    full_name: 'Ananya Verma',
    email: 'ananya.v@example.com',
    phone: '+91 97123 45678',
    stage: 'offer',
    rating: 5,
    experience_years: 6,
    current_company: 'Paladion Networks',
    expected_salary: '₹20 LPA',
    scorecard_notes: 'Offer letter released for Senior SOC 2 Lead.',
    applied_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'cand_4',
    job_id: 'job_3',
    organization_id: 'subedge_org',
    full_name: 'David Wilson',
    email: 'david.wilson@example.com',
    phone: '+91 99887 76655',
    stage: 'applied',
    rating: 4,
    experience_years: 3.5,
    current_company: 'Freelance Lead Designer',
    expected_salary: '₹16 LPA',
    applied_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

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

export async function updateCandidateStage(candidateId: string, stage: CandidateStage): Promise<Candidate> {
  const candidate = CANDIDATES_STORE.find((c) => c.id === candidateId);
  if (!candidate) throw new Error('Candidate not found');
  candidate.stage = stage;
  return candidate;
}
