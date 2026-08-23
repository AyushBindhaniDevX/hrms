import { db, auth } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit as limitDocs, setDoc, updateDoc } from 'firebase/firestore';
import { calculateDistance } from './location';
import type { Attendance, GeofenceResponse, Employee, Workplace, Profile } from '@/types';

async function getEmployeeData(): Promise<{ emp: Employee; wp: Workplace } | null> {
  const user = auth.currentUser;
  if (!user) return null;
  
  // 1. Get profile to find organization
  const q = query(collection(db, 'employees'), where('profile_id', '==', user.uid));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const empDoc = snap.docs[0];
  const emp = { id: empDoc.id, ...empDoc.data() } as Employee;
  
  if (!emp.workplace_id) return null;
  
  // 2. Get workplace
  const wpDoc = await getDoc(doc(db, 'workplaces', emp.workplace_id));
  if (!wpDoc.exists()) return null;
  const wp = { id: wpDoc.id, ...wpDoc.data() } as Workplace;
  
  return { emp, wp };
}

export async function clockIn(latitude: number, longitude: number): Promise<GeofenceResponse> {
  const data = await getEmployeeData();
  if (!data) {
    // Fallback: try to get employee without workplace
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const q = query(collection(db, 'employees'), where('profile_id', '==', user.uid));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Employee record not found. Please contact HR.');
    const empDoc = snap.docs[0];
    const emp = { id: empDoc.id, ...empDoc.data() } as Employee;
    // No workplace — clock in without geofence
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const attendanceId = `${emp.id}_${today}`;
    const docRef = doc(db, 'attendance', attendanceId);
    const existing = await getDoc(docRef);
    if (existing.exists() && existing.data().clock_in) {
      return { success: false, message: 'Already clocked in today' };
    }
    await setDoc(docRef, {
      id: attendanceId,
      employee_id: emp.id,
      date: today,
      clock_in: now,
      clock_in_latitude: latitude,
      clock_in_longitude: longitude,
      clock_in_verified: false,
      working_minutes: 0,
      status: 'present',
      created_at: now,
      updated_at: now,
    }, { merge: true });
    return { success: true, message: 'Clocked in (no geofence)' };
  }

  const { emp, wp } = data;
  const distance = calculateDistance(latitude, longitude, wp.latitude, wp.longitude);
  const isValid = distance <= wp.radius_meters;

  if (!isValid) {
    return { success: false, message: `You are ${Math.round(distance)}m away. Must be within ${wp.radius_meters}m of ${wp.name}.`, distance_meters: distance };
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  const attendanceId = `${emp.id}_${today}`;
  const docRef = doc(db, 'attendance', attendanceId);
  const existing = await getDoc(docRef);
  if (existing.exists() && existing.data().clock_in) {
    return { success: false, message: 'Already clocked in today' };
  }

  await setDoc(docRef, {
    id: attendanceId,
    employee_id: emp.id,
    workplace_id: wp.id,
    date: today,
    clock_in: now,
    clock_in_latitude: latitude,
    clock_in_longitude: longitude,
    clock_in_verified: true,
    working_minutes: 0,
    status: 'present',
    created_at: now,
    updated_at: now,
  }, { merge: true });

  return { success: true, message: 'Clocked in successfully', distance_meters: distance };
}

export async function clockOut(latitude: number, longitude: number): Promise<GeofenceResponse> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const q = query(collection(db, 'employees'), where('profile_id', '==', user.uid));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Employee record not found');
  const emp = { id: snap.docs[0].id, ...snap.docs[0].data() } as Employee;

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  const attendanceId = `${emp.id}_${today}`;
  const docRef = doc(db, 'attendance', attendanceId);
  const attDoc = await getDoc(docRef);

  if (!attDoc.exists() || !attDoc.data().clock_in) {
    return { success: false, message: 'No clock-in found for today. Please clock in first.' };
  }
  if (attDoc.data().clock_out) {
    return { success: false, message: 'Already clocked out for today.' };
  }

  const clockInTime = new Date(attDoc.data().clock_in);
  const clockOutTime = new Date(now);
  let totalMinutes = Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / 60000);
  
  const breaks: { start: string; end: string | null; reason: string }[] = attDoc.data().breaks || [];
  let breakMinutes = 0;
  
  // Auto-close any open break
  let updatedBreaks = [...breaks];
  if (updatedBreaks.length > 0 && !updatedBreaks[updatedBreaks.length - 1].end) {
    updatedBreaks[updatedBreaks.length - 1].end = now;
  }
  
  for (const b of updatedBreaks) {
    if (b.start && b.end) {
      breakMinutes += Math.floor((new Date(b.end).getTime() - new Date(b.start).getTime()) / 60000);
    }
  }

  const workingMinutes = Math.max(0, totalMinutes - breakMinutes);

  // Optional: geofence check for clock out if workplace exists
  let distance_meters: number | undefined;
  if (emp.workplace_id) {
    try {
      const wpDoc = await getDoc(doc(db, 'workplaces', emp.workplace_id));
      if (wpDoc.exists()) {
        const wp = { id: wpDoc.id, ...wpDoc.data() } as Workplace;
        const dist = calculateDistance(latitude, longitude, wp.latitude, wp.longitude);
        distance_meters = dist;
        if (dist > wp.radius_meters) {
          return { success: false, message: `You are ${Math.round(dist)}m away. Must be within ${wp.radius_meters}m to clock out.`, distance_meters: dist };
        }
      }
    } catch { /* ignore geofence errors on clock-out */ }
  }

  await updateDoc(docRef, {
    clock_out: now,
    clock_out_latitude: latitude,
    clock_out_longitude: longitude,
    clock_out_verified: !!emp.workplace_id,
    working_minutes: workingMinutes,
    breaks: updatedBreaks,
    updated_at: now,
  });

  return { success: true, message: 'Clocked out successfully', distance_meters, clock_out: now, working_minutes: workingMinutes };
}

