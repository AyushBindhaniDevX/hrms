/**
 * Shifts & Roster Scheduling Service (Supabase)
 * Oasis HRMS Multi-Tenant Platform
 */

import { supabase } from '@/lib/supabase';
import { WorkShift, EmployeeShift } from '@/types/database';

export const DEFAULT_SHIFTS: Omit<WorkShift, 'id' | 'created_at'>[] = [];

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

    if (!error && data) {
      return data as WorkShift[];
    }
  } catch (err) {
    console.error('Error querying shifts:', err);
  }

  return [];
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
    throw error;
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
