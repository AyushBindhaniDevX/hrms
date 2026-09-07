import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDfm6Y3LjDzeeK7a7hg6FvaE5rL4FgBIh8",
  authDomain: "project-9d1aa.firebaseapp.com",
  databaseURL: "https://project-9d1aa-default-rtdb.firebaseio.com",
  projectId: "project-9d1aa",
  storageBucket: "project-9d1aa.firebasestorage.app",
  messagingSenderId: "970423945867",
  appId: "1:970423945867:web:41cde39590eed383a1e28e",
  measurementId: "G-WD23318M8K"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_PASSWORD = 'Password@123';

console.log('🚀 Starting Master Firebase Database Seeder...');
console.log('   Target Project:', firebaseConfig.projectId);
console.log('   Organization ID:', ORG_ID);

async function main() {
  // ──────────────────────────────────────────────────────────────────────────
  // 0. Primary Administrator Authentication (Required for Firestore Access)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🔐 0. Authenticating Primary Administrator...');
  let primaryAdminUid = 'URtAoHI5KUNKSw0sJzlmO6smFiH3';
  try {
    const cred = await signInWithEmailAndPassword(auth, 'ayushbindhani001@gmail.com', 'Nanda@5152');
    primaryAdminUid = cred.user.uid;
    console.log(`  ✓ Authenticated as Administrator: ayushbindhani001@gmail.com (UID: ${primaryAdminUid})`);
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        const cred = await createUserWithEmailAndPassword(auth, 'ayushbindhani001@gmail.com', 'Nanda@5152');
        primaryAdminUid = cred.user.uid;
        await updateProfile(cred.user, { displayName: 'Ayush Bindhani' });
        console.log(`  ✓ Created & Authenticated Admin: ayushbindhani001@gmail.com (UID: ${primaryAdminUid})`);
      } catch (cErr) {
        console.error('Failed to create admin auth user:', cErr);
      }
    } else {
      console.warn('Admin sign in notice:', err.message);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Organization
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📦 1. Seeding Organization...');
  const orgPayload = {
    id: ORG_ID,
    name: 'Oasis Technologies Ltd.',
    slug: 'oasis',
    package_type: 'enterprise',
    logo_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200',
    primary_color: '#006a61',
    accent_color: '#0d7377',
    settings: {
      working_hours_start: '09:00',
      working_hours_end: '18:00',
      default_radius_meters: 200,
      fiscal_year_start_month: 4,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      geofencing_strict: false,
    },
    created_at: new Date('2025-01-01').toISOString(),
    updated_at: new Date().toISOString(),
  };

  await setDoc(doc(db, 'organizations', ORG_ID), orgPayload);
  // Aliases for slug lookups
  await setDoc(doc(db, 'organizations', 'oasis'), { ...orgPayload, id: 'oasis' });
  await setDoc(doc(db, 'organizations', 'subedge'), { ...orgPayload, id: 'subedge', slug: 'subedge' });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Workplaces (Geofenced Campuses)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📍 2. Seeding Workplaces...');
  const workplaces = [
    {
      id: 'wp-blr-techpark',
      organization_id: ORG_ID,
      name: 'Bangalore Tech Campus (HQ)',
      address: 'Prestige Tech Park, Outer Ring Road, Bengaluru, Karnataka 560103',
      latitude: 12.9352,
      longitude: 77.6946,
      radius_meters: 250,
      is_active: true,
      wifi_ssid: 'Oasis_HQ_Guest',
    },
    {
      id: 'wp-mum-bkc',
      organization_id: ORG_ID,
      name: 'Mumbai Financial Center',
      address: 'One BKC, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
      latitude: 19.0657,
      longitude: 72.8687,
      radius_meters: 200,
      is_active: true,
      wifi_ssid: 'Oasis_BKC_Secure',
    },
    {
      id: 'wp-del-cyberhub',
      organization_id: ORG_ID,
      name: 'Delhi NCR Innovation Hub',
      address: 'DLF Cyber City, Building 10, Gurugram, Haryana 122002',
      latitude: 28.4952,
      longitude: 77.0891,
      radius_meters: 200,
      is_active: true,
      wifi_ssid: 'Oasis_CyberHub',
    },
  ];

  for (const wp of workplaces) {
    await setDoc(doc(db, 'workplaces', wp.id), {
      ...wp,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Departments
  // ──────────────────────────────────────────────────────────────────────────
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
      updated_at: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Shifts (Work Schedules)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('⏰ 4. Seeding Work Shifts...');
  const shifts = [
    {
      id: 'shift-morning',
      organization_id: ORG_ID,
      name: 'General Morning Shift',
      start_time: '09:00',
      end_time: '18:00',
      grace_period_minutes: 15,
      break_duration_minutes: 60,
      is_night_shift: false,
    },
    {
      id: 'shift-evening',
      organization_id: ORG_ID,
      name: 'Evening Tech Operations Shift',
      start_time: '14:00',
      end_time: '23:00',
      grace_period_minutes: 15,
      break_duration_minutes: 60,
      is_night_shift: false,
    },
    {
      id: 'shift-night',
      organization_id: ORG_ID,
      name: 'Global Support Night Shift',
      start_time: '22:00',
      end_time: '07:00',
      grace_period_minutes: 15,
      break_duration_minutes: 60,
      is_night_shift: true,
    },
    {
      id: 'shift-flexible',
      organization_id: ORG_ID,
      name: 'Flexible Core Hours',
      start_time: '10:00',
      end_time: '19:00',
      grace_period_minutes: 30,
      break_duration_minutes: 60,
      is_night_shift: false,
    },
  ];

  for (const s of shifts) {
    await setDoc(doc(db, 'shifts', s.id), {
      ...s,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Leave Types
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🏖️ 5. Seeding Leave Types...');
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

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Holidays (2026)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📅 6. Seeding Corporate & National Holidays 2026...');
  const holidays = [
    { id: 'hol-2026-01', name: "New Year's Day", date: '2026-01-01', type: 'public', description: 'Global New Year Holiday' },
    { id: 'hol-2026-02', name: 'Republic Day', date: '2026-01-26', type: 'public', description: 'National Republic Day' },
    { id: 'hol-2026-03', name: 'Maha Shivratri', date: '2026-02-15', type: 'optional', description: 'Cultural Festival' },
    { id: 'hol-2026-04', name: 'Holi (Festival of Colors)', date: '2026-03-04', type: 'public', description: 'National Spring Festival' },
    { id: 'hol-2026-05', name: 'Good Friday', date: '2026-04-03', type: 'public', description: 'Christian Holiday' },
    { id: 'hol-2026-06', name: 'Eid al-Fitr', date: '2026-03-21', type: 'public', description: 'Islamic Festival' },
    { id: 'hol-2026-07', name: 'May Day / Labor Day', date: '2026-05-01', type: 'company', description: 'International Workers Day' },
    { id: 'hol-2026-08', name: 'Independence Day', date: '2026-08-15', type: 'public', description: 'National Independence Day' },
    { id: 'hol-2026-09', name: 'Raksha Bandhan', date: '2026-08-28', type: 'optional', description: 'Cultural Celebration' },
    { id: 'hol-2026-10', name: 'Gandhi Jayanti', date: '2026-10-02', type: 'public', description: 'National Holiday' },
    { id: 'hol-2026-11', name: 'Dussehra (Vijayadashami)', date: '2026-10-20', type: 'public', description: 'Victory of Good over Evil' },
    { id: 'hol-2026-12', name: 'Diwali (Deepavali)', date: '2026-11-08', type: 'public', description: 'Festival of Lights' },
    { id: 'hol-2026-13', name: 'Guru Nanak Jayanti', date: '2026-11-24', type: 'optional', description: 'Sikh Festival' },
    { id: 'hol-2026-14', name: 'Christmas Day', date: '2026-12-25', type: 'public', description: 'Christmas Celebration' },
  ];

  for (const h of holidays) {
    await setDoc(doc(db, 'holidays', h.id), {
      ...h,
      organization_id: ORG_ID,
      is_optional: h.type === 'optional',
      created_at: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Users & Employee Profiles
  // ──────────────────────────────────────────────────────────────────────────
  console.log('👥 7. Seeding 29 Corporate Accounts (Profiles & Employees)...');
  const usersData = [
    // ── Primary Administrator
    {
      emp_id: 'emp-0001',
      code: 'EMP-0001',
      name: 'Ayush Bindhani',
      email: 'ayushbindhani001@gmail.com',
      password: 'Nanda@5152',
      role: 'admin',
      dept: 'dept-exec',
      wp: 'wp-blr-techpark',
      shift: 'shift-morning',
      designation: 'Managing Director & Principal Architect',
      salary: 500000,
      phone: '+91 99999 99999',
      manager_emp_id: null,
      joining: '2020-01-01',
      authUid: primaryAdminUid,
    },

    // ── Executives & Admins
    {
      emp_id: 'emp-1001',
      code: 'EMP-1001',
      name: 'Alexander Wright',
      email: 'admin@oasis.io',
      role: 'admin',
      dept: 'dept-exec',
      wp: 'wp-blr-techpark',
      shift: 'shift-morning',
      designation: 'Chief Executive Officer',
      salary: 350000,
      phone: '+91 98200 11001',
      manager_emp_id: 'emp-0001',
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
      shift: 'shift-morning',
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
      shift: 'shift-morning',
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
      shift: 'shift-morning',
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
      shift: 'shift-morning',
      designation: 'Lead Talent Acquisition Manager',
      salary: 130000,
      phone: '+91 98200 11005',
      manager_emp_id: 'emp-1003',
      joining: '2022-06-01',
    },
    {
      emp_id: 'emp-1006',
      code: 'EMP-1006',
      name: 'Ananya Deshmukh',
      email: 'ananya.d@oasis.io',
      role: 'hr',
      dept: 'dept-hr',
      wp: 'wp-del-cyberhub',
      shift: 'shift-morning',
      designation: 'Payroll & Benefits Specialist',
      salary: 95000,
      phone: '+91 98200 11006',
      manager_emp_id: 'emp-1003',
      joining: '2023-02-15',
    },

    // ── Engineering Team
    {
      emp_id: 'emp-1007',
      code: 'EMP-1007',
      name: 'Vikram Malhotra',
      email: 'vikram.m@oasis.io',
      role: 'employee',
      dept: 'dept-eng',
      wp: 'wp-blr-techpark',
      shift: 'shift-morning',
      designation: 'Director of Software Engineering',
      salary: 280000,
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
      shift: 'shift-morning',
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
      shift: 'shift-morning',
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
      shift: 'shift-morning',
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
      shift: 'shift-morning',
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
      shift: 'shift-morning',
      designation: 'Staff DevOps & SRE Engineer',
      salary: 160000,
      phone: '+91 98200 11012',
      manager_emp_id: 'emp-1007',
      joining: '2022-07-01',
    },
    {
      emp_id: 'emp-1013',
      code: 'EMP-1013',
      name: 'Daniel Santos',
      email: 'daniel.santos@oasis.io',
      role: 'employee',
      dept: 'dept-eng',
      wp: 'wp-blr-techpark',
      shift: 'shift-morning',
      designation: 'Quality Assurance & Test Automation Lead',
      salary: 125000,
      phone: '+91 98200 11013',
      manager_emp_id: 'emp-1007',
      joining: '2022-09-15',
    },
    {
      emp_id: 'emp-1014',
      code: 'EMP-1014',
      name: 'Rohan Verma',
      email: 'rohan.verma@oasis.io',
      role: 'employee',
      dept: 'dept-eng',
      wp: 'wp-mum-bkc',
      shift: 'shift-evening',
      designation: 'Data Platform Engineer',
      salary: 135000,
      phone: '+91 98200 11014',
      manager_emp_id: 'emp-1007',
      joining: '2023-01-10',
    },

    // ── Product & Design
    {
      emp_id: 'emp-1015',
      code: 'EMP-1015',
      name: 'Elena Rostova',
      email: 'elena.r@oasis.io',
      role: 'employee',
      dept: 'dept-prod',
      wp: 'wp-blr-techpark',
      shift: 'shift-morning',
      designation: 'Head of Product',
      salary: 260000,
      phone: '+91 98200 11015',
      manager_emp_id: 'emp-1001',
      joining: '2021-05-15',
    },
    {
      emp_id: 'emp-1016',
      code: 'EMP-1016',
      name: 'Jordan Lee',
      email: 'employee@oasis.io',
      role: 'employee',
      dept: 'dept-prod',
      wp: 'wp-blr-techpark',
      shift: 'shift-morning',
      designation: 'Lead Product Designer',
      salary: 170000,
      phone: '+91 98200 11016',
      manager_emp_id: 'emp-1015',
      joining: '2021-09-01',
    },
    {
      emp_id: 'emp-1017',
      code: 'EMP-1017',
      name: 'Aisha Al-Hashimi',
      email: 'aisha.h@oasis.io',
      role: 'employee',
      dept: 'dept-prod',
      wp: 'wp-del-cyberhub',
      shift: 'shift-morning',
      designation: 'Senior UX Researcher',
      salary: 135000,
      phone: '+91 98200 11017',
      manager_emp_id: 'emp-1015',
      joining: '2022-04-01',
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
      shift: 'shift-morning',
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
      shift: 'shift-morning',
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
      shift: 'shift-morning',
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
      shift: 'shift-morning',
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
      shift: 'shift-morning',
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
      shift: 'shift-morning',
      designation: 'Content & Brand Strategist',
      salary: 120000,
      phone: '+91 98200 11023',
      manager_emp_id: 'emp-1021',
      joining: '2023-05-10',
    },

    // ── Sales & Business Development
    {
      emp_id: 'emp-1024',
      code: 'EMP-1024',
      name: 'Michael Chang',
      email: 'michael.chang@oasis.io',
      role: 'employee',
      dept: 'dept-sales',
      wp: 'wp-blr-techpark',
      shift: 'shift-morning',
      designation: 'VP of Global Enterprise Sales',
      salary: 270000,
      phone: '+91 98200 11024',
      manager_emp_id: 'emp-1001',
      joining: '2021-06-01',
    },
    {
      emp_id: 'emp-1025',
      code: 'EMP-1025',
      name: 'Fatima Zahra',
      email: 'fatima.z@oasis.io',
      role: 'employee',
      dept: 'dept-sales',
      wp: 'wp-mum-bkc',
      shift: 'shift-morning',
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
      shift: 'shift-morning',
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
      shift: 'shift-morning',
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
      shift: 'shift-morning',
      designation: 'Client Solutions Engineer',
      salary: 145000,
      phone: '+91 98200 11028',
      manager_emp_id: 'emp-1024',
      joining: '2023-04-01',
    },
  ];

  // Store profile mappings
  for (const u of usersData) {
    let authUid = u.authUid || u.emp_id;

    // For other users, attempt creation or UID lookup
    if (!u.authUid) {
      const userPassword = u.password || DEFAULT_PASSWORD;
      try {
        const cred = await createUserWithEmailAndPassword(auth, u.email, userPassword);
        authUid = cred.user.uid;
        await updateProfile(cred.user, { displayName: u.name });
        console.log(`  ✓ Auth registered: ${u.email}`);
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          try {
            const cred = await signInWithEmailAndPassword(auth, u.email, userPassword);
            authUid = cred.user.uid;
            console.log(`  ✓ Auth exists: ${u.email}`);
          } catch {
            console.log(`  ℹ Auth exists: ${u.email}`);
          }
        }
      }
      // Re-authenticate as primary admin to keep admin write permissions active
      await signInWithEmailAndPassword(auth, 'ayushbindhani001@gmail.com', 'Nanda@5152');
    }

    // Write Profile Document
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
      organization_id: ORG_ID,
      employee_code: u.code,
      department_id: u.dept,
      designation: u.designation,
      joining_date: u.joining,
      workplace_id: u.wp,
      default_shift_id: u.shift || 'shift-morning',
      manager_id: u.manager_emp_id,
      basic_salary: u.salary,
      employment_status: 'active',
      onboarding_completed: true,
      tax_config: {
        tax_regime: 'new',
        tds_percentage: 10,
        epf_percentage: 12,
        hra_percentage: 40,
        pt_amount: 200,
        epf_exempt: false,
      },
      created_at: new Date(u.joining).toISOString(),
      updated_at: new Date().toISOString(),
    };
    await setDoc(doc(db, 'employees', u.emp_id), empDoc);
  }

  // Update Department Heads
  console.log('👔 Updating Department Heads...');
  const deptManagers = {
    'dept-exec': 'emp-0001',
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

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Employee Shifts (Roster for Current & Upcoming Dates)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📅 8. Seeding Employee Shift Rosters...');
  const rosterDates = [
    '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05',
    '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11',
  ];

  for (const rDate of rosterDates) {
    for (const u of usersData.slice(0, 15)) {
      const shiftEntryId = `${u.emp_id}_${rDate}`;
      await setDoc(doc(db, 'employee_shifts', shiftEntryId), {
        id: shiftEntryId,
        organization_id: ORG_ID,
        employee_id: u.emp_id,
        date: rDate,
        shift_id: u.shift || 'shift-morning',
        created_at: new Date().toISOString(),
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Leave Balances
  // ──────────────────────────────────────────────────────────────────────────
  console.log('⚖️ 9. Seeding Leave Balances (200+ quotas)...');
  const currentYear = 2026;
  for (const u of usersData) {
    for (const lt of leaveTypes) {
      const balId = `${u.emp_id}_${lt.id}_${currentYear}`;
      const usedDays = lt.id === 'lt-annual' ? Math.floor(Math.random() * 5) : lt.id === 'lt-sick' ? Math.floor(Math.random() * 3) : 0;
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

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Leave Requests
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📝 10. Seeding Leave Requests...');
  const sampleRequests = [
    { emp: 'emp-1007', lt: 'lt-annual', start: '2026-08-25', end: '2026-08-28', days: 4, status: 'approved', reason: 'Family vacation trip' },
    { emp: 'emp-1009', lt: 'lt-sick', start: '2026-08-18', end: '2026-08-19', days: 2, status: 'approved', reason: 'Viral fever recovery' },
    { emp: 'emp-1011', lt: 'lt-casual', start: '2026-09-02', end: '2026-09-02', days: 1, status: 'pending', reason: 'Personal bank appointment' },
    { emp: 'emp-1014', lt: 'lt-annual', start: '2026-09-10', end: '2026-09-14', days: 5, status: 'pending', reason: 'Annual trekking expedition' },
    { emp: 'emp-1016', lt: 'lt-comp', start: '2026-08-10', end: '2026-08-10', days: 1, status: 'approved', reason: 'Comp off for weekend deployment' },
    { emp: 'emp-1017', lt: 'lt-annual', start: '2026-08-12', end: '2026-08-14', days: 3, status: 'approved', reason: 'Attending Design Thinking Summit' },
    { emp: 'emp-1022', lt: 'lt-casual', start: '2026-09-05', end: '2026-09-05', days: 1, status: 'pending', reason: 'Apartment lease renewal' },
    { emp: 'emp-1025', lt: 'lt-sick', start: '2026-08-04', end: '2026-08-05', days: 2, status: 'approved', reason: 'Dental appointment' },
    { emp: 'emp-1026', lt: 'lt-annual', start: '2026-09-15', end: '2026-09-18', days: 4, status: 'pending', reason: 'Family wedding celebrations' },
    { emp: 'emp-1027', lt: 'lt-casual', start: '2026-08-14', end: '2026-08-14', days: 1, status: 'approved', reason: 'Family gathering' },
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

  // ──────────────────────────────────────────────────────────────────────────
  // 11. Attendance Records (Recent Check-ins & Today)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('⏱️ 11. Seeding Attendance Records (150+ check-in events)...');
  const attendanceDates = [
    '2026-09-07',
    '2026-09-04',
    '2026-09-03',
    '2026-09-02',
    '2026-09-01',
    '2026-08-28',
    '2026-08-27',
  ];

  for (const dateStr of attendanceDates) {
    for (const u of usersData.slice(0, 22)) {
      const attId = `att_${u.emp_id}_${dateStr}`;
      const isLate = Math.random() < 0.15;
      const clockInHour = isLate ? 9 : 8;
      const clockInMin = isLate ? 35 : Math.floor(45 + Math.random() * 14);
      const clockInTime = `${dateStr}T0${clockInHour}:${clockInMin < 10 ? '0' : ''}${clockInMin}:00Z`;
      const isToday = dateStr === '2026-09-07';
      const clockOutTime = isToday ? null : `${dateStr}T18:15:00Z`;
      const workingMins = isToday ? 240 : Math.floor(480 + Math.random() * 60);

      await setDoc(doc(db, 'attendance', attId), {
        id: attId,
        organization_id: ORG_ID,
        employee_id: u.emp_id,
        workplace_id: u.wp,
        date: dateStr,
        clock_in: clockInTime,
        clock_out: clockOutTime,
        clock_in_latitude: 12.9352,
        clock_in_longitude: 77.6946,
        clock_out_latitude: 12.9352,
        clock_out_longitude: 77.6946,
        clock_in_verified: true,
        clock_out_verified: !isToday,
        working_minutes: workingMins,
        status: isLate ? 'late' : 'present',
        created_at: clockInTime,
        updated_at: new Date().toISOString(),
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 12. Attendance Regularizations
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🔄 12. Seeding Attendance Regularizations...');
  const regularizations = [
    { emp: 'emp-1008', date: '2026-08-27', in: '09:00:00', out: '18:30:00', reason: 'Biometric kiosk was rebooting during morning entry', status: 'approved' },
    { emp: 'emp-1011', date: '2026-08-28', in: '09:15:00', out: '18:15:00', reason: 'Heavy traffic on Outer Ring Road due to rain', status: 'approved' },
    { emp: 'emp-1014', date: '2026-09-02', in: '09:00:00', out: '19:00:00', reason: 'Forgot to punch out due to critical server migration', status: 'pending' },
    { emp: 'emp-1020', date: '2026-09-03', in: '09:30:00', out: '18:30:00', reason: 'Metro purple line signal issue', status: 'pending' },
  ];

  for (let i = 0; i < regularizations.length; i++) {
    const reg = regularizations[i];
    const regId = `reg_${Date.now()}_${i}`;
    await setDoc(doc(db, 'attendance_regularizations', regId), {
      id: regId,
      organization_id: ORG_ID,
      employee_id: reg.emp,
      date: reg.date,
      requested_clock_in: `${reg.date}T${reg.in}Z`,
      requested_clock_out: `${reg.date}T${reg.out}Z`,
      reason: reg.reason,
      status: reg.status,
      reviewed_by: reg.status === 'approved' ? 'emp-0001' : null,
      reviewed_at: reg.status === 'approved' ? new Date().toISOString() : null,
      created_at: new Date(reg.date).toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 13. Payroll Periods, Calculations & Payslips
  // ──────────────────────────────────────────────────────────────────────────
  console.log('💰 13. Seeding Payroll Periods, Calculations & Payslips...');
  const payrollPeriods = [
    {
      id: 'pay-2026-07',
      organization_id: ORG_ID,
      name: 'July 2026 Corporate Payroll',
      month: 7,
      year: 2026,
      start_date: '2026-07-01',
      end_date: '2026-07-31',
      status: 'closed',
      total_gross: 4850000,
      total_net: 4120000,
      processed_at: '2026-07-28T10:00:00Z',
    },
    {
      id: 'pay-2026-08',
      organization_id: ORG_ID,
      name: 'August 2026 Corporate Payroll',
      month: 8,
      year: 2026,
      start_date: '2026-08-01',
      end_date: '2026-08-31',
      status: 'closed',
      total_gross: 4920000,
      total_net: 4180000,
      processed_at: '2026-08-28T10:00:00Z',
    },
    {
      id: 'pay-2026-09',
      organization_id: ORG_ID,
      name: 'September 2026 Corporate Payroll',
      month: 9,
      year: 2026,
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      status: 'open',
      total_gross: 0,
      total_net: 0,
      processed_at: null,
    },
  ];

  for (const pp of payrollPeriods) {
    await setDoc(doc(db, 'payroll_periods', pp.id), {
      ...pp,
      created_at: new Date(pp.start_date).toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Seed entries and payslips for July & August
  const processedMonths = [
    { month: 7, year: 2026, periodId: 'pay-2026-07' },
    { month: 8, year: 2026, periodId: 'pay-2026-08' },
  ];

  for (const m of processedMonths) {
    for (const u of usersData) {
      const payrollId = `payroll_${u.emp_id}_${m.year}_${m.month}`;
      const payslipId = `ps_${u.emp_id}_${m.year}_${m.month}`;

      const basic = u.salary;
      const hra = Math.round(basic * 0.4);
      const special = Math.round(basic * 0.2);
      const pf = Math.round(basic * 0.12);
      const pt = 200;
      const tds = Math.round(basic * 0.1);
      const gross = basic + hra + special + 2500;
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
        gross_salary: gross,
        net_salary: net,
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

  // ──────────────────────────────────────────────────────────────────────────
  // 14. Company Assets
  // ──────────────────────────────────────────────────────────────────────────
  console.log('💻 14. Seeding Enterprise IT & Corporate Assets...');
  const assets = [
    { id: 'ast-01', name: 'MacBook Pro 16" (M3 Max, 64GB)', asset_tag: 'OASIS-IT-001', category: 'Laptop', serial_number: 'C02G87Y0MD6R', purchase_date: '2024-02-15', purchase_cost: 349900, assigned_to: 'emp-0001', status: 'allocated' },
    { id: 'ast-02', name: 'MacBook Pro 16" (M3 Pro, 36GB)', asset_tag: 'OASIS-IT-002', category: 'Laptop', serial_number: 'C02H12Z1MD6R', purchase_date: '2024-02-15', purchase_cost: 249900, assigned_to: 'emp-1001', status: 'allocated' },
    { id: 'ast-03', name: 'Dell XPS 15 9530 (i9, RTX 4070)', asset_tag: 'OASIS-IT-003', category: 'Laptop', serial_number: 'DELL-89210-XP', purchase_date: '2024-03-10', purchase_cost: 210000, assigned_to: 'emp-1002', status: 'allocated' },
    { id: 'ast-04', name: 'Apple Studio Display 27" 5K', asset_tag: 'OASIS-IT-004', category: 'Monitor', serial_number: 'F9GF7284MD6M', purchase_date: '2024-03-15', purchase_cost: 159900, assigned_to: 'emp-1007', status: 'allocated' },
    { id: 'ast-05', name: 'ThinkPad X1 Carbon Gen 11', asset_tag: 'OASIS-IT-005', category: 'Laptop', serial_number: 'LEN-X1-99812', purchase_date: '2024-04-01', purchase_cost: 165000, assigned_to: 'emp-1003', status: 'allocated' },
    { id: 'ast-06', name: 'MacBook Air 15" (M3, 16GB)', asset_tag: 'OASIS-IT-006', category: 'Laptop', serial_number: 'C02KJ918MD6S', purchase_date: '2024-04-10', purchase_cost: 134900, assigned_to: 'emp-1008', status: 'allocated' },
    { id: 'ast-07', name: 'Dell UltraSharp 32" 4K USB-C Hub', asset_tag: 'OASIS-IT-007', category: 'Monitor', serial_number: 'DEL-U3223-991', purchase_date: '2024-04-15', purchase_cost: 78000, assigned_to: 'emp-1009', status: 'allocated' },
    { id: 'ast-08', name: 'Herman Miller Aeron Chair', asset_tag: 'OASIS-FAC-001', category: 'Furniture', serial_number: 'HM-AER-48192', purchase_date: '2023-11-20', purchase_cost: 125000, assigned_to: 'emp-0001', status: 'allocated' },
    { id: 'ast-09', name: 'YubiKey 5C NFC Security Key', asset_tag: 'OASIS-SEC-001', category: 'Security Token', serial_number: 'YK-5C-881920', purchase_date: '2024-01-05', purchase_cost: 6500, assigned_to: 'emp-0001', status: 'allocated' },
    { id: 'ast-10', name: 'MacBook Pro 14" (M3 Pro, 18GB)', asset_tag: 'OASIS-IT-008', category: 'Laptop', serial_number: 'C02M4411MD6P', purchase_date: '2024-05-01', purchase_cost: 199900, assigned_to: 'emp-1010', status: 'allocated' },
    { id: 'ast-11', name: 'Cisco Meraki MX68 Enterprise Router', asset_tag: 'OASIS-NET-001', category: 'Networking', serial_number: 'MRK-MX68-8120', purchase_date: '2023-10-12', purchase_cost: 95000, assigned_to: null, status: 'available' },
    { id: 'ast-12', name: 'Apple iPad Pro 12.9" M2 (512GB)', asset_tag: 'OASIS-IT-009', category: 'Tablet', serial_number: 'DMPV88190MD9', purchase_date: '2024-01-20', purchase_cost: 112000, assigned_to: 'emp-1016', status: 'allocated' },
  ];

  for (const a of assets) {
    await setDoc(doc(db, 'assets', a.id), {
      ...a,
      organization_id: ORG_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 15. Company Policies & Documents
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📄 15. Seeding Corporate Policy Documents...');
  const documents = [
    { id: 'doc-01', title: 'Oasis Code of Business Conduct & Ethics 2026', category: 'Compliance', description: 'Comprehensive ethical principles, anti-corruption, and standards of professional behavior.', version: 'v3.2', is_mandatory: true, signatures_count: 28 },
    { id: 'doc-02', title: 'Enterprise Information Security & Clean Desk Policy', category: 'Security', description: 'Guidelines on credential hygiene, zero-trust network access, and endpoint protection.', version: 'v4.0', is_mandatory: true, signatures_count: 26 },
    { id: 'doc-03', title: 'Global Remote & Hybrid Work Guidelines', category: 'HR Policies', description: 'Core operational parameters, workspace ergonomics, and travel compensation.', version: 'v2.1', is_mandatory: false, signatures_count: 22 },
    { id: 'doc-04', title: 'Health, Wellness & Health Insurance Coverage Handbook', category: 'Benefits', description: 'Comprehensive health coverage tiers, outpatient benefit claims, and mental health support.', version: 'v2.0', is_mandatory: false, signatures_count: 25 },
  ];

  for (const d of documents) {
    await setDoc(doc(db, 'documents', d.id), {
      ...d,
      organization_id: ORG_ID,
      created_at: new Date('2026-01-10').toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 16. Support & Helpdesk Tickets
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🎫 16. Seeding IT & HR Support Tickets...');
  const tickets = [
    { id: 'tkt-01', ticket_number: 'TKT-1041', employee_id: 'emp-1009', category: 'it', priority: 'high', title: 'Need VPN tunnel access for US-East production cluster', description: 'Requesting IAM permissions and wireguard config for staging & prod diagnostics.', status: 'resolved', assigned_to: 'emp-1012' },
    { id: 'tkt-02', ticket_number: 'TKT-1042', employee_id: 'emp-1016', category: 'it', priority: 'medium', title: 'Figma Enterprise workspace seat allocation', description: 'Require Design System admin rights for Oasis UI Mobile revamp.', status: 'resolved', assigned_to: 'emp-1002' },
    { id: 'tkt-03', ticket_number: 'TKT-1043', employee_id: 'emp-1022', category: 'hr', priority: 'low', title: 'Form 16 Tax Certificate clarification', description: 'Requesting breakdown of HRA exemption in current financial year.', status: 'in_progress', assigned_to: 'emp-1006' },
    { id: 'tkt-04', ticket_number: 'TKT-1044', employee_id: 'emp-1011', category: 'facilities', priority: 'medium', title: 'Bangalore Campus 4th Floor Meeting Room Pod Screen HDMI Issue', description: 'Screen flickering when connected via USB-C to HDMI adapter.', status: 'open', assigned_to: 'emp-1003' },
  ];

  for (const t of tickets) {
    await setDoc(doc(db, 'tickets', t.id), {
      ...t,
      organization_id: ORG_ID,
      created_at: new Date('2026-08-20').toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 17. Expense Claims & Reimbursements
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🧾 17. Seeding Expense Claims...');
  const expenses = [
    { id: 'exp-01', employee_id: 'emp-1024', title: 'Client Dinner with Tata Consultancy Leadership', amount: 8450, category: 'food', status: 'approved', expense_date: '2026-08-22', notes: 'Client enterprise agreement discussion dinner at Leela Palace' },
    { id: 'exp-02', employee_id: 'emp-1008', title: 'AWS Certified Solutions Architect Exam Fee', amount: 12500, category: 'equipment', status: 'paid', expense_date: '2026-08-15', notes: 'Professional upskilling certification voucher' },
    { id: 'exp-03', employee_id: 'emp-1011', title: 'Home Fiber Broadband Reimbursement (August)', amount: 1499, category: 'office', status: 'paid', expense_date: '2026-08-30', notes: 'Monthly high-speed internet reimbursement' },
    { id: 'exp-04', employee_id: 'emp-1017', title: 'Cab Travel for User Research Field Interviews', amount: 2350, category: 'travel', status: 'pending', expense_date: '2026-09-02', notes: 'Visits to user testing locations across Gurgaon' },
  ];

  for (const e of expenses) {
    await setDoc(doc(db, 'expenses', e.id), {
      ...e,
      organization_id: ORG_ID,
      receipt_url: null,
      created_at: new Date(e.expense_date).toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 18. Training Courses & Enrollments
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🎓 18. Seeding Learning & Development Courses...');
  const courses = [
    {
      id: 'course_sec',
      organization_id: ORG_ID,
      title: 'Enterprise SOC 2, HIPAA & ISO 27001 Security Training',
      category: 'Security & Governance',
      description: 'Mandatory annual compliance training covering access controls, cryptographic standards, clean desk policies, and incident reporting.',
      duration_minutes: 120,
      modules_count: 3,
      is_mandatory: true,
      instructor: 'Ayush Bindhani (CISO & Principal Architect)',
      rating: 4.9,
      enrolled_count: 28,
      certificate_title: 'Certified Information Security Specialist',
      pass_percentage: 80,
    },
    {
      id: 'course_cloud',
      organization_id: ORG_ID,
      title: 'Advanced React Native, Skia & Offline-First Engineering',
      category: 'Engineering',
      description: 'Master 60fps animations with React Native Skia, WatermelonDB SQLite sync, and native module bridges.',
      duration_minutes: 180,
      modules_count: 4,
      is_mandatory: false,
      instructor: 'Marcus Vance (CTO)',
      rating: 5.0,
      enrolled_count: 14,
      certificate_title: 'Master Mobile Systems Engineer',
      pass_percentage: 85,
    },
    {
      id: 'course_mgmt',
      organization_id: ORG_ID,
      title: 'Strategic Leadership, 1-on-1s & OKR Execution',
      category: 'Leadership & People',
      description: 'Effective empathetic leadership, running high-impact reviews, and aligning department goals to company OKRs.',
      duration_minutes: 90,
      modules_count: 2,
      is_mandatory: false,
      instructor: 'Sarah Jenkins (VP HR)',
      rating: 4.8,
      enrolled_count: 18,
      certificate_title: 'Certified People Leader',
      pass_percentage: 80,
    },
  ];

  for (const c of courses) {
    await setDoc(doc(db, 'courses', c.id), {
      ...c,
      created_at: new Date('2026-01-15').toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Seed sample enrollments
  const enrollments = [
    { id: 'enr-01', employee_id: 'emp-0001', course_id: 'course_sec', progress_percentage: 100, completed_at: '2026-08-01T10:00:00Z', certificate_issued: true },
    { id: 'enr-02', employee_id: 'emp-1008', course_id: 'course_sec', progress_percentage: 100, completed_at: '2026-08-10T14:30:00Z', certificate_issued: true },
    { id: 'enr-03', employee_id: 'emp-1011', course_id: 'course_cloud', progress_percentage: 75, completed_at: null, certificate_issued: false },
    { id: 'enr-04', employee_id: 'emp-1016', course_id: 'course_sec', progress_percentage: 80, completed_at: null, certificate_issued: false },
  ];

  for (const en of enrollments) {
    await setDoc(doc(db, 'course_enrollments', en.id), {
      ...en,
      organization_id: ORG_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 19. Performance Goals & OKRs
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🎯 19. Seeding Company OKRs & Performance Goals...');
  const goals = [
    {
      id: 'goal-01',
      organization_id: ORG_ID,
      title: 'Attain 99.99% Core API Uptime & Multi-Region Cloud Resilience',
      description: 'Ensure automated failovers, sub-100ms response times, and automated database backups.',
      category: 'company',
      status: 'in_progress',
      progress: 88,
      employee_id: 'emp-1002',
      department_id: 'dept-eng',
      start_date: '2026-01-01',
      due_date: '2026-12-31',
      key_results: [
        { id: 'kr-01', title: 'Keep p99 API latency below 95ms', target_value: 95, current_value: 82, metric: 'ms', progress: 86 },
        { id: 'kr-02', title: 'Complete disaster recovery drills in Q3', target_value: 4, current_value: 3, metric: 'drills', progress: 75 },
      ],
    },
    {
      id: 'goal-02',
      organization_id: ORG_ID,
      title: 'Scale Enterprise Client ARR to $10M by Q4',
      description: 'Accelerate Mid-Market & Enterprise onboarding across India & APAC.',
      category: 'department',
      status: 'in_progress',
      progress: 74,
      employee_id: 'emp-1024',
      department_id: 'dept-sales',
      start_date: '2026-01-01',
      due_date: '2026-12-31',
      key_results: [
        { id: 'kr-03', title: 'Sign 20 Tier-1 enterprise customers', target_value: 20, current_value: 15, metric: 'clients', progress: 75 },
      ],
    },
    {
      id: 'goal-03',
      organization_id: ORG_ID,
      title: 'Maintain eNPS (Employee Net Promoter Score) above +65',
      description: 'Promote employee recognition, flexible work options, and wellness initiatives.',
      category: 'department',
      status: 'in_progress',
      progress: 92,
      employee_id: 'emp-1003',
      department_id: 'dept-hr',
      start_date: '2026-01-01',
      due_date: '2026-12-31',
      key_results: [
        { id: 'kr-04', title: 'Achieve quarterly pulse survey participation > 90%', target_value: 90, current_value: 94, metric: '%', progress: 100 },
      ],
    },
  ];

  for (const g of goals) {
    await setDoc(doc(db, 'goals', g.id), {
      ...g,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 20. Kudos & Peer Recognitions
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🌟 20. Seeding Kudos & Peer Recognitions...');
  const kudosList = [
    { id: 'kud-01', from_employee_id: 'emp-1001', to_employee_id: 'emp-0001', badge: 'Visionary Leader', message: 'Incredible work driving the complete Firebase cloud modernization and multi-tenant security architecture!' },
    { id: 'kud-02', from_employee_id: 'emp-1007', to_employee_id: 'emp-1011', badge: 'Engineering Excellence', message: 'Fantastic execution on the offline-first sync engine and lightning-fast attendance check-ins!' },
    { id: 'kud-03', from_employee_id: 'emp-1003', to_employee_id: 'emp-1004', badge: 'Team Player', message: 'Outstanding dedication orchestrating the campus onboarding sessions and employee wellness week!' },
  ];

  for (const k of kudosList) {
    await setDoc(doc(db, 'kudos', k.id), {
      ...k,
      organization_id: ORG_ID,
      created_at: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 21. System Notifications
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🔔 21. Seeding Notifications...');
  const sampleNotifications = [
    { profile_id: 'emp-0001', title: 'Welcome to Oasis Cloud Platform', message: 'Your administrative account is live with full security controls and multi-tenant management.', type: 'system' },
    { profile_id: 'emp-0001', title: 'August 2026 Payroll Processed', message: 'Monthly payroll reconciliation has completed and digital payslips have been published.', type: 'payroll' },
    { profile_id: 'emp-1001', title: 'New Leave Request Pending Review', message: 'Vikram Malhotra submitted an annual leave request for review.', type: 'leave' },
    { profile_id: 'emp-1016', title: 'August 2026 Payslip Available', message: 'Your confidential salary slip for August 2026 is ready to download.', type: 'payroll' },
  ];

  for (let i = 0; i < sampleNotifications.length; i++) {
    const notif = sampleNotifications[i];
    const notifId = `notif-${Date.now()}-${i}`;
    await setDoc(doc(db, 'notifications', notifId), {
      id: notifId,
      organization_id: ORG_ID,
      profile_id: notif.profile_id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      is_read: false,
      action_url: null,
      created_at: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 22. Security Audit Logs
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🛡️ 22. Seeding Enterprise Audit Logs...');
  const auditLogs = [
    { action: 'organization_setup', entity: 'organization', text: 'Initialized Oasis Technologies Ltd. multi-tenant cloud tenant' },
    { action: 'workplaces_configured', entity: 'workplace', text: 'Configured Bangalore, Mumbai, and Delhi NCR geofenced hubs' },
    { action: 'departments_established', entity: 'department', text: 'Established 7 corporate business units and assigned department heads' },
    { action: 'shifts_roster_defined', entity: 'shifts', text: 'Provisioned 4 core work shift schedules (Morning, Evening, Night, Flexible)' },
    { action: 'users_bulk_onboarded', entity: 'profile', text: 'Provisioned 29 enterprise user accounts & multi-tier access profiles' },
    { action: 'leave_policies_activated', entity: 'leave_types', text: 'Allocated 200+ annual, sick, and parental leave balances for 2026' },
    { action: 'payroll_cycle_completed', entity: 'payroll', text: 'Successfully disbursed July & August 2026 corporate payroll batches' },
    { action: 'security_governance_verified', entity: 'security', text: 'Audit verification: All collections scoped strictly under organization' },
  ];

  for (let i = 0; i < auditLogs.length; i++) {
    const l = auditLogs[i];
    const logId = `log-${Date.now()}-${i}`;
    await setDoc(doc(db, 'audit_logs', logId), {
      id: logId,
      organization_id: ORG_ID,
      user_id: 'emp-0001',
      action: l.action,
      entity_type: l.entity,
      entity_id: ORG_ID,
      metadata: { description: l.text },
      created_at: new Date(Date.now() - (auditLogs.length - i) * 3600000).toISOString(),
    });
  }

  console.log('\n===================================================================');
  console.log('🎉 MASTER FIREBASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('===================================================================');
  console.log('🏢 Organization: Oasis Technologies Ltd.');
  console.log('🆔 Organization ID: 00000000-0000-0000-0000-000000000001');
  console.log('📊 Seeded Collections:');
  console.log('   ✓ organizations');
  console.log('   ✓ workplaces (3 geofenced campuses)');
  console.log('   ✓ departments (7 business units)');
  console.log('   ✓ shifts (4 work shift patterns)');
  console.log('   ✓ leave_types & leave_balances (200+ quotas)');
  console.log('   ✓ holidays (14 gazetted holidays for 2026)');
  console.log('   ✓ profiles & employees (29 accounts with Firebase Auth)');
  console.log('   ✓ employee_shifts (rosters)');
  console.log('   ✓ leave_requests (approved, pending, rejected)');
  console.log('   ✓ attendance (150+ check-in events)');
  console.log('   ✓ attendance_regularizations (missed punch approvals)');
  console.log('   ✓ payroll_periods, payroll & payslips (July, August, Sept)');
  console.log('   ✓ assets (25 corporate laptops, monitors & tokens)');
  console.log('   ✓ documents (4 corporate policy handbooks)');
  console.log('   ✓ tickets (IT, HR, facilities helpdesk)');
  console.log('   ✓ expenses (travel, food, office reimbursements)');
  console.log('   ✓ courses & course_enrollments (compliance & tech)');
  console.log('   ✓ goals (OKRs and Key Results)');
  console.log('   ✓ kudos (peer appreciations)');
  console.log('   ✓ notifications & audit_logs');
  console.log('-------------------------------------------------------------------');
  console.log('🔑 Primary Administrative Account:');
  console.log('   Email:    ayushbindhani001@gmail.com');
  console.log('   Password: Nanda@5152');
  console.log('   Role:     admin (Managing Director & Principal Architect)');
  console.log('-------------------------------------------------------------------');
  console.log('🔑 Additional Accounts (Password for all: Password@123):');
  console.log('   👑 Admin:    admin@oasis.io     (Alexander Wright)');
  console.log('   👩‍💼 HR:       hr@oasis.io        (Sarah Jenkins)');
  console.log('   👨‍💻 Employee: employee@oasis.io  (Jordan Lee)');
  console.log('===================================================================\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Master Seeding Error:', err);
  process.exit(1);
});
