import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCnA0ZVxqFoP0HgOJazks691wnrnpbS4_8",
  authDomain: "expo-exo.firebaseapp.com",
  projectId: "expo-exo",
  storageBucket: "expo-exo.firebasestorage.app",
  messagingSenderId: "487683331313",
  appId: "1:487683331313:web:a988d106d962790415c550",
  measurementId: "G-W0VNCFKS7L",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_PASSWORD = 'Password@123';

console.log('🚀 Starting Comprehensive Firebase Seeding...');

async function main() {
  // 1. Seed Organization
  console.log('📦 1. Seeding Organization...');
  await setDoc(doc(db, 'organizations', ORG_ID), {
    id: ORG_ID,
    name: 'Oasis Technologies Ltd.',
    settings: {
      working_hours_start: '09:00',
      working_hours_end: '18:00',
      default_radius_meters: 150,
      fiscal_year_start_month: 4,
      currency: 'INR',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // 2. Seed Workplaces
  console.log('📍 2. Seeding Workplaces...');
  const workplaces = [
    {
      id: 'wp-blr-techpark',
      organization_id: ORG_ID,
      name: 'Bangalore Tech Campus (HQ)',
      address: 'Prestige Tech Park, Outer Ring Road, Bengaluru, Karnataka 560103',
      latitude: 12.9352,
      longitude: 77.6946,
      radius_meters: 200,
      is_active: true,
    },
    {
      id: 'wp-mum-bkc',
      organization_id: ORG_ID,
      name: 'Mumbai Financial Center',
      address: 'One BKC, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
      latitude: 19.0657,
      longitude: 72.8687,
      radius_meters: 150,
      is_active: true,
    },
    {
      id: 'wp-del-cyberhub',
      organization_id: ORG_ID,
      name: 'Delhi NCR Innovation Hub',
      address: 'DLF Cyber City, Building 10, Gurugram, Haryana 122002',
      latitude: 28.4952,
      longitude: 77.0891,
      radius_meters: 180,
      is_active: true,
    },
  ];

  for (const wp of workplaces) {
    await setDoc(doc(db, 'workplaces', wp.id), {
      ...wp,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 3. Seed Departments
  console.log('🏢 3. Seeding Departments...');
  const departments = [
    { id: 'dept-exec', name: 'Executive Leadership', description: 'Strategic executive management and corporate governance' },
    { id: 'dept-eng', name: 'Engineering & Technology', description: 'Full-stack software development, cloud infrastructure, DevOps & QA' },
    { id: 'dept-prod', name: 'Product & Design', description: 'Product management, user experience, UI research & strategy' },
    { id: 'dept-hr', name: 'People & Human Resources', description: 'Talent acquisition, employee welfare, payroll operations & compliance' },
    { id: 'dept-fin', name: 'Finance & Accounting', description: 'Financial planning, accounting, corporate audits, taxation & budgeting' },
    { id: 'dept-mkt', name: 'Marketing & Brand Growth', description: 'Brand marketing, performance growth, public relations & content' },
    { id: 'dept-sales', name: 'Enterprise Sales & Partnerships', description: 'B2B enterprise client acquisition, customer success & accounts' },
  ];

  for (const d of departments) {
    await setDoc(doc(db, 'departments', d.id), {
      id: d.id,
      organization_id: ORG_ID,
      name: d.name,
      description: d.description,
      manager_id: null,
      created_at: new Date().toISOString(),
    });
  }

  // 4. Seed Leave Types
  console.log('🏖️ 4. Seeding Leave Types...');
  const leaveTypes = [
    { id: 'lt-annual', name: 'Annual Leave', annual_days: 18, is_paid: true },
    { id: 'lt-sick', name: 'Sick Leave', annual_days: 12, is_paid: true },
    { id: 'lt-casual', name: 'Casual Leave', annual_days: 7, is_paid: true },
    { id: 'lt-maternity', name: 'Maternity Leave', annual_days: 90, is_paid: true },
    { id: 'lt-paternity', name: 'Paternity Leave', annual_days: 7, is_paid: true },
    { id: 'lt-comp', name: 'Compensatory Off', annual_days: 5, is_paid: true },
    { id: 'lt-unpaid', name: 'Unpaid Leave', annual_days: 30, is_paid: false },
  ];

  for (const lt of leaveTypes) {
    await setDoc(doc(db, 'leave_types', lt.id), {
      id: lt.id,
      organization_id: ORG_ID,
      name: lt.name,
      annual_days: lt.annual_days,
      is_paid: lt.is_paid,
      created_at: new Date().toISOString(),
    });
  }

  // 5. Seed 28 Users & Employees
  console.log('👥 5. Seeding 28 Corporate User Accounts & Employee Profiles...');

  const usersData = [
    // ── Executives & Admins
    {
      emp_id: 'emp-1001',
      code: 'EMP-1001',
      name: 'Alexander Wright',
      email: 'admin@oasis.io',
      role: 'admin',
      dept: 'dept-exec',
      wp: 'wp-blr-techpark',
      designation: 'Chief Executive Officer',
      salary: 350000,
      phone: '+91 98200 11001',
      manager_emp_id: null,
      joining: '2021-01-15',
    },
    {
      emp_id: 'emp-1002',
      code: 'EMP-1002',
      name: 'Marcus Vance',
      email: 'marcus.vance@oasis.io',
      role: 'admin',
      dept: 'dept-eng',
      wp: 'wp-blr-techpark',
      designation: 'Chief Technology Officer',
      salary: 300000,
      phone: '+91 98200 11002',
      manager_emp_id: 'emp-1001',
      joining: '2021-02-01',
    },

    // ── HR Team
    {
      emp_id: 'emp-1003',
      code: 'EMP-1003',
      name: 'Sarah Jenkins',
      email: 'hr@oasis.io',
      role: 'hr',
      dept: 'dept-hr',
      wp: 'wp-blr-techpark',
      designation: 'VP of People & Culture',
      salary: 220000,
      phone: '+91 98200 11003',
      manager_emp_id: 'emp-1001',
      joining: '2021-03-10',
    },
    {
      emp_id: 'emp-1004',
      code: 'EMP-1004',
      name: 'Priya Sharma',
      email: 'priya.sharma@oasis.io',
      role: 'hr',
      dept: 'dept-hr',
      wp: 'wp-mum-bkc',
      designation: 'Senior HR Business Partner',
      salary: 140000,
      phone: '+91 98200 11004',
      manager_emp_id: 'emp-1003',
      joining: '2022-01-15',
    },
    {
      emp_id: 'emp-1005',
      code: 'EMP-1005',
      name: 'David Kim',
      email: 'david.kim@oasis.io',
      role: 'hr',
      dept: 'dept-hr',
      wp: 'wp-blr-techpark',
      designation: 'Payroll & Benefits Lead',
      salary: 130000,
      phone: '+91 98200 11005',
      manager_emp_id: 'emp-1003',
      joining: '2022-04-01',
    },
    {
      emp_id: 'emp-1006',
      code: 'EMP-1006',
      name: 'Elena Rostova',
      email: 'elena.rostova@oasis.io',
      role: 'hr',
      dept: 'dept-hr',
      wp: 'wp-del-cyberhub',
      designation: 'Talent Acquisition Manager',
      salary: 125000,
      phone: '+91 98200 11006',
      manager_emp_id: 'emp-1003',
      joining: '2022-06-15',
    },

    // ── Engineering Team
    {
      emp_id: 'emp-1007',
      code: 'EMP-1007',
      name: 'Vikram Mehta',
      email: 'vikram.mehta@oasis.io',
      role: 'employee',
      dept: 'dept-eng',
      wp: 'wp-blr-techpark',
      designation: 'Director of Software Engineering',
      salary: 260000,
      phone: '+91 98200 11007',
      manager_emp_id: 'emp-1002',
      joining: '2021-04-01',
    },
    {
      emp_id: 'emp-1008',
      code: 'EMP-1008',
      name: 'Rachel Green',
      email: 'rachel.green@oasis.io',
      role: 'employee',
      dept: 'dept-eng',
      wp: 'wp-blr-techpark',
      designation: 'Principal Cloud Architect',
      salary: 210000,
      phone: '+91 98200 11008',
      manager_emp_id: 'emp-1007',
      joining: '2021-08-15',
    },
    {
      emp_id: 'emp-1009',
      code: 'EMP-1009',
      name: 'Arjun Patel',
      email: 'arjun.patel@oasis.io',
      role: 'employee',
      dept: 'dept-eng',
      wp: 'wp-blr-techpark',
      designation: 'Staff Backend Engineer',
      salary: 175000,
      phone: '+91 98200 11009',
      manager_emp_id: 'emp-1007',
      joining: '2022-02-01',
    },
    {
      emp_id: 'emp-1010',
      code: 'EMP-1010',
      name: 'Clara Schmidt',
      email: 'clara.schmidt@oasis.io',
      role: 'employee',
      dept: 'dept-eng',
      wp: 'wp-mum-bkc',
      designation: 'Lead Frontend Engineer',
      salary: 165000,
      phone: '+91 98200 11010',
      manager_emp_id: 'emp-1007',
      joining: '2022-03-15',
    },
    {
      emp_id: 'emp-1011',
      code: 'EMP-1011',
      name: 'Kevin Chen',
      email: 'kevin.chen@oasis.io',
      role: 'employee',
      dept: 'dept-eng',
      wp: 'wp-blr-techpark',
      designation: 'Senior Mobile Engineer (React Native)',
      salary: 155000,
      phone: '+91 98200 11011',
      manager_emp_id: 'emp-1007',
      joining: '2022-05-10',
    },
    {
      emp_id: 'emp-1012',
      code: 'EMP-1012',
      name: 'Neha Gupta',
      email: 'neha.gupta@oasis.io',
      role: 'employee',
      dept: 'dept-eng',
      wp: 'wp-del-cyberhub',
      designation: 'DevOps & SRE Specialist',
      salary: 150000,
      phone: '+91 98200 11012',
      manager_emp_id: 'emp-1007',
      joining: '2022-07-01',
    },
    {
      emp_id: 'emp-1013',
      code: 'EMP-1013',
      name: 'Robert Taylor',
      email: 'robert.taylor@oasis.io',
      role: 'employee',
      dept: 'dept-eng',
      wp: 'wp-mum-bkc',
      designation: 'QA Automation Lead',
      salary: 135000,
      phone: '+91 98200 11013',
      manager_emp_id: 'emp-1007',
      joining: '2022-09-15',
    },
    {
      emp_id: 'emp-1014',
      code: 'EMP-1014',
      name: 'Jordan Lee',
      email: 'employee@oasis.io',
      role: 'employee',
      dept: 'dept-eng',
      wp: 'wp-blr-techpark',
      designation: 'Full Stack Software Engineer',
      salary: 110000,
      phone: '+91 98200 11014',
      manager_emp_id: 'emp-1009',
      joining: '2023-01-10',
    },

    // ── Product & Design
    {
      emp_id: 'emp-1015',
      code: 'EMP-1015',
      name: 'Ananya Deshmukh',
      email: 'ananya.deshmukh@oasis.io',
      role: 'employee',
      dept: 'dept-prod',
      wp: 'wp-blr-techpark',
      designation: 'Head of Product Management',
      salary: 240000,
      phone: '+91 98200 11015',
      manager_emp_id: 'emp-1001',
      joining: '2021-06-01',
    },
    {
      emp_id: 'emp-1016',
      code: 'EMP-1016',
      name: 'Lucas Silva',
      email: 'lucas.silva@oasis.io',
      role: 'employee',
      dept: 'dept-prod',
      wp: 'wp-mum-bkc',
      designation: 'Senior Product Manager',
      salary: 170000,
      phone: '+91 98200 11016',
      manager_emp_id: 'emp-1015',
      joining: '2022-04-15',
    },
    {
      emp_id: 'emp-1017',
      code: 'EMP-1017',
      name: 'Maya Lin',
      email: 'maya.lin@oasis.io',
      role: 'employee',
      dept: 'dept-prod',
      wp: 'wp-blr-techpark',
      designation: 'Principal UI/UX Designer',
      salary: 160000,
      phone: '+91 98200 11017',
      manager_emp_id: 'emp-1015',
      joining: '2022-05-01',
    },

    // ── Finance Team
    {
      emp_id: 'emp-1018',
      code: 'EMP-1018',
      name: 'James Wilson',
      email: 'james.wilson@oasis.io',
      role: 'employee',
      dept: 'dept-fin',
      wp: 'wp-mum-bkc',
      designation: 'Chief Financial Officer',
      salary: 280000,
      phone: '+91 98200 11018',
      manager_emp_id: 'emp-1001',
      joining: '2021-02-15',
    },
    {
      emp_id: 'emp-1019',
      code: 'EMP-1019',
      name: 'Pooja Reddy',
      email: 'pooja.reddy@oasis.io',
      role: 'employee',
      dept: 'dept-fin',
      wp: 'wp-blr-techpark',
      designation: 'Senior Financial Controller',
      salary: 160000,
      phone: '+91 98200 11019',
      manager_emp_id: 'emp-1018',
      joining: '2022-01-10',
    },
    {
      emp_id: 'emp-1020',
      code: 'EMP-1020',
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@oasis.io',
      role: 'employee',
      dept: 'dept-fin',
      wp: 'wp-del-cyberhub',
      designation: 'Staff Corporate Accountant',
      salary: 115000,
      phone: '+91 98200 11020',
      manager_emp_id: 'emp-1019',
      joining: '2023-03-01',
    },

    // ── Marketing & Growth
    {
      emp_id: 'emp-1021',
      code: 'EMP-1021',
      name: 'Sophia Martinez',
      email: 'sophia.martinez@oasis.io',
      role: 'employee',
      dept: 'dept-mkt',
      wp: 'wp-blr-techpark',
      designation: 'Chief Marketing Officer',
      salary: 250000,
      phone: '+91 98200 11021',
      manager_emp_id: 'emp-1001',
      joining: '2021-07-01',
    },
    {
      emp_id: 'emp-1022',
      code: 'EMP-1022',
      name: 'Tariq Al-Mansoor',
      email: 'tariq.almansoor@oasis.io',
      role: 'employee',
      dept: 'dept-mkt',
      wp: 'wp-mum-bkc',
      designation: 'Growth Marketing Lead',
      salary: 155000,
      phone: '+91 98200 11022',
      manager_emp_id: 'emp-1021',
      joining: '2022-08-15',
    },
    {
      emp_id: 'emp-1023',
      code: 'EMP-1023',
      name: 'Emily Watson',
      email: 'emily.watson@oasis.io',
      role: 'employee',
      dept: 'dept-mkt',
      wp: 'wp-del-cyberhub',
      designation: 'Brand & Content Manager',
      salary: 130000,
      phone: '+91 98200 11023',
      manager_emp_id: 'emp-1021',
      joining: '2023-02-15',
    },

    // ── Sales & Enterprise Partnerships
    {
      emp_id: 'emp-1024',
      code: 'EMP-1024',
      name: 'Daniel Park',
      email: 'daniel.park@oasis.io',
      role: 'employee',
      dept: 'dept-sales',
      wp: 'wp-mum-bkc',
      designation: 'VP of Global Enterprise Sales',
      salary: 260000,
      phone: '+91 98200 11024',
      manager_emp_id: 'emp-1001',
      joining: '2021-05-01',
    },
    {
      emp_id: 'emp-1025',
      code: 'EMP-1025',
      name: 'Aisha Khan',
      email: 'aisha.khan@oasis.io',
      role: 'employee',
      dept: 'dept-sales',
      wp: 'wp-del-cyberhub',
      designation: 'Enterprise Account Executive',
      salary: 160000,
      phone: '+91 98200 11025',
      manager_emp_id: 'emp-1024',
      joining: '2022-03-01',
    },
    {
      emp_id: 'emp-1026',
      code: 'EMP-1026',
      name: 'Liam O’Connor',
      email: 'liam.oconnor@oasis.io',
      role: 'employee',
      dept: 'dept-sales',
      wp: 'wp-blr-techpark',
      designation: 'Business Development Manager',
      salary: 135000,
      phone: '+91 98200 11026',
      manager_emp_id: 'emp-1024',
      joining: '2022-09-01',
    },
    {
      emp_id: 'emp-1027',
      code: 'EMP-1027',
      name: 'Sneha Iyer',
      email: 'sneha.iyer@oasis.io',
      role: 'employee',
      dept: 'dept-sales',
      wp: 'wp-blr-techpark',
      designation: 'Senior Customer Success Manager',
      salary: 140000,
      phone: '+91 98200 11027',
      manager_emp_id: 'emp-1024',
      joining: '2022-11-15',
    },
    {
      emp_id: 'emp-1028',
      code: 'EMP-1028',
      name: 'Gabriel Costa',
      email: 'gabriel.costa@oasis.io',
      role: 'employee',
      dept: 'dept-sales',
      wp: 'wp-mum-bkc',
      designation: 'Client Solutions Engineer',
      salary: 145000,
      phone: '+91 98200 11028',
      manager_emp_id: 'emp-1024',
      joining: '2023-04-01',
    },
  ];

  // Try creating Auth users (or retrieve UID)
  for (const u of usersData) {
    let authUid = u.emp_id;
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, DEFAULT_PASSWORD);
      authUid = cred.user.uid;
      await updateProfile(cred.user, { displayName: u.name });
      console.log(`  ✓ Auth created: ${u.email} (${authUid})`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        try {
          const cred = await signInWithEmailAndPassword(auth, u.email, DEFAULT_PASSWORD);
          authUid = cred.user.uid;
          console.log(`  ✓ Auth exists (logged in): ${u.email} (${authUid})`);
        } catch {
          console.log(`  ℹ Auth exists: ${u.email}`);
        }
      } else {
        console.log(`  ℹ User record: ${u.email}`);
      }
    }

    // Write Profile Document (keyed by authUid and emp_id alias)
    const imgIndex = (usersData.indexOf(u) % 68) + 1;
    const profileDoc = {
      id: authUid,
      organization_id: ORG_ID,
      full_name: u.name,
      email: u.email,
      phone: u.phone,
      avatar_url: `https://i.pravatar.cc/150?img=${imgIndex}`,
      role: u.role,
      is_active: true,
      created_at: new Date(u.joining).toISOString(),
      updated_at: new Date().toISOString(),
    };
    await setDoc(doc(db, 'profiles', authUid), profileDoc);
    if (authUid !== u.emp_id) {
      await setDoc(doc(db, 'profiles', u.emp_id), { ...profileDoc, id: u.emp_id });
    }

    // Write Employee Document
    const empDoc = {
      id: u.emp_id,
      profile_id: authUid,
      employee_code: u.code,
      department_id: u.dept,
      designation: u.designation,
      joining_date: u.joining,
      workplace_id: u.wp,
      manager_id: u.manager_emp_id,
      basic_salary: u.salary,
      employment_status: 'active',
      created_at: new Date(u.joining).toISOString(),
      updated_at: new Date().toISOString(),
    };
    await setDoc(doc(db, 'employees', u.emp_id), empDoc);
  }

  // Update Department Managers
  console.log('👔 Updating Department Heads...');
  const deptManagers = {
    'dept-exec': 'emp-1001',
    'dept-eng': 'emp-1007',
    'dept-prod': 'emp-1015',
    'dept-hr': 'emp-1003',
    'dept-fin': 'emp-1018',
    'dept-mkt': 'emp-1021',
    'dept-sales': 'emp-1024',
  };
  for (const [dId, mId] of Object.entries(deptManagers)) {
    await setDoc(doc(db, 'departments', dId), { manager_id: mId }, { merge: true });
  }

  // 6. Seed Leave Balances for all 28 employees
  console.log('⚖️ 6. Seeding Leave Balances (196 quotas)...');
  const currentYear = 2026;
  for (const u of usersData) {
    for (const lt of leaveTypes) {
      const balId = `${u.emp_id}_${lt.id}_${currentYear}`;
      const usedDays = lt.id === 'lt-annual' ? Math.floor(Math.random() * 6) : lt.id === 'lt-sick' ? Math.floor(Math.random() * 3) : 0;
      await setDoc(doc(db, 'leave_balances', balId), {
        id: balId,
        organization_id: ORG_ID,
        employee_id: u.emp_id,
        leave_type_id: lt.id,
        year: currentYear,
        allocated_days: lt.annual_days,
        used_days: usedDays,
        remaining_days: Math.max(0, lt.annual_days - usedDays),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  // 7. Seed Leave Requests
  console.log('📝 7. Seeding Leave Requests (25 records)...');
  const sampleRequests = [
    { emp: 'emp-1007', lt: 'lt-annual', start: '2026-08-25', end: '2026-08-28', days: 4, status: 'pending', reason: 'Family summer vacation travel' },
    { emp: 'emp-1009', lt: 'lt-sick', start: '2026-08-18', end: '2026-08-19', days: 2, status: 'approved', reason: 'Viral fever and doctor consultation' },
    { emp: 'emp-1011', lt: 'lt-casual', start: '2026-08-29', end: '2026-08-29', days: 1, status: 'pending', reason: 'Personal errands & bank appointment' },
    { emp: 'emp-1014', lt: 'lt-annual', start: '2026-09-01', end: '2026-09-05', days: 5, status: 'pending', reason: 'Annual trekking trip' },
    { emp: 'emp-1016', lt: 'lt-comp', start: '2026-08-10', end: '2026-08-10', days: 1, status: 'approved', reason: 'Comp off for weekend system release' },
    { emp: 'emp-1017', lt: 'lt-annual', start: '2026-08-12', end: '2026-08-14', days: 3, status: 'approved', reason: 'Attending design conference' },
    { emp: 'emp-1022', lt: 'lt-casual', start: '2026-08-21', end: '2026-08-21', days: 1, status: 'approved', reason: 'Relocating apartment' },
    { emp: 'emp-1025', lt: 'lt-sick', start: '2026-08-04', end: '2026-08-05', days: 2, status: 'approved', reason: 'Medical appointment' },
    { emp: 'emp-1026', lt: 'lt-annual', start: '2026-08-30', end: '2026-09-03', days: 4, status: 'pending', reason: 'Sister wedding celebrations' },
    { emp: 'emp-1027', lt: 'lt-casual', start: '2026-08-14', end: '2026-08-14', days: 1, status: 'approved', reason: 'Family gathering' },
    { emp: 'emp-1010', lt: 'lt-annual', start: '2026-07-20', end: '2026-07-22', days: 3, status: 'approved', reason: 'Mid-year break' },
    { emp: 'emp-1012', lt: 'lt-sick', start: '2026-08-11', end: '2026-08-11', days: 1, status: 'rejected', reason: 'Short notice request' },
  ];

  for (let i = 0; i < sampleRequests.length; i++) {
    const r = sampleRequests[i];
    const reqId = `req-${1000 + i}`;
    await setDoc(doc(db, 'leave_requests', reqId), {
      id: reqId,
      organization_id: ORG_ID,
      employee_id: r.emp,
      leave_type_id: r.lt,
      start_date: r.start,
      end_date: r.end,
      days: r.days,
      is_half_day: r.days === 0.5,
      status: r.status,
      reason: r.reason,
      created_at: new Date(r.start).toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 8. Seed Attendance Logs (~150 records across recent days)
  console.log('⏱️ 8. Seeding Attendance Logs (150+ check-in events)...');
  const recentDates = [
    '2026-08-21',
    '2026-08-20',
    '2026-08-19',
    '2026-08-18',
    '2026-08-15',
    '2026-08-14',
    '2026-08-13',
  ];

  for (const dateStr of recentDates) {
    for (const u of usersData.slice(0, 20)) {
      const attId = `att_${u.emp_id}_${dateStr}`;
      const isLate = Math.random() < 0.2;
      const clockInHour = isLate ? 9 : 8;
      const clockInMin = isLate ? 35 : Math.floor(45 + Math.random() * 14);
      const clockInTime = `${dateStr}T0${clockInHour}:${clockInMin < 10 ? '0' : ''}${clockInMin}:00Z`;
      const clockOutTime = `${dateStr}T18:15:00Z`;
      const workingMins = Math.floor(480 + Math.random() * 60);

      await setDoc(doc(db, 'attendance', attId), {
        id: attId,
        organization_id: ORG_ID,
        employee_id: u.emp_id,
        date: dateStr,
        clock_in: clockInTime,
        clock_out: clockOutTime,
        clock_in_latitude: 12.9352,
        clock_in_longitude: 77.6946,
        clock_out_latitude: 12.9352,
        clock_out_longitude: 77.6946,
        working_minutes: workingMins,
        status: isLate ? 'late' : 'present',
        created_at: clockInTime,
        updated_at: clockOutTime,
      });
    }
  }

  // 9. Seed Payroll and Payslips (2 Months for all employees)
  console.log('💰 9. Seeding Payroll Cycles & Payslips (56 statements)...');
  const monthsToSeed = [
    { month: 7, year: 2026, periodId: 'pay-2026-07' },
    { month: 8, year: 2026, periodId: 'pay-2026-08' },
  ];

  for (const m of monthsToSeed) {
    for (const u of usersData) {
      const payrollId = `payroll_${u.emp_id}_${m.year}_${m.month}`;
      const payslipId = `ps_${u.emp_id}_${m.year}_${m.month}`;

      const basic = u.salary;
      const hra = Math.round(basic * 0.4);
      const special = Math.round(basic * 0.2);
      const pf = Math.round(basic * 0.12);
      const pt = 200;
      const tds = Math.round(basic * 0.1);
      const gross = basic + hra + special;
      const net = gross - (pf + pt + tds);

      const payrollData = {
        id: payrollId,
        organization_id: ORG_ID,
        employee_id: u.emp_id,
        payroll_period_id: m.periodId,
        basic_salary: basic,
        allowances: {
          house_rent_allowance: hra,
          special_allowance: special,
          internet_reimbursement: 2500,
        },
        deductions: {
          provident_fund: pf,
          professional_tax: pt,
          tax_deducted_at_source: tds,
        },
        gross_salary: gross + 2500,
        net_salary: net + 2500,
        lop_days: 0,
        lop_amount: 0,
        status: 'paid',
        created_at: new Date(m.year, m.month - 1, 28).toISOString(),
        updated_at: new Date(m.year, m.month - 1, 28).toISOString(),
      };
      await setDoc(doc(db, 'payroll', payrollId), payrollData);

      const payslipData = {
        id: payslipId,
        organization_id: ORG_ID,
        payroll_id: payrollId,
        employee_id: u.emp_id,
        payslip_number: `PS-${m.year}${m.month < 10 ? '0' : ''}${m.month}-${u.code.split('-')[1]}`,
        period_month: m.month,
        period_year: m.year,
        file_url: null,
        created_at: new Date(m.year, m.month - 1, 28).toISOString(),
        payroll: payrollData,
      };
      await setDoc(doc(db, 'payslips', payslipId), payslipData);
    }
  }

  // 10. Seed Audit Logs
  console.log('🛡️ 10. Seeding Security Audit Logs...');
  const auditLogs = [
    { action: 'organization_setup', entity: 'organization', text: 'Initialized Oasis Technologies Enterprise Suite' },
    { action: 'workplaces_configured', entity: 'workplace', text: 'Configured 3 primary corporate geofenced offices' },
    { action: 'departments_established', entity: 'department', text: 'Established 7 core departments and appointed department heads' },
    { action: 'batch_users_onboarded', entity: 'profile', text: 'Provisioned 28 employee and executive accounts' },
    { action: 'payroll_disbursed', entity: 'payroll', text: 'Successfully disbursed July 2026 and August 2026 payroll cycles' },
    { action: 'leave_policy_activated', entity: 'leave_types', text: 'Activated standard paid and parental leave quotas' },
  ];

  for (let i = 0; i < auditLogs.length; i++) {
    const l = auditLogs[i];
    const logId = `log-${Date.now()}-${i}`;
    await setDoc(doc(db, 'audit_logs', logId), {
      id: logId,
      organization_id: ORG_ID,
      user_id: 'emp-1001',
      action: l.action,
      entity_type: l.entity,
      entity_id: ORG_ID,
      metadata: { description: l.text },
      created_at: new Date(Date.now() - (auditLogs.length - i) * 86400000).toISOString(),
    });
  }

  console.log('\n🎉 ALL 28 USERS AND COMPLETE ENTERPRISE DATA SUCCESSFULLY SEEDED INTO FIREBASE!');
  console.log('───────────────────────────────────────────────────────────────────');
  console.log('🔑 Ready-to-use Login Credentials (Password for all: Password@123):');
  console.log('   👑 Administrator:  admin@oasis.io       (Alexander Wright)');
  console.log('   👩‍💼 HR Manager:     hr@oasis.io          (Sarah Jenkins)');
  console.log('   👨‍💻 Employee:       employee@oasis.io    (Jordan Lee)');
  console.log('   + 25 more team members across Engineering, Product, Finance, Marketing, Sales');
  console.log('───────────────────────────────────────────────────────────────────\n');
}

main().catch((err) => {
  console.error('❌ Seeding Error:', err);
  process.exit(1);
});
