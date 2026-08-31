import { supabase } from '@/lib/supabase';
import type { Holiday, HolidayType } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_HOLIDAYS_STORAGE_KEY = 'oasis_custom_holidays_v1';

export const DEFAULT_HOLIDAYS = [
  { name: "New Year's Day", date_suffix: '-01-01', type: 'public' as HolidayType, description: 'Global New Year Holiday' },
  { name: 'Republic Day', date_suffix: '-01-26', type: 'public' as HolidayType, description: 'National Republic Day' },
  { name: 'Maha Shivratri', date_suffix: '-02-15', type: 'optional' as HolidayType, description: 'Cultural Festival' },
  { name: 'Holi (Festival of Colors)', date_suffix: '-03-04', type: 'public' as HolidayType, description: 'National Spring Festival' },
  { name: 'Good Friday', date_suffix: '-04-03', type: 'public' as HolidayType, description: 'Christian Holiday' },
  { name: 'Eid al-Fitr', date_suffix: '-03-21', type: 'public' as HolidayType, description: 'Islamic Festival' },
  { name: 'May Day / Labor Day', date_suffix: '-05-01', type: 'company' as HolidayType, description: 'International Workers Day' },
  { name: 'Independence Day', date_suffix: '-08-15', type: 'public' as HolidayType, description: 'National Independence Day' },
  { name: 'Raksha Bandhan', date_suffix: '-08-28', type: 'optional' as HolidayType, description: 'Cultural Celebration' },
  { name: 'Gandhi Jayanti', date_suffix: '-10-02', type: 'public' as HolidayType, description: 'National Holiday' },
  { name: 'Dussehra (Vijayadashami)', date_suffix: '-10-20', type: 'public' as HolidayType, description: 'Victory of Good over Evil' },
  { name: 'Diwali (Deepavali)', date_suffix: '-11-08', type: 'public' as HolidayType, description: 'Festival of Lights' },
  { name: 'Guru Nanak Jayanti', date_suffix: '-11-24', type: 'optional' as HolidayType, description: 'Sikh Festival' },
  { name: 'Christmas Day', date_suffix: '-12-25', type: 'public' as HolidayType, description: 'Christmas Celebration' },
];

async function getLocalCustomHolidays(): Promise<Holiday[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_HOLIDAYS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveLocalCustomHolidays(holidays: Holiday[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_HOLIDAYS_STORAGE_KEY, JSON.stringify(holidays));
  } catch {}
}

/**
 * Fetch all holidays for an organization, optionally filtered by year
 */
export async function getHolidays(organizationId?: string, year?: number): Promise<Holiday[]> {
  const currentYear = year ?? new Date().getFullYear();
  const startOfYear = `${currentYear}-01-01`;
  const endOfYear = `${currentYear}-12-31`;

  try {
    let query = supabase
      .from('holidays')
      .select('*')
      .gte('date', startOfYear)
      .lte('date', endOfYear)
      .order('date', { ascending: true });

    if (organizationId) {
      query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return data as Holiday[];
    }
  } catch {}

  // Fallback: merge default holidays with any locally saved custom entries
  return await getFallbackHolidays(organizationId, currentYear);
}

/**
 * Seed default calendar holidays into Supabase
 */
