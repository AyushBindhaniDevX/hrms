/**
 * Learning & Development (L&D) Service (Supabase)
 * Oasis HRMS Multi-Tenant Platform
 */

import { supabase } from '@/lib/supabase';
import {
  TrainingCourse,
  CourseEnrollment,
  CourseModule,
  CourseLesson,
} from '@/types/database';

const DEFAULT_COURSES: TrainingCourse[] = [
  {
    id: 'course_sec',
    organization_id: '00000000-0000-0000-0000-000000000001',
    title: 'Enterprise SOC 2, HIPAA & ISO 27001 Security Training',
    category: 'Security & Governance',
    description: 'Mandatory annual compliance training covering access controls, cryptographic standards, clean desk policies, and incident reporting.',
    duration_minutes: 120,
    modules_count: 3,
    is_mandatory: true,
    instructor: 'Ayush Bindhani (CISO & Principal Architect)',
    rating: 4.9,
    enrolled_count: 142,
    certificate_title: 'Certified Information Security Specialist',
    pass_percentage: 80,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    curriculum: [
      {
        id: 'mod_1',
        title: 'Module 1: Principles of Zero Trust & Access Control',
        description: 'Understand least-privilege architecture, multi-factor authentication, and privileged access management.',
        lessons: [
          {
            id: 'les_1_1',
            title: '🎥 Video Lecture: Zero-Trust Security Architecture',
            type: 'video',
            duration_minutes: 18,
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            content_markdown: '### Core Architecture Principles:\n1. **Verify explicitly:** Always authenticate and authorize based on all available data points.\n2. **Use least privilege access:** Limit user access with Just-In-Time and Just-Enough-Access (JIT/JEA).\n3. **Assume breach:** Minimize blast radius and segment access.',
            order: 1,
          },
          {
            id: 'les_1_2',
            title: '📄 Handbook: Clean Desk & Cryptographic Token Protocols',
            type: 'article',
            duration_minutes: 12,
            content_markdown: '# Information Security Protocol\n\nAll workstations must utilize hardware-backed security keys. Screen lock timers must never exceed 180 seconds.\n\n### Key Takeaways:\n- Never store plaintext credentials or API secrets in source repositories.\n- Always encrypt local SSDs using BitLocker or FileVault.',
            order: 2,
          },
        ],
      },
    ],
  },
];

export async function getCourses(): Promise<TrainingCourse[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (!error && data && data.length > 0) {
    return data as TrainingCourse[];
  }

  return DEFAULT_COURSES;
}

export async function getCourseById(courseId: string): Promise<TrainingCourse | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle();

  if (error || !data) {
    const fallback = DEFAULT_COURSES.find((c) => c.id === courseId);
    return fallback || null;
  }

  return data as TrainingCourse;
}

export async function getEnrollments(employeeId?: string): Promise<CourseEnrollment[]> {
  let query = supabase.from('course_enrollments').select('*');
  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query;
  if (!error && data && data.length > 0) {
    return data as CourseEnrollment[];
  }

  return [
    {
      id: 'enr_demo_1',
      course_id: 'course_sec',
      employee_id: employeeId || 'emp_demo',
      progress_percent: 65,
      is_completed: false,
      completed_lesson_ids: ['les_1_1'],
    },
  ];
}

export async function createCourse(course: Omit<TrainingCourse, 'id' | 'created_at'>): Promise<TrainingCourse> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('courses')
    .insert({
      ...course,
      created_at: now,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating course in Supabase:', error);
    throw error;
  }

  return data as TrainingCourse;
}

export async function completeLesson(
  enrollmentId: string,
  lessonId: string,
  totalLessonsInCourse: number
): Promise<{ newProgress: number; isCompleted: boolean }> {
  const { data: enrData } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .maybeSingle();

  let completedIds: string[] = enrData?.completed_lesson_ids || [];
  if (!completedIds.includes(lessonId)) {
    completedIds.push(lessonId);
  }

  const calculatedProgress = Math.min(100, Math.round((completedIds.length / (totalLessonsInCourse || 1)) * 100));
  const isCompleted = calculatedProgress >= 100;
  const certId = isCompleted ? `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : null;

  await supabase
    .from('course_enrollments')
    .update({
      completed_lesson_ids: completedIds,
      progress_percent: calculatedProgress,
      is_completed: isCompleted,
      ...(isCompleted ? { completed_at: new Date().toISOString(), certificate_url: certId } : {}),
    })
    .eq('id', enrollmentId);

  return { newProgress: calculatedProgress, isCompleted };
}

export async function updateProgress(enrollmentId: string, progress: number): Promise<void> {
  const isCompleted = progress >= 100;
  const certId = isCompleted ? `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : null;

  await supabase
    .from('course_enrollments')
    .update({
      progress_percent: progress,
      is_completed: isCompleted,
      ...(isCompleted ? { completed_at: new Date().toISOString(), certificate_url: certId } : {}),
    })
    .eq('id', enrollmentId);
}
