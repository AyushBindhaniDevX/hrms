/**
 * Work Shifts & Roster Scheduling Service
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { WorkShift, ShiftSchedule } from '@/types/database';

let SHIFTS_STORE: WorkShift[] = [
  {
    id: 'shift_general',
    organization_id: 'subedge_org',
    name: 'General Day Shift (Standard)',
    start_time: '09:00',
    end_time: '18:00',
    color: '#0D7377',
    allowance_per_day: 0,
  },
  {
    id: 'shift_morning',
    organization_id: 'subedge_org',
    name: 'Early Morning Operations',
    start_time: '06:00',
    end_time: '15:00',
    color: '#D97706',
    allowance_per_day: 350,
  },
  {
    id: 'shift_evening',
    organization_id: 'subedge_org',
    name: 'Evening APAC / EMEA Support',
    start_time: '14:00',
    end_time: '23:00',
    color: '#6366F1',
    allowance_per_day: 500,
  },
  {
    id: 'shift_night',
    organization_id: 'subedge_org',
    name: 'Night SOC 2 & SRE Monitoring',
    start_time: '22:00',
    end_time: '07:00',
    color: '#1E293B',
    allowance_per_day: 850,
  },
];

let SCHEDULES_STORE: ShiftSchedule[] = [
  {
    id: 'sched_1',
    employee_id: 'emp_demo',
    shift_id: 'shift_general',
    date: '2026-03-09',
    is_overtime: false,
  },
  {
    id: 'sched_2',
    employee_id: 'emp_demo',
    shift_id: 'shift_general',
    date: '2026-03-10',
    is_overtime: false,
  },
  {
    id: 'sched_3',
    employee_id: 'emp_demo',
    shift_id: 'shift_evening',
    date: '2026-03-11',
    is_overtime: true,
  },
];

export async function getShifts(): Promise<WorkShift[]> {
  return [...SHIFTS_STORE];
}

export async function getShiftSchedules(employeeId?: string): Promise<ShiftSchedule[]> {
  if (employeeId) {
    return SCHEDULES_STORE.filter((s) => s.employee_id === employeeId);
  }
  return [...SCHEDULES_STORE];
}

export async function assignShift(data: Omit<ShiftSchedule, 'id'>): Promise<ShiftSchedule> {
  const newSched: ShiftSchedule = {
    ...data,
    id: `sched_${Date.now()}`,
  };
  SCHEDULES_STORE.push(newSched);
  return newSched;
}
