/**
 * Learning & Development (L&D) Service (Cloud Firestore)
 * Oasis HRMS Multi-Tenant Platform
 */

import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
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
            title: 'Video Lecture: Zero-Trust Security Architecture',
            type: 'video',
            duration_minutes: 18,
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            content_markdown: '### Core Architecture Principles:\n1. **Verify explicitly:** Always authenticate and authorize based on all available data points.\n2. **Use least privilege access:** Limit user access with Just-In-Time and Just-Enough-Access (JIT/JEA).\n3. **Assume breach:** Minimize blast radius and segment access.',
            order: 1,
          },
          {
            id: 'les_1_2',
            title: 'Handbook: Clean Desk & Cryptographic Token Protocols',
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

export async function getCourses(organizationId?: string): Promise<TrainingCourse[]> {
  try {
    const snap = await getDocs(collection(db, 'courses'));
    const courses: TrainingCourse[] = [];
    snap.forEach((d) => {
      const c = { id: d.id, ...d.data() } as TrainingCourse;
      if (!organizationId || !c.organization_id || c.organization_id === organizationId) {
        courses.push(c);
      }
    });

    if (courses.length > 0) {
      return courses;
    }
  } catch (err) {
    console.warn('Error fetching courses from Firestore:', err);
  }

  return DEFAULT_COURSES;
}

export async function getCourseById(courseId: string): Promise<TrainingCourse | null> {
  try {
    const snap = await getDoc(doc(db, 'courses', courseId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as TrainingCourse;
    }
  } catch {}

  const fallback = DEFAULT_COURSES.find((c) => c.id === courseId);
  return fallback || null;
}

export async function getEnrollments(employeeId?: string): Promise<CourseEnrollment[]> {
  try {
    const snap = await getDocs(collection(db, 'course_enrollments'));
    const enrollments: CourseEnrollment[] = [];
    snap.forEach((d) => {
      const e = { id: d.id, ...d.data() } as CourseEnrollment;
      if (!employeeId || e.employee_id === employeeId) {
        enrollments.push(e);
      }
    });

    if (enrollments.length > 0) {
      return enrollments;
    }
  } catch (err) {
    console.warn('Error fetching enrollments from Firestore:', err);
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
  const courseId = `course_${Date.now()}`;
  const now = new Date().toISOString();
  const newCourse: TrainingCourse = {
    ...course,
    id: courseId,
    created_at: now,
  };

  await setDoc(doc(db, 'courses', courseId), newCourse);
  return newCourse;
}

export async function addLessonToCourse(
  courseId: string,
  moduleId: string,
  lesson: Omit<CourseLesson, 'id'>
): Promise<void> {
  const course = await getCourseById(courseId);
  if (!course) return;

  const newLesson: CourseLesson = {
    ...lesson,
    id: `les_${Date.now()}`,
  };

  let curriculum = [...(course.curriculum || [])];
  let modIndex = curriculum.findIndex((m) => m.id === moduleId);

  if (modIndex >= 0) {
    curriculum[modIndex] = {
      ...curriculum[modIndex],
      lessons: [...(curriculum[modIndex].lessons || []), newLesson],
    };
  } else {
    curriculum.push({
      id: moduleId,
      title: 'Module 1: General Curriculum',
      description: 'Course lessons and learning materials',
      lessons: [newLesson],
    });
  }

  await updateDoc(doc(db, 'courses', courseId), {
    curriculum,
    modules_count: curriculum.length,
    updated_at: new Date().toISOString(),
  });
}

export async function completeLesson(
  enrollmentId: string,
  lessonId: string,
  totalLessonsInCourse: number
): Promise<{ newProgress: number; isCompleted: boolean }> {
  const enrSnap = await getDoc(doc(db, 'course_enrollments', enrollmentId));
  const enrData = enrSnap.exists() ? (enrSnap.data() as CourseEnrollment) : null;

  let completedIds: string[] = enrData?.completed_lesson_ids || [];
  if (!completedIds.includes(lessonId)) {
    completedIds.push(lessonId);
  }

  const calculatedProgress = Math.min(100, Math.round((completedIds.length / (totalLessonsInCourse || 1)) * 100));
  const isCompleted = calculatedProgress >= 100;
  const certId = isCompleted ? `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : null;

  await setDoc(
    doc(db, 'course_enrollments', enrollmentId),
    {
      completed_lesson_ids: completedIds,
      progress_percent: calculatedProgress,
      is_completed: isCompleted,
      ...(isCompleted ? { completed_at: new Date().toISOString(), certificate_url: certId } : {}),
    },
    { merge: true }
  );

  return { newProgress: calculatedProgress, isCompleted };
}

export async function updateProgress(enrollmentId: string, progress: number): Promise<void> {
  const isCompleted = progress >= 100;
  const certId = isCompleted ? `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : null;

  await updateDoc(doc(db, 'course_enrollments', enrollmentId), {
    progress_percent: progress,
    is_completed: isCompleted,
    ...(isCompleted ? { completed_at: new Date().toISOString(), certificate_url: certId } : {}),
  });
}
