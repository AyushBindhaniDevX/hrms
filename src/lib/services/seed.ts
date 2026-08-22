/**
 * Master Enterprise Database Seeder
 * Subedge Technology Pvt Ltd — Oasis Platform: Oasis HRMS
 * Seeds interconnected collections into Firestore for all HRMS modules.
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export async function seedDatabaseIfEmpty(): Promise<{ seeded: boolean; message: string }> {
  try {
    const expensesSnap = await getDocs(collection(db, 'expenses'));
    if (!expensesSnap.empty) {
      return { seeded: false, message: 'Database already populated with dynamic records.' };
    }

    const batch = writeBatch(db);

    // 1. EXPENSES & CLAIMS (Interconnected with Employee & Mileage/Per Diem)
    const seedExpenses = [
      {
        id: 'exp_1',
        organization_id: DEFAULT_ORG_ID,
        employee_id: 'emp_demo',
        title: 'High-speed Fiber Broadband Reimbursement',
        category: 'internet',
        amount: 1499,
        currency: 'INR',
        receipt_url: 'https://subedge.vercel.app/receipts/broadband_mar2026.pdf',
        description: 'Monthly dedicated fiber connection for remote architecture squad.',
        status: 'approved',
        spent_at: '2026-03-01',
        approved_by: 'Finance Lead',
        approved_at: '2026-03-02',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id: 'exp_2',
        organization_id: DEFAULT_ORG_ID,
        employee_id: 'emp_demo',
        title: 'Bengaluru Client Strategy Meeting Travel (Mileage Claim)',
        category: 'travel',
        amount: 3450,
        currency: 'INR',
        receipt_url: 'https://subedge.vercel.app/receipts/toll_fuel_receipt.pdf',
        description: 'Round trip to Client HQ (75 km @ ₹46/km with toll validation).',
        status: 'pending',
        spent_at: '2026-03-06',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'exp_3',
        organization_id: DEFAULT_ORG_ID,
        employee_id: 'emp_demo',
        title: 'AWS Certified Security Specialty Certification Exam',
        category: 'learning',
        amount: 16500,
        currency: 'INR',
        receipt_url: 'https://subedge.vercel.app/receipts/aws_exam_invoice.pdf',
        description: 'Professional L&D annual upskilling sponsorship.',
        status: 'approved',
        spent_at: '2026-02-28',
        approved_by: 'HR Admin',
        approved_at: '2026-03-01',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
    ];

    for (const exp of seedExpenses) {
      batch.set(doc(db, 'expenses', exp.id), exp);
    }

    // 2. IT ASSETS & HARDWARE REGISTRY (With QR, Warranty, Depreciation & Linked Employee)
    const seedAssets = [
      {
        id: 'asset_1',
        organization_id: DEFAULT_ORG_ID,
        name: 'MacBook Pro 16" (M3 Max, 36GB RAM, 1TB SSD)',
        asset_tag: 'SUB-LPT-042',
        category: 'laptop',
        model: 'Apple MacBook Pro 16 2024',
        serial_number: 'C02G89A4MD6R',
        purchase_date: '2025-01-15',
        value: 249900,
        current_value: 219900,
        status: 'in_use',
        assigned_to_id: 'emp_demo',
        assigned_employee_name: 'Ayush Bindhani (Principal Architect)',
        warranty_expiry: '2028-01-14',
        qr_code: 'SUBEDGE-ASSET-042-M3MAX',
        notes: 'Assigned to Principal Architect with full SOC 2 disk encryption.',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'asset_2',
        organization_id: DEFAULT_ORG_ID,
        name: 'Dell UltraSharp 27" 4K USB-C Hub Monitor',
        asset_tag: 'SUB-MON-018',
        category: 'monitor',
        model: 'Dell U2723QE IPS Black',
        serial_number: 'CN-0N897-74261',
        purchase_date: '2025-02-10',
        value: 54000,
        current_value: 48600,
        status: 'in_use',
        assigned_to_id: 'emp_demo',
        assigned_employee_name: 'Ayush Bindhani (Principal Architect)',
        warranty_expiry: '2028-02-09',
        qr_code: 'SUBEDGE-ASSET-018-DELL4K',
        created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      },
      {
        id: 'asset_3',
        organization_id: DEFAULT_ORG_ID,
        name: 'Yubico YubiKey 5C NFC FIPS Hardware Key',
        asset_tag: 'SUB-SEC-099',
        category: 'security_token',
        model: 'YubiKey 5C NFC Enterprise',
        serial_number: 'YK998231',
        purchase_date: '2025-03-01',
        value: 6500,
        current_value: 6500,
        status: 'available',
        assigned_to_id: null,
        warranty_expiry: '2027-03-01',
        qr_code: 'SUBEDGE-ASSET-099-YUBIKEY',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'asset_4',
        organization_id: DEFAULT_ORG_ID,
        name: 'ThinkPad X1 Carbon Gen 12',
        asset_tag: 'SUB-LPT-055',
        category: 'laptop',
        model: 'Lenovo ThinkPad X1 2025',
        serial_number: 'PF4B9912',
        purchase_date: '2025-02-20',
        value: 185000,
        current_value: 172000,
        status: 'available',
        assigned_to_id: null,
        warranty_expiry: '2028-02-19',
        qr_code: 'SUBEDGE-ASSET-055-THINKPAD',
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
    ];

    for (const ast of seedAssets) {
      batch.set(doc(db, 'assets', ast.id), ast);
    }

    // 3. HELPDESK & SERVICE TICKETS (With SLA Engine, Subcategories & Resolution Trail)
    const seedTickets = [
      {
        id: 'tkt_1',
        organization_id: DEFAULT_ORG_ID,
        employee_id: 'emp_demo',
        ticket_number: 'TKT-1089',
        title: 'WireGuard Client Certificate Renewal for Staging Cluster',
        category: 'it_support',
        subcategory: 'Access & VPN',
        priority: 'high',
        status: 'in_progress',
        sla_target_hours: 4,
        response_sla_mins: 30,
        is_sla_breached: false,
        description: 'My WireGuard client certificate for the internal testing VPC is expiring this Friday.',
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tkt_2',
        organization_id: DEFAULT_ORG_ID,
        employee_id: 'emp_demo',
        ticket_number: 'TKT-1082',
        title: 'Form 12BB HRA & 80C Investment Proofs Verification',
        category: 'payroll_issue',
        subcategory: 'Tax & Declarations',
        priority: 'medium',
        status: 'resolved',
        sla_target_hours: 24,
        response_sla_mins: 120,
        is_sla_breached: false,
        description: 'Submitted rent agreement and Section 80C tax investment receipts.',
        resolution_notes: 'All investment proofs verified and updated for Q4 FY25-26 payroll deductions.',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ];

    for (const tkt of seedTickets) {
      batch.set(doc(db, 'tickets', tkt.id), tkt);
    }

    // 4. LEARNING & DEVELOPMENT LMS (With Modules, Skill Tags & Certificates)
    const seedCourses = [
      {
        id: 'course_1',
        organization_id: DEFAULT_ORG_ID,
        title: 'SOC 2 & HIPAA Security Compliance Essentials (2026)',
        category: 'Security & Governance',
        description: 'Mandatory annual training on data handling, PHI protection, clean desk policy, and phishing prevention.',
        duration_minutes: 45,
        modules_count: 5,
        is_mandatory: true,
        instructor: 'Subedge InfoSec Team',
        rating: 4.9,
        enrolled_count: 58,
        skills: ['SOC 2', 'HIPAA', 'Data Privacy', 'Threat Awareness'],
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'course_2',
        organization_id: DEFAULT_ORG_ID,
        title: 'Architecting Scalable Microservices with Go & GraphQL',
        category: 'Engineering',
        description: 'Deep dive into event-driven design, high-concurrency patterns, and gRPC communication.',
        duration_minutes: 180,
        modules_count: 12,
        is_mandatory: false,
        instructor: 'Ayush B. (Principal Architect)',
        rating: 5.0,
        enrolled_count: 34,
        skills: ['Go', 'GraphQL', 'Microservices', 'Distributed Systems'],
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
    ];

    for (const crs of seedCourses) {
      batch.set(doc(db, 'courses', crs.id), crs);
    }

    // Course Enrollments
    const seedEnrollments = [
      {
        id: 'enr_1',
        course_id: 'course_1',
        employee_id: 'emp_demo',
        progress_percent: 100,
        is_completed: true,
        completed_at: '2026-02-15',
        score: 96,
        certificate_id: 'SUB-CERT-SOC2-2026',
      },
      {
        id: 'enr_2',
        course_id: 'course_2',
        employee_id: 'emp_demo',
        progress_percent: 65,
        is_completed: false,
      },
    ];

    for (const enr of seedEnrollments) {
      batch.set(doc(db, 'course_enrollments', enr.id), enr);
    }

    // 5. DOCUMENT VAULT & POLICY ACKNOWLEDGEMENT
    const seedDocuments = [
      {
        id: 'doc_1',
        organization_id: DEFAULT_ORG_ID,
        title: 'Subedge Technology Employee Handbook (2026 Edition)',
        category: 'handbook',
        file_size_kb: 2450,
        version: 'v2.4',
        file_url: 'https://subedge.vercel.app/docs/handbook-2026.pdf',
        requires_signature: true,
        signatures_count: 52,
        uploaded_by: 'HR Policy Team',
        effective_date: '2026-01-01',
        created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
      },
      {
        id: 'doc_2',
        organization_id: DEFAULT_ORG_ID,
        title: 'Information Security & Data Privacy Policy (SOC 2 & HIPAA)',
        category: 'policy',
        file_size_kb: 1840,
        version: 'v3.1',
        file_url: 'https://subedge.vercel.app/docs/infosec-policy.pdf',
        requires_signature: true,
        signatures_count: 58,
        uploaded_by: 'CISO Office',
        effective_date: '2026-01-01',
        created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
      },
      {
        id: 'doc_3',
        organization_id: DEFAULT_ORG_ID,
        title: 'Remote Work & Hybrid Workplace Equipment Policy',
        category: 'policy',
        file_size_kb: 920,
        version: 'v1.8',
        file_url: 'https://subedge.vercel.app/docs/remote-work-policy.pdf',
        requires_signature: false,
        signatures_count: 0,
        uploaded_by: 'People Ops',
        effective_date: '2026-02-01',
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      },
    ];

    for (const docItem of seedDocuments) {
      batch.set(doc(db, 'documents', docItem.id), docItem);
    }

    // 6. SHIFTS & ROSTER MASTER
    const seedShifts = [
      {
        id: 'shift_general',
        organization_id: DEFAULT_ORG_ID,
        name: 'General Day Shift (Standard)',
        start_time: '09:00',
        end_time: '18:00',
        color: '#0D7377',
        allowance_per_day: 0,
      },
      {
        id: 'shift_morning',
        organization_id: DEFAULT_ORG_ID,
        name: 'Early Morning Operations',
        start_time: '06:00',
        end_time: '15:00',
        color: '#D97706',
        allowance_per_day: 350,
      },
      {
        id: 'shift_evening',
        organization_id: DEFAULT_ORG_ID,
        name: 'Evening APAC / EMEA Support',
        start_time: '14:00',
        end_time: '23:00',
        color: '#6366F1',
        allowance_per_day: 500,
      },
      {
        id: 'shift_night',
        organization_id: DEFAULT_ORG_ID,
        name: 'Night SOC 2 & SRE Monitoring',
        start_time: '22:00',
        end_time: '07:00',
        color: '#1E293B',
        allowance_per_day: 850,
      },
    ];

    for (const sh of seedShifts) {
      batch.set(doc(db, 'shifts', sh.id), sh);
    }

    await batch.commit();
    return { seeded: true, message: 'All enterprise collections successfully seeded into Firestore.' };
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return { seeded: false, message: error?.message || 'Seeding error' };
  }
}
