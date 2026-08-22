import { db, auth } from '@/lib/firebase';
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
  serverTimestamp,
  getCountFromServer,
  writeBatch
} from 'firebase/firestore';
import type { Employee, Profile, Department, Workplace } from '@/types';

async function fetchEmployeeJoins(empData: any): Promise<Employee> {
  const emp = { ...empData } as Employee;

  if (empData.profile_id) {
    const profSnap = await getDoc(doc(db, 'profiles', empData.profile_id));
    if (profSnap.exists()) emp.profile = { id: profSnap.id, ...profSnap.data() } as Profile;
  }

  if (empData.department_id) {
    const deptSnap = await getDoc(doc(db, 'departments', empData.department_id));
    if (deptSnap.exists()) emp.department = { id: deptSnap.id, ...deptSnap.data() } as Department;
  }

  if (empData.workplace_id) {
    const wpSnap = await getDoc(doc(db, 'workplaces', empData.workplace_id));
    if (wpSnap.exists()) emp.workplace = { id: wpSnap.id, ...wpSnap.data() } as Workplace;
  }

  if (empData.manager_id) {
    const mgrSnap = await getDoc(doc(db, 'employees', empData.manager_id));
    if (mgrSnap.exists()) {
      const mgrData = { id: mgrSnap.id, ...mgrSnap.data() };
      if ((mgrData as any).profile_id) {
        const mgrProfSnap = await getDoc(doc(db, 'profiles', (mgrData as any).profile_id));
        if (mgrProfSnap.exists()) {
          (mgrData as any).profile = { id: mgrProfSnap.id, ...mgrProfSnap.data() };
        }
      }
      emp.manager = mgrData as Employee;
    }
  }

  return emp;
}

export async function getEmployeeByProfileId(profileId: string): Promise<Employee | null> {
  const q = query(collection(db, 'employees'), where('profile_id', '==', profileId));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const empData = { id: snap.docs[0].id, ...snap.docs[0].data() };
  return fetchEmployeeJoins(empData);
}

function getTimestampMillis(val: any): number {
  if (!val) return 0;
  if (typeof val === 'string') return new Date(val).getTime() || 0;
  if (typeof val?.toDate === 'function') return val.toDate().getTime();
  if (typeof val?.seconds === 'number') return val.seconds * 1000;
  if (val instanceof Date) return val.getTime();
  return 0;
}

export async function getEmployees(params?: {
  department_id?: string;
  workplace_id?: string;
  employment_status?: string;
  search?: string;
}): Promise<Employee[]> {
  const { department_id, workplace_id, employment_status, search } = params || {};
  let q: any = collection(db, 'employees');

  if (department_id) {
    q = query(q, where('department_id', '==', department_id));
  }
  if (workplace_id) {
    q = query(q, where('workplace_id', '==', workplace_id));
  }
  if (employment_status) {
    q = query(q, where('employment_status', '==', employment_status));
  }

  const snap = await getDocs(q);
  let results = await Promise.all(snap.docs.map((d) => fetchEmployeeJoins({ id: d.id, ...(d.data() as any) })));

  if (search) {
    const s = search.toLowerCase();
    results = results.filter(
      (e) =>
        e.profile?.full_name?.toLowerCase().includes(s) ||
        e.designation?.toLowerCase().includes(s) ||
        e.employee_code?.toLowerCase().includes(s)
    );
  }

  return results.sort((a, b) => getTimestampMillis(b.created_at) - getTimestampMillis(a.created_at));
}

export async function getDirectory(search?: string, departmentId?: string): Promise<Employee[]> {
  let q = query(
    collection(db, 'employees'),
    where('employment_status', '==', 'active')
  );

  if (departmentId) {
    q = query(q, where('department_id', '==', departmentId));
  }

  const snap = await getDocs(q);
  let results = await Promise.all(snap.docs.map((d) => fetchEmployeeJoins({ id: d.id, ...(d.data() as any) })));

  if (search) {
    const s = search.toLowerCase();
    results = results.filter(
      (e) =>
        e.profile?.full_name?.toLowerCase().includes(s) ||
        e.designation?.toLowerCase().includes(s) ||
        e.employee_code?.toLowerCase().includes(s)
    );
  }

  return results.sort((a, b) => getTimestampMillis(b.created_at) - getTimestampMillis(a.created_at));
}

export async function getAllEmployees(): Promise<Employee[]> {
  const snap = await getDocs(collection(db, 'employees'));
  const results = await Promise.all(snap.docs.map((d) => fetchEmployeeJoins({ id: d.id, ...(d.data() as any) })));
  return results.sort((a, b) => getTimestampMillis(b.created_at) - getTimestampMillis(a.created_at));
}

