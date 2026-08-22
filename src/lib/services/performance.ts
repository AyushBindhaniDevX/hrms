import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import type {
  Goal,
  KeyResult,
  AppraisalReview,
  PerformanceRatingBreakdown,
  Kudos,
  KudosBadge,
  AppraisalRecommendation,
  Employee,
  Profile,
  Department,
} from '@/types';
import { createAuditLog } from './audit';
import { createNotification } from './notifications';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

const SEED_GOALS: Partial<Goal>[] = [
  {
    title: 'Achieve 99.95% Core Platform SLA & Zero Critical Outages',
    description: 'Optimize high-traffic backend services, migrate microservices to multi-region clustering, and implement active monitoring.',
    category: 'company',
    priority: 'high',
    status: 'on_track',
    progress: 85,
    start_date: '2026-01-01',
    target_date: '2026-12-31',
    key_results: [
      { id: 'kr-1', title: 'Reduce p99 API latency to under 120ms', target_value: 120, current_value: 110, unit: 'ms', completed: true },
      { id: 'kr-2', title: 'Achieve 99.95% uptime across Q1-Q4', target_value: 99.95, current_value: 99.98, unit: '%', completed: true },
      { id: 'kr-3', title: 'Automated failover recovery within 30s', target_value: 30, current_value: 45, unit: 's', completed: false },
    ],
  },
  {
    title: 'Deliver HRMS 2.0 Enterprise Automation Suite',
    description: 'Launch end-to-end performance appraisals, real-time geofencing, multi-tier payroll, and Oasis AI Copilot.',
    category: 'department',
    priority: 'high',
    status: 'completed',
    progress: 100,
    start_date: '2026-01-15',
    target_date: '2026-06-30',
    key_results: [
      { id: 'kr-4', title: 'Deploy AI Assistant with natural language queries', target_value: 1, current_value: 1, unit: 'module', completed: true },
      { id: 'kr-5', title: 'Role-based consistency & dynamic sidebar', target_value: 100, current_value: 100, unit: '%', completed: true },
      { id: 'kr-6', title: 'Performance OKRs and 360 Appraisals module', target_value: 100, current_value: 100, unit: '%', completed: true },
    ],
  },
  {
    title: 'Accelerate Technical Onboarding & Developer Experience',
    description: 'Reduce new engineer ramp-up time from 3 weeks to 5 business days with interactive sandbox environments.',
    category: 'department',
    priority: 'medium',
    status: 'in_progress',
    progress: 60,
    start_date: '2026-02-01',
    target_date: '2026-08-31',
    key_results: [
      { id: 'kr-7', title: 'Standardize Docker devcontainers for all services', target_value: 10, current_value: 7, unit: 'repos', completed: false },
      { id: 'kr-8', title: 'Create automated sample dataset generator', target_value: 1, current_value: 1, unit: 'tool', completed: true },
    ],
  },
  {
    title: 'Elevate Team eNPS (Employee Net Promoter Score) to 85+',
    description: 'Foster transparent continuous feedback, quarterly recognition bonuses, and clear career growth ladders.',
    category: 'company',
    priority: 'high',
    status: 'on_track',
    progress: 75,
    start_date: '2026-01-01',
    target_date: '2026-12-31',
    key_results: [
      { id: 'kr-9', title: 'Conduct bi-weekly 1-on-1 performance check-ins', target_value: 95, current_value: 90, unit: '%', completed: false },
      { id: 'kr-10', title: 'Distribute monthly peer recognition kudos', target_value: 50, current_value: 42, unit: 'kudos', completed: false },
    ],
  },
];

const SEED_APPRAISALS: Partial<AppraisalReview>[] = [
  {
    cycle_name: 'Q1 2026 Performance Appraisal',
    period: 'Q1 2026',
    status: 'manager_review',
    self_rating: 4.5,
    self_comments: 'Successfully delivered the core attendance & location geofencing infrastructure ahead of schedule with 99.8% verification accuracy.',
    self_submitted_at: '2026-03-28T10:00:00Z',
    ratings_breakdown: {
      technical_skills: 5,
      productivity: 4,
      communication: 4,
      leadership: 4,
      teamwork: 5,
    },
  },
  {
    cycle_name: 'Annual Performance Review 2025',
    period: 'Annual 2025',
    status: 'completed',
    self_rating: 4.0,
    self_comments: 'Led team migration to modern React Native architecture and mentored 3 junior software engineers.',
    self_submitted_at: '2025-12-15T09:30:00Z',
    manager_rating: 4.8,
    manager_comments: 'Exceptional contributor with stellar technical ownership and cross-functional leadership. Strongly recommended for promotion.',
    manager_submitted_at: '2025-12-20T14:15:00Z',
    overall_score: 94,
    recommendation: 'promotion',
    ratings_breakdown: {
      technical_skills: 5,
      productivity: 5,
      communication: 4,
      leadership: 5,
      teamwork: 5,
    },
  },
];

