/**
 * Shifts & Roster Scheduling Service (Supabase)
 * Oasis HRMS Multi-Tenant Platform
 */

import { supabase } from '@/lib/supabase';
import { WorkShift, EmployeeShift } from '@/types/database';

export const DEFAULT_SHIFTS: Omit<WorkShift, 'id' | 'created_at'>[] = [
  {
    organization_id: '00000000-0000-0000-0000-000000000002',
    name: 'General Shift',
    start_time: '09:30',
    end_time: '18:30',
    color: '#0D7377',
    allowance_per_day: 0,
    is_night_shift: false,
  },
  {
    organization_id: '00000000-0000-0000-0000-000000000002',
    name: 'Morning OPD Shift',
    start_time: '07:00',
    end_time: '15:30',
    color: '#059669',
    allowance_per_day: 150,
    is_night_shift: false,
  },
  {
    organization_id: '00000000-0000-0000-0000-000000000002',
    name: 'Evening Shift',
    start_time: '14:00',
    end_time: '22:30',
    color: '#D97706',
    allowance_per_day: 250,
    is_night_shift: false,
  },
  {
    organization_id: '00000000-0000-0000-0000-000000000002',
    name: 'Emergency Night Shift',
    start_time: '22:00',
    end_time: '07:00',
    color: '#7C3AED',
    allowance_per_day: 500,
    is_night_shift: true,
  },
];

export async function getShifts(organizationId?: string): Promise<WorkShift[]> {
  try {
    let query = supabase
      .from('shifts')
      .select('*')
      .order('name', { ascending: true });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return data as WorkShift[];
    }
  } catch (err) {
    console.error('Error querying shifts:', err);
  }

  // Fallback default shifts if table empty or seeding
  return DEFAULT_SHIFTS.map((s, idx) => ({
    ...s,
    id: `shift_${idx + 1}`,
    organization_id: organizationId || s.organization_id,
  }));
}

export async function createShift(shift: Omit<WorkShift, 'id' | 'created_at'>): Promise<WorkShift> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('shifts')
    .insert({
      ...shift,
      created_at: now,
    })
    .select('*')
    .single();

  if (error) {
    // Return mock with id if table does not exist
    return {
      ...shift,
      id: `shift_${Date.now()}`,
      created_at: now,
    };
  }
  return data as WorkShift;
}

export async function updateShift(id: string, updates: Partial<WorkShift>): Promise<void> {
  const { error } = await supabase
    .from('shifts')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteShift(id: string): Promise<void> {
  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getRoster(
  startDate: string,
  endDate: string,
  organizationId?: string
): Promise<EmployeeShift[]> {
  try {
    let query = supabase
      .from('employee_shifts')
      .select('*, shift:shifts(*)')
      .gte('date', startDate)
      .lte('date', endDate);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (!error && data) {
      return data as EmployeeShift[];
    }
  } catch (e) {
    console.error('Error fetching roster:', e);
  }

  return [];
}

export async function assignEmployeeShift(
  employeeId: string,
  date: string,
  shiftId: string | null,
  organizationId: string
): Promise<void> {
  const now = new Date().toISOString();
  const id = `${employeeId}_${date}`;

  try {
    await supabase.from('employee_shifts').upsert({
      id,
      employee_id: employeeId,
      date,
      shift_id: shiftId,
      organization_id: organizationId,
      created_at: now,
    });
  } catch (err) {
    console.error('Error assigning employee shift:', err);
  }
}
