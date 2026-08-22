/**
 * Learning & Development (L&D) Service (Moodle / WordPress-style LMS)
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import {
  TrainingCourse,
  CourseEnrollment,
  CourseModule,
  CourseLesson,
} from '@/types/database';
import { seedDatabaseIfEmpty } from './seed';

// ----------------------------------------------------
// DEFAULT ENTERPRISE CURRICULUM WITH VIDEOS, ARTICLES & QUIZZES
// ----------------------------------------------------
const DEFAULT_COURSES: TrainingCourse[] = [
  {
    id: 'course_sec',
    organization_id: 'subedge_org',
    title: 'Enterprise SOC 2, HIPAA & ISO 27001 Security Training',
    category: 'Security & Governance',
    description: 'Mandatory annual compliance training covering access controls, cryptographic standards, clean desk policies, and incident reporting.',
    duration_minutes: 120,
    modules_count: 3,
    is_mandatory: true,
    instructor: 'Ayush Bindhani (CISO & Principal Architect)',
    rating: 4.9,
    enrolled_count: 142,
    certificate_title: 'Certified Subedge Information Security Specialist',
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
            content_markdown: '# Subedge Information Security Protocol\n\nAll workstations must utilize hardware-backed FIPS 140-2 Level 3 security keys (YubiKey 5 Series). Screen lock timers must never exceed 180 seconds.\n\n### Key Takeaways:\n- Never store plaintext credentials or API secrets in source repositories.\n- Always encrypt local SSDs using BitLocker or FileVault.',
            attachment_name: 'Subedge_Security_Checklist_v4.pdf',
            attachment_url: 'https://subedge.vercel.app/docs/security_checklist.pdf',
            order: 2,
          },
          {
            id: 'les_1_3',
            title: '❓ Knowledge Check: Zero-Trust Assessment Quiz',
            type: 'quiz',
            duration_minutes: 10,
            order: 3,
            quiz_questions: [
              {
                id: 'q1',
                question: 'What is the mandatory auto-lock timer for developer workstations at Subedge?',
                options: ['30 seconds', '180 seconds (3 minutes)', '15 minutes', 'Never lock'],
                correct_index: 1,
                explanation: 'Subedge Security baseline mandates a maximum 180-second screen lock timeout.',
              },
              {
                id: 'q2',
                question: 'Where should production API secrets and signing keys be stored?',
                options: ['In Git repository commits', 'In Slack messages', 'In Vault / Cloud Secret Manager', 'In desktop sticky notes'],
                correct_index: 2,
                explanation: 'Production secrets must always be kept in audited Cloud Key/Secret Managers.',
              },
            ],
          },
        ],
      },
      {
        id: 'mod_2',
        title: 'Module 2: Incident Response & Phishing Simulation',
        description: 'How to identify spear-phishing attacks, report vulnerabilities, and trigger the SOC escalation matrix.',
        lessons: [
          {
            id: 'les_2_1',
            title: '🎥 Video: Identifying Social Engineering & Deepfakes',
            type: 'video',
            duration_minutes: 15,
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            content_markdown: '### Defense Against Social Engineering:\nBe vigilant against urgent financial requests, spoofed vendor invoices, and AI voice cloning.',
            order: 1,
          },
          {
            id: 'les_2_2',
            title: '📄 Handbook: SOC Escalation Matrix & SLA Timelines',
            type: 'article',
            duration_minutes: 10,
            content_markdown: '### Severity 1 Incidents:\nReport directly to `security@subedge.com` and trigger emergency PagerDuty notification within 15 minutes.',
            order: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'course_cloud',
    organization_id: 'subedge_org',
    title: 'High-Concurrency Cloud Architecture & Microservices',
    category: 'Engineering & Cloud',
    description: 'Master event-driven microservices, distributed transaction rollback, caching strategies with Redis, and Kubernetes autoscaling.',
    duration_minutes: 180,
    modules_count: 2,
    is_mandatory: false,
    instructor: 'Subedge Engineering Guild',
    rating: 4.95,
    enrolled_count: 88,
    certificate_title: 'Subedge Certified Cloud Architect',
    pass_percentage: 85,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    curriculum: [
      {
        id: 'cmod_1',
        title: 'Module 1: Event-Driven Systems & Kafka Streaming',
        description: 'Publish-subscribe messaging patterns, schema registries, and partition balancing.',
        lessons: [
          {
            id: 'cles_1_1',
            title: '🎥 Video: Distributed Event Choreography',
            type: 'video',
            duration_minutes: 24,
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            content_markdown: '### Choreography vs Orchestration:\nLearn when to decouple services using asynchronous Kafka message buses versus synchronous Saga coordinators.',
            order: 1,
          },
          {
            id: 'cles_1_2',
            title: '📑 Architecture Blueprint Slides (PDF)',
            type: 'document',
            duration_minutes: 15,
            attachment_name: 'Subedge_Cloud_Reference_Architecture_2026.pdf',
            attachment_url: 'https://subedge.vercel.app/docs/cloud_architecture.pdf',
            content_markdown: 'Download the comprehensive Subedge Cloud Architecture slides and topology diagrams.',
            order: 2,
          },
        ],
      },
    ],
  },
];

export async function getCourses(): Promise<TrainingCourse[]> {
  await seedDatabaseIfEmpty();

  try {
    const coursesRef = collection(db, 'courses');
    const snapshot = await getDocs(coursesRef);
    const results: TrainingCourse[] = [];
    snapshot.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as TrainingCourse);
    });

    if (results.length === 0) {
      return DEFAULT_COURSES;
    }

    // Merge default rich curriculum if courses were seeded with basic schema
    return results.map((r) => {
      if (!r.curriculum || r.curriculum.length === 0) {
        const defMatch = DEFAULT_COURSES.find((dc) => dc.id === r.id || dc.category === r.category);
        if (defMatch && defMatch.curriculum) {
          return { ...r, curriculum: defMatch.curriculum };
        }
      }
      return r;
    });
  } catch (error) {
    console.error('Error fetching courses from Firestore:', error);
    return DEFAULT_COURSES;
  }
}

export async function getEnrollments(employeeId?: string): Promise<CourseEnrollment[]> {
  await seedDatabaseIfEmpty();

  try {
    const enrRef = collection(db, 'course_enrollments');
    let q = query(enrRef);
    if (employeeId) {
      q = query(enrRef, where('employee_id', '==', employeeId));
    }
    const snapshot = await getDocs(q);
    const results: CourseEnrollment[] = [];
    snapshot.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as CourseEnrollment);
    });

    if (results.length === 0) {
      return [
        {
          id: 'enr_demo_1',
          course_id: 'course_sec',
          employee_id: employeeId || 'emp_demo',
          progress_percent: 65,
          is_completed: false,
          completed_lesson_ids: ['les_1_1', 'les_1_2'],
        },
      ];
    }

    return results;
  } catch (error) {
    console.error('Error fetching course enrollments from Firestore:', error);
    return [];
  }
}

export async function createCourse(course: Omit<TrainingCourse, 'id' | 'created_at'>): Promise<TrainingCourse> {
  const newId = `course_${Date.now()}`;
  const newCourse: TrainingCourse = {
    ...course,
    id: newId,
    created_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'courses', newId), newCourse);
  } catch (error) {
    console.error('Error creating course in Firestore:', error);
  }

  return newCourse;
}

export async function addLessonToCourse(
  courseId: string,
  moduleId: string,
  lesson: Omit<CourseLesson, 'id'>
): Promise<void> {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return;

    const courseData = courseSnap.data() as TrainingCourse;
    const curriculum = courseData.curriculum || [];
    const targetMod = curriculum.find((m) => m.id === moduleId);

    const newLesson: CourseLesson = {
      ...lesson,
      id: `les_${Date.now()}`,
    };

    if (targetMod) {
      targetMod.lessons.push(newLesson);
    } else {
      curriculum.push({
        id: moduleId,
        title: 'New Section',
        lessons: [newLesson],
      });
    }

    await updateDoc(courseRef, { curriculum });
  } catch (error) {
    console.error('Error adding lesson to course:', error);
  }
}

export async function completeLesson(
  enrollmentId: string,
  lessonId: string,
  totalLessonsInCourse: number
): Promise<{ newProgress: number; isCompleted: boolean }> {
  try {
    const enrRef = doc(db, 'course_enrollments', enrollmentId);
    const enrSnap = await getDoc(enrRef);

    let completedIds: string[] = [];
    if (enrSnap.exists()) {
      completedIds = enrSnap.data().completed_lesson_ids || [];
    }

    if (!completedIds.includes(lessonId)) {
      completedIds.push(lessonId);
    }

    const calculatedProgress = Math.min(100, Math.round((completedIds.length / (totalLessonsInCourse || 1)) * 100));
    const isCompleted = calculatedProgress >= 100;
    const certId = isCompleted ? `SUB-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : null;

    await updateDoc(enrRef, {
      completed_lesson_ids: completedIds,
      progress_percent: calculatedProgress,
      is_completed: isCompleted,
      ...(isCompleted ? { completed_at: new Date().toISOString(), certificate_url: certId } : {}),
    });

    return { newProgress: calculatedProgress, isCompleted };
  } catch (error) {
    console.error('Error completing lesson:', error);
    return { newProgress: 100, isCompleted: true };
  }
}

export async function updateProgress(enrollmentId: string, progress: number): Promise<void> {
  try {
    const enrRef = doc(db, 'course_enrollments', enrollmentId);
    const isCompleted = progress >= 100;
    const certId = isCompleted ? `SUB-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : null;

    await updateDoc(enrRef, {
      progress_percent: progress,
      is_completed: isCompleted,
      ...(isCompleted ? { completed_at: new Date().toISOString(), certificate_url: certId } : {}),
    });
  } catch (error) {
    console.error('Error updating course progress in Firestore:', error);
  }
}
