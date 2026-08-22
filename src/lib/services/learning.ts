/**
 * Learning & Development (L&D) Service
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { TrainingCourse, CourseEnrollment } from '@/types/database';

let COURSES_STORE: TrainingCourse[] = [
  {
    id: 'course_1',
    organization_id: 'subedge_org',
    title: 'SOC 2 & HIPAA Security Compliance Essentials (2026)',
    category: 'Security & Governance',
    description: 'Mandatory annual training on data handling, PHI protection, clean desk policy, and phishing prevention.',
    duration_minutes: 45,
    modules_count: 5,
    is_mandatory: true,
    instructor: 'Subedge InfoSec Team',
    rating: 4.9,
    enrolled_count: 58,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'course_2',
    organization_id: 'subedge_org',
    title: 'Architecting Scalable Microservices with Go & GraphQL',
    category: 'Engineering',
    description: 'Deep dive into event-driven design, high-concurrency patterns, and gRPC communication.',
    duration_minutes: 180,
    modules_count: 12,
    is_mandatory: false,
    instructor: 'Ayush B. (Principal Architect)',
    rating: 5.0,
    enrolled_count: 34,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'course_3',
    organization_id: 'subedge_org',
    title: 'Modern People Leadership & OKR Goal Setting',
    category: 'Leadership & Management',
    description: 'Strategies for effective 1-on-1s, giving constructive feedback, and aligning squad OKRs with business milestones.',
    duration_minutes: 90,
    modules_count: 6,
    is_mandatory: false,
    instructor: 'HR People Strategy Group',
    rating: 4.8,
    enrolled_count: 22,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

let ENROLLMENTS_STORE: CourseEnrollment[] = [
  {
    id: 'enr_1',
    course_id: 'course_1',
    employee_id: 'emp_demo',
    progress_percent: 100,
    is_completed: true,
    completed_at: '2026-02-15',
    score: 96,
    certificate_id: 'SUB-CERT-SOC2-2026',
  },
  {
    id: 'enr_2',
    course_id: 'course_2',
    employee_id: 'emp_demo',
    progress_percent: 65,
    is_completed: false,
  },
];

export async function getCourses(): Promise<TrainingCourse[]> {
  return [...COURSES_STORE];
}

export async function getEnrollments(employeeId?: string): Promise<CourseEnrollment[]> {
  if (employeeId) {
    return ENROLLMENTS_STORE.filter((e) => e.employee_id === employeeId);
  }
  return [...ENROLLMENTS_STORE];
}

export async function enrollInCourse(courseId: string, employeeId: string): Promise<CourseEnrollment> {
  const existing = ENROLLMENTS_STORE.find((e) => e.course_id === courseId && e.employee_id === employeeId);
  if (existing) return existing;

  const newEnrollment: CourseEnrollment = {
    id: `enr_${Date.now()}`,
    course_id: courseId,
    employee_id: employeeId,
    progress_percent: 0,
    is_completed: false,
  };
  ENROLLMENTS_STORE.push(newEnrollment);
  return newEnrollment;
}

export async function updateProgress(enrollmentId: string, progress: number): Promise<CourseEnrollment> {
  const enrollment = ENROLLMENTS_STORE.find((e) => e.id === enrollmentId);
  if (!enrollment) throw new Error('Enrollment not found');
  enrollment.progress_percent = progress;
  if (progress >= 100) {
    enrollment.is_completed = true;
    enrollment.completed_at = new Date().toISOString();
    enrollment.certificate_id = `SUB-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  return enrollment;
}
