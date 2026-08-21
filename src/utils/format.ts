import { format, formatDistanceToNow, parseISO, differenceInDays, isValid } from 'date-fns';

/**
 * Converts anything that could be a date into a native JS Date.
 * Handles: string (ISO), Date, Firestore Timestamp, null, undefined.
 */
function toDate(date: any): Date | null {
  if (!date) return null;
  // Firestore Timestamp object: has .toDate() method
  if (date && typeof date.toDate === 'function') return date.toDate();
  // Firestore Timestamp-like: has .seconds field
  if (date && typeof date.seconds === 'number') return new Date(date.seconds * 1000);
  if (date instanceof Date) return isValid(date) ? date : null;
  if (typeof date === 'string' && date.trim()) {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
  }
  return null;
}

export function formatDate(date: any): string {
  const d = toDate(date);
  if (!d) return '—';
  return format(d, 'MMM dd, yyyy');
}

export function formatTime(date: any): string {
  const d = toDate(date);
  if (!d) return '—';
  return format(d, 'hh:mm a');
}

export function formatDateTime(date: any): string {
  const d = toDate(date);
  if (!d) return '—';
  return format(d, 'MMM dd, yyyy hh:mm a');
}

export function formatRelative(date: any): string {
  const d = toDate(date);
  if (!d) return '—';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m > 0 ? ` ${m}m` : ''}`;
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMonth(month: number, year: number): string {
  return format(new Date(year, month - 1), 'MMMM yyyy');
}

export function getDaysBetween(start: string, end: string): number {
  const s = parseISO(start);
  const e = parseISO(end);
  if (!isValid(s) || !isValid(e)) return 1;
  return Math.max(1, differenceInDays(e, s) + 1);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function getInitials(name: string): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