export async function createEmployee(params: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: string;
  organization_id: string;
  employee_code: string;
  department_id?: string;
  manager_id?: string;
  designation?: string;
  basic_salary?: number;
}): Promise<void> {
  const { initializeApp, deleteApp } = await import('firebase/app');
  const { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } = await import('firebase/auth');
  const { firebaseConfig } = await import('@/lib/firebase');

  const tempAppName = `emp-creator-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  try {
    const tempAuth = getAuth(tempApp);
    const userCredential = await createUserWithEmailAndPassword(tempAuth, params.email, params.password);
    const user = userCredential.user;

    if (params.full_name) {
      await updateProfile(user, { displayName: params.full_name });
    }

    // Create profile
    await setDoc(doc(db, 'profiles', user.uid), {
      id: user.uid,
      full_name: params.full_name,
      email: params.email,
      role: params.role || 'employee',
      organization_id: params.organization_id || '00000000-0000-0000-0000-000000000001',
      phone: params.phone || null,
      is_active: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    // Create employee
    const newEmpRef = doc(collection(db, 'employees'));
    await setDoc(newEmpRef, {
      id: newEmpRef.id,
      profile_id: user.uid,
      employee_code: params.employee_code,
      department_id: params.department_id || null,
      manager_id: params.manager_id || null,
      employment_status: 'active',
      designation: params.designation || null,
      basic_salary: params.basic_salary || 0,
      onboarding_completed: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    await signOut(tempAuth);
    await deleteApp(tempApp);

    // Send Resend Welcome Notification
    try {
      const { sendWelcomeEmail } = await import('./resend');
      await sendWelcomeEmail(
        params.email,
        params.full_name || 'Team Member',
        params.employee_code,
        params.designation || 'Engineer'
      );
    } catch (mailErr) {
      console.warn('Resend welcome notification dispatch warning:', mailErr);
    }
  } catch (error) {
    try {
      await deleteApp(tempApp);
    } catch {}
    throw error;
  }
}

export async function updateEmployee(
  id: string,
  updates: Partial<Pick<Employee, 'department_id' | 'designation' | 'workplace_id' | 'basic_salary' | 'employment_status' | 'employee_code' | 'manager_id'>>
): Promise<void> {
  await updateDoc(doc(db, 'employees', id), {
    ...updates,
    updated_at: serverTimestamp(),
  });
}

// ── Department Management ──────────────────────────────────────────────────

export async function getDepartments(): Promise<Department[]> {
  const snap = await getDocs(collection(db, 'departments'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Department);
}

export async function completeOnboarding(
  employeeId: string, 
  profileId: string,
  data: { 
    home_address: string;
    bank_details: { bank_name: string; account_number: string; routing_number: string };
    emergency_contact: { name: string; phone: string; relationship: string };
  },
  avatarUrl?: string
) {
  const batch = writeBatch(db);
  
  const empRef = doc(db, 'employees', employeeId);
  batch.update(empRef, {
    ...data,
    onboarding_completed: true,
    updated_at: serverTimestamp()
  });

  if (avatarUrl) {
    const profRef = doc(db, 'profiles', profileId);
    batch.update(profRef, {
      avatar_url: avatarUrl,
      updated_at: serverTimestamp()
    });
  }

  await batch.commit();
}

export async function getDepartmentsWithStats(): Promise<Department[]> {
  const [deptSnap, empSnap] = await Promise.all([
    getDocs(query(collection(db, 'departments'), orderBy('name'))),
    getDocs(collection(db, 'employees')),
  ]);

  const employees = await Promise.all(
    empSnap.docs.map((d) => fetchEmployeeJoins({ id: d.id, ...d.data() }))
  );

  const departments = deptSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Department));

  for (const dept of departments) {
    const deptEmps = employees.filter((e) => e.department_id === dept.id);
    dept.employee_count = deptEmps.length;

    if (dept.manager_id) {
      dept.manager = employees.find((e) => e.id === dept.manager_id) || undefined;
    }
  }

  return departments;
}

export async function createDepartment(params: {
  organization_id: string;
  name: string;
  description?: string;
  manager_id?: string | null;
}): Promise<Department> {
  const newDeptRef = doc(collection(db, 'departments'));
  const deptData: Department = {
    id: newDeptRef.id,
    organization_id: params.organization_id,
    name: params.name,
    description: params.description || null,
    manager_id: params.manager_id || null,
    created_at: new Date().toISOString(),
  };
  await setDoc(newDeptRef, {
    ...deptData,
    created_at: serverTimestamp(),
  });
  return deptData;
}

export async function updateDepartment(
  id: string,
  updates: Partial<Pick<Department, 'name' | 'description' | 'manager_id'>>
): Promise<void> {
  await updateDoc(doc(db, 'departments', id), {
    ...updates,
    updated_at: serverTimestamp(),
  });
}

export async function deleteDepartment(id: string): Promise<void> {
  await deleteDoc(doc(db, 'departments', id));
}

export async function updateReportingManager(employeeId: string, managerId: string | null): Promise<void> {
  await updateDoc(doc(db, 'employees', employeeId), {
    manager_id: managerId,
    updated_at: serverTimestamp(),
  });
}

export async function getOrgHierarchy(): Promise<Employee[]> {
  const allEmployees = await getAllEmployees();

  // Populate direct reports on every manager
  const empMap = new Map<string, Employee>();
  for (const e of allEmployees) {
    e.direct_reports = [];
    empMap.set(e.id, e);
  }

  for (const e of allEmployees) {
    if (e.manager_id && empMap.has(e.manager_id)) {
      const manager = empMap.get(e.manager_id);
      if (manager) {
        manager.direct_reports = manager.direct_reports || [];
        manager.direct_reports.push(e);
      }
    }
  }

  return allEmployees;
}

// ── Workplaces ─────────────────────────────────────────────────────────────

export async function getWorkplaces(): Promise<Workplace[]> {
  const snap = await getDocs(query(collection(db, 'workplaces'), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Workplace));
}

export async function createWorkplace(params: {
  organization_id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}): Promise<Workplace> {
  const newWpRef = doc(collection(db, 'workplaces'));
  const wpData = {
    id: newWpRef.id,
    ...params,
    is_active: true,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  await setDoc(newWpRef, wpData);
  return wpData as unknown as Workplace;
}

export async function updateWorkplace(id: string, updates: Partial<Workplace>): Promise<void> {
  await updateDoc(doc(db, 'workplaces', id), {
    ...updates,
    updated_at: serverTimestamp(),
  });
}

export async function getEmployeeCount(): Promise<number> {
  const q = query(collection(db, 'employees'), where('employment_status', '==', 'active'));
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}
