import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
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

const ORG_ID = 'shanti-memorial-hospital';
const SMH_LOGO = 'https://www.shantimemorialhospital.com/wp-content/uploads/2021/05/SMH-Logo.jpg';
const DEFAULT_PASSWORD = 'Password@123';

console.log('🏥 Starting Shanti Memorial Hospital Database Seeder...');
console.log('   Target Organization ID:', ORG_ID);
console.log('   Logo URL:', SMH_LOGO);

async function main() {
  // ──────────────────────────────────────────────────────────────────────────
  // 0. Administrator Authentication (Required for Firestore Security Rules)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🔐 0. Authenticating Administrator (admin@oasis.io)...');
  const adminCred = await signInWithEmailAndPassword(auth, 'admin@oasis.io', 'Password@123');
  console.log(`  ✓ Authenticated Administrator: admin@oasis.io (UID: ${adminCred.user.uid})`);

  // Lookup existing profile for ayushbindhani001@gmail.com to get their active UID
  let userUid = 'URtAoHI5KUNKSw0sJzlmO6smFiH3';
  try {
    const profQuery = query(collection(db, 'profiles'), where('email', '==', 'ayushbindhani001@gmail.com'));
    const profSnap = await getDocs(profQuery);
    if (!profSnap.empty) {
      userUid = profSnap.docs[0].id;
      console.log(`  ✓ Discovered existing profile UID for ayushbindhani001@gmail.com: ${userUid}`);
    }
  } catch (lookupErr) {
    console.warn('Profile UID lookup note:', lookupErr.message);
  }


  // ──────────────────────────────────────────────────────────────────────────
  // 1. Organization Document
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📦 1. Seeding Shanti Memorial Hospital Organization...');
  const orgPayload = {
    id: ORG_ID,
    name: 'Shanti Memorial Hospital',
    slug: 'shanti-memorial-hospital',
    package_type: 'enterprise',
    plan: 'enterprise',
    logo_url: SMH_LOGO,
    primary_color: '#0D7377',
    accent_color: '#14B8A6',
    features: {
      payroll: true,
      biometrics: true,
      geofencing: true,
      performance: true,
      learning: true,
      recruitment: true,
      expenses: true,
      helpdesk: true,
      assets: true,
      audit_logs: true,
    },
    max_employees: 1000,
    settings: {
      industry: 'Healthcare & Multi-Specialty Hospital',
      address: 'Patia / Thoria Sahi, Manglabag, Cuttack, Odisha 753001',
      working_hours_start: '08:00',
      working_hours_end: '20:00',
      default_radius_meters: 300,
      fiscal_year_start_month: 4,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      geofencing_strict: false,
      shifts_24x7: true,
      contact_phone: '+91 671 2414243',
      contact_email: 'info@shantimemorialhospital.com',
      website: 'https://www.shantimemorialhospital.com',
    },
    created_at: new Date('2024-01-01').toISOString(),
    updated_at: new Date().toISOString(),
  };

  await setDoc(doc(db, 'organizations', ORG_ID), orgPayload);
  // Alias for slug lookups
  await setDoc(doc(db, 'organizations', 'smh'), { ...orgPayload, id: 'smh' });
  console.log('  ✓ Organization document created (shanti-memorial-hospital & smh alias)');

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Hospital Campuses (Workplaces with Geofences)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📍 2. Seeding Hospital Campuses with Geofences...');
  const workplaces = [
    {
      id: 'wp-smh-main',
      organization_id: ORG_ID,
      name: 'Shanti Memorial Hospital - Main Multi-Specialty Campus',
      address: 'Manglabag, Thoria Sahi, Cuttack, Odisha 753001',
      latitude: 20.4625,
      longitude: 85.8830,
      radius_meters: 350,
      is_active: true,
    },
    {
      id: 'wp-smh-trauma',
      organization_id: ORG_ID,
      name: 'SMH Emergency & Trauma Center',
      address: 'Ring Road Branch, Cuttack, Odisha 753002',
      latitude: 20.4690,
      longitude: 85.8750,
      radius_meters: 250,
      is_active: true,
    },
    {
      id: 'wp-smh-diagnostic',
      organization_id: ORG_ID,
      name: 'SMH Advanced Diagnostics & MRI Centre',
      address: 'Badambadi Square, Cuttack, Odisha 753012',
      latitude: 20.4550,
      longitude: 85.8680,
      radius_meters: 200,
      is_active: true,
    },
  ];

  for (const wp of workplaces) {
    await setDoc(doc(db, 'workplaces', wp.id), {
      ...wp,
      created_at: new Date().toISOString(),
    });
  }
  console.log(`  ✓ ${workplaces.length} Hospital Campuses created`);

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Clinical & Administrative Hospital Departments
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🏥 3. Seeding Hospital Clinical & Administrative Departments...');
  const departments = [
    { id: 'dept-smh-admin', name: 'Hospital Administration & Directorate', description: 'Medical governance, executive management, and clinical standards' },
    { id: 'dept-smh-emergency', name: 'Emergency & Trauma Care (24x7)', description: 'Critical life support, triage, acute resuscitation and ambulance services' },
    { id: 'dept-smh-cardio', name: 'Cardiology & Cath Lab', description: 'Interventional cardiology, ECG/ECHO, and coronary care unit (CCU)' },
    { id: 'dept-smh-icu', name: 'Intensive Care Unit (ICU)', description: 'Advanced mechanical ventilation, multi-parameter vital monitoring' },
    { id: 'dept-smh-surgery', name: 'General & Laparoscopic Surgery', description: 'Modular operation theatres, minimally invasive and GI surgeries' },
    { id: 'dept-smh-ortho', name: 'Orthopedics & Joint Replacement', description: 'Trauma bone surgery, arthroscopy, and spine care' },
    { id: 'dept-smh-nursing', name: 'In-Patient Nursing Services', description: 'Ward management, IV medications, pre/post-operative patient nursing' },
    { id: 'dept-smh-diagnostics', name: 'Radiology & Central Pathology Lab', description: 'Digital X-Ray, CT scan, ultrasound, and automated hematology' },
    { id: 'dept-smh-pharmacy', name: 'Central Pharmacy & Supplies', description: '24x7 in-house pharmacy, cold-chain medication storage and surgical supply' },
    { id: 'dept-smh-hr', name: 'Human Resources & Hospital Operations', description: 'Medical staff credentialing, duty rosters, and hospital compliance' },
  ];

  for (const d of departments) {
    await setDoc(doc(db, 'departments', d.id), {
      id: d.id,
      organization_id: ORG_ID,
      name: d.name,
      description: d.description,
      created_at: new Date().toISOString(),
    });
  }
  console.log(`  ✓ ${departments.length} Hospital Departments created`);

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Hospital 24x7 Shifts & Rosters
  // ──────────────────────────────────────────────────────────────────────────
  console.log('⏰ 4. Seeding Hospital 24x7 Shifts & Clinical Duty Rosters...');
  const shifts = [
    {
      id: 'shift-smh-general',
      organization_id: ORG_ID,
      name: 'General Administrative Shift',
      start_time: '09:00',
      end_time: '18:00',
      grace_period_minutes: 15,
      break_duration_minutes: 60,
      is_night_shift: false,
    },
    {
      id: 'shift-smh-morning',
      organization_id: ORG_ID,
      name: 'Morning Clinical Ward Shift (A-Shift)',
      start_time: '07:00',
      end_time: '15:30',
      grace_period_minutes: 15,
      break_duration_minutes: 45,
      is_night_shift: false,
    },
    {
      id: 'shift-smh-evening',
      organization_id: ORG_ID,
      name: 'Evening Clinical Ward Shift (B-Shift)',
      start_time: '14:30',
      end_time: '22:30',
      grace_period_minutes: 15,
      break_duration_minutes: 45,
      is_night_shift: false,
    },
    {
      id: 'shift-smh-night',
      organization_id: ORG_ID,
      name: 'Night Emergency & ICU Duty (C-Shift)',
      start_time: '22:00',
      end_time: '07:30',
      grace_period_minutes: 15,
      break_duration_minutes: 45,
      is_night_shift: true,
    },
    {
      id: 'shift-smh-rotational',
      organization_id: ORG_ID,
      name: '24x7 Rotational Ward Duty (12-Hour Shift)',
      start_time: '08:00',
      end_time: '20:00',
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
  console.log(`  ✓ ${shifts.length} Hospital Shifts created`);

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Hospital Leave Types
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🏖️ 5. Seeding Hospital Leave Policies...');
  const leaveTypes = [
    { id: 'lt-smh-casual', name: 'Casual Leave (CL)', annual_days: 10, is_paid: true },
    { id: 'lt-smh-sick', name: 'Medical / Sick Leave (SL)', annual_days: 14, is_paid: true },
    { id: 'lt-smh-earned', name: 'Earned Privilege Leave (EL)', annual_days: 18, is_paid: true },
    { id: 'lt-smh-maternity', name: 'Maternity Leave', annual_days: 180, is_paid: true },
    { id: 'lt-smh-oncall', name: 'Compensatory On-Call Off', annual_days: 8, is_paid: true },
    { id: 'lt-smh-cme', name: 'Medical Conference / CME Leave', annual_days: 6, is_paid: true },
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
  console.log(`  ✓ ${leaveTypes.length} Leave Types created`);

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Users & Healthcare Professionals (Doctors, Nurses, Administrators)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('👥 6. Seeding Hospital Healthcare Personnel & Linking User Account...');
  const usersData = [
    // ── Primary Administrator: Ayush Bindhani (Linked Account)
    {
      emp_id: 'emp-smh-0001',
      code: 'SMH-0001',
      name: 'Ayush Bindhani',
      email: 'ayushbindhani001@gmail.com',
      password: 'Nanda@5152',
      role: 'admin',
      dept: 'dept-smh-admin',
      wp: 'wp-smh-main',
      shift: 'shift-smh-general',
      designation: 'Managing Director & Chief of Medical Services',
      salary: 450000,
      phone: '+91 98610 12345',
      manager_emp_id: null,
      joining: '2021-01-01',
      authUid: userUid,
    },
    // ── Head of Cardiology
    {
      emp_id: 'emp-smh-0002',
      code: 'SMH-0002',
      name: 'Dr. Sanjeev Mohapatra',
      email: 'dr.sanjeev@shantimemorialhospital.com',
      password: DEFAULT_PASSWORD,
      role: 'hr',
      dept: 'dept-smh-cardio',
      wp: 'wp-smh-main',
      shift: 'shift-smh-morning',
      designation: 'Head of Department - Interventional Cardiology',
      salary: 320000,
      phone: '+91 98611 22334',
      manager_emp_id: 'emp-smh-0001',
      joining: '2021-04-15',
    },
    // ── Chief of Emergency Care
    {
      emp_id: 'emp-smh-0003',
      code: 'SMH-0003',
      name: 'Dr. Priyadarshini Ray',
      email: 'dr.priyadarshini@shantimemorialhospital.com',
      password: DEFAULT_PASSWORD,
      role: 'hr',
      dept: 'dept-smh-emergency',
      wp: 'wp-smh-trauma',
      shift: 'shift-smh-rotational',
      designation: 'Chief of Emergency & Critical Care',
      salary: 280000,
      phone: '+91 98612 33445',
      manager_emp_id: 'emp-smh-0001',
      joining: '2021-06-01',
    },
    // ── Consultant General Surgeon
    {
      emp_id: 'emp-smh-0004',
      code: 'SMH-0004',
      name: 'Dr. Rajesh Mishra',
      email: 'dr.rajesh@shantimemorialhospital.com',
      password: DEFAULT_PASSWORD,
      role: 'employee',
      dept: 'dept-smh-surgery',
      wp: 'wp-smh-main',
      shift: 'shift-smh-morning',
      designation: 'Senior Consultant Laparoscopic Surgeon',
      salary: 260000,
      phone: '+91 98613 44556',
      manager_emp_id: 'emp-smh-0001',
      joining: '2022-02-10',
    },
    // ── ICU Specialist
    {
      emp_id: 'emp-smh-0005',
      code: 'SMH-0005',
      name: 'Dr. Ananya Mohanty',
      email: 'dr.ananya@shantimemorialhospital.com',
      password: DEFAULT_PASSWORD,
      role: 'employee',
      dept: 'dept-smh-icu',
      wp: 'wp-smh-main',
      shift: 'shift-smh-night',
      designation: 'Consultant Intensivist & Critical Care Specialist',
      salary: 240000,
      phone: '+91 98614 55667',
      manager_emp_id: 'emp-smh-0003',
      joining: '2022-05-18',
    },
    // ── Chief Nursing Superintendent
    {
      emp_id: 'emp-smh-0006',
      code: 'SMH-0006',
      name: 'Sister Mary Fernandez',
      email: 'nurse.mary@shantimemorialhospital.com',
      password: DEFAULT_PASSWORD,
      role: 'hr',
      dept: 'dept-smh-nursing',
      wp: 'wp-smh-main',
      shift: 'shift-smh-morning',
      designation: 'Chief Nursing Superintendent (CNS)',
      salary: 110000,
      phone: '+91 98615 66778',
      manager_emp_id: 'emp-smh-0001',
      joining: '2021-03-01',
    },
    // ── Senior Staff Nurse - ICU
    {
      emp_id: 'emp-smh-0007',
      code: 'SMH-0007',
      name: 'Sunita Patnaik',
      email: 'sunita.nurse@shantimemorialhospital.com',
      password: DEFAULT_PASSWORD,
      role: 'employee',
      dept: 'dept-smh-nursing',
      wp: 'wp-smh-main',
      shift: 'shift-smh-evening',
      designation: 'Senior ICU & Ventilator Nurse',
      salary: 58000,
      phone: '+91 98616 77889',
      manager_emp_id: 'emp-smh-0006',
      joining: '2022-08-12',
    },
    // ── Radiology & MRI Technologist
    {
      emp_id: 'emp-smh-0008',
      code: 'SMH-0008',
      name: 'Aniket Das',
      email: 'aniket.rad@shantimemorialhospital.com',
      password: DEFAULT_PASSWORD,
      role: 'employee',
      dept: 'dept-smh-diagnostics',
      wp: 'wp-smh-diagnostic',
      shift: 'shift-smh-general',
      designation: 'Lead MRI & 128-Slice CT Technologist',
      salary: 68000,
      phone: '+91 98617 88990',
      manager_emp_id: 'emp-smh-0001',
      joining: '2022-11-01',
    },
    // ── Chief Pharmacist
    {
      emp_id: 'emp-smh-0009',
      code: 'SMH-0009',
      name: 'Manas Ranjan Sahoo',
      email: 'manas.pharmacy@shantimemorialhospital.com',
      password: DEFAULT_PASSWORD,
      role: 'employee',
      dept: 'dept-smh-pharmacy',
      wp: 'wp-smh-main',
      shift: 'shift-smh-rotational',
      designation: 'Chief Pharmacist & Inventory Lead',
      salary: 75000,
      phone: '+91 98618 99001',
      manager_emp_id: 'emp-smh-0001',
      joining: '2022-03-20',
    },
    // ── Hospital HR & Compliance Manager
    {
      emp_id: 'emp-smh-0010',
      code: 'SMH-0010',
      name: 'Meenakshi Sen',
      email: 'meenakshi.hr@shantimemorialhospital.com',
      password: DEFAULT_PASSWORD,
      role: 'hr',
      dept: 'dept-smh-hr',
      wp: 'wp-smh-main',
      shift: 'shift-smh-general',
      designation: 'Head of Hospital HR & NABH Compliance',
      salary: 125000,
      phone: '+91 98619 00112',
      manager_emp_id: 'emp-smh-0001',
      joining: '2021-09-01',
    },
    // ── Operations & Biomedical Engineer
    {
      emp_id: 'emp-smh-0011',
      code: 'SMH-0011',
      name: 'Rakesh Tripathy',
      email: 'rakesh.ops@shantimemorialhospital.com',
      password: DEFAULT_PASSWORD,
      role: 'employee',
      dept: 'dept-smh-admin',
      wp: 'wp-smh-main',
      shift: 'shift-smh-general',
      designation: 'Lead Biomedical Engineer & Facilities Head',
      salary: 85000,
      phone: '+91 98620 11223',
      manager_emp_id: 'emp-smh-0001',
      joining: '2022-01-15',
    },
  ];

  for (const u of usersData) {
    let authUid = u.authUid || userUid;

    // Create Firebase Auth user if not existing
    if (!u.authUid) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
        authUid = cred.user.uid;
        await updateProfile(cred.user, { displayName: u.name });
        console.log(`    Created auth user: ${u.email} (${authUid})`);
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            const cred = await signInWithEmailAndPassword(auth, u.email, u.password);
            authUid = cred.user.uid;
            console.log(`    Authenticated existing auth user: ${u.email} (${authUid})`);
          } catch (loginErr) {
            authUid = `auth-${u.emp_id}`;
          }
        } else {
          authUid = `auth-${u.emp_id}`;
        }
      }
      // Re-authenticate as administrator to maintain Firestore write permissions
      await signInWithEmailAndPassword(auth, 'admin@oasis.io', 'Password@123');
    }

    const now = new Date().toISOString();

    // Set Profile under UID
    const profilePayload = {
      id: authUid,
      organization_id: ORG_ID,
      full_name: u.name,
      email: u.email,
      phone: u.phone,
      avatar_url: null,
      role: u.role,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    await setDoc(doc(db, 'profiles', authUid), profilePayload);

    // If linking primary admin, also make sure any query by email matches
    if (u.email === 'ayushbindhani001@gmail.com') {
      await setDoc(doc(db, 'profiles', userUid), profilePayload);
      await setDoc(doc(db, 'profiles', 'URtAoHI5KUNKSw0sJzlmO6smFiH3'), profilePayload);
    }

    // Set Employee
    const employeePayload = {
      id: u.emp_id,
      profile_id: authUid,
      organization_id: ORG_ID,
      employee_code: u.code,
      department_id: u.dept,
      designation: u.designation,
      joining_date: u.joining,
      workplace_id: u.wp,
      manager_id: u.manager_emp_id,
      default_shift_id: u.shift,
      basic_salary: u.salary,
      employment_status: 'active',
      onboarding_completed: true,
      tax_config: {
        tax_regime: 'new',
        epf_percentage: 12,
        tds_percentage: 10,
        hra_percentage: 40,
      },
      created_at: now,
      updated_at: now,
    };
    await setDoc(doc(db, 'employees', u.emp_id), employeePayload);
  }
  console.log(`  ✓ ${usersData.length} Healthcare profiles & employees linked to Shanti Memorial Hospital`);

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Clinical Attendance & Check-Ins for Today
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📋 7. Seeding Hospital Staff Attendance Logs...');
  const today = new Date().toISOString().split('T')[0];
  const attendanceLogs = [
    { emp: 'emp-smh-0001', check_in: '08:45:00', status: 'present', shift: 'shift-smh-general' },
    { emp: 'emp-smh-0002', check_in: '06:55:00', status: 'present', shift: 'shift-smh-morning' },
    { emp: 'emp-smh-0003', check_in: '07:50:00', status: 'present', shift: 'shift-smh-rotational' },
    { emp: 'emp-smh-0004', check_in: '07:10:00', status: 'present', shift: 'shift-smh-morning' },
    { emp: 'emp-smh-0006', check_in: '06:48:00', status: 'present', shift: 'shift-smh-morning' },
    { emp: 'emp-smh-0008', check_in: '08:52:00', status: 'present', shift: 'shift-smh-general' },
    { emp: 'emp-smh-0009', check_in: '08:00:00', status: 'present', shift: 'shift-smh-rotational' },
    { emp: 'emp-smh-0010', check_in: '08:58:00', status: 'present', shift: 'shift-smh-general' },
    { emp: 'emp-smh-0011', check_in: '09:05:00', status: 'late', shift: 'shift-smh-general' },
  ];

  for (let i = 0; i < attendanceLogs.length; i++) {
    const log = attendanceLogs[i];
    const attId = `att-smh-${today}-${log.emp}`;
    await setDoc(doc(db, 'attendance', attId), {
      id: attId,
      employee_id: log.emp,
      organization_id: ORG_ID,
      workplace_id: 'wp-smh-main',
      date: today,
      check_in_time: `${today}T${log.check_in}+05:30`,
      check_out_time: null,
      status: log.status,
      is_geofence_verified: true,
      is_face_verified: true,
      verification_method: 'biometric_kiosk',
      shift_id: log.shift,
      created_at: new Date().toISOString(),
    });
  }
  console.log(`  ✓ ${attendanceLogs.length} Hospital Attendance Records seeded`);

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Sample Clinical Payroll Slips (Recent Month)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('💰 8. Seeding Hospital Payroll Records...');
  for (const u of usersData.slice(0, 5)) {
    const payId = `pay-smh-2026-08-${u.emp_id}`;
    const basic = u.salary;
    const hra = Math.round(basic * 0.4);
    const medicalAllowance = 15000;
    const gross = basic + hra + medicalAllowance;
    const epf = Math.round(basic * 0.12);
    const tds = Math.round(gross * 0.10);
    const net = gross - (epf + tds);

    await setDoc(doc(db, 'payrolls', payId), {
      id: payId,
      organization_id: ORG_ID,
      employee_id: u.emp_id,
      month: 8,
      year: 2026,
      period_start: '2026-08-01',
      period_end: '2026-08-31',
      basic_salary: basic,
      hra: hra,
      medical_allowance: medicalAllowance,
      gross_earnings: gross,
      epf_deduction: epf,
      tds_deduction: tds,
      total_deductions: epf + tds,
      net_salary: net,
      status: 'paid',
      payment_date: '2026-09-01',
      payment_reference: `SMH-PAY-202608-${u.code}`,
      created_at: new Date('2026-09-01').toISOString(),
    });
  }
  console.log('  ✓ Hospital Payroll entries seeded');

  console.log('\n🎉 Shanti Memorial Hospital Database Seeding Completed Successfully!');
  console.log('   Organization ID: shanti-memorial-hospital');
  console.log('   Linked Account: ayushbindhani001@gmail.com (Role: Admin / Managing Director)');
  console.log('   Branding Logo:', SMH_LOGO);
}

main().catch(err => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
