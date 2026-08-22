/**
 * Learning & Development (L&D) Service (Dynamic Firestore)
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { TrainingCourse, CourseEnrollment } from '@/types/database';
import { seedDatabaseIfEmpty } from './seed';

export async function getCourses(): Promise<TrainingCourse[]> {
  await seedDatabaseIfEmpty();

  try {
    const coursesRef = collection(db, 'courses');
    const snapshot = await getDocs(coursesRef);
    const results: TrainingCourse[] = [];
    snapshot.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as TrainingCourse);
    });
    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('Error fetching courses from Firestore:', error);
    return [];
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
    return results;
  } catch (error) {
    console.error('Error fetching course enrollments from Firestore:', error);
    return [];
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
      ...(isCompleted ? { completed_at: new Date().toISOString(), certificate_id: certId } : {}),
    });
  } catch (error) {
    console.error('Error updating course progress in Firestore:', error);
  }
}