const SEED_KUDOS: Partial<Kudos>[] = [
  {
    badge: 'innovator',
    message: 'Awesome work architecting the new offline-first caching and real-time syncing system! Really leveled up our app speed.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    badge: 'rockstar',
    message: 'Huge shoutout for resolving the production database migration smoothly without any user downtime during launch!',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    badge: 'team_player',
    message: 'Thanks for jumping in to help debug the payroll allowances calculation edge case before payroll closure!',
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

// Helper to hydrate joined models
async function hydrateGoal(goalData: any): Promise<Goal> {
  const goal: Goal = { ...goalData };
  if (goal.employee_id) {
    try {
      const empDoc = await getDoc(doc(db, 'employees', goal.employee_id));
      if (empDoc.exists()) {
        const empData = { id: empDoc.id, ...empDoc.data() } as Employee;
        if (empData.profile_id) {
          const profDoc = await getDoc(doc(db, 'profiles', empData.profile_id));
          if (profDoc.exists()) empData.profile = { id: profDoc.id, ...profDoc.data() } as Profile;
        }
        goal.employee = empData;
      }
    } catch (e) {
      console.error('Failed to hydrate employee for goal:', e);
    }
  }
  if (goal.department_id) {
    try {
      const deptDoc = await getDoc(doc(db, 'departments', goal.department_id));
      if (deptDoc.exists()) {
        goal.department = { id: deptDoc.id, ...deptDoc.data() } as Department;
      }
    } catch (e) {
      console.error('Failed to hydrate dept for goal:', e);
    }
  }
  return goal;
}

// ----------------------------------------------------
// GOALS & OKRs API
// ----------------------------------------------------
export async function getGoals(options?: {
  employeeId?: string;
  departmentId?: string;
  category?: string;
  status?: string;
}): Promise<Goal[]> {
  try {
    const goalsRef = collection(db, 'goals');
    let q = query(goalsRef, orderBy('created_at', 'desc'));

    if (options?.employeeId) {
      q = query(goalsRef, where('employee_id', '==', options.employeeId), orderBy('created_at', 'desc'));
    }

    const snap = await getDocs(q);

    if (snap.empty && !options?.employeeId) {
      // Auto-seed initial goals
      const seeded: Goal[] = [];
      for (const item of SEED_GOALS) {
        const newRef = doc(collection(db, 'goals'));
        const now = new Date().toISOString();
        const goalDoc: Goal = {
          id: newRef.id,
          organization_id: DEFAULT_ORG_ID,
          employee_id: null,
          department_id: null,
          title: item.title || '',
          description: item.description || null,
          category: item.category || 'company',
          priority: item.priority || 'medium',
          status: item.status || 'in_progress',
          progress: item.progress || 0,
          start_date: item.start_date || now.split('T')[0],
          target_date: item.target_date || now.split('T')[0],
          key_results: item.key_results || [],
          created_at: now,
          updated_at: now,
        };
        await setDoc(newRef, goalDoc);
        seeded.push(goalDoc);
      }
      return seeded;
    }

    const goals: Goal[] = [];
    for (const d of snap.docs) {
      const g = await hydrateGoal({ id: d.id, ...d.data() });
      if (options?.status && g.status !== options.status) continue;
      if (options?.category && g.category !== options.category) continue;
      if (options?.departmentId && g.department_id !== options.departmentId) continue;
      goals.push(g);
    }
    return goals;
  } catch (error) {
    console.error('getGoals error:', error);
    return [];
  }
}

export async function createGoal(
  data: Omit<Goal, 'id' | 'created_at' | 'updated_at'>,
  userId?: string
): Promise<Goal> {
  const newRef = doc(collection(db, 'goals'));
  const now = new Date().toISOString();
  const goal: Goal = {
    ...data,
    id: newRef.id,
    created_at: now,
    updated_at: now,
  };
  await setDoc(newRef, goal);

  await createAuditLog('CREATE_GOAL', 'goal', newRef.id, {
    title: goal.title,
    category: goal.category,
    priority: goal.priority,
  });

  return goal;
}

export async function updateGoal(
  id: string,
  updates: Partial<Goal>,
  userId?: string
): Promise<void> {
  const goalRef = doc(db, 'goals', id);
  const now = new Date().toISOString();
  await updateDoc(goalRef, {
    ...updates,
    updated_at: now,
  });

  await createAuditLog('UPDATE_GOAL', 'goal', id, updates);
}

export async function deleteGoal(id: string, userId?: string): Promise<void> {
  await deleteDoc(doc(db, 'goals', id));
  await createAuditLog('DELETE_GOAL', 'goal', id, {});
}

// ----------------------------------------------------
// APPRAISAL REVIEWS API
// ----------------------------------------------------
export async function getAppraisals(options?: {
  employeeId?: string;
  status?: string;
  period?: string;
}): Promise<AppraisalReview[]> {
  try {
    const appraisalsRef = collection(db, 'appraisal_reviews');
    let q = query(appraisalsRef, orderBy('created_at', 'desc'));

    if (options?.employeeId) {
      q = query(appraisalsRef, where('employee_id', '==', options.employeeId), orderBy('created_at', 'desc'));
    }

    const snap = await getDocs(q);

    if (snap.empty && !options?.employeeId) {
      // Auto-seed initial appraisals
      // Fetch an employee or create placeholder
      const empSnap = await getDocs(collection(db, 'employees'));
      const firstEmpId = !empSnap.empty ? empSnap.docs[0].id : 'sample-emp-1';

      const seeded: AppraisalReview[] = [];
      for (const item of SEED_APPRAISALS) {
        const newRef = doc(collection(db, 'appraisal_reviews'));
        const now = new Date().toISOString();
        const appDoc: AppraisalReview = {
          id: newRef.id,
          organization_id: DEFAULT_ORG_ID,
          employee_id: firstEmpId,
          reviewer_id: null,
          cycle_name: item.cycle_name || 'Q1 2026 Appraisal',
          period: item.period || 'Q1 2026',
          status: item.status || 'self_review',
          self_rating: item.self_rating || 4.0,
          self_comments: item.self_comments || null,
          self_submitted_at: item.self_submitted_at || now,
          manager_rating: item.manager_rating || null,
          manager_comments: item.manager_comments || null,
          manager_submitted_at: item.manager_submitted_at || null,
          overall_score: item.overall_score || null,
          recommendation: item.recommendation || null,
          ratings_breakdown: item.ratings_breakdown || null,
          created_at: now,
          updated_at: now,
        };
        await setDoc(newRef, appDoc);
        seeded.push(appDoc);
      }
      return seeded;
    }

    const reviews: AppraisalReview[] = [];
    for (const d of snap.docs) {
      const data = { id: d.id, ...d.data() } as AppraisalReview;

      if (data.employee_id) {
        try {
          const empDoc = await getDoc(doc(db, 'employees', data.employee_id));
          if (empDoc.exists()) {
            const empData = { id: empDoc.id, ...empDoc.data() } as Employee;
            if (empData.profile_id) {
              const profDoc = await getDoc(doc(db, 'profiles', empData.profile_id));
              if (profDoc.exists()) empData.profile = { id: profDoc.id, ...profDoc.data() } as Profile;
            }
            data.employee = empData;
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (data.reviewer_id) {
        try {
          const profDoc = await getDoc(doc(db, 'profiles', data.reviewer_id));
          if (profDoc.exists()) data.reviewer = { id: profDoc.id, ...profDoc.data() } as Profile;
        } catch (e) {
          console.error(e);
        }
      }

      if (options?.status && data.status !== options.status) continue;
      if (options?.period && data.period !== options.period) continue;
      reviews.push(data);
    }
    return reviews;
  } catch (error) {
    console.error('getAppraisals error:', error);
    return [];
  }
}

export async function createAppraisal(
  data: Omit<AppraisalReview, 'id' | 'created_at' | 'updated_at'>,
  userId?: string
): Promise<AppraisalReview> {
  const newRef = doc(collection(db, 'appraisal_reviews'));
  const now = new Date().toISOString();
  const review: AppraisalReview = {
    ...data,
    id: newRef.id,
    created_at: now,
    updated_at: now,
  };
  await setDoc(newRef, review);

  await createAuditLog('INITIATE_APPRAISAL', 'appraisal_review', newRef.id, {
    cycle: review.cycle_name,
    employee_id: review.employee_id,
  });

  return review;
}

export async function submitSelfReview(
  id: string,
  data: {
    self_rating: number;
    self_comments: string;
    ratings_breakdown?: PerformanceRatingBreakdown;
  },
  userId?: string
): Promise<void> {
  const reviewRef = doc(db, 'appraisal_reviews', id);
  const now = new Date().toISOString();
  await updateDoc(reviewRef, {
    self_rating: data.self_rating,
    self_comments: data.self_comments,
    ratings_breakdown: data.ratings_breakdown || null,
    self_submitted_at: now,
    status: 'manager_review',
    updated_at: now,
  });

  await createAuditLog('SUBMIT_SELF_APPRAISAL', 'appraisal_review', id, {
    rating: data.self_rating,
  });
}

export async function submitManagerReview(
  id: string,
  data: {
    manager_rating: number;
    manager_comments: string;
    overall_score: number;
    recommendation: AppraisalRecommendation;
    ratings_breakdown?: PerformanceRatingBreakdown;
    reviewer_id: string;
  },
  employeeProfileId?: string
): Promise<void> {
  const reviewRef = doc(db, 'appraisal_reviews', id);
  const now = new Date().toISOString();
  await updateDoc(reviewRef, {
    manager_rating: data.manager_rating,
    manager_comments: data.manager_comments,
    overall_score: data.overall_score,
    recommendation: data.recommendation,
    ratings_breakdown: data.ratings_breakdown || null,
    reviewer_id: data.reviewer_id,
    manager_submitted_at: now,
    status: 'completed',
    updated_at: now,
  });

  await createAuditLog('COMPLETE_MANAGER_APPRAISAL', 'appraisal_review', id, {
    rating: data.manager_rating,
    overall_score: data.overall_score,
    recommendation: data.recommendation,
  });

  if (employeeProfileId) {
    await createNotification({
      profile_id: employeeProfileId,
      title: 'Appraisal Review Completed',
      message: `Your manager has finalized your appraisal review with an overall score of ${data.overall_score}/100.`,
      type: 'performance',
      action_url: '/(employee)/performance',
    });
  }
}

// ----------------------------------------------------
// CONTINUOUS FEEDBACK & KUDOS API
// ----------------------------------------------------
export async function getKudos(): Promise<Kudos[]> {
  try {
    const kudosRef = collection(db, 'kudos');
    const q = query(kudosRef, orderBy('created_at', 'desc'));
    const snap = await getDocs(q);

    if (snap.empty) {
      // Seed default kudos
      const profilesSnap = await getDocs(collection(db, 'profiles'));
      const profs = profilesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Profile));
      const senderId = profs[0]?.id || 'p-sender';
      const receiverId = profs[1]?.id || profs[0]?.id || 'p-receiver';

      const seeded: Kudos[] = [];
      for (const item of SEED_KUDOS) {
        const newRef = doc(collection(db, 'kudos'));
        const k: Kudos = {
          id: newRef.id,
          organization_id: DEFAULT_ORG_ID,
          sender_id: senderId,
          receiver_id: receiverId,
          badge: item.badge || 'star',
          message: item.message || 'Great job!',
          created_at: item.created_at || new Date().toISOString(),
        };
        await setDoc(newRef, k);
        seeded.push(k);
      }
      return seeded;
    }

    const list: Kudos[] = [];
    for (const d of snap.docs) {
      const data = { id: d.id, ...d.data() } as Kudos;
      try {
        if (data.sender_id) {
          const sDoc = await getDoc(doc(db, 'profiles', data.sender_id));
          if (sDoc.exists()) data.sender = { id: sDoc.id, ...sDoc.data() } as Profile;
        }
        if (data.receiver_id) {
          const rDoc = await getDoc(doc(db, 'profiles', data.receiver_id));
          if (rDoc.exists()) data.receiver = { id: rDoc.id, ...rDoc.data() } as Profile;
        }
      } catch (e) {
        console.error(e);
      }
      list.push(data);
    }
    return list;
  } catch (error) {
    console.error('getKudos error:', error);
    return [];
  }
}

export async function sendKudos(data: {
  sender_id: string;
  receiver_id: string;
  badge: KudosBadge;
  message: string;
  sender_name?: string;
}): Promise<Kudos> {
  const newRef = doc(collection(db, 'kudos'));
  const now = new Date().toISOString();
  const kudos: Kudos = {
    id: newRef.id,
    organization_id: DEFAULT_ORG_ID,
    sender_id: data.sender_id,
    receiver_id: data.receiver_id,
    badge: data.badge,
    message: data.message,
    created_at: now,
  };
  await setDoc(newRef, kudos);

  await createNotification({
    profile_id: data.receiver_id,
    title: 'New Kudos Received! 🎉',
    message: `${data.sender_name || 'A teammate'} sent you a "${data.badge.toUpperCase()}" badge: "${data.message}"`,
    type: 'kudos',
    action_url: '/(employee)/performance',
  });

  return kudos;
}