export async function seedDefaultHolidays(organizationId?: string, year?: number): Promise<Holiday[]> {
  const targetYear = year ?? new Date().getFullYear();

  let resolvedOrgId = organizationId;
  if (!resolvedOrgId) {
    try {
      const { data: anyOrg } = await supabase.from('organizations').select('id').limit(1).maybeSingle();
      if (anyOrg?.id) resolvedOrgId = anyOrg.id;
    } catch {}
  }

  const payload = DEFAULT_HOLIDAYS.map((h) => ({
    organization_id: resolvedOrgId || null,
    name: h.name,
    date: `${targetYear}${h.date_suffix}`,
    type: h.type,
    description: h.description,
    is_recurring: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  try {
    const { data, error } = await supabase
      .from('holidays')
      .insert(payload)
      .select('*')
      .order('date', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as Holiday[];
    }
  } catch {}

  return getFallbackHolidays(organizationId, targetYear);
}

async function getFallbackHolidays(organizationId?: string, year?: number): Promise<Holiday[]> {
  const targetYear = year ?? new Date().getFullYear();
  const defaults: Holiday[] = DEFAULT_HOLIDAYS.map((h, idx) => ({
    id: `hol_${targetYear}_${idx + 1}`,
    organization_id: organizationId || '00000000-0000-0000-0000-000000000001',
    name: h.name,
    date: `${targetYear}${h.date_suffix}`,
    type: h.type,
    description: h.description,
    is_recurring: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const localCustom = await getLocalCustomHolidays();
  const localThisYear = localCustom.filter((h) => h.date.startsWith(`${targetYear}`));

  const all = [...defaults, ...localThisYear];
  all.sort((a, b) => a.date.localeCompare(b.date));
  return all;
}

/**
 * Add a new holiday (HR / Admin)
 */
export async function createHoliday(holiday: {
  organization_id?: string | null;
  name: string;
  date: string;
  type: HolidayType;
  description?: string | null;
  is_recurring?: boolean;
}): Promise<Holiday> {
  const now = new Date().toISOString();

  let orgId = holiday.organization_id;
  if (!orgId) {
    try {
      const { data: anyOrg } = await supabase.from('organizations').select('id').limit(1).maybeSingle();
      orgId = anyOrg?.id || null;
    } catch {}
  }

  const newEntry: Holiday = {
    id: `hol_custom_${Date.now()}`,
    organization_id: orgId || '',
    name: holiday.name.trim(),
    date: holiday.date,
    type: holiday.type,
    description: holiday.description?.trim() || null,
    is_recurring: holiday.is_recurring ?? false,
    created_at: now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from('holidays')
      .insert({
        organization_id: orgId,
        name: holiday.name.trim(),
        date: holiday.date,
        type: holiday.type,
        description: holiday.description?.trim() || null,
        is_recurring: holiday.is_recurring ?? false,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (!error && data) {
      return data as Holiday;
    }
  } catch {}

  // Local storage fallback if Supabase table is not yet migrated
  const current = await getLocalCustomHolidays();
  const updated = [...current, newEntry];
  await saveLocalCustomHolidays(updated);
  return newEntry;
}

/**
 * Update an existing holiday
 */
export async function updateHoliday(id: string, updates: Partial<Holiday>): Promise<Holiday> {
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('holidays')
      .update({
        ...updates,
        updated_at: now,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      return data as Holiday;
    }
  } catch {}

  // Local storage fallback
  const current = await getLocalCustomHolidays();
  const idx = current.findIndex((h) => h.id === id);
  if (idx >= 0) {
    const updatedObj = { ...current[idx], ...updates, updated_at: now };
    current[idx] = updatedObj;
    await saveLocalCustomHolidays(current);
    return updatedObj;
  }

  return {
    id,
    organization_id: '',
    name: updates.name || 'Holiday',
    date: updates.date || now.split('T')[0],
    type: updates.type || 'public',
    description: updates.description || null,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Delete a holiday
 */
export async function deleteHoliday(id: string): Promise<void> {
  try {
    await supabase.from('holidays').delete().eq('id', id);
  } catch {}

  const current = await getLocalCustomHolidays();
  const filtered = current.filter((h) => h.id !== id);
  await saveLocalCustomHolidays(filtered);
}

/**
 * Check if a specific date is a declared Holiday
 */
export async function isHoliday(
  dateStr: string,
  organizationId?: string
): Promise<{ isHoliday: boolean; holiday?: Holiday }> {
  try {
    let query = supabase.from('holidays').select('*').eq('date', dateStr);
    if (organizationId) {
      query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
    }

    const { data } = await query.maybeSingle();
    if (data) {
      return { isHoliday: true, holiday: data as Holiday };
    }
  } catch {}

  // Check local defaults
  const d = dateStr.slice(5); // -MM-DD
  const match = DEFAULT_HOLIDAYS.find((h) => h.date_suffix === `-${d}`);
  if (match) {
    return {
      isHoliday: true,
      holiday: {
        id: `hol_temp_${dateStr}`,
        organization_id: organizationId || '',
        name: match.name,
        date: dateStr,
        type: match.type,
        description: match.description,
        created_at: new Date().toISOString(),
      },
    };
  }

  const custom = await getLocalCustomHolidays();
  const customMatch = custom.find((h) => h.date === dateStr);
  if (customMatch) {
    return { isHoliday: true, holiday: customMatch };
  }

  return { isHoliday: false };
}

/**
 * Get all holidays falling within a specific date range [startDate, endDate]
 */
export async function getHolidaysForDateRange(
  startDate: string,
  endDate: string,
  organizationId?: string
): Promise<Holiday[]> {
  try {
    let query = supabase
      .from('holidays')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (organizationId) {
      query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) return data as Holiday[];
  } catch {}

  // Fallback from combined list
  const start = new Date(startDate);
  const end = new Date(endDate);
  const year = start.getFullYear();
  const allHols = await getFallbackHolidays(organizationId, year);
  return allHols.filter((h) => {
    const d = new Date(h.date);
    return d >= start && d <= end;
  });
}

/**
 * Calculate net working days between startDate and endDate
 * EXCLUDING Saturdays/Sundays and declared Public/Company Holidays.
 * This guarantees holidays are NOT deducted against leave balances or counted for Loss of Pay (LOP)!
 */
export async function getWorkingDaysCount(
  startDate: string,
  endDate: string,
  organizationId?: string,
  isHalfDay: boolean = false
): Promise<{ workingDays: number; holidayDays: number; holidaysInRange: Holiday[] }> {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return { workingDays: 0, holidayDays: 0, holidaysInRange: [] };
  }

  const holidays = await getHolidaysForDateRange(startDate, endDate, organizationId);
  const holidayDateSet = new Set(holidays.filter((h) => h.type !== 'optional').map((h) => h.date));

  let workingDays = 0;
  let holidayDays = 0;

  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 = Sun, 6 = Sat
    const dateStr = current.toISOString().split('T')[0];

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isDeclaredHoliday = holidayDateSet.has(dateStr);

    if (isDeclaredHoliday) {
      holidayDays++;
    } else if (!isWeekend) {
      workingDays += isHalfDay ? 0.5 : 1.0;
    }

    current.setDate(current.getDate() + 1);
  }

  return {
    workingDays,
    holidayDays,
    holidaysInRange: holidays,
  };
}