export async function startBreak(attendanceId: string, reason: string): Promise<boolean> {
  const docRef = doc(db, 'attendance', attendanceId);
  const attDoc = await getDoc(docRef);
  if (!attDoc.exists()) return false;
  
  const breaks = attDoc.data().breaks || [];
  if (breaks.length > 0 && !breaks[breaks.length - 1].end) {
    return false; // Already on break
  }
  
  breaks.push({ start: new Date().toISOString(), end: null, reason });
  await updateDoc(docRef, { breaks, updated_at: new Date().toISOString() });
  return true;
}

export async function endBreak(attendanceId: string): Promise<boolean> {
  const docRef = doc(db, 'attendance', attendanceId);
  const attDoc = await getDoc(docRef);
  if (!attDoc.exists()) return false;
  
  const breaks = attDoc.data().breaks || [];
  if (breaks.length === 0 || breaks[breaks.length - 1].end) {
    return false; // Not on break
  }
  
  breaks[breaks.length - 1].end = new Date().toISOString();
  await updateDoc(docRef, { breaks, updated_at: new Date().toISOString() });
  return true;
}

export async function getTodayAttendance(employeeId: string): Promise<Attendance | null> {
  const today = new Date().toISOString().split('T')[0];
  const attendanceId = `${employeeId}_${today}`;
  const docRef = doc(db, 'attendance', attendanceId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Attendance;
}

export async function getAttendanceHistory(
  employeeId: string,
  limitDays = 30,
  offset = 0
): Promise<Attendance[]> {
  let calculatedLimit = limitDays;

  // 1. Fetch employee to get joining_date
  try {
    const empDoc = await getDoc(doc(db, 'employees', employeeId));
    if (empDoc.exists()) {
      const empData = empDoc.data() as Employee;
      if (empData.joining_date) {
        const joinDate = new Date(empData.joining_date);
        const today = new Date();
        if (joinDate > today) {
          calculatedLimit = 0;
        } else {
          const diffTime = today.getTime() - joinDate.getTime();
          calculatedLimit = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
      }
    }
  } catch (e) {
    console.error('Error fetching employee joining date', e);
  }

  // Safe cap for performance if needed, but we'll allow full history
  // if (calculatedLimit > 365) calculatedLimit = 365;

  const q = query(
    collection(db, 'attendance'),
    where('employee_id', '==', employeeId),
    orderBy('date', 'desc'),
    limitDocs(calculatedLimit > 0 ? calculatedLimit : 1) 
  );
  
  const snap = await getDocs(q);
  const rawRecords = snap.docs.map(d => ({ id: d.id, ...d.data() } as Attendance));

  const results: Attendance[] = [];
  const shiftStartTime = "09:30"; // Standard hardcoded shift

  // Generate date range from today backwards
  for (let i = 0; i < calculatedLimit; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    const existingRecord = rawRecords.find(r => r.date === dateStr);

    if (existingRecord) {
      if (existingRecord.clock_in) {
        const clockInDate = new Date(existingRecord.clock_in);
        // Format to HH:mm
        const clockInTime = `${String(clockInDate.getHours()).padStart(2, '0')}:${String(clockInDate.getMinutes()).padStart(2, '0')}`;
        
        if (clockInTime > shiftStartTime && existingRecord.status !== 'half_day' && existingRecord.status !== 'on_leave') {
          existingRecord.status = 'late';
        } else if (existingRecord.status !== 'half_day' && existingRecord.status !== 'on_leave') {
          existingRecord.status = 'present';
        }
      }
      results.push(existingRecord);
    } else {
      // Missing record
      if (!isWeekend) {
        // Mark as absent if it's a weekday and they didn't clock in
        results.push({
          id: `missing_${dateStr}`,
          employee_id: employeeId,
          workplace_id: null,
          date: dateStr,
          clock_in: null,
          clock_out: null,
          clock_in_latitude: null,
          clock_in_longitude: null,
          clock_out_latitude: null,
          clock_out_longitude: null,
          clock_in_verified: false,
          clock_out_verified: false,
          working_minutes: 0,
          status: 'absent',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
  }

  return results;
}

export async function getOrgAttendance(date: string): Promise<Attendance[]> {
  const q = query(
    collection(db, 'attendance'),
    where('date', '==', date),
    orderBy('clock_in', 'asc')
  );
  
  const snap = await getDocs(q);
  const records = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  
  // Fetch employee + profile for each record
  for (const record of records) {
    if (record.employee_id) {
      try {
        const empDoc = await getDoc(doc(db, 'employees', record.employee_id));
        if (empDoc.exists()) {
          const empData = empDoc.data() as Employee;
          record.employee = { ...empData, id: empDoc.id };
          if (empData.profile_id) {
             const profDoc = await getDoc(doc(db, 'profiles', empData.profile_id));
             if (profDoc.exists()) {
               (record.employee as any).profile = { ...profDoc.data(), id: profDoc.id };
             }
          }
        }
      } catch (e) {}
    }
  }
  
  return records as Attendance[];
}

export async function getAttendanceStats(date: string) {
  const q = query(
    collection(db, 'attendance'),
    where('date', '==', date)
  );
  const snap = await getDocs(q);
  const records = snap.docs.map(d => d.data());
  
  return {
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    halfDay: records.filter(r => r.status === 'half_day').length,
    total: records.length,
  };
}
