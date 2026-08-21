import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit as limitDocs, setDoc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import type { LeaveType, LeaveBalance, LeaveRequest, LeaveProcessResponse, Employee } from '@/types';

const DEFAULT_LEAVE_TYPES = [
  { name: 'Annual Leave',       annual_days: 18, is_paid: true  },
  { name: 'Sick Leave',         annual_days: 12, is_paid: true  },
  { name: 'Casual Leave',       annual_days: 7,  is_paid: true  },
  { name: 'Maternity Leave',    annual_days: 90, is_paid: true  },
  { name: 'Paternity Leave',    annual_days: 7,  is_paid: true  },
  { name: 'Compensatory Leave', annual_days: 5,  is_paid: true  },
  { name: 'Unpaid Leave',       annual_days: 30, is_paid: false },
];

export async function getLeaveTypes(): Promise<LeaveType[]> {
  const q = query(collection(db, 'leave_types'), orderBy('name'));
  const snap = await getDocs(q);

  if (!snap.empty) {
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaveType));
  }

  // Auto-seed default leave types for new organisations
  const defaultOrgId = '00000000-0000-0000-0000-000000000001';
  const seeded: LeaveType[] = [];
  for (const lt of DEFAULT_LEAVE_TYPES) {
    const newRef = doc(collection(db, 'leave_types'));
    const data: LeaveType = {
      id: newRef.id,
      organization_id: defaultOrgId,
      name: lt.name,
      annual_days: lt.annual_days,
      is_paid: lt.is_paid,
      created_at: new Date().toISOString(),
    };
    await setDoc(newRef, data);
    seeded.push(data);
  }
  return seeded.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getLeaveBalances(employeeId: string, year?: number): Promise<LeaveBalance[]> {
  const y = year ?? new Date().getFullYear();
  const q = query(
    collection(db, 'leave_balances'),
    where('employee_id', '==', employeeId),
    where('year', '==', y)
  );
  const snap = await getDocs(q);
  const balances = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  
  for (const b of balances) {
    if (b.leave_type_id) {
      const ltDoc = await getDoc(doc(db, 'leave_types', b.leave_type_id));
      if (ltDoc.exists()) b.leave_type = { id: ltDoc.id, ...ltDoc.data() };
    }
  }
  
  return balances as LeaveBalance[];
}

export async function getLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
  const q = query(
    collection(db, 'leave_requests'),
    where('employee_id', '==', employeeId),
    orderBy('created_at', 'desc')
  );
  const snap = await getDocs(q);
  const requests = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  
  for (const req of requests) {
    if (req.leave_type_id) {
      const ltDoc = await getDoc(doc(db, 'leave_types', req.leave_type_id));
      if (ltDoc.exists()) req.leave_type = { id: ltDoc.id, ...ltDoc.data() };
    }
  }
  
  return requests as LeaveRequest[];
}

export async function applyLeave(params: {
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days: number;
  is_half_day: boolean;
  reason: string;
}): Promise<LeaveRequest> {
  const newReqRef = doc(collection(db, 'leave_requests'));
  const data = {
    id: newReqRef.id,
    ...params,
    status: 'pending',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  await setDoc(newReqRef, data);
  return data as unknown as LeaveRequest;
}

export async function cancelLeave(requestId: string): Promise<void> {
  await updateDoc(doc(db, 'leave_requests', requestId), {
    status: 'cancelled',
    updated_at: serverTimestamp(),
  });
}

async function fetchLeaveJoins(reqData: any): Promise<LeaveRequest> {
  const req = { ...reqData };
  if (req.leave_type_id) {
    const ltDoc = await getDoc(doc(db, 'leave_types', req.leave_type_id));
    if (ltDoc.exists()) req.leave_type = { id: ltDoc.id, ...(ltDoc.data() as any) };
  }
  if (req.employee_id) {
    const empDoc = await getDoc(doc(db, 'employees', req.employee_id));
    if (empDoc.exists()) {
      const emp = { id: empDoc.id, ...(empDoc.data() as any) };
      if (emp.profile_id) {
        const profDoc = await getDoc(doc(db, 'profiles', emp.profile_id));
        if (profDoc.exists()) {
          emp.profile = { id: profDoc.id, ...(profDoc.data() as any) };
        }
      }
      if (emp.department_id) {
        const deptDoc = await getDoc(doc(db, 'departments', emp.department_id));
        if (deptDoc.exists()) {
          emp.department = { id: deptDoc.id, ...(deptDoc.data() as any) };
        }
      }
      req.employee = emp;
    }
  }
  return req as LeaveRequest;
}

// HR Functions
export async function getPendingLeaveRequests(): Promise<LeaveRequest[]> {
  const q = query(
    collection(db, 'leave_requests'),
    where('status', '==', 'pending'),
    orderBy('created_at', 'asc')
  );
  const snap = await getDocs(q);
  return Promise.all(snap.docs.map(d => fetchLeaveJoins({ id: d.id, ...(d.data() as any) })));
}

export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
  const q = query(
    collection(db, 'leave_requests'),
    orderBy('created_at', 'desc'),
    limitDocs(100)
  );
  const snap = await getDocs(q);
  return Promise.all(snap.docs.map(d => fetchLeaveJoins({ id: d.id, ...(d.data() as any) })));
}

export async function processLeaveRequest(
  requestId: string,
  action: 'approve' | 'reject'
): Promise<LeaveProcessResponse> {
  let success = false;
  let message = '';
  
  try {
    await runTransaction(db, async (transaction) => {
      const reqRef = doc(db, 'leave_requests', requestId);
      const reqDoc = await transaction.get(reqRef);
      if (!reqDoc.exists()) throw new Error('Request not found');
      
      const reqData = reqDoc.data();
      if (reqData.status !== 'pending') throw new Error('Request is not pending');
      
      if (action === 'approve') {
        // Find the leave balance
        const y = new Date(reqData.start_date).getFullYear();
        const balQuery = query(
          collection(db, 'leave_balances'),
          where('employee_id', '==', reqData.employee_id),
          where('leave_type_id', '==', reqData.leave_type_id),
          where('year', '==', y)
        );
        const balSnap = await getDocs(balQuery); // Note: getDocs inside transaction is not fully atomic in client SDK without special care, but good enough for MVP
        
        if (!balSnap.empty) {
           const balDoc = balSnap.docs[0];
           const balData = balDoc.data();
           const newUsed = balData.used_days + reqData.days;
           const newRem = balData.allocated_days - newUsed;
           transaction.update(balDoc.ref, {
             used_days: newUsed,
             remaining_days: newRem,
           });
        }
      }
      
      transaction.update(reqRef, {
        status: action === 'approve' ? 'approved' : 'rejected',
        updated_at: serverTimestamp()
      });
      
      success = true;
      message = `Leave request ${action}d successfully.`;
    });
  } catch (err: any) {
    success = false;
    message = err.message;
  }
  
  return { success, message };
}
