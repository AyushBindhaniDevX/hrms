import { db, firebaseConfig } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection, updateDoc, setDoc, query, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import type { Organization, Profile, Department, Workplace } from '@/types';

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const docRef = doc(db, 'organizations', orgId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Organization;
}

export async function updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
  const docRef = doc(db, 'organizations', orgId);
  await updateDoc(docRef, updates);
}

export async function getOrgUsers(): Promise<Profile[]> {
  const q = query(
    collection(db, 'profiles'),
    orderBy('role'),
    orderBy('full_name')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Profile));
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  const docRef = doc(db, 'profiles', userId);
  await updateDoc(docRef, { role, updated_at: serverTimestamp() });
}

export async function updateUserProfileData(userId: string, data: { full_name?: string; phone?: string | null; role?: string }): Promise<void> {
  const docRef = doc(db, 'profiles', userId);
  await updateDoc(docRef, {
    ...data,
    updated_at: serverTimestamp()
  });
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<void> {
  const docRef = doc(db, 'profiles', userId);
  await updateDoc(docRef, { is_active: isActive, updated_at: serverTimestamp() });
}

export async function deleteUserRecord(userId: string): Promise<void> {
  const docRef = doc(db, 'profiles', userId);
  await deleteDoc(docRef);
}

/**
 * Creates a new Auth user and Firestore Profile without logging out the current active admin/HR session.
 */
export async function createSystemUser(params: {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'hr' | 'employee';
  organization_id: string;
  phone?: string;
  create_employee_record?: boolean;
  employee_code?: string;
  department_id?: string;
  designation?: string;
  joining_date?: string;
  workplace_id?: string;
  basic_salary?: number;
}): Promise<string> {
  const tempAppName = `creator-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  try {
    const tempAuth = getAuth(tempApp);
    const userCredential = await createUserWithEmailAndPassword(tempAuth, params.email, params.password);
    const user = userCredential.user;

    if (params.full_name) {
      await updateProfile(user, { displayName: params.full_name });
    }

    const uid = user.uid;

    // Save to profiles
    await setDoc(doc(db, 'profiles', uid), {
      id: uid,
      full_name: params.full_name,
      email: params.email,
      role: params.role,
      organization_id: params.organization_id || '00000000-0000-0000-0000-000000000001',
      phone: params.phone || null,
      is_active: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    // Create employee record if requested
    if (params.create_employee_record) {
      const newEmpRef = doc(collection(db, 'employees'));
      await setDoc(newEmpRef, {
        id: newEmpRef.id,
        profile_id: uid,
        employee_code: params.employee_code || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        department_id: params.department_id || null,
        designation: params.designation || (params.role === 'admin' ? 'Administrator' : params.role === 'hr' ? 'HR Manager' : 'Staff'),
        joining_date: params.joining_date || new Date().toISOString().split('T')[0],
        workplace_id: params.workplace_id || null,
        basic_salary: params.basic_salary || 0,
        employment_status: 'active',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }

    await signOut(tempAuth);
    await deleteApp(tempApp);
    return uid;
  } catch (error) {
    try {
      await deleteApp(tempApp);
    } catch {}
    throw error;
  }
}

export async function createDepartment(orgId: string, name: string, description: string): Promise<string> {
  const docRef = await addDoc(collection(db, 'departments'), {
    organization_id: orgId,
    name,
    description,
    created_at: serverTimestamp()
  });
  return docRef.id;
}

export async function createWorkplace(
  orgId: string, 
  name: string, 
  address: string, 
  latitude: number, 
  longitude: number, 
  radiusMeters: number
): Promise<string> {
  const docRef = await addDoc(collection(db, 'workplaces'), {
    organization_id: orgId,
    name,
    address,
    latitude,
    longitude,
    radius_meters: radiusMeters,
    is_active: true,
    created_at: serverTimestamp()
  });
  return docRef.id;
}
